// Copyright 2013, 2014, 2015, 2016, 2017 Lovell Fuller and contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include <algorithm>
#include <cmath>
#include <map>
#include <memory>
#include <numeric>
#include <string>
#include <tuple>
#include <utility>
#include <vector>

#include <vips/vips8>
#include <node.h>
#include <nan.h>

#include "common.h"
#include "operations.h"
#include "pipeline.h"

class PipelineWorker : public Nan::AsyncWorker {
 public:
  PipelineWorker(
    Nan::Callback *callback, PipelineBaton *baton, Nan::Callback *queueListener,
    std::vector<v8::Local<v8::Object>> const buffersToPersist)
    : Nan::AsyncWorker(callback), baton(baton), queueListener(queueListener), buffersToPersist(buffersToPersist) {
    // Protect Buffer objects from GC, keyed on index
    std::accumulate(buffersToPersist.begin(), buffersToPersist.end(), 0,
      [this](uint32_t index, v8::Local<v8::Object> const buffer) -> uint32_t {
        SaveToPersistent(index, buffer);
        return index + 1;
      });
  }
  ~PipelineWorker() {}

  // libuv worker
  void Execute() {
    using sharp::HasAlpha;
    using sharp::ImageType;

    // Decrement queued task counter
    g_atomic_int_dec_and_test(&sharp::counterQueue);
    // Increment processing task counter
    g_atomic_int_inc(&sharp::counterProcess);

    std::map<VipsInterpretation, std::string> profileMap;
    // Default sRGB ICC profile from https://packages.debian.org/sid/all/icc-profiles-free/filelist
    profileMap.insert(
      std::pair<VipsInterpretation, std::string>(VIPS_INTERPRETATION_sRGB,
                                                 baton->iccProfilePath + "sRGB.icc"));
    // Convert to sRGB using default CMYK profile from http://www.argyllcms.com/cmyk.icm
    profileMap.insert(
      std::pair<VipsInterpretation, std::string>(VIPS_INTERPRETATION_CMYK,
                                                 baton->iccProfilePath + "cmyk.icm"));

    try {
      // Open input
      vips::VImage image;
      ImageType inputImageType;
      std::tie(image, inputImageType) = sharp::OpenInput(baton->input, baton->accessMethod);

      // Limit input images to a given number of pixels, where pixels = width * height
      // Ignore if 0
      if (baton->limitInputPixels > 0 && image.width() * image.height() > baton->limitInputPixels) {
        (baton->err).append("Input image exceeds pixel limit");
        return Error();
      }

      // Calculate angle of rotation
      VipsAngle rotation;
      bool flip;
      bool flop;
      std::tie(rotation, flip, flop) = CalculateRotationAndFlip(baton->angle, image);
      if (flip && !baton->flip) {
        // Add flip operation due to EXIF mirroring
        baton->flip = TRUE;
      }
      if (flop && !baton->flop) {
        // Add flip operation due to EXIF mirroring
        baton->flop = TRUE;
      }

      // Rotate pre-extract
      if (baton->rotateBeforePreExtract && rotation != VIPS_ANGLE_D0) {
        image = image.rot(rotation);
        sharp::RemoveExifOrientation(image);
      }

      // Trim
      if (baton->trimTolerance != 0) {
        image = sharp::Trim(image, baton->trimTolerance);
      }

      // Pre extraction
      if (baton->topOffsetPre != -1) {
        image = image.extract_area(baton->leftOffsetPre, baton->topOffsetPre, baton->widthPre, baton->heightPre);
      }

      // Get pre-resize image width and height
      int inputWidth = image.width();
      int inputHeight = image.height();
      if (!baton->rotateBeforePreExtract &&
        (rotation == VIPS_ANGLE_D90 || rotation == VIPS_ANGLE_D270)) {
        // Swap input output width and height when rotating by 90 or 270 degrees
        std::swap(inputWidth, inputHeight);
      }

      // Scaling calculations
      double xfactor = 1.0;
      double yfactor = 1.0;
      int targetResizeWidth = baton->width;
      int targetResizeHeight = baton->height;
      if (baton->width > 0 && baton->height > 0) {
        // Fixed width and height
        xfactor = static_cast<double>(inputWidth) / static_cast<double>(baton->width);
        yfactor = static_cast<double>(inputHeight) / static_cast<double>(baton->height);
        switch (baton->canvas) {
          case Canvas::CROP:
            if (xfactor < yfactor) {
              targetResizeHeight = static_cast<int>(round(static_cast<double>(inputHeight) / xfactor));
              yfactor = xfactor;
            } else {
              targetResizeWidth = static_cast<int>(round(static_cast<double>(inputWidth) / yfactor));
              xfactor = yfactor;
            }
            break;
          case Canvas::EMBED:
            if (xfactor > yfactor) {
              targetResizeHeight = static_cast<int>(round(static_cast<double>(inputHeight) / xfactor));
              yfactor = xfactor;
            } else {
              targetResizeWidth = static_cast<int>(round(static_cast<double>(inputWidth) / yfactor));
              xfactor = yfactor;
            }
            break;
          case Canvas::MAX:
            if (xfactor > yfactor) {
              targetResizeHeight = baton->height = static_cast<int>(round(static_cast<double>(inputHeight) / xfactor));
              yfactor = xfactor;
            } else {
              targetResizeWidth = baton->width = static_cast<int>(round(static_cast<double>(inputWidth) / yfactor));
              xfactor = yfactor;
            }
            break;
          case Canvas::MIN:
            if (xfactor < yfactor) {
              targetResizeHeight = baton->height = static_cast<int>(round(static_cast<double>(inputHeight) / xfactor));
              yfactor = xfactor;
            } else {
              targetResizeWidth = baton->width = static_cast<int>(round(static_cast<double>(inputWidth) / yfactor));
              xfactor = yfactor;
            }
            break;
          case Canvas::IGNORE_ASPECT:
            if (!baton->rotateBeforePreExtract &&
              (rotation == VIPS_ANGLE_D90 || rotation == VIPS_ANGLE_D270)) {
              std::swap(xfactor, yfactor);
            }
            break;
        }
      } else if (baton->width > 0) {
        // Fixed width
        xfactor = static_cast<double>(inputWidth) / static_cast<double>(baton->width);
        if (baton->canvas == Canvas::IGNORE_ASPECT) {
          targetResizeHeight = baton->height = inputHeight;
        } else {
          // Auto height
          yfactor = xfactor;
          targetResizeHeight = baton->height = static_cast<int>(round(static_cast<double>(inputHeight) / yfactor));
        }
      } else if (baton->height > 0) {
        // Fixed height
        yfactor = static_cast<double>(inputHeight) / static_cast<double>(baton->height);
        if (baton->canvas == Canvas::IGNORE_ASPECT) {
          targetResizeWidth = baton->width = inputWidth;
        } else {
          // Auto width
          xfactor = yfactor;
          targetResizeWidth = baton->width = static_cast<int>(round(static_cast<double>(inputWidth) / xfactor));
        }
      } else {
        // Identity transform
        baton->width = inputWidth;
        baton->height = inputHeight;
      }

      // Calculate integral box shrink
      int xshrink = std::max(1, static_cast<int>(floor(xfactor)));
      int yshrink = std::max(1, static_cast<int>(floor(yfactor)));

      // Calculate residual float affine transformation
      double xresidual = static_cast<double>(xshrink) / xfactor;
      double yresidual = static_cast<double>(yshrink) / yfactor;

      // Do not enlarge the output if the input width *or* height
      // are already less than the required dimensions
      if (baton->withoutEnlargement) {
        if (inputWidth < baton->width || inputHeight < baton->height) {
          xfactor = 1.0;
          yfactor = 1.0;
          xshrink = 1;
          yshrink = 1;
          xresidual = 1.0;
          yresidual = 1.0;
          baton->width = inputWidth;
          baton->height = inputHeight;
        }
      }

      // If integral x and y shrink are equal, try to use shrink-on-load for JPEG and WebP,
      // but not when applying gamma correction or pre-resize extract
      int shrink_on_load = 1;
      if (
        xshrink == yshrink && xshrink >= 2 &&
        (inputImageType == ImageType::JPEG || inputImageType == ImageType::WEBP) &&
        baton->gamma == 0 && baton->topOffsetPre == -1
      ) {
        if (xshrink >= 8) {
          xfactor = xfactor / 8;
          yfactor = yfactor / 8;
          shrink_on_load = 8;
        } else if (xshrink >= 4) {
          xfactor = xfactor / 4;
          yfactor = yfactor / 4;
          shrink_on_load = 4;
        } else if (xshrink >= 2) {
          xfactor = xfactor / 2;
          yfactor = yfactor / 2;
          shrink_on_load = 2;
        }
      }
      if (shrink_on_load > 1) {
        // Reload input using shrink-on-load
        vips::VOption *option = VImage::option()->set("shrink", shrink_on_load);
        if (baton->input->buffer != nullptr) {
          VipsBlob *blob = vips_blob_new(nullptr, baton->input->buffer, baton->input->bufferLength);
          if (inputImageType == ImageType::JPEG) {
            // Reload JPEG buffer
            image = VImage::jpegload_buffer(blob, option);
          } else {
            // Reload WebP buffer
            image = VImage::webpload_buffer(blob, option);
          }
          vips_area_unref(reinterpret_cast<VipsArea*>(blob));
        } else {
          if (inputImageType == ImageType::JPEG) {
            // Reload JPEG file
            image = VImage::jpegload(const_cast<char*>(baton->input->file.data()), option);
          } else {
            // Reload WebP file
            image = VImage::webpload(const_cast<char*>(baton->input->file.data()), option);
          }
        }
        // Recalculate integral shrink and double residual
        int shrunkOnLoadWidth = image.width();
        int shrunkOnLoadHeight = image.height();
        if (!baton->rotateBeforePreExtract &&
          (rotation == VIPS_ANGLE_D90 || rotation == VIPS_ANGLE_D270)) {
          // Swap input output width and height when rotating by 90 or 270 degrees
          std::swap(shrunkOnLoadWidth, shrunkOnLoadHeight);
        }
        xfactor = static_cast<double>(shrunkOnLoadWidth) / static_cast<double>(targetResizeWidth);
        yfactor = static_cast<double>(shrunkOnLoadHeight) / static_cast<double>(targetResizeHeight);
        xshrink = std::max(1, static_cast<int>(floor(xfactor)));
        yshrink = std::max(1, static_cast<int>(floor(yfactor)));
        xresidual = static_cast<double>(xshrink) / xfactor;
        yresidual = static_cast<double>(yshrink) / yfactor;
        if (
          !baton->rotateBeforePreExtract &&
          (rotation == VIPS_ANGLE_D90 || rotation == VIPS_ANGLE_D270)
        ) {
          std::swap(xresidual, yresidual);
        }
      }

      // Ensure we're using a device-independent colour space
      if (sharp::HasProfile(image)) {
        // Convert to sRGB using embedded profile
        try {
          image = image.icc_transform(
            const_cast<char*>(profileMap[VIPS_INTERPRETATION_sRGB].data()), VImage::option()
            ->set("embedded", TRUE)
            ->set("intent", VIPS_INTENT_PERCEPTUAL));
        } catch(...) {
          // Ignore failure of embedded profile
        }
      } else if (image.interpretation() == VIPS_INTERPRETATION_CMYK) {
        image = image.icc_transform(
          const_cast<char*>(profileMap[VIPS_INTERPRETATION_sRGB].data()), VImage::option()
          ->set("input_profile", profileMap[VIPS_INTERPRETATION_CMYK].data())
          ->set("intent", VIPS_INTENT_PERCEPTUAL));
      }

      // Flatten image to remove alpha channel
      if (baton->flatten && HasAlpha(image)) {
        // Scale up 8-bit values to match 16-bit input image
        double const multiplier = sharp::Is16Bit(image.interpretation()) ? 256.0 : 1.0;
        // Background colour
        std::vector<double> background {
          baton->background[0] * multiplier,
          baton->background[1] * multiplier,
          baton->background[2] * multiplier
        };
        image = image.flatten(VImage::option()
          ->set("background", background));
      }

      // Negate the colours in the image
      if (baton->negate) {
        image = image.invert();
      }

      // Gamma encoding (darken)
      if (baton->gamma >= 1 && baton->gamma <= 3) {
        image = sharp::Gamma(image, 1.0 / baton->gamma);
      }

      // Convert to greyscale (linear, therefore after gamma encoding, if any)
      if (baton->greyscale) {
        image = image.colourspace(VIPS_INTERPRETATION_B_W);
      }

      // Ensure image has an alpha channel when there is an overlay
      bool hasOverlay = baton->overlay != nullptr;
      if (hasOverlay && !HasAlpha(image)) {
        double const multiplier = sharp::Is16Bit(image.interpretation()) ? 256.0 : 1.0;
        image = image.bandjoin(
          VImage::new_matrix(image.width(), image.height()).new_from_image(255 * multiplier));
      }

      bool const shouldShrink = xshrink > 1 || yshrink > 1;
      bool const shouldReduce = xresidual != 1.0 || yresidual != 1.0;
      bool const shouldBlur = baton->blurSigma != 0.0;
      bool const shouldConv = baton->convKernelWidth * baton->convKernelHeight > 0;
      bool const shouldSharpen = baton->sharpenSigma != 0.0;
      bool const shouldCutout = baton->overlayCutout;
      bool const shouldPremultiplyAlpha = HasAlpha(image) &&
        (shouldShrink || shouldReduce || shouldBlur || shouldConv || shouldSharpen || (hasOverlay && !shouldCutout));

      // Premultiply image alpha channel before all transformations to avoid
      // dark fringing around bright pixels
      // See: http://entropymine.com/imageworsener/resizealpha/
      if (shouldPremultiplyAlpha) {
        image = image.premultiply();
      }

      // Fast, integral box-shrink
      if (shouldShrink) {
        if (yshrink > 1) {
          image = image.shrinkv(yshrink);
        }
        if (xshrink > 1) {
          image = image.shrinkh(xshrink);
        }
        // Recalculate residual float based on dimensions of required vs shrunk images
        int shrunkWidth = image.width();
        int shrunkHeight = image.height();
        if (!baton->rotateBeforePreExtract &&
          (rotation == VIPS_ANGLE_D90 || rotation == VIPS_ANGLE_D270)) {
          // Swap input output width and height when rotating by 90 or 270 degrees
          std::swap(shrunkWidth, shrunkHeight);
        }
        xresidual = static_cast<double>(targetResizeWidth) / static_cast<double>(shrunkWidth);
        yresidual = static_cast<double>(targetResizeHeight) / static_cast<double>(shrunkHeight);
        if (
          !baton->rotateBeforePreExtract &&
          (rotation == VIPS_ANGLE_D90 || rotation == VIPS_ANGLE_D270)
        ) {
          std::swap(xresidual, yresidual);
        }
      }

      // Use affine increase or kernel reduce with the remaining float part
      if (xresidual != 1.0 || yresidual != 1.0) {
        // Insert tile cache to prevent over-computation of previous operations
        if (baton->accessMethod == VIPS_ACCESS_SEQUENTIAL) {
          image = sharp::TileCache(image, yresidual);
        }
        // Perform kernel-based reduction
        if (yresidual < 1.0 || xresidual < 1.0) {
          VipsKernel kernel = static_cast<VipsKernel>(
            vips_enum_from_nick(nullptr, VIPS_TYPE_KERNEL, baton->kernel.data()));
          if (kernel != VIPS_KERNEL_CUBIC && kernel != VIPS_KERNEL_LANCZOS2 && kernel != VIPS_KERNEL_LANCZOS3) {
            throw vips::VError("Unknown kernel");
          }
          if (yresidual < 1.0) {
            image = image.reducev(1.0 / yresidual, VImage::option()
              ->set("kernel", kernel)
              ->set("centre", baton->centreSampling));
          }
          if (xresidual < 1.0) {
            image = image.reduceh(1.0 / xresidual, VImage::option()
              ->set("kernel", kernel)
              ->set("centre", baton->centreSampling));
          }
        }
        // Perform affine enlargement
        if (yresidual > 1.0 || xresidual > 1.0) {
          vips::VInterpolate interpolator = vips::VInterpolate::new_from_name(baton->interpolator.data());
          if (yresidual > 1.0) {
            image = image.affine({1.0, 0.0, 0.0, yresidual}, VImage::option()
              ->set("interpolate", interpolator));
          }
          if (xresidual > 1.0) {
            image = image.affine({xresidual, 0.0, 0.0, 1.0}, VImage::option()
              ->set("interpolate", interpolator));
          }
        }
      }

      // Rotate
      if (!baton->rotateBeforePreExtract && rotation != VIPS_ANGLE_D0) {
        image = image.rot(rotation);
        sharp::RemoveExifOrientation(image);
      }

      // Flip (mirror about Y axis)
      if (baton->flip) {
        image = image.flip(VIPS_DIRECTION_VERTICAL);
        sharp::RemoveExifOrientation(image);
      }

      // Flop (mirror about X axis)
      if (baton->flop) {
        image = image.flip(VIPS_DIRECTION_HORIZONTAL);
        sharp::RemoveExifOrientation(image);
      }

      // Join additional color channels to the image
      if (baton->joinChannelIn.size() > 0) {
        VImage joinImage;
        ImageType joinImageType = ImageType::UNKNOWN;

        for (unsigned int i = 0; i < baton->joinChannelIn.size(); i++) {
          std::tie(joinImage, joinImageType) = sharp::OpenInput(baton->joinChannelIn[i], baton->accessMethod);
          image = image.bandjoin(joinImage);
        }
        image = image.copy(VImage::option()->set("interpretation", baton->colourspace));
      }

      // Crop/embed
      if (image.width() != baton->width || image.height() != baton->height) {
        if (baton->canvas == Canvas::EMBED) {
          // Scale up 8-bit values to match 16-bit input image
          double const multiplier = sharp::Is16Bit(image.interpretation()) ? 256.0 : 1.0;
          // Create background colour
          std::vector<double> background;
          if (image.bands() > 2) {
            background = {
              multiplier * baton->background[0],
              multiplier * baton->background[1],
              multiplier * baton->background[2]
            };
          } else {
            // Convert sRGB to greyscale
            background = { multiplier * (
              0.2126 * baton->background[0] +
              0.7152 * baton->background[1] +
              0.0722 * baton->background[2])
            };
          }
          // Add alpha channel to background colour
          if (baton->background[3] < 255.0 || HasAlpha(image)) {
            background.push_back(baton->background[3] * multiplier);
          }
          // Ensure background colour uses correct colourspace
          background = sharp::GetRgbaAsColourspace(background, image.interpretation());
          // Add non-transparent alpha channel, if required
          if (baton->background[3] < 255.0 && !HasAlpha(image)) {
            image = image.bandjoin(
              VImage::new_matrix(image.width(), image.height()).new_from_image(255 * multiplier));
          }
          // Embed
          int left = static_cast<int>(round((baton->width - image.width()) / 2));
          int top = static_cast<int>(round((baton->height - image.height()) / 2));
          image = image.embed(left, top, baton->width, baton->height, VImage::option()
            ->set("extend", VIPS_EXTEND_BACKGROUND)
            ->set("background", background));
        } else if (baton->canvas != Canvas::IGNORE_ASPECT) {
          // Crop/max/min
          int left;
          int top;
          if (baton->crop < 9) {
            // Gravity-based crop
            std::tie(left, top) = sharp::CalculateCrop(
              image.width(), image.height(), baton->width, baton->height, baton->crop);
          } else if (baton->crop == 16) {
            // Entropy-based crop
            std::tie(left, top) = sharp::Crop(image, baton->width, baton->height, sharp::EntropyStrategy());
          } else {
            // Attention-based crop
            std::tie(left, top) = sharp::Crop(image, baton->width, baton->height, sharp::AttentionStrategy());
          }
          int width = std::min(image.width(), baton->width);
          int height = std::min(image.height(), baton->height);
          image = image.extract_area(left, top, width, height);
          baton->cropCalcLeft = left;
          baton->cropCalcTop = top;
        }
      }

      // Post extraction
      if (baton->topOffsetPost != -1) {
        image = image.extract_area(
          baton->leftOffsetPost, baton->topOffsetPost, baton->widthPost, baton->heightPost);
      }

      // Extend edges
      if (baton->extendTop > 0 || baton->extendBottom > 0 || baton->extendLeft > 0 || baton->extendRight > 0) {
        // Scale up 8-bit values to match 16-bit input image
        double const multiplier = sharp::Is16Bit(image.interpretation()) ? 256.0 : 1.0;
        // Create background colour
        std::vector<double> background;
        if (image.bands() > 2) {
          background = {
            multiplier * baton->background[0],
            multiplier * baton->background[1],
            multiplier * baton->background[2]
          };
        } else {
          // Convert sRGB to greyscale
          background = { multiplier * (
            0.2126 * baton->background[0] +
            0.7152 * baton->background[1] +
            0.0722 * baton->background[2])
          };
        }
        // Add alpha channel to background colour
        if (baton->background[3] < 255.0 || HasAlpha(image)) {
          background.push_back(baton->background[3] * multiplier);
        }
        // Ensure background colour uses correct colourspace
        background = sharp::GetRgbaAsColourspace(background, image.interpretation());
        // Add non-transparent alpha channel, if required
        if (baton->background[3] < 255.0 && !HasAlpha(image)) {
          image = image.bandjoin(
            VImage::new_matrix(image.width(), image.height()).new_from_image(255 * multiplier));
        }
        // Embed
        baton->width = image.width() + baton->extendLeft + baton->extendRight;
        baton->height = image.height() + baton->extendTop + baton->extendBottom;

        image = image.embed(baton->extendLeft, baton->extendTop, baton->width, baton->height,
          VImage::option()->set("extend", VIPS_EXTEND_BACKGROUND)->set("background", background));
      }

      // Threshold - must happen before blurring, due to the utility of blurring after thresholding
      if (baton->threshold != 0) {
        image = sharp::Threshold(image, baton->threshold, baton->thresholdGrayscale);
      }

      // Blur
      if (shouldBlur) {
        image = sharp::Blur(image, baton->blurSigma);
      }

      // Convolve
      if (shouldConv) {
        image = sharp::Convolve(image,
          baton->convKernelWidth, baton->convKernelHeight,
          baton->convKernelScale, baton->convKernelOffset,
          baton->convKernel);
      }

      // Sharpen
      if (shouldSharpen) {
        image = sharp::Sharpen(image, baton->sharpenSigma, baton->sharpenFlat, baton->sharpenJagged);
      }

      // Composite with overlay, if present
      if (hasOverlay) {
        VImage overlayImage;
        ImageType overlayImageType = ImageType::UNKNOWN;
        std::tie(overlayImage, overlayImageType) = OpenInput(baton->overlay, baton->accessMethod);
        // Check if overlay is tiled
        if (baton->overlayTile) {
          int const overlayImageWidth = overlayImage.width();
          int const overlayImageHeight = overlayImage.height();
          int across = 0;
          int down = 0;
          // Use gravity in overlay
          if (overlayImageWidth <= baton->width) {
            across = static_cast<int>(ceil(static_cast<double>(image.width()) / overlayImageWidth));
          }
          if (overlayImageHeight <= baton->height) {
            down = static_cast<int>(ceil(static_cast<double>(image.height()) / overlayImageHeight));
          }
          if (across != 0 || down != 0) {
            int left;
            int top;
            overlayImage = overlayImage.replicate(across, down);
            if (baton->overlayXOffset >= 0 && baton->overlayYOffset >= 0) {
              // the overlayX/YOffsets will now be used to CalculateCrop for extract_area
              std::tie(left, top) = sharp::CalculateCrop(
                overlayImage.width(), overlayImage.height(), image.width(), image.height(),
                baton->overlayXOffset, baton->overlayYOffset);
            } else {
              // the overlayGravity will now be used to CalculateCrop for extract_area
              std::tie(left, top) = sharp::CalculateCrop(
                overlayImage.width(), overlayImage.height(), image.width(), image.height(), baton->overlayGravity);
            }
            overlayImage = overlayImage.extract_area(left, top, image.width(), image.height());
          }
          // the overlayGravity was used for extract_area, therefore set it back to its default value of 0
          baton->overlayGravity = 0;
        }
        if (shouldCutout) {
          // 'cut out' the image, premultiplication is not required
          image = sharp::Cutout(overlayImage, image, baton->overlayGravity);
        } else {
          // Ensure overlay has alpha channel
          if (!HasAlpha(overlayImage)) {
            double const multiplier = sharp::Is16Bit(overlayImage.interpretation()) ? 256.0 : 1.0;
            overlayImage = overlayImage.bandjoin(
              VImage::new_matrix(overlayImage.width(), overlayImage.height()).new_from_image(255 * multiplier));
          }
          // Ensure image has alpha channel
          if (!HasAlpha(image)) {
            double const multiplier = sharp::Is16Bit(image.interpretation()) ? 256.0 : 1.0;
            image = image.bandjoin(
              VImage::new_matrix(image.width(), image.height()).new_from_image(255 * multiplier));
          }
          // Ensure overlay is premultiplied sRGB
          overlayImage = overlayImage.colourspace(VIPS_INTERPRETATION_sRGB).premultiply();
          if (baton->overlayXOffset >= 0 && baton->overlayYOffset >= 0) {
            // Composite images with given offsets
            image = sharp::Composite(overlayImage, image, baton->overlayXOffset, baton->overlayYOffset);
          } else {
            // Composite images with given gravity
            image = sharp::Composite(overlayImage, image, baton->overlayGravity);
          }
        }
      }

      // Reverse premultiplication after all transformations:
      if (shouldPremultiplyAlpha) {
        image = image.unpremultiply();
        // Cast pixel values to integer
        if (sharp::Is16Bit(image.interpretation())) {
          image = image.cast(VIPS_FORMAT_USHORT);
        } else {
          image = image.cast(VIPS_FORMAT_UCHAR);
        }
      }

      // Gamma decoding (brighten)
      if (baton->gamma >= 1 && baton->gamma <= 3) {
        image = sharp::Gamma(image, baton->gamma);
      }

      // Apply normalisation - stretch luminance to cover full dynamic range
      if (baton->normalise) {
        image = sharp::Normalise(image);
      }

      // Apply bitwise boolean operation between images
      if (baton->boolean != nullptr) {
        VImage booleanImage;
        ImageType booleanImageType = ImageType::UNKNOWN;
        std::tie(booleanImage, booleanImageType) = sharp::OpenInput(baton->boolean, baton->accessMethod);
        image = sharp::Boolean(image, booleanImage, baton->booleanOp);
      }

      // Apply per-channel Bandbool bitwise operations after all other operations
      if (baton->bandBoolOp >= VIPS_OPERATION_BOOLEAN_AND && baton->bandBoolOp < VIPS_OPERATION_BOOLEAN_LAST) {
        image = sharp::Bandbool(image, baton->bandBoolOp);
      }

      // Extract an image channel (aka vips band)
      if (baton->extractChannel > -1) {
        if (baton->extractChannel >= image.bands()) {
          (baton->err).append("Cannot extract channel from image. Too few channels in image.");
          return Error();
        }
        image = image.extract_band(baton->extractChannel);
      }
      // Convert image to sRGB, if not already
      if (sharp::Is16Bit(image.interpretation())) {
        image = image.cast(VIPS_FORMAT_USHORT);
      }
      if (image.interpretation() != baton->colourspace) {
        // Convert colourspace, pass the current known interpretation so libvips doesn't have to guess
        image = image.colourspace(baton->colourspace, VImage::option()->set("source_space", image.interpretation()));
        // Transform colours from embedded profile to output profile
        if (baton->withMetadata && sharp::HasProfile(image) && profileMap[baton->colourspace] != std::string()) {
          image = image.icc_transform(const_cast<char*>(profileMap[baton->colourspace].data()),
            VImage::option()->set("embedded", TRUE));
        }
      }

      // Override EXIF Orientation tag
      if (baton->withMetadata && baton->withMetadataOrientation != -1) {
        sharp::SetExifOrientation(image, baton->withMetadataOrientation);
      }

      // Number of channels used in output image
      baton->channels = image.bands();
      baton->width = image.width();
      baton->height = image.height();
      // Output
      if (baton->fileOut == "") {
        // Buffer output
        if (baton->formatOut == "jpeg" || (baton->formatOut == "input" && inputImageType == ImageType::JPEG)) {
          // Write JPEG to buffer
          VipsArea *area = VIPS_AREA(image.jpegsave_buffer(VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->jpegQuality)
            ->set("interlace", baton->jpegProgressive)
            ->set("no_subsample", baton->jpegChromaSubsampling == "4:4:4")
            ->set("trellis_quant", baton->jpegTrellisQuantisation)
            ->set("overshoot_deringing", baton->jpegOvershootDeringing)
            ->set("optimize_scans", baton->jpegOptimiseScans)
            ->set("optimize_coding", TRUE)));
          baton->bufferOut = static_cast<char*>(area->data);
          baton->bufferOutLength = area->length;
          area->free_fn = nullptr;
          vips_area_unref(area);
          baton->formatOut = "jpeg";
          if (baton->colourspace == VIPS_INTERPRETATION_CMYK) {
            baton->channels = std::min(baton->channels, 4);
          } else {
            baton->channels = std::min(baton->channels, 3);
          }
        } else if (baton->formatOut == "png" || (baton->formatOut == "input" &&
          (inputImageType == ImageType::PNG || inputImageType == ImageType::GIF || inputImageType == ImageType::SVG))) {
          // Strip profile
          if (!baton->withMetadata) {
            vips_image_remove(image.get_image(), VIPS_META_ICC_NAME);
          }
          // Write PNG to buffer
          VipsArea *area = VIPS_AREA(image.pngsave_buffer(VImage::option()
            ->set("interlace", baton->pngProgressive)
            ->set("compression", baton->pngCompressionLevel)
            ->set("filter", baton->pngAdaptiveFiltering ? VIPS_FOREIGN_PNG_FILTER_ALL : VIPS_FOREIGN_PNG_FILTER_NONE)));
          baton->bufferOut = static_cast<char*>(area->data);
          baton->bufferOutLength = area->length;
          area->free_fn = nullptr;
          vips_area_unref(area);
          baton->formatOut = "png";
        } else if (baton->formatOut == "webp" || (baton->formatOut == "input" && inputImageType == ImageType::WEBP)) {
          // Write WEBP to buffer
          VipsArea *area = VIPS_AREA(image.webpsave_buffer(VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->webpQuality)
            ->set("lossless", baton->webpLossless)
            ->set("near_lossless", baton->webpNearLossless)
            ->set("alpha_q", baton->webpAlphaQuality)));
          baton->bufferOut = static_cast<char*>(area->data);
          baton->bufferOutLength = area->length;
          area->free_fn = nullptr;
          vips_area_unref(area);
          baton->formatOut = "webp";
        } else if (baton->formatOut == "raw" || (baton->formatOut == "input" && inputImageType == ImageType::RAW)) {
          // Write raw, uncompressed image data to buffer
          if (baton->greyscale || image.interpretation() == VIPS_INTERPRETATION_B_W) {
            // Extract first band for greyscale image
            image = image[0];
          }
          if (image.format() != VIPS_FORMAT_UCHAR) {
            // Cast pixels to uint8 (unsigned char)
            image = image.cast(VIPS_FORMAT_UCHAR);
          }
          // Get raw image data
          baton->bufferOut = static_cast<char*>(image.write_to_memory(&baton->bufferOutLength));
          if (baton->bufferOut == nullptr) {
            (baton->err).append("Could not allocate enough memory for raw output");
            return Error();
          }
          baton->formatOut = "raw";
        } else {
          // Unsupported output format
          (baton->err).append("Unsupported output format ");
          if (baton->formatOut == "input") {
            (baton->err).append(ImageTypeId(inputImageType));
          } else {
            (baton->err).append(baton->formatOut);
          }
          return Error();
        }
      } else {
        // File output
        bool const isJpeg = sharp::IsJpeg(baton->fileOut);
        bool const isPng = sharp::IsPng(baton->fileOut);
        bool const isWebp = sharp::IsWebp(baton->fileOut);
        bool const isTiff = sharp::IsTiff(baton->fileOut);
        bool const isDz = sharp::IsDz(baton->fileOut);
        bool const isDzZip = sharp::IsDzZip(baton->fileOut);
        bool const isV = sharp::IsV(baton->fileOut);
        bool const matchInput = baton->formatOut == "input" &&
          !(isJpeg || isPng || isWebp || isTiff || isDz || isDzZip || isV);
        if (baton->formatOut == "jpeg" || isJpeg || (matchInput && inputImageType == ImageType::JPEG)) {
          // Write JPEG to file
          image.jpegsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->jpegQuality)
            ->set("interlace", baton->jpegProgressive)
            ->set("no_subsample", baton->jpegChromaSubsampling == "4:4:4")
            ->set("trellis_quant", baton->jpegTrellisQuantisation)
            ->set("overshoot_deringing", baton->jpegOvershootDeringing)
            ->set("optimize_scans", baton->jpegOptimiseScans)
            ->set("optimize_coding", TRUE));
          baton->formatOut = "jpeg";
          baton->channels = std::min(baton->channels, 3);
        } else if (baton->formatOut == "png" || isPng || (matchInput &&
          (inputImageType == ImageType::PNG || inputImageType == ImageType::GIF || inputImageType == ImageType::SVG))) {
          // Strip profile
          if (!baton->withMetadata) {
            vips_image_remove(image.get_image(), VIPS_META_ICC_NAME);
          }
          // Write PNG to file
          image.pngsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("interlace", baton->pngProgressive)
            ->set("compression", baton->pngCompressionLevel)
            ->set("filter", baton->pngAdaptiveFiltering ? VIPS_FOREIGN_PNG_FILTER_ALL : VIPS_FOREIGN_PNG_FILTER_NONE));
          baton->formatOut = "png";
        } else if (baton->formatOut == "webp" || isWebp || (matchInput && inputImageType == ImageType::WEBP)) {
          // Write WEBP to file
          image.webpsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->webpQuality)
            ->set("lossless", baton->webpLossless)
            ->set("near_lossless", baton->webpNearLossless)
            ->set("alpha_q", baton->webpAlphaQuality));
          baton->formatOut = "webp";
        } else if (baton->formatOut == "tiff" || isTiff || (matchInput && inputImageType == ImageType::TIFF)) {
          // Write TIFF to file
          image.tiffsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->tiffQuality)
            ->set("compression", VIPS_FOREIGN_TIFF_COMPRESSION_JPEG));
          baton->formatOut = "tiff";
          baton->channels = std::min(baton->channels, 3);
        } else if (baton->formatOut == "dz" || isDz || isDzZip) {
          if (isDzZip) {
            baton->tileContainer = VIPS_FOREIGN_DZ_CONTAINER_ZIP;
          }
          // Forward format options through suffix
          std::string suffix;
          if (baton->tileFormat == "png") {
            std::vector<std::pair<std::string, std::string>> options {
              {"interlace", baton->pngProgressive ? "TRUE" : "FALSE"},
              {"compression", std::to_string(baton->pngCompressionLevel)},
              {"filter", baton->pngAdaptiveFiltering ? "all" : "none"}
            };
            suffix = AssembleSuffixString(".png", options);
          } else if (baton->tileFormat == "webp") {
            std::vector<std::pair<std::string, std::string>> options {
              {"Q", std::to_string(baton->webpQuality)},
              {"alpha_q", std::to_string(baton->webpAlphaQuality)},
              {"lossless", baton->webpLossless ? "TRUE" : "FALSE"},
              {"near_lossless", baton->webpNearLossless ? "TRUE" : "FALSE"}
            };
            suffix = AssembleSuffixString(".webp", options);
          } else {
            std::string extname = baton->tileLayout == VIPS_FOREIGN_DZ_LAYOUT_GOOGLE
              || baton->tileLayout == VIPS_FOREIGN_DZ_LAYOUT_ZOOMIFY
                ? ".jpg" : ".jpeg";
            std::vector<std::pair<std::string, std::string>> options {
              {"Q", std::to_string(baton->jpegQuality)},
              {"interlace", baton->jpegProgressive ? "TRUE" : "FALSE"},
              {"no_subsample", baton->jpegChromaSubsampling == "4:4:4" ? "TRUE": "FALSE"},
              {"trellis_quant", baton->jpegTrellisQuantisation ? "TRUE" : "FALSE"},
              {"overshoot_deringing", baton->jpegOvershootDeringing ? "TRUE": "FALSE"},
              {"optimize_scans", baton->jpegOptimiseScans ? "TRUE": "FALSE"},
              {"optimize_coding", "TRUE"}
            };
            suffix = AssembleSuffixString(extname, options);
          }
          // Write DZ to file
          image.dzsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("tile_size", baton->tileSize)
            ->set("overlap", baton->tileOverlap)
            ->set("container", baton->tileContainer)
            ->set("layout", baton->tileLayout)
            ->set("suffix", const_cast<char*>(suffix.data())));
          baton->formatOut = "dz";
        } else if (baton->formatOut == "v" || isV || (matchInput && inputImageType == ImageType::VIPS)) {
          // Write V to file
          image.vipssave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata));
          baton->formatOut = "v";
        } else {
          // Unsupported output format
          (baton->err).append("Unsupported output format " + baton->fileOut);
          return Error();
        }
      }
    } catch (vips::VError const &err) {
      (baton->err).append(err.what());
    }
    // Clean up libvips' per-request data and threads
    vips_error_clear();
    vips_thread_shutdown();
  }

  void HandleOKCallback() {
    using Nan::New;
    using Nan::Set;
    Nan::HandleScope();

    v8::Local<v8::Value> argv[3] = { Nan::Null(), Nan::Null(), Nan::Null() };
    if (!baton->err.empty()) {
      // Error
      argv[0] = Nan::Error(baton->err.data());
    } else {
      int width = baton->width;
      int height = baton->height;
      if (baton->topOffsetPre != -1 && (baton->width == -1 || baton->height == -1)) {
        width = baton->widthPre;
        height = baton->heightPre;
      }
      if (baton->topOffsetPost != -1) {
        width = baton->widthPost;
        height = baton->heightPost;
      }
      // Info Object
      v8::Local<v8::Object> info = New<v8::Object>();
      Set(info, New("format").ToLocalChecked(), New<v8::String>(baton->formatOut).ToLocalChecked());
      Set(info, New("width").ToLocalChecked(), New<v8::Uint32>(static_cast<uint32_t>(width)));
      Set(info, New("height").ToLocalChecked(), New<v8::Uint32>(static_cast<uint32_t>(height)));
      Set(info, New("channels").ToLocalChecked(), New<v8::Uint32>(static_cast<uint32_t>(baton->channels)));
      if (baton->cropCalcLeft != -1 && baton->cropCalcLeft != -1) {
        Set(info, New("cropCalcLeft").ToLocalChecked(), New<v8::Uint32>(static_cast<uint32_t>(baton->cropCalcLeft)));
        Set(info, New("cropCalcTop").ToLocalChecked(), New<v8::Uint32>(static_cast<uint32_t>(baton->cropCalcTop)));
      }

      if (baton->bufferOutLength > 0) {
        // Pass ownership of output data to Buffer instance
        argv[1] = Nan::NewBuffer(
          static_cast<char*>(baton->bufferOut), baton->bufferOutLength, sharp::FreeCallback, nullptr)
          .ToLocalChecked();
        // Add buffer size to info
        Set(info, New("size").ToLocalChecked(), New<v8::Uint32>(static_cast<uint32_t>(baton->bufferOutLength)));
        argv[2] = info;
      } else {
        // Add file size to info
        GStatBuf st;
        if (g_stat(baton->fileOut.data(), &st) == 0) {
          Set(info, New("size").ToLocalChecked(), New<v8::Uint32>(static_cast<uint32_t>(st.st_size)));
        }
        argv[1] = info;
      }
    }

    // Dispose of Persistent wrapper around input Buffers so they can be garbage collected
    std::accumulate(buffersToPersist.begin(), buffersToPersist.end(), 0,
      [this](uint32_t index, v8::Local<v8::Object> const buffer) -> uint32_t {
        GetFromPersistent(index);
        return index + 1;
      });
    delete baton->input;
    delete baton->overlay;
    delete baton->boolean;
    for_each(baton->joinChannelIn.begin(), baton->joinChannelIn.end(),
      [this](sharp::InputDescriptor *joinChannelIn) {
        delete joinChannelIn;
      });
    delete baton;

    // Decrement processing task counter
    g_atomic_int_dec_and_test(&sharp::counterProcess);
    v8::Local<v8::Value> queueLength[1] = { New<v8::Uint32>(sharp::counterQueue) };
    queueListener->Call(1, queueLength);
    delete queueListener;

    // Return to JavaScript
    callback->Call(3, argv);
  }

 private:
  PipelineBaton *baton;
  Nan::Callback *queueListener;
  std::vector<v8::Local<v8::Object>> buffersToPersist;

  /*
    Calculate the angle of rotation and need-to-flip for the output image.
    In order of priority:
     1. Use explicitly requested angle (supports 90, 180, 270)
     2. Use input image EXIF Orientation header - supports mirroring
     3. Otherwise default to zero, i.e. no rotation
  */
  std::tuple<VipsAngle, bool, bool>
  CalculateRotationAndFlip(int const angle, vips::VImage image) {
    VipsAngle rotate = VIPS_ANGLE_D0;
    bool flip = FALSE;
    bool flop = FALSE;
    if (angle == -1) {
      switch (sharp::ExifOrientation(image)) {
        case 6: rotate = VIPS_ANGLE_D90; break;
        case 3: rotate = VIPS_ANGLE_D180; break;
        case 8: rotate = VIPS_ANGLE_D270; break;
        case 2: flop = TRUE; break;  // flop 1
        case 7: flip = TRUE; rotate = VIPS_ANGLE_D90; break;  // flip 6
        case 4: flop = TRUE; rotate = VIPS_ANGLE_D180; break;  // flop 3
        case 5: flip = TRUE; rotate = VIPS_ANGLE_D270; break;  // flip 8
      }
    } else {
      if (angle == 90) {
        rotate = VIPS_ANGLE_D90;
      } else if (angle == 180) {
        rotate = VIPS_ANGLE_D180;
      } else if (angle == 270) {
        rotate = VIPS_ANGLE_D270;
      }
    }
    return std::make_tuple(rotate, flip, flop);
  }

  /*
    Assemble the suffix argument to dzsave, which is the format (by extname)
    alongisde comma-separated arguments to the corresponding `formatsave` vips
    action.
  */
  std::string
  AssembleSuffixString(std::string extname, std::vector<std::pair<std::string, std::string>> options) {
    std::string argument;
    for (auto const &option : options) {
      if (!argument.empty()) {
        argument += ",";
      }
      argument += option.first + "=" + option.second;
    }
    return extname + "[" + argument + "]";
  }

  /*
    Clear all thread-local data.
  */
  void Error() {
    // Clean up libvips' per-request data and threads
    vips_error_clear();
    vips_thread_shutdown();
  }
};

