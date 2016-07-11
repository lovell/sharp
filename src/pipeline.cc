#include <algorithm>
#include <cmath>
#include <tuple>
#include <utility>
#include <memory>
#include <numeric>

#include <vips/vips8>

#include <node.h>
#include <node_buffer.h>

#include "nan.h"

#include "common.h"
#include "operations.h"
#include "pipeline.h"

using v8::Handle;
using v8::Local;
using v8::Value;
using v8::Object;
using v8::Integer;
using v8::Uint32;
using v8::String;
using v8::Array;
using v8::Function;
using v8::Exception;

using Nan::AsyncQueueWorker;
using Nan::AsyncWorker;
using Nan::Callback;
using Nan::HandleScope;
using Nan::Utf8String;
using Nan::Has;
using Nan::Get;
using Nan::Set;
using Nan::To;
using Nan::New;
using Nan::NewBuffer;
using Nan::Null;
using Nan::Equals;

using vips::VImage;
using vips::VInterpolate;
using vips::VOption;
using vips::VError;

using sharp::Composite;
using sharp::Cutout;
using sharp::Normalize;
using sharp::Gamma;
using sharp::Blur;
using sharp::Convolve;
using sharp::Sharpen;
using sharp::EntropyCrop;
using sharp::TileCache;
using sharp::Threshold;
using sharp::Bandbool;
using sharp::Boolean;
using sharp::Trim;

using sharp::ImageType;
using sharp::ImageTypeId;
using sharp::DetermineImageType;
using sharp::HasProfile;
using sharp::HasAlpha;
using sharp::ExifOrientation;
using sharp::SetExifOrientation;
using sharp::RemoveExifOrientation;
using sharp::SetDensity;
using sharp::IsJpeg;
using sharp::IsPng;
using sharp::IsWebp;
using sharp::IsTiff;
using sharp::IsDz;
using sharp::IsDzZip;
using sharp::IsV;
using sharp::FreeCallback;
using sharp::CalculateCrop;
using sharp::Is16Bit;
using sharp::MaximumImageAlpha;
using sharp::GetBooleanOperation;

using sharp::counterProcess;
using sharp::counterQueue;

class PipelineWorker : public AsyncWorker {
 public:
  PipelineWorker(
    Callback *callback, PipelineBaton *baton, Callback *queueListener,
    std::vector<Local<Object>> const buffersToPersist
  ) : AsyncWorker(callback), baton(baton), queueListener(queueListener), buffersToPersist(buffersToPersist) {
    // Protect Buffer objects from GC, keyed on index
    std::accumulate(buffersToPersist.begin(), buffersToPersist.end(), 0,
      [this](uint32_t index, Local<Object> const buffer) -> uint32_t {
        SaveToPersistent(index, buffer);
        return index + 1;
      }
    );
  }
  ~PipelineWorker() {}

  /*
    libuv worker
  */
  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&counterQueue);
    // Increment processing task counter
    g_atomic_int_inc(&counterProcess);

    // Default sRGB ICC profile from https://packages.debian.org/sid/all/icc-profiles-free/filelist
    std::string srgbProfile = baton->iccProfilePath + "sRGB.icc";

    // Input
    ImageType inputImageType = ImageType::UNKNOWN;
    VImage image;
    if (baton->bufferInLength > 0) {
      // From buffer
      if (baton->rawWidth > 0 && baton->rawHeight > 0 && baton->rawChannels > 0) {
        // Raw, uncompressed pixel data
        try {
          image = VImage::new_from_memory(baton->bufferIn, baton->bufferInLength,
            baton->rawWidth, baton->rawHeight, baton->rawChannels, VIPS_FORMAT_UCHAR);
          if (baton->rawChannels < 3) {
            image.get_image()->Type = VIPS_INTERPRETATION_B_W;
          } else {
            image.get_image()->Type = VIPS_INTERPRETATION_sRGB;
          }
          inputImageType = ImageType::RAW;
        } catch(VError const &err) {
          (baton->err).append(err.what());
          inputImageType = ImageType::UNKNOWN;
        }
      } else {
        // Compressed data
        inputImageType = DetermineImageType(baton->bufferIn, baton->bufferInLength);
        if (inputImageType != ImageType::UNKNOWN) {
          try {
            VOption *option = VImage::option()->set("access", baton->accessMethod);
            if (inputImageType == ImageType::SVG || inputImageType == ImageType::PDF) {
              option->set("dpi", static_cast<double>(baton->density));
            }
            if (inputImageType == ImageType::MAGICK) {
              option->set("density", std::to_string(baton->density).data());
            }
            image = VImage::new_from_buffer(baton->bufferIn, baton->bufferInLength, nullptr, option);
            if (inputImageType == ImageType::SVG ||
              inputImageType == ImageType::PDF ||
              inputImageType == ImageType::MAGICK) {
              SetDensity(image, baton->density);
            }
          } catch (...) {
            (baton->err).append("Input buffer has corrupt header");
            inputImageType = ImageType::UNKNOWN;
          }
        } else {
          (baton->err).append("Input buffer contains unsupported image format");
        }
      }
    } else {
      // From file
      inputImageType = DetermineImageType(baton->fileIn.data());
      if (inputImageType != ImageType::UNKNOWN) {
        try {
          VOption *option = VImage::option()->set("access", baton->accessMethod);
          if (inputImageType == ImageType::SVG || inputImageType == ImageType::PDF) {
            option->set("dpi", static_cast<double>(baton->density));
          }
          if (inputImageType == ImageType::MAGICK) {
            option->set("density", std::to_string(baton->density).data());
          }
          image = VImage::new_from_file(baton->fileIn.data(), option);
          if (inputImageType == ImageType::SVG ||
            inputImageType == ImageType::PDF ||
            inputImageType == ImageType::MAGICK) {
            SetDensity(image, baton->density);
          }
        } catch (...) {
          (baton->err).append("Input file has corrupt header");
          inputImageType = ImageType::UNKNOWN;
        }
      } else {
        (baton->err).append("Input file is missing or of an unsupported image format");
      }
    }
    if (inputImageType == ImageType::UNKNOWN) {
      return Error();
    }

    // Limit input images to a given number of pixels, where pixels = width * height
    // Ignore if 0
    if (baton->limitInputPixels > 0 && image.width() * image.height() > baton->limitInputPixels) {
      (baton->err).append("Input image exceeds pixel limit");
      return Error();
    }

    try {
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
        RemoveExifOrientation(image);
      }

      // Trim
      if(baton->trimTolerance != 0) {
        image = Trim(image, baton->trimTolerance);
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

      // If integral x and y shrink are equal, try to use libjpeg shrink-on-load,
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
        // Recalculate integral shrink and double residual
        xfactor = std::max(xfactor, 1.0);
        yfactor = std::max(yfactor, 1.0);
        xshrink = std::max(1, static_cast<int>(floor(xfactor)));
        yshrink = std::max(1, static_cast<int>(floor(yfactor)));
        xresidual = static_cast<double>(xshrink) / xfactor;
        yresidual = static_cast<double>(yshrink) / yfactor;
        // Reload input using shrink-on-load
        VOption *option = VImage::option()->set("shrink", shrink_on_load);
        if (baton->bufferInLength > 1) {
          VipsBlob *blob = vips_blob_new(nullptr, baton->bufferIn, baton->bufferInLength);
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
            image = VImage::jpegload(const_cast<char*>((baton->fileIn).data()), option);
          } else {
            // Reload WebP file
            image = VImage::webpload(const_cast<char*>((baton->fileIn).data()), option);
          }
        }
      }

      // Ensure we're using a device-independent colour space
      if (HasProfile(image)) {
        // Convert to sRGB using embedded profile
        try {
          image = image.icc_transform(const_cast<char*>(srgbProfile.data()), VImage::option()
            ->set("embedded", TRUE)
            ->set("intent", VIPS_INTENT_PERCEPTUAL)
          );
        } catch(...) {
          // Ignore failure of embedded profile
        }
      } else if (image.interpretation() == VIPS_INTERPRETATION_CMYK) {
        // Convert to sRGB using default CMYK profile from http://www.argyllcms.com/cmyk.icm
        std::string cmykProfile = baton->iccProfilePath + "cmyk.icm";
        image = image.icc_transform(const_cast<char*>(srgbProfile.data()), VImage::option()
          ->set("input_profile", cmykProfile.data())
          ->set("intent", VIPS_INTENT_PERCEPTUAL)
        );
      }

      // Calculate maximum alpha value based on input image pixel depth
      double const maxAlpha = MaximumImageAlpha(image.interpretation());

      // Flatten image to remove alpha channel
      if (baton->flatten && HasAlpha(image)) {
        // Scale up 8-bit values to match 16-bit input image
        double const multiplier = Is16Bit(image.interpretation()) ? 256.0 : 1.0;
        // Background colour
        std::vector<double> background {
          baton->background[0] * multiplier,
          baton->background[1] * multiplier,
          baton->background[2] * multiplier
        };
        image = image.flatten(VImage::option()
          ->set("background", background)
          ->set("max_alpha", maxAlpha)
        );
      }

      // Negate the colours in the image
      if (baton->negate) {
        image = image.invert();
      }

      // Gamma encoding (darken)
      if (baton->gamma >= 1 && baton->gamma <= 3) {
        image = Gamma(image, 1.0 / baton->gamma);
      }

      // Convert to greyscale (linear, therefore after gamma encoding, if any)
      if (baton->greyscale) {
        image = image.colourspace(VIPS_INTERPRETATION_B_W);
      }

      if (xshrink > 1 || yshrink > 1) {
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

      // Ensure image has an alpha channel when there is an overlay
      bool hasOverlay = baton->overlayBufferInLength > 0 || !baton->overlayFileIn.empty();
      if (hasOverlay && !HasAlpha(image)) {
        double const multiplier = Is16Bit(image.interpretation()) ? 256.0 : 1.0;
        image = image.bandjoin(
          VImage::new_matrix(image.width(), image.height()).new_from_image(255 * multiplier)
        );
      }

      bool shouldAffineTransform = xresidual != 1.0 || yresidual != 1.0;
      bool shouldBlur = baton->blurSigma != 0.0;
      bool shouldConv = baton->convKernelWidth * baton->convKernelHeight > 0;
      bool shouldSharpen = baton->sharpenSigma != 0.0;
      bool shouldCutout = baton->overlayCutout;
      bool shouldPremultiplyAlpha = HasAlpha(image) &&
        (shouldAffineTransform || shouldBlur || shouldConv || shouldSharpen || (hasOverlay && !shouldCutout));

      // Premultiply image alpha channel before all transformations to avoid
      // dark fringing around bright pixels
      // See: http://entropymine.com/imageworsener/resizealpha/
      if (shouldPremultiplyAlpha) {
        image = image.premultiply(VImage::option()->set("max_alpha", maxAlpha));
      }

      // Use affine increase or kernel reduce with the remaining float part
      if (shouldAffineTransform) {
        // Insert tile cache to prevent over-computation of previous operations
        if (baton->accessMethod == VIPS_ACCESS_SEQUENTIAL) {
          image = TileCache(image, yresidual);
        }
        // Perform kernel-based reduction
        if (yresidual < 1.0 || xresidual < 1.0) {
          VipsKernel kernel = static_cast<VipsKernel>(
            vips_enum_from_nick(nullptr, VIPS_TYPE_KERNEL, baton->kernel.data())
          );
          if (kernel != VIPS_KERNEL_CUBIC && kernel != VIPS_KERNEL_LANCZOS2 && kernel != VIPS_KERNEL_LANCZOS3) {
            throw VError("Unknown kernel");
          }
          if (yresidual < 1.0) {
            image = image.reducev(1.0 / yresidual, VImage::option()->set("kernel", kernel));
          }
          if (xresidual < 1.0) {
            image = image.reduceh(1.0 / xresidual, VImage::option()->set("kernel", kernel));
          }
        }
        // Perform affine enlargement
        if (yresidual > 1.0 || xresidual > 1.0) {
          VInterpolate interpolator = VInterpolate::new_from_name(baton->interpolator.data());
          if (yresidual > 1.0) {
            image = image.affine({1.0, 0.0, 0.0, yresidual}, VImage::option()
              ->set("interpolate", interpolator)
            );
          }
          if (xresidual > 1.0) {
            image = image.affine({xresidual, 0.0, 0.0, 1.0}, VImage::option()
              ->set("interpolate", interpolator)
            );
          }
        }
      }

      // Rotate
      if (!baton->rotateBeforePreExtract && rotation != VIPS_ANGLE_D0) {
        image = image.rot(rotation);
        RemoveExifOrientation(image);
      }

      // Flip (mirror about Y axis)
      if (baton->flip) {
        image = image.flip(VIPS_DIRECTION_VERTICAL);
        RemoveExifOrientation(image);
      }

      // Flop (mirror about X axis)
      if (baton->flop) {
        image = image.flip(VIPS_DIRECTION_HORIZONTAL);
        RemoveExifOrientation(image);
      }

      // Crop/embed
      if (image.width() != baton->width || image.height() != baton->height) {
        if (baton->canvas == Canvas::EMBED) {
          // Scale up 8-bit values to match 16-bit input image
          double const multiplier = Is16Bit(image.interpretation()) ? 256.0 : 1.0;
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
              0.0722 * baton->background[2]
            )};
          }
          // Add alpha channel to background colour
          if (baton->background[3] < 255.0 || HasAlpha(image)) {
            background.push_back(baton->background[3] * multiplier);
          }
          // Add non-transparent alpha channel, if required
          if (baton->background[3] < 255.0 && !HasAlpha(image)) {
            image = image.bandjoin(
              VImage::new_matrix(image.width(), image.height()).new_from_image(255 * multiplier)
            );
          }
          // Embed
          int left = static_cast<int>(round((baton->width - image.width()) / 2));
          int top = static_cast<int>(round((baton->height - image.height()) / 2));
          image = image.embed(left, top, baton->width, baton->height, VImage::option()
            ->set("extend", VIPS_EXTEND_BACKGROUND)
            ->set("background", background)
          );
        } else if (baton->canvas != Canvas::IGNORE_ASPECT) {
          // Crop/max/min
          int left;
          int top;
          if (baton->crop < 9) {
            // Gravity-based crop
            std::tie(left, top) = CalculateCrop(
              image.width(), image.height(), baton->width, baton->height, baton->crop
            );
          } else {
            // Entropy-based crop
            std::tie(left, top) = EntropyCrop(image, baton->width, baton->height);
          }
          int width = std::min(image.width(), baton->width);
          int height = std::min(image.height(), baton->height);
          image = image.extract_area(left, top, width, height);
        }
      }

      // Post extraction
      if (baton->topOffsetPost != -1) {
        image = image.extract_area(
          baton->leftOffsetPost, baton->topOffsetPost, baton->widthPost, baton->heightPost
        );
      }

      // Extend edges
      if (baton->extendTop > 0 || baton->extendBottom > 0 || baton->extendLeft > 0 || baton->extendRight > 0) {
        // Scale up 8-bit values to match 16-bit input image
        double const multiplier = Is16Bit(image.interpretation()) ? 256.0 : 1.0;
        // Create background colour
        std::vector<double> background {
          baton->background[0] * multiplier,
          baton->background[1] * multiplier,
          baton->background[2] * multiplier
        };
        // Add alpha channel to background colour
        if (baton->background[3] < 255.0 || HasAlpha(image)) {
          background.push_back(baton->background[3] * multiplier);
        }
        // Add non-transparent alpha channel, if required
        if (baton->background[3] < 255.0 && !HasAlpha(image)) {
          image = image.bandjoin(
            VImage::new_matrix(image.width(), image.height()).new_from_image(255 * multiplier)
          );
        }
        // Embed
        baton->width = image.width() + baton->extendLeft + baton->extendRight;
        baton->height = image.height() + baton->extendTop + baton->extendBottom;

        image = image.embed(baton->extendLeft, baton->extendTop, baton->width, baton->height,
          VImage::option()->set("extend", VIPS_EXTEND_BACKGROUND)->set("background", background));
      }

      // Threshold - must happen before blurring, due to the utility of blurring after thresholding
      if (baton->threshold != 0) {
        image = Threshold(image, baton->threshold, baton->thresholdGrayscale);
      }

      // Blur
      if (shouldBlur) {
        image = Blur(image, baton->blurSigma);
      }

      // Convolve
      if (shouldConv) {
        image = Convolve(image,
          baton->convKernelWidth, baton->convKernelHeight,
          baton->convKernelScale, baton->convKernelOffset,
          baton->convKernel
        );
      }

      // Sharpen
      if (shouldSharpen) {
        image = Sharpen(image, baton->sharpenSigma, baton->sharpenFlat, baton->sharpenJagged);
      }

      // Composite with overlay, if present
      if (hasOverlay) {
        VImage overlayImage;
        ImageType overlayImageType = ImageType::UNKNOWN;
        if (baton->overlayBufferInLength > 0) {
          // Overlay with image from buffer
          overlayImageType = DetermineImageType(baton->overlayBufferIn, baton->overlayBufferInLength);
          if (overlayImageType != ImageType::UNKNOWN) {
            try {
              overlayImage = VImage::new_from_buffer(baton->overlayBufferIn, baton->overlayBufferInLength,
                nullptr, VImage::option()->set("access", baton->accessMethod));
            } catch (...) {
              (baton->err).append("Overlay buffer has corrupt header");
              overlayImageType = ImageType::UNKNOWN;
            }
          } else {
            (baton->err).append("Overlay buffer contains unsupported image format");
          }
        } else {
          // Overlay with image from file
          overlayImageType = DetermineImageType(baton->overlayFileIn.data());
          if (overlayImageType != ImageType::UNKNOWN) {
            try {
              overlayImage = VImage::new_from_file(baton->overlayFileIn.data(),
                VImage::option()->set("access", baton->accessMethod));
            } catch (...) {
              (baton->err).append("Overlay file has corrupt header");
              overlayImageType = ImageType::UNKNOWN;
            }
          }
        }
        if (overlayImageType == ImageType::UNKNOWN) {
          return Error();
        }
        // Check if overlay is tiled
        if (baton->overlayTile) {
          int overlayImageWidth = overlayImage.width();
          int overlayImageHeight = overlayImage.height();
          int across = 0;
          int down = 0;

          // use gravity in ovelay
          if(overlayImageWidth <= baton->width) {
            across = static_cast<int>(ceil(static_cast<double>(image.width()) / overlayImageWidth));
          }
          if(overlayImageHeight <= baton->height) {
            down = static_cast<int>(ceil(static_cast<double>(image.height()) / overlayImageHeight));
          }
          if(across != 0 || down != 0) {
            int left;
            int top;
            overlayImage = overlayImage.replicate(across, down);

            if(baton->overlayXOffset >= 0 && baton->overlayYOffset >= 0) {
              // the overlayX/YOffsets will now be used to CalculateCrop for extract_area
              std::tie(left, top) = CalculateCrop(
                overlayImage.width(), overlayImage.height(), image.width(), image.height(),
                baton->overlayXOffset, baton->overlayYOffset
              );
            } else {
              // the overlayGravity will now be used to CalculateCrop for extract_area
              std::tie(left, top) = CalculateCrop(
                overlayImage.width(), overlayImage.height(), image.width(), image.height(), baton->overlayGravity
              );
            }
            overlayImage = overlayImage.extract_area(
              left, top, image.width(), image.height()
            );
          }
          // the overlayGravity was used for extract_area, therefore set it back to its default value of 0
          baton->overlayGravity = 0;
        }
        if(shouldCutout) {
          // 'cut out' the image, premultiplication is not required
          image = Cutout(overlayImage, image, baton->overlayGravity);
        } else {
          // Ensure overlay is premultiplied sRGB
          overlayImage = overlayImage.colourspace(VIPS_INTERPRETATION_sRGB).premultiply();
          if(baton->overlayXOffset >= 0 && baton->overlayYOffset >= 0) {
            // Composite images with given offsets
            image = Composite(overlayImage, image, baton->overlayXOffset, baton->overlayYOffset);
          } else {
            // Composite images with given gravity
            image = Composite(overlayImage, image, baton->overlayGravity);
          }
        }
      }

      // Reverse premultiplication after all transformations:
      if (shouldPremultiplyAlpha) {
        image = image.unpremultiply(VImage::option()->set("max_alpha", maxAlpha));
        // Cast pixel values to integer
        if (Is16Bit(image.interpretation())) {
          image = image.cast(VIPS_FORMAT_USHORT);
        } else {
          image = image.cast(VIPS_FORMAT_UCHAR);
        }
      }

      // Gamma decoding (brighten)
      if (baton->gamma >= 1 && baton->gamma <= 3) {
        image = Gamma(image, baton->gamma);
      }

      // Apply normalization - stretch luminance to cover full dynamic range
      if (baton->normalize) {
        image = Normalize(image);
      }

      // Convert image to sRGB, if not already
      if (Is16Bit(image.interpretation())) {
        image = image.cast(VIPS_FORMAT_USHORT);
      }
      if (image.interpretation() != VIPS_INTERPRETATION_sRGB) {
        image = image.colourspace(VIPS_INTERPRETATION_sRGB);
        // Transform colours from embedded profile to sRGB profile
        if (baton->withMetadata && HasProfile(image)) {
          image = image.icc_transform(const_cast<char*>(srgbProfile.data()), VImage::option()
            ->set("embedded", TRUE)
          );
        }
      }

      // Apply bitwise boolean operation between images
      if (baton->booleanOp != VIPS_OPERATION_BOOLEAN_LAST &&
          (baton->booleanBufferInLength > 0 || !baton->booleanFileIn.empty())) {
        VImage booleanImage;
        ImageType booleanImageType = ImageType::UNKNOWN;
        if (baton->booleanBufferInLength > 0) {
          // Buffer input for boolean operation
          booleanImageType = DetermineImageType(baton->booleanBufferIn, baton->booleanBufferInLength);
          if (booleanImageType != ImageType::UNKNOWN) {
            try {
              booleanImage = VImage::new_from_buffer(baton->booleanBufferIn, baton->booleanBufferInLength,
                nullptr, VImage::option()->set("access", baton->accessMethod));
            } catch (...) {
              (baton->err).append("Boolean operation buffer has corrupt header");
              booleanImageType = ImageType::UNKNOWN;
            }
          } else {
            (baton->err).append("Boolean operation buffer contains unsupported image format");
          }
        } else if (!baton->booleanFileIn.empty()) {
          // File input for boolean operation
          booleanImageType = DetermineImageType(baton->booleanFileIn.data());
          if (booleanImageType != ImageType::UNKNOWN) {
            try {
              booleanImage = VImage::new_from_file(baton->booleanFileIn.data(),
                VImage::option()->set("access", baton->accessMethod));
            } catch (...) {
              (baton->err).append("Boolean operation file has corrupt header");
            }
          }
        }
        if (booleanImageType == ImageType::UNKNOWN) {
          return Error();
        }
        // Apply the boolean operation
        image = Boolean(image, booleanImage, baton->booleanOp);
      }

      // Apply per-channel Bandbool bitwise operations after all other operations
      if (baton->bandBoolOp >= VIPS_OPERATION_BOOLEAN_AND && baton->bandBoolOp < VIPS_OPERATION_BOOLEAN_LAST) {
        image = Bandbool(image, baton->bandBoolOp);
      }

      // Extract an image channel (aka vips band)
      if(baton->extractChannel > -1) {
        if(baton->extractChannel >= image.bands()) {
          (baton->err).append("Cannot extract channel from image. Too few channels in image.");
          return Error();
        }
        image = image.extract_band(baton->extractChannel);
      }

      // Override EXIF Orientation tag
      if (baton->withMetadata && baton->withMetadataOrientation != -1) {
        SetExifOrientation(image, baton->withMetadataOrientation);
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
            ->set("Q", baton->quality)
            ->set("optimize_coding", TRUE)
            ->set("no_subsample", baton->withoutChromaSubsampling)
            ->set("trellis_quant", baton->trellisQuantisation)
            ->set("overshoot_deringing", baton->overshootDeringing)
            ->set("optimize_scans", baton->optimiseScans)
            ->set("interlace", baton->progressive)
          ));
          baton->bufferOut = static_cast<char*>(area->data);
          baton->bufferOutLength = area->length;
          area->free_fn = nullptr;
          vips_area_unref(area);
          baton->formatOut = "jpeg";
          baton->channels = std::min(baton->channels, 3);
        } else if (baton->formatOut == "png" || (baton->formatOut == "input" && inputImageType == ImageType::PNG)) {
          // Write PNG to buffer
          VipsArea *area = VIPS_AREA(image.pngsave_buffer(VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("compression", baton->compressionLevel)
            ->set("interlace", baton->progressive)
            ->set("filter", baton->withoutAdaptiveFiltering ?
              VIPS_FOREIGN_PNG_FILTER_NONE : VIPS_FOREIGN_PNG_FILTER_ALL)
          ));
          baton->bufferOut = static_cast<char*>(area->data);
          baton->bufferOutLength = area->length;
          area->free_fn = nullptr;
          vips_area_unref(area);
          baton->formatOut = "png";
        } else if (baton->formatOut == "webp" || (baton->formatOut == "input" && inputImageType == ImageType::WEBP)) {
          // Write WEBP to buffer
          VipsArea *area = VIPS_AREA(image.webpsave_buffer(VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->quality)
          ));
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
        bool isJpeg = IsJpeg(baton->fileOut);
        bool isPng = IsPng(baton->fileOut);
        bool isWebp = IsWebp(baton->fileOut);
        bool isTiff = IsTiff(baton->fileOut);
        bool isDz = IsDz(baton->fileOut);
        bool isDzZip = IsDzZip(baton->fileOut);
        bool isV = IsV(baton->fileOut);
        bool matchInput = baton->formatOut == "input" &&
          !(isJpeg || isPng || isWebp || isTiff || isDz || isDzZip || isV);
        if (baton->formatOut == "jpeg" || isJpeg || (matchInput && inputImageType == ImageType::JPEG)) {
          // Write JPEG to file
          image.jpegsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->quality)
            ->set("optimize_coding", TRUE)
            ->set("no_subsample", baton->withoutChromaSubsampling)
            ->set("trellis_quant", baton->trellisQuantisation)
            ->set("overshoot_deringing", baton->overshootDeringing)
            ->set("optimize_scans", baton->optimiseScans)
            ->set("interlace", baton->progressive)
          );
          baton->formatOut = "jpeg";
          baton->channels = std::min(baton->channels, 3);
        } else if (baton->formatOut == "png" || isPng || (matchInput && inputImageType == ImageType::PNG)) {
          // Write PNG to file
          image.pngsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("compression", baton->compressionLevel)
            ->set("interlace", baton->progressive)
            ->set("filter", baton->withoutAdaptiveFiltering ?
              VIPS_FOREIGN_PNG_FILTER_NONE : VIPS_FOREIGN_PNG_FILTER_ALL)
          );
          baton->formatOut = "png";
        } else if (baton->formatOut == "webp" || isWebp || (matchInput && inputImageType == ImageType::WEBP)) {
          // Write WEBP to file
          image.webpsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->quality)
          );
          baton->formatOut = "webp";
        } else if (baton->formatOut == "tiff" || isTiff || (matchInput && inputImageType == ImageType::TIFF)) {
          // Write TIFF to file
          image.tiffsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("Q", baton->quality)
            ->set("compression", VIPS_FOREIGN_TIFF_COMPRESSION_JPEG)
          );
          baton->formatOut = "tiff";
          baton->channels = std::min(baton->channels, 3);
        } else if (baton->formatOut == "dz" || isDz || isDzZip) {
          if (isDzZip) {
            baton->tileContainer = VIPS_FOREIGN_DZ_CONTAINER_ZIP;
          }
          // Write DZ to file
          image.dzsave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
            ->set("tile_size", baton->tileSize)
            ->set("overlap", baton->tileOverlap)
            ->set("container", baton->tileContainer)
            ->set("layout", baton->tileLayout)
          );
          baton->formatOut = "dz";
        } else if (baton->formatOut == "v" || isV || (matchInput && inputImageType == ImageType::VIPS)) {
          // Write V to file
          image.vipssave(const_cast<char*>(baton->fileOut.data()), VImage::option()
            ->set("strip", !baton->withMetadata)
          );
          baton->formatOut = "v";
        } else {
          // Unsupported output format
          (baton->err).append("Unsupported output format " + baton->fileOut);
          return Error();
        }
      }
    } catch (VError const &err) {
      (baton->err).append(err.what());
    }
    // Clean up libvips' per-request data and threads
    vips_error_clear();
    vips_thread_shutdown();
  }

  void HandleOKCallback () {
    HandleScope();

    Local<Value> argv[3] = { Null(), Null(), Null() };
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
      Local<Object> info = New<Object>();
      Set(info, New("format").ToLocalChecked(), New<String>(baton->formatOut).ToLocalChecked());
      Set(info, New("width").ToLocalChecked(), New<Uint32>(static_cast<uint32_t>(width)));
      Set(info, New("height").ToLocalChecked(), New<Uint32>(static_cast<uint32_t>(height)));
      Set(info, New("channels").ToLocalChecked(), New<Uint32>(static_cast<uint32_t>(baton->channels)));

      if (baton->bufferOutLength > 0) {
        // Pass ownership of output data to Buffer instance
        argv[1] = NewBuffer(
          static_cast<char*>(baton->bufferOut), baton->bufferOutLength, FreeCallback, nullptr
        ).ToLocalChecked();
        // Add buffer size to info
        Set(info, New("size").ToLocalChecked(), New<Uint32>(static_cast<uint32_t>(baton->bufferOutLength)));
        argv[2] = info;
      } else {
        // Add file size to info
        GStatBuf st;
        g_stat(baton->fileOut.data(), &st);
        Set(info, New("size").ToLocalChecked(), New<Uint32>(static_cast<uint32_t>(st.st_size)));
        argv[1] = info;
      }
    }

    // Dispose of Persistent wrapper around input Buffers so they can be garbage collected
    std::accumulate(buffersToPersist.begin(), buffersToPersist.end(), 0,
      [this](uint32_t index, Local<Object> const buffer) -> uint32_t {
        GetFromPersistent(index);
        return index + 1;
      }
    );
    delete baton;

    // Decrement processing task counter
    g_atomic_int_dec_and_test(&counterProcess);
    Local<Value> queueLength[1] = { New<Uint32>(counterQueue) };
    queueListener->Call(1, queueLength);
    delete queueListener;

    // Return to JavaScript
    callback->Call(3, argv);
  }

 private:
  PipelineBaton *baton;
  Callback *queueListener;
  std::vector<Local<Object>> buffersToPersist;

  /*
    Calculate the angle of rotation and need-to-flip for the output image.
    In order of priority:
     1. Use explicitly requested angle (supports 90, 180, 270)
     2. Use input image EXIF Orientation header - supports mirroring
     3. Otherwise default to zero, i.e. no rotation
  */
  std::tuple<VipsAngle, bool, bool>
  CalculateRotationAndFlip(int const angle, VImage image) {
    VipsAngle rotate = VIPS_ANGLE_D0;
    bool flip = FALSE;
    bool flop = FALSE;
    if (angle == -1) {
      switch(ExifOrientation(image)) {
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
    Clear all thread-local data.
  */
  void Error() {
    // Clean up libvips' per-request data and threads
    vips_error_clear();
    vips_thread_shutdown();
  }
};

// Convenience methods to access the attributes of a V8::Object
template<typename T> T attrAs(Handle<Object> obj, std::string attr) {
  return To<T>(Get(obj, New(attr).ToLocalChecked()).ToLocalChecked()).FromJust();
}
static std::string attrAsStr(Handle<Object> obj, std::string attr) {
  return *Utf8String(Get(obj, New(attr).ToLocalChecked()).ToLocalChecked());
}

/*
  pipeline(options, output, callback)
*/
NAN_METHOD(pipeline) {
  HandleScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  PipelineBaton *baton = new PipelineBaton;
  Local<Object> options = info[0].As<Object>();

  // Input Buffers must not undergo GC compaction during processing
  std::vector<Local<Object>> buffersToPersist;

  // Input filename
  baton->fileIn = attrAsStr(options, "fileIn");
  baton->accessMethod = attrAs<bool>(options, "sequentialRead") ?
    VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;
  // Input Buffer object
  Local<Object> bufferIn;
  if (node::Buffer::HasInstance(Get(options, New("bufferIn").ToLocalChecked()).ToLocalChecked())) {
    bufferIn = Get(options, New("bufferIn").ToLocalChecked()).ToLocalChecked().As<Object>();
    baton->bufferInLength = node::Buffer::Length(bufferIn);
    baton->bufferIn = node::Buffer::Data(bufferIn);
    buffersToPersist.push_back(bufferIn);
  }
  // ICC profile to use when input CMYK image has no embedded profile
  baton->iccProfilePath = attrAsStr(options, "iccProfilePath");
  // Limit input images to a given number of pixels, where pixels = width * height
  baton->limitInputPixels = attrAs<int32_t>(options, "limitInputPixels");
  // Density/DPI at which to load vector images via libmagick
  baton->density = attrAs<int32_t>(options, "density");
  // Raw pixel input
  baton->rawWidth = attrAs<int32_t>(options, "rawWidth");
  baton->rawHeight = attrAs<int32_t>(options, "rawHeight");
  baton->rawChannels = attrAs<int32_t>(options, "rawChannels");
  // Extract image options
  baton->topOffsetPre = attrAs<int32_t>(options, "topOffsetPre");
  baton->leftOffsetPre = attrAs<int32_t>(options, "leftOffsetPre");
  baton->widthPre = attrAs<int32_t>(options, "widthPre");
  baton->heightPre = attrAs<int32_t>(options, "heightPre");
  baton->topOffsetPost = attrAs<int32_t>(options, "topOffsetPost");
  baton->leftOffsetPost = attrAs<int32_t>(options, "leftOffsetPost");
  baton->widthPost = attrAs<int32_t>(options, "widthPost");
  baton->heightPost = attrAs<int32_t>(options, "heightPost");
  // Output image dimensions
  baton->width = attrAs<int32_t>(options, "width");
  baton->height = attrAs<int32_t>(options, "height");
  // Canvas option
  std::string canvas = attrAsStr(options, "canvas");
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
  Local<Object> background = Get(options, New("background").ToLocalChecked()).ToLocalChecked().As<Object>();
  for (int i = 0; i < 4; i++) {
    baton->background[i] = To<int32_t>(Get(background, i).ToLocalChecked()).FromJust();
  }
  // Overlay options
  baton->overlayFileIn = attrAsStr(options, "overlayFileIn");
  Local<Object> overlayBufferIn;
  if (node::Buffer::HasInstance(Get(options, New("overlayBufferIn").ToLocalChecked()).ToLocalChecked())) {
    overlayBufferIn = Get(options, New("overlayBufferIn").ToLocalChecked()).ToLocalChecked().As<Object>();
    baton->overlayBufferInLength = node::Buffer::Length(overlayBufferIn);
    baton->overlayBufferIn = node::Buffer::Data(overlayBufferIn);
    buffersToPersist.push_back(overlayBufferIn);
  }
  baton->overlayGravity = attrAs<int32_t>(options, "overlayGravity");
  baton->overlayXOffset = attrAs<int32_t>(options, "overlayXOffset");
  baton->overlayYOffset = attrAs<int32_t>(options, "overlayYOffset");
  baton->overlayTile = attrAs<bool>(options, "overlayTile");
  baton->overlayCutout = attrAs<bool>(options, "overlayCutout");
  // Boolean options
  baton->booleanFileIn = attrAsStr(options, "booleanFileIn");
  Local<Object> booleanBufferIn;
  if (node::Buffer::HasInstance(Get(options, New("booleanBufferIn").ToLocalChecked()).ToLocalChecked())) {
    booleanBufferIn = Get(options, New("booleanBufferIn").ToLocalChecked()).ToLocalChecked().As<Object>();
    baton->booleanBufferInLength = node::Buffer::Length(booleanBufferIn);
    baton->booleanBufferIn = node::Buffer::Data(booleanBufferIn);
    buffersToPersist.push_back(booleanBufferIn);
  }
  // Resize options
  baton->withoutEnlargement = attrAs<bool>(options, "withoutEnlargement");
  baton->crop = attrAs<int32_t>(options, "crop");
  baton->kernel = attrAsStr(options, "kernel");
  baton->interpolator = attrAsStr(options, "interpolator");
  // Operators
  baton->flatten = attrAs<bool>(options, "flatten");
  baton->negate = attrAs<bool>(options, "negate");
  baton->blurSigma = attrAs<double>(options, "blurSigma");
  baton->sharpenSigma = attrAs<double>(options, "sharpenSigma");
  baton->sharpenFlat = attrAs<double>(options, "sharpenFlat");
  baton->sharpenJagged = attrAs<double>(options, "sharpenJagged");
  baton->threshold = attrAs<int32_t>(options, "threshold");
  baton->thresholdGrayscale = attrAs<bool>(options, "thresholdGrayscale");
  baton->trimTolerance = attrAs<int32_t>(options, "trimTolerance");
  if(baton->accessMethod == VIPS_ACCESS_SEQUENTIAL && baton->trimTolerance != 0) {
    baton->accessMethod = VIPS_ACCESS_RANDOM;
  }
  baton->gamma = attrAs<double>(options, "gamma");
  baton->greyscale = attrAs<bool>(options, "greyscale");
  baton->normalize = attrAs<bool>(options, "normalize");
  baton->angle = attrAs<int32_t>(options, "angle");
  baton->rotateBeforePreExtract = attrAs<bool>(options, "rotateBeforePreExtract");
  baton->flip = attrAs<bool>(options, "flip");
  baton->flop = attrAs<bool>(options, "flop");
  baton->extendTop = attrAs<int32_t>(options, "extendTop");
  baton->extendBottom = attrAs<int32_t>(options, "extendBottom");
  baton->extendLeft = attrAs<int32_t>(options, "extendLeft");
  baton->extendRight = attrAs<int32_t>(options, "extendRight");
  baton->extractChannel = attrAs<int32_t>(options, "extractChannel");
  // Output options
  baton->progressive = attrAs<bool>(options, "progressive");
  baton->quality = attrAs<int32_t>(options, "quality");
  baton->compressionLevel = attrAs<int32_t>(options, "compressionLevel");
  baton->withoutAdaptiveFiltering = attrAs<bool>(options, "withoutAdaptiveFiltering");
  baton->withoutChromaSubsampling = attrAs<bool>(options, "withoutChromaSubsampling");
  baton->trellisQuantisation = attrAs<bool>(options, "trellisQuantisation");
  baton->overshootDeringing = attrAs<bool>(options, "overshootDeringing");
  baton->optimiseScans = attrAs<bool>(options, "optimiseScans");
  baton->withMetadata = attrAs<bool>(options, "withMetadata");
  baton->withMetadataOrientation = attrAs<int32_t>(options, "withMetadataOrientation");
  // Output
  baton->formatOut = attrAsStr(options, "formatOut");
  baton->fileOut = attrAsStr(options, "fileOut");
  // Tile output
  baton->tileSize = attrAs<int32_t>(options, "tileSize");
  baton->tileOverlap = attrAs<int32_t>(options, "tileOverlap");
  std::string tileContainer = attrAsStr(options, "tileContainer");
  if (tileContainer == "zip") {
    baton->tileContainer = VIPS_FOREIGN_DZ_CONTAINER_ZIP;
  } else {
    baton->tileContainer = VIPS_FOREIGN_DZ_CONTAINER_FS;
  }
  std::string tileLayout = attrAsStr(options, "tileLayout");
  if (tileLayout == "google") {
    baton->tileLayout = VIPS_FOREIGN_DZ_LAYOUT_GOOGLE;
  } else if (tileLayout == "zoomify") {
    baton->tileLayout = VIPS_FOREIGN_DZ_LAYOUT_ZOOMIFY;
  } else {
    baton->tileLayout = VIPS_FOREIGN_DZ_LAYOUT_DZ;
  }
  // Convolution Kernel
  if(Has(options, New("convKernel").ToLocalChecked()).FromJust()) {
    Local<Object> kernel = Get(options, New("convKernel").ToLocalChecked()).ToLocalChecked().As<Object>();
    baton->convKernelWidth = attrAs<uint32_t>(kernel, "width");
    baton->convKernelHeight = attrAs<uint32_t>(kernel, "height");
    baton->convKernelScale = attrAs<double>(kernel, "scale");
    baton->convKernelOffset = attrAs<double>(kernel, "offset");

    size_t const kernelSize = static_cast<size_t>(baton->convKernelWidth * baton->convKernelHeight);
    baton->convKernel = std::unique_ptr<double[]>(new double[kernelSize]);
    Local<Array> kdata = Get(kernel, New("kernel").ToLocalChecked()).ToLocalChecked().As<Array>();
    for(unsigned int i = 0; i < kernelSize; i++) {
      baton->convKernel[i] = To<double>(Get(kdata, i).ToLocalChecked()).FromJust();
    }
  }
  // Bandbool operation
  baton->bandBoolOp = GetBooleanOperation(attrAsStr(options, "bandBoolOp"));

  // Boolean operation
  baton->booleanOp = GetBooleanOperation(attrAsStr(options, "booleanOp"));

  // Function to notify of queue length changes
  Callback *queueListener = new Callback(
    Get(options, New("queueListener").ToLocalChecked()).ToLocalChecked().As<Function>()
  );

  // Join queue for worker thread
  Callback *callback = new Callback(info[1].As<Function>());
  AsyncQueueWorker(new PipelineWorker(callback, baton, queueListener, buffersToPersist));

  // Increment queued task counter
  g_atomic_int_inc(&counterQueue);
  Local<Value> queueLength[1] = { New<Uint32>(counterQueue) };
  queueListener->Call(1, queueLength);
}