/*
  pipeline(options, output, callback)
*/
NAN_METHOD(pipeline) {
  using sharp::HasAttr;
  using sharp::AttrTo;
  using sharp::AttrAs;
  using sharp::AttrAsStr;
  using sharp::CreateInputDescriptor;

  // Input Buffers must not undergo GC compaction during processing
  std::vector<v8::Local<v8::Object>> buffersToPersist;

  // V8 objects are converted to non-V8 types held in the baton struct
  PipelineBaton *baton = new PipelineBaton;
  v8::Local<v8::Object> options = info[0].As<v8::Object>();

  // Input
  baton->input = CreateInputDescriptor(AttrAs<v8::Object>(options, "input"), buffersToPersist);

  // ICC profile to use when input CMYK image has no embedded profile
  baton->iccProfilePath = AttrAsStr(options, "iccProfilePath");
  baton->accessMethod = AttrTo<bool>(options, "sequentialRead") ?
    VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;
  // Limit input images to a given number of pixels, where pixels = width * height
  baton->limitInputPixels = AttrTo<int32_t>(options, "limitInputPixels");
  // Extract image options
  baton->topOffsetPre = AttrTo<int32_t>(options, "topOffsetPre");
  baton->leftOffsetPre = AttrTo<int32_t>(options, "leftOffsetPre");
  baton->widthPre = AttrTo<int32_t>(options, "widthPre");
  baton->heightPre = AttrTo<int32_t>(options, "heightPre");
  baton->topOffsetPost = AttrTo<int32_t>(options, "topOffsetPost");
  baton->leftOffsetPost = AttrTo<int32_t>(options, "leftOffsetPost");
  baton->widthPost = AttrTo<int32_t>(options, "widthPost");
  baton->heightPost = AttrTo<int32_t>(options, "heightPost");
  // Output image dimensions
  baton->width = AttrTo<int32_t>(options, "width");
  baton->height = AttrTo<int32_t>(options, "height");
  // Canvas option
  std::string canvas = AttrAsStr(options, "canvas");
  if (canvas == "crop") {
    baton->canvas = Canvas::CROP;
  } else if (canvas == "embed") {
    baton->canvas = Canvas::EMBED;
  } else if (canvas == "max") {
    baton->canvas = Canvas::MAX;
  } else if (canvas == "min") {
    baton->canvas = Canvas::MIN;
  } else if (canvas == "ignore_aspect") {
    baton->canvas = Canvas::IGNORE_ASPECT;
  }
  // Background colour
  v8::Local<v8::Object> background = AttrAs<v8::Object>(options, "background");
  for (unsigned int i = 0; i < 4; i++) {
    baton->background[i] = AttrTo<uint32_t>(background, i);
  }
  // Overlay options
  if (HasAttr(options, "overlay")) {
    baton->overlay = CreateInputDescriptor(AttrAs<v8::Object>(options, "overlay"), buffersToPersist);
    baton->overlayGravity = AttrTo<int32_t>(options, "overlayGravity");
    baton->overlayXOffset = AttrTo<int32_t>(options, "overlayXOffset");
    baton->overlayYOffset = AttrTo<int32_t>(options, "overlayYOffset");
    baton->overlayTile = AttrTo<bool>(options, "overlayTile");
    baton->overlayCutout = AttrTo<bool>(options, "overlayCutout");
  }
  // Resize options
  baton->withoutEnlargement = AttrTo<bool>(options, "withoutEnlargement");
  baton->crop = AttrTo<int32_t>(options, "crop");
  baton->kernel = AttrAsStr(options, "kernel");
  baton->interpolator = AttrAsStr(options, "interpolator");
  baton->centreSampling = AttrTo<bool>(options, "centreSampling");
  // Join Channel Options
  if (HasAttr(options, "joinChannelIn")) {
    v8::Local<v8::Object> joinChannelObject = Nan::Get(options, Nan::New("joinChannelIn").ToLocalChecked())
      .ToLocalChecked().As<v8::Object>();
    v8::Local<v8::Array> joinChannelArray = joinChannelObject.As<v8::Array>();
    int joinChannelArrayLength = AttrTo<int32_t>(joinChannelObject, "length");
    for (int i = 0; i < joinChannelArrayLength; i++) {
      baton->joinChannelIn.push_back(
        CreateInputDescriptor(
          Nan::Get(joinChannelArray, i).ToLocalChecked().As<v8::Object>(),
          buffersToPersist));
    }
  }
  // Operators
  baton->flatten = AttrTo<bool>(options, "flatten");
  baton->negate = AttrTo<bool>(options, "negate");
  baton->blurSigma = AttrTo<double>(options, "blurSigma");
  baton->sharpenSigma = AttrTo<double>(options, "sharpenSigma");
  baton->sharpenFlat = AttrTo<double>(options, "sharpenFlat");
  baton->sharpenJagged = AttrTo<double>(options, "sharpenJagged");
  baton->threshold = AttrTo<int32_t>(options, "threshold");
  baton->thresholdGrayscale = AttrTo<bool>(options, "thresholdGrayscale");
  baton->trimTolerance = AttrTo<int32_t>(options, "trimTolerance");
  if (baton->accessMethod == VIPS_ACCESS_SEQUENTIAL && baton->trimTolerance != 0) {
    baton->accessMethod = VIPS_ACCESS_RANDOM;
  }
  baton->gamma = AttrTo<double>(options, "gamma");
  baton->greyscale = AttrTo<bool>(options, "greyscale");
  baton->normalise = AttrTo<bool>(options, "normalise");
  baton->angle = AttrTo<int32_t>(options, "angle");
  baton->rotateBeforePreExtract = AttrTo<bool>(options, "rotateBeforePreExtract");
  baton->flip = AttrTo<bool>(options, "flip");
  baton->flop = AttrTo<bool>(options, "flop");
  baton->extendTop = AttrTo<int32_t>(options, "extendTop");
  baton->extendBottom = AttrTo<int32_t>(options, "extendBottom");
  baton->extendLeft = AttrTo<int32_t>(options, "extendLeft");
  baton->extendRight = AttrTo<int32_t>(options, "extendRight");
  baton->extractChannel = AttrTo<int32_t>(options, "extractChannel");
  if (HasAttr(options, "boolean")) {
    baton->boolean = CreateInputDescriptor(AttrAs<v8::Object>(options, "boolean"), buffersToPersist);
    baton->booleanOp = sharp::GetBooleanOperation(AttrAsStr(options, "booleanOp"));
  }
  if (HasAttr(options, "bandBoolOp")) {
    baton->bandBoolOp = sharp::GetBooleanOperation(AttrAsStr(options, "bandBoolOp"));
  }
  if (HasAttr(options, "convKernel")) {
    v8::Local<v8::Object> kernel = AttrAs<v8::Object>(options, "convKernel");
    baton->convKernelWidth = AttrTo<uint32_t>(kernel, "width");
    baton->convKernelHeight = AttrTo<uint32_t>(kernel, "height");
    baton->convKernelScale = AttrTo<double>(kernel, "scale");
    baton->convKernelOffset = AttrTo<double>(kernel, "offset");
    size_t const kernelSize = static_cast<size_t>(baton->convKernelWidth * baton->convKernelHeight);
    baton->convKernel = std::unique_ptr<double[]>(new double[kernelSize]);
    v8::Local<v8::Array> kdata = AttrAs<v8::Array>(kernel, "kernel");
    for (unsigned int i = 0; i < kernelSize; i++) {
      baton->convKernel[i] = AttrTo<double>(kdata, i);
    }
  }
  baton->colourspace = sharp::GetInterpretation(AttrAsStr(options, "colourspace"));
  if (baton->colourspace == VIPS_INTERPRETATION_ERROR) {
    baton->colourspace = VIPS_INTERPRETATION_sRGB;
  }
  // Output
  baton->formatOut = AttrAsStr(options, "formatOut");
  baton->fileOut = AttrAsStr(options, "fileOut");
  baton->withMetadata = AttrTo<bool>(options, "withMetadata");
  baton->withMetadataOrientation = AttrTo<uint32_t>(options, "withMetadataOrientation");
  // Format-specific
  baton->jpegQuality = AttrTo<uint32_t>(options, "jpegQuality");
  baton->jpegProgressive = AttrTo<bool>(options, "jpegProgressive");
  baton->jpegChromaSubsampling = AttrAsStr(options, "jpegChromaSubsampling");
  baton->jpegTrellisQuantisation = AttrTo<bool>(options, "jpegTrellisQuantisation");
  baton->jpegOvershootDeringing = AttrTo<bool>(options, "jpegOvershootDeringing");
  baton->jpegOptimiseScans = AttrTo<bool>(options, "jpegOptimiseScans");
  baton->pngProgressive = AttrTo<bool>(options, "pngProgressive");
  baton->pngCompressionLevel = AttrTo<uint32_t>(options, "pngCompressionLevel");
  baton->pngAdaptiveFiltering = AttrTo<bool>(options, "pngAdaptiveFiltering");
  baton->webpQuality = AttrTo<uint32_t>(options, "webpQuality");
  baton->webpAlphaQuality = AttrTo<uint32_t>(options, "webpAlphaQuality");
  baton->webpLossless = AttrTo<bool>(options, "webpLossless");
  baton->webpNearLossless = AttrTo<bool>(options, "webpNearLossless");
  baton->tiffQuality = AttrTo<uint32_t>(options, "tiffQuality");
  // Tile output
  baton->tileSize = AttrTo<uint32_t>(options, "tileSize");
  baton->tileOverlap = AttrTo<uint32_t>(options, "tileOverlap");
  std::string tileContainer = AttrAsStr(options, "tileContainer");
  if (tileContainer == "zip") {
    baton->tileContainer = VIPS_FOREIGN_DZ_CONTAINER_ZIP;
  } else {
    baton->tileContainer = VIPS_FOREIGN_DZ_CONTAINER_FS;
  }
  std::string tileLayout = AttrAsStr(options, "tileLayout");
  if (tileLayout == "google") {
    baton->tileLayout = VIPS_FOREIGN_DZ_LAYOUT_GOOGLE;
  } else if (tileLayout == "zoomify") {
    baton->tileLayout = VIPS_FOREIGN_DZ_LAYOUT_ZOOMIFY;
  } else {
    baton->tileLayout = VIPS_FOREIGN_DZ_LAYOUT_DZ;
  }
  baton->tileFormat = AttrAsStr(options, "tileFormat");

  // Function to notify of queue length changes
  Nan::Callback *queueListener = new Nan::Callback(AttrAs<v8::Function>(options, "queueListener"));

  // Join queue for worker thread
  Nan::Callback *callback = new Nan::Callback(info[1].As<v8::Function>());
  Nan::AsyncQueueWorker(new PipelineWorker(callback, baton, queueListener, buffersToPersist));

  // Increment queued task counter
  g_atomic_int_inc(&sharp::counterQueue);
  v8::Local<v8::Value> queueLength[1] = { Nan::New<v8::Uint32>(sharp::counterQueue) };
  queueListener->Call(1, queueLength);
}
