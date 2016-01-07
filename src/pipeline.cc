#include <tuple>
#include <algorithm>
#include <cmath>
#include <node.h>
#include <node_buffer.h>
#include <vips/vips.h>

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

using sharp::Composite;
using sharp::Normalize;
using sharp::Blur;
using sharp::Sharpen;
using sharp::Threshold;

using sharp::ImageType;
using sharp::DetermineImageType;
using sharp::InitImage;
using sharp::InterpolatorWindowSize;
using sharp::HasProfile;
using sharp::HasAlpha;
using sharp::ExifOrientation;
using sharp::SetExifOrientation;
using sharp::RemoveExifOrientation;
using sharp::IsJpeg;
using sharp::IsPng;
using sharp::IsWebp;
using sharp::IsTiff;
using sharp::IsDz;
using sharp::FreeCallback;
using sharp::counterProcess;
using sharp::counterQueue;

enum class Canvas {
  CROP,
  EMBED,
  MAX,
  MIN,
  IGNORE_ASPECT
};

enum class Angle {
  D0,
  D90,
  D180,
  D270,
  DLAST
};

struct PipelineBaton {
  std::string fileIn;
  char *bufferIn;
  size_t bufferInLength;
  std::string iccProfilePath;
  int limitInputPixels;
  std::string output;
  std::string outputFormat;
  void *bufferOut;
  size_t bufferOutLength;
  int topOffsetPre;
  int leftOffsetPre;
  int widthPre;
  int heightPre;
  int topOffsetPost;
  int leftOffsetPost;
  int widthPost;
  int heightPost;
  int width;
  int height;
  Canvas canvas;
  int gravity;
  std::string interpolator;
  double background[4];
  bool flatten;
  bool negate;
  double blurSigma;
  int sharpenRadius;
  double sharpenFlat;
  double sharpenJagged;
  int threshold;
  std::string overlayPath;
  double gamma;
  bool greyscale;
  bool normalize;
  int angle;
  bool rotateBeforePreExtract;
  bool flip;
  bool flop;
  bool progressive;
  bool withoutEnlargement;
  VipsAccess accessMethod;
  int quality;
  int compressionLevel;
  bool withoutAdaptiveFiltering;
  bool withoutChromaSubsampling;
  bool trellisQuantisation;
  bool overshootDeringing;
  bool optimiseScans;
  std::string err;
  bool withMetadata;
  int withMetadataOrientation;
  int tileSize;
  int tileOverlap;

  PipelineBaton():
    bufferInLength(0),
    limitInputPixels(0),
    outputFormat(""),
    bufferOutLength(0),
    topOffsetPre(-1),
    topOffsetPost(-1),
    canvas(Canvas::CROP),
    gravity(0),
    flatten(false),
    negate(false),
    blurSigma(0.0),
    sharpenRadius(0),
    sharpenFlat(1.0),
    sharpenJagged(2.0),
    threshold(0),
    gamma(0.0),
    greyscale(false),
    normalize(false),
    angle(0),
    flip(false),
    flop(false),
    progressive(false),
    withoutEnlargement(false),
    quality(80),
    compressionLevel(6),
    withoutAdaptiveFiltering(false),
    withoutChromaSubsampling(false),
    trellisQuantisation(false),
    overshootDeringing(false),
    optimiseScans(false),
    withMetadata(false),
    withMetadataOrientation(-1),
    tileSize(256),
    tileOverlap(0) {
      background[0] = 0.0;
      background[1] = 0.0;
      background[2] = 0.0;
      background[3] = 255.0;
    }
};

class PipelineWorker : public AsyncWorker {

 public:
  PipelineWorker(Callback *callback, PipelineBaton *baton, Callback *queueListener, const Local<Object> &bufferIn) :
    AsyncWorker(callback), baton(baton), queueListener(queueListener) {
      if (baton->bufferInLength > 0) {
        SaveToPersistent("bufferIn", bufferIn);
      }
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

    // Latest v2 sRGB ICC profile
    std::string srgbProfile = baton->iccProfilePath + "sRGB_IEC61966-2-1_black_scaled.icc";

    // Create "hook" VipsObject to hang image references from
    hook = reinterpret_cast<VipsObject*>(vips_image_new());

    // Input
    ImageType inputImageType = ImageType::UNKNOWN;
    VipsImage *image = nullptr;
    if (baton->bufferInLength > 0) {
      // From buffer
      inputImageType = DetermineImageType(baton->bufferIn, baton->bufferInLength);
      if (inputImageType != ImageType::UNKNOWN) {
        image = InitImage(baton->bufferIn, baton->bufferInLength, baton->accessMethod);
        if (image == nullptr) {
          // Could not read header data
          (baton->err).append("Input buffer has corrupt header");
          inputImageType = ImageType::UNKNOWN;
        }
      } else {
        (baton->err).append("Input buffer contains unsupported image format");
      }
    } else {
      // From file
      inputImageType = DetermineImageType(baton->fileIn.data());
      if (inputImageType != ImageType::UNKNOWN) {
        image = InitImage(baton->fileIn.data(), baton->accessMethod);
        if (image == nullptr) {
          (baton->err).append("Input file has corrupt header");
          inputImageType = ImageType::UNKNOWN;
        }
      } else {
        (baton->err).append("Input file is of an unsupported image format");
      }
    }
    if (image == nullptr || inputImageType == ImageType::UNKNOWN) {
      return Error();
    }
    vips_object_local(hook, image);

    // Limit input images to a given number of pixels, where pixels = width * height
    if (image->Xsize * image->Ysize > baton->limitInputPixels) {
      (baton->err).append("Input image exceeds pixel limit");
      return Error();
    }

    // Calculate angle of rotation
    Angle rotation;
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
    if (baton->rotateBeforePreExtract && rotation != Angle::D0) {
      VipsImage *rotated;
      if (vips_rot(image, &rotated, static_cast<VipsAngle>(rotation), nullptr)) {
        return Error();
      }
      vips_object_local(hook, rotated);
      image = rotated;
      RemoveExifOrientation(image);
    }

    // Pre extraction
    if (baton->topOffsetPre != -1) {
      VipsImage *extractedPre;
      if (vips_extract_area(image, &extractedPre, baton->leftOffsetPre, baton->topOffsetPre, baton->widthPre, baton->heightPre, nullptr)) {
        return Error();
      }
      vips_object_local(hook, extractedPre);
      image = extractedPre;
    }

    // Get pre-resize image width and height
    int inputWidth = image->Xsize;
    int inputHeight = image->Ysize;
    if (!baton->rotateBeforePreExtract && (rotation == Angle::D90 || rotation == Angle::D270)) {
      // Swap input output width and height when rotating by 90 or 270 degrees
      int swap = inputWidth;
      inputWidth = inputHeight;
      inputHeight = swap;
    }

    // Get window size of interpolator, used for determining shrink vs affine
    int interpolatorWindowSize = InterpolatorWindowSize(baton->interpolator.data());
    if (interpolatorWindowSize < 0) {
      return Error();
    }

    // Scaling calculations
    double xfactor = 1.0;
    double yfactor = 1.0;
    if (baton->width > 0 && baton->height > 0) {
      // Fixed width and height
      xfactor = static_cast<double>(inputWidth) / static_cast<double>(baton->width);
      yfactor = static_cast<double>(inputHeight) / static_cast<double>(baton->height);
      switch (baton->canvas) {
        case Canvas::CROP:
          xfactor = std::min(xfactor, yfactor);
          yfactor = xfactor;
          break;
        case Canvas::EMBED:
          xfactor = std::max(xfactor, yfactor);
          yfactor = xfactor;
          break;
        case Canvas::MAX:
          if (xfactor > yfactor) {
            baton->height = static_cast<int>(round(static_cast<double>(inputHeight) / xfactor));
            yfactor = xfactor;
          } else {
            baton->width = static_cast<int>(round(static_cast<double>(inputWidth) / yfactor));
            xfactor = yfactor;
          }
          break;
        case Canvas::MIN:
          if (xfactor < yfactor) {
            baton->height = static_cast<int>(round(static_cast<double>(inputHeight) / xfactor));
            yfactor = xfactor;
          } else {
            baton->width = static_cast<int>(round(static_cast<double>(inputWidth) / yfactor));
            xfactor = yfactor;
          }
          break;
        case Canvas::IGNORE_ASPECT:
          // xfactor, yfactor OK!
          break;
      }
    } else if (baton->width > 0) {
      // Fixed width
      xfactor = static_cast<double>(inputWidth) / static_cast<double>(baton->width);
      if (baton->canvas == Canvas::IGNORE_ASPECT) {
        baton->height = inputHeight;
      } else {
        // Auto height
        yfactor = xfactor;
        baton->height = static_cast<int>(round(static_cast<double>(inputHeight) / yfactor));
      }
    } else if (baton->height > 0) {
      // Fixed height
      yfactor = static_cast<double>(inputHeight) / static_cast<double>(baton->height);
      if (baton->canvas == Canvas::IGNORE_ASPECT) {
        baton->width = inputWidth;
      } else {
        // Auto width
        xfactor = yfactor;
        baton->width = static_cast<int>(round(static_cast<double>(inputWidth) / xfactor));
      }
    } else {
      // Identity transform
      baton->width = inputWidth;
      baton->height = inputHeight;
    }

    // Calculate integral box shrink
    int xshrink = CalculateShrink(xfactor, interpolatorWindowSize);
    int yshrink = CalculateShrink(yfactor, interpolatorWindowSize);

    // Calculate residual float affine transformation
    double xresidual = CalculateResidual(xshrink, xfactor);
    double yresidual = CalculateResidual(yshrink, yfactor);

    // Do not enlarge the output if the input width *or* height are already less than the required dimensions
    if (baton->withoutEnlargement) {
      if (inputWidth < baton->width || inputHeight < baton->height) {
        xfactor = 1;
        yfactor = 1;
        xshrink = 1;
        yshrink = 1;
        xresidual = 0;
        yresidual = 0;
        baton->width = inputWidth;
        baton->height = inputHeight;
      }
    }

    // If integral x and y shrink are equal, try to use libjpeg shrink-on-load, but not when applying gamma correction or pre-resize extract
    int shrink_on_load = 1;
    if (xshrink == yshrink && inputImageType == ImageType::JPEG && xshrink >= 2 && baton->gamma == 0 && baton->topOffsetPre == -1) {
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
      xshrink = CalculateShrink(xfactor, interpolatorWindowSize);
      yshrink = CalculateShrink(yfactor, interpolatorWindowSize);
      xresidual = CalculateResidual(xshrink, xfactor);
      yresidual = CalculateResidual(yshrink, yfactor);
      // Reload input using shrink-on-load
      VipsImage *shrunkOnLoad;
      if (baton->bufferInLength > 1) {
        if (vips_jpegload_buffer(baton->bufferIn, baton->bufferInLength, &shrunkOnLoad, "shrink", shrink_on_load, nullptr)) {
          return Error();
        }
      } else {
        if (vips_jpegload((baton->fileIn).data(), &shrunkOnLoad, "shrink", shrink_on_load, nullptr)) {
          return Error();
        }
      }
      vips_object_local(hook, shrunkOnLoad);
      image = shrunkOnLoad;
    }

    // Ensure we're using a device-independent colour space
    if (HasProfile(image)) {
      // Convert to sRGB using embedded profile
      VipsImage *transformed;
      if (
        !vips_icc_transform(image, &transformed, srgbProfile.data(),
          "embedded", TRUE, "intent", VIPS_INTENT_PERCEPTUAL, nullptr)
      ) {
        // Embedded profile can fail, so only update references on success
        vips_object_local(hook, transformed);
        image = transformed;
      }
    } else if (image->Type == VIPS_INTERPRETATION_CMYK) {
      // Convert to sRGB using default "USWebCoatedSWOP" CMYK profile
      std::string cmykProfile = baton->iccProfilePath + "USWebCoatedSWOP.icc";
      VipsImage *transformed;
      if (
        vips_icc_transform(image, &transformed, srgbProfile.data(),
          "input_profile", cmykProfile.data(), "intent", VIPS_INTENT_PERCEPTUAL, nullptr)
      ) {
        return Error();
      }
      vips_object_local(hook, transformed);
      image = transformed;
    }

    // Calculate maximum alpha value based on input image pixel depth
    double maxAlpha = (image->BandFmt == VIPS_FORMAT_USHORT) ? 65535.0 : 255.0;

    // Flatten image to remove alpha channel
    if (baton->flatten && HasAlpha(image)) {
      // Scale up 8-bit values to match 16-bit input image
      double multiplier = (image->Type == VIPS_INTERPRETATION_RGB16) ? 256.0 : 1.0;
      // Background colour
      VipsArrayDouble *background = vips_array_double_newv(
        3, // Ignore alpha channel as we're about to remove it
        baton->background[0] * multiplier,
        baton->background[1] * multiplier,
        baton->background[2] * multiplier
      );
      VipsImage *flattened;
      if (vips_flatten(image, &flattened, "background", background, "max_alpha", maxAlpha, nullptr)) {
        vips_area_unref(reinterpret_cast<VipsArea*>(background));
        return Error();
      }
      vips_area_unref(reinterpret_cast<VipsArea*>(background));
      vips_object_local(hook, flattened);
      image = flattened;
    }

    // Negate the colors in the image.
    if (baton->negate) {
        VipsImage *negated;
        if (vips_invert(image, &negated, nullptr)) {
            return Error();
        }
        vips_object_local(hook, negated);
        image = negated;
    }

    // Gamma encoding (darken)
    if (baton->gamma >= 1 && baton->gamma <= 3 && !HasAlpha(image)) {
      VipsImage *gammaEncoded;
      if (vips_gamma(image, &gammaEncoded, "exponent", 1.0 / baton->gamma, nullptr)) {
        return Error();
      }
      vips_object_local(hook, gammaEncoded);
      image = gammaEncoded;
    }

    // Convert to greyscale (linear, therefore after gamma encoding, if any)
    if (baton->greyscale) {
      VipsImage *greyscale;
      if (vips_colourspace(image, &greyscale, VIPS_INTERPRETATION_B_W, nullptr)) {
        return Error();
      }
      vips_object_local(hook, greyscale);
      image = greyscale;
    }

    if (xshrink > 1 || yshrink > 1) {
      VipsImage *shrunk;
      // Use vips_shrink with the integral reduction
      if (vips_shrink(image, &shrunk, xshrink, yshrink, nullptr)) {
        return Error();
      }
      vips_object_local(hook, shrunk);
      image = shrunk;
      // Recalculate residual float based on dimensions of required vs shrunk images
      int shrunkWidth = shrunk->Xsize;
      int shrunkHeight = shrunk->Ysize;
      if (rotation == Angle::D90 || rotation == Angle::D270) {
        // Swap input output width and height when rotating by 90 or 270 degrees
        int swap = shrunkWidth;
        shrunkWidth = shrunkHeight;
        shrunkHeight = swap;
      }
      xresidual = static_cast<double>(baton->width) / static_cast<double>(shrunkWidth);
      yresidual = static_cast<double>(baton->height) / static_cast<double>(shrunkHeight);
      if (baton->canvas == Canvas::EMBED) {
        xresidual = std::min(xresidual, yresidual);
        yresidual = xresidual;
      } else if (baton->canvas != Canvas::IGNORE_ASPECT) {
        xresidual = std::max(xresidual, yresidual);
        yresidual = xresidual;
      }
    }

    bool shouldAffineTransform = xresidual != 0.0 || yresidual != 0.0;
    bool shouldBlur = baton->blurSigma != 0.0;
    bool shouldSharpen = baton->sharpenRadius != 0;
    bool shouldThreshold = baton->threshold != 0;
    bool hasOverlay = !baton->overlayPath.empty();
    bool shouldPremultiplyAlpha = HasAlpha(image) && (shouldAffineTransform || shouldBlur || shouldSharpen || hasOverlay);

    // Premultiply image alpha channel before all transformations to avoid
    // dark fringing around bright pixels
    // See: http://entropymine.com/imageworsener/resizealpha/
    if (shouldPremultiplyAlpha) {
      VipsImage *imagePremultiplied;
      if (vips_premultiply(image, &imagePremultiplied, "max_alpha", maxAlpha, nullptr)) {
        (baton->err).append("Failed to premultiply alpha channel.");
        return Error();
      }
      vips_object_local(hook, imagePremultiplied);
      image = imagePremultiplied;
    }

    // Use vips_affine with the remaining float part
    if (shouldAffineTransform) {
      // Create interpolator
      VipsInterpolate *interpolator = vips_interpolate_new(baton->interpolator.data());
      if (interpolator == nullptr) {
        return Error();
      }
      vips_object_local(hook, interpolator);
      // Use average of x and y residuals to compute sigma for Gaussian blur
      double residual = (xresidual + yresidual) / 2.0;
      // Apply Gaussian blur before large affine reductions
      if (residual < 1.0) {
        // Calculate standard deviation
        double sigma = ((1.0 / residual) - 0.4) / 3.0;
        if (sigma >= 0.3) {
          // Sequential input requires a small linecache before use of convolution
          if (baton->accessMethod == VIPS_ACCESS_SEQUENTIAL) {
            VipsImage *lineCached;
            if (vips_linecache(image, &lineCached, "access", VIPS_ACCESS_SEQUENTIAL,
              "tile_height", 1, "threaded", TRUE, nullptr)
            ) {
              return Error();
            }
            vips_object_local(hook, lineCached);
            image = lineCached;
          }
          // Apply Gaussian blur
          VipsImage *blurred;
          if (vips_gaussblur(image, &blurred, sigma, nullptr)) {
            return Error();
          }
          vips_object_local(hook, blurred);
          image = blurred;
        }
      }
      // Perform affine transformation
      VipsImage *affined;
      if (vips_affine(image, &affined, xresidual, 0.0, 0.0, yresidual,
        "interpolate", interpolator, nullptr)
      ) {
        return Error();
      }
      vips_object_local(hook, affined);
      image = affined;
    }

    // Rotate
    if (!baton->rotateBeforePreExtract && rotation != Angle::D0) {
      VipsImage *rotated;
      if (vips_rot(image, &rotated, static_cast<VipsAngle>(rotation), nullptr)) {
        return Error();
      }
      vips_object_local(hook, rotated);
      image = rotated;
      RemoveExifOrientation(image);
    }

    // Flip (mirror about Y axis)
    if (baton->flip) {
      VipsImage *flipped;
      if (vips_flip(image, &flipped, VIPS_DIRECTION_VERTICAL, nullptr)) {
        return Error();
      }
      vips_object_local(hook, flipped);
      image = flipped;
      RemoveExifOrientation(image);
    }

    // Flop (mirror about X axis)
    if (baton->flop) {
      VipsImage *flopped;
      if (vips_flip(image, &flopped, VIPS_DIRECTION_HORIZONTAL, nullptr)) {
        return Error();
      }
      vips_object_local(hook, flopped);
      image = flopped;
      RemoveExifOrientation(image);
    }

    // Crop/embed
    if (image->Xsize != baton->width || image->Ysize != baton->height) {
      if (baton->canvas == Canvas::EMBED) {
        // Add non-transparent alpha channel, if required
        if (baton->background[3] < 255.0 && !HasAlpha(image)) {
          // Create single-channel transparency
          VipsImage *black;
          if (vips_black(&black, image->Xsize, image->Ysize, "bands", 1, nullptr)) {
            return Error();
          }
          vips_object_local(hook, black);
          // Invert to become non-transparent
          VipsImage *alpha;
          if (vips_invert(black, &alpha, nullptr)) {
            return Error();
          }
          vips_object_local(hook, alpha);
          // Append alpha channel to existing image
          VipsImage *joined;
          if (vips_bandjoin2(image, alpha, &joined, nullptr)) {
            return Error();
          }
          vips_object_local(hook, joined);
          image = joined;
        }
        // Create background
        VipsArrayDouble *background;
        // Scale up 8-bit values to match 16-bit input image
        double multiplier = (image->Type == VIPS_INTERPRETATION_RGB16) ? 256.0 : 1.0;
        if (baton->background[3] < 255.0 || HasAlpha(image)) {
          // RGBA
          background = vips_array_double_newv(4,
            baton->background[0] * multiplier,
            baton->background[1] * multiplier,
            baton->background[2] * multiplier,
            baton->background[3] * multiplier
          );
        } else {
          // RGB
          background = vips_array_double_newv(3,
            baton->background[0] * multiplier,
            baton->background[1] * multiplier,
            baton->background[2] * multiplier
          );
        }
        // Embed
        int left = (baton->width - image->Xsize) / 2;
        int top = (baton->height - image->Ysize) / 2;
        VipsImage *embedded;
        if (vips_embed(image, &embedded, left, top, baton->width, baton->height,
          "extend", VIPS_EXTEND_BACKGROUND, "background", background, nullptr
        )) {
          vips_area_unref(reinterpret_cast<VipsArea*>(background));
          return Error();
        }
        vips_area_unref(reinterpret_cast<VipsArea*>(background));
        vips_object_local(hook, embedded);
        image = embedded;
      } else if (baton->canvas != Canvas::IGNORE_ASPECT) {
        // Crop/max/min
        int left;
        int top;
        std::tie(left, top) = CalculateCrop(image->Xsize, image->Ysize, baton->width, baton->height, baton->gravity);
        int width = std::min(image->Xsize, baton->width);
        int height = std::min(image->Ysize, baton->height);
        VipsImage *extracted;
        if (vips_extract_area(image, &extracted, left, top, width, height, nullptr)) {
          return Error();
        }
        vips_object_local(hook, extracted);
        image = extracted;
      }
    }

    // Post extraction
    if (baton->topOffsetPost != -1) {
      VipsImage *extractedPost;
      if (vips_extract_area(image, &extractedPost,
        baton->leftOffsetPost, baton->topOffsetPost, baton->widthPost, baton->heightPost, nullptr
      )) {
        return Error();
      }
      vips_object_local(hook, extractedPost);
      image = extractedPost;
    }

    // Threshold - must happen before blurring, due to the utility of blurring after thresholding
    if (shouldThreshold) {
        VipsImage *thresholded;
        if (Threshold(hook, image, &thresholded, baton->threshold)) {
            return Error();
        }
        image = thresholded;
    }

    // Blur
    if (shouldBlur) {
      VipsImage *blurred;
      if (Blur(hook, image, &blurred, baton->blurSigma)) {
        return Error();
      }
      image = blurred;
    }

    // Sharpen
    if (shouldSharpen) {
      VipsImage *sharpened;
      if (Sharpen(hook, image, &sharpened, baton->sharpenRadius, baton->sharpenFlat, baton->sharpenJagged)) {
        return Error();
      }
      image = sharpened;
    }

    // Composite with overlay, if present
    if (hasOverlay) {
      VipsImage *overlayImage = nullptr;
      ImageType overlayImageType = ImageType::UNKNOWN;
      overlayImageType = DetermineImageType(baton->overlayPath.data());
      if (overlayImageType != ImageType::UNKNOWN) {
        overlayImage = InitImage(baton->overlayPath.data(), baton->accessMethod);
        if (overlayImage == nullptr) {
          (baton->err).append("Overlay image has corrupt header");
          return Error();
        } else {
          vips_object_local(hook, overlayImage);
        }
      } else {
        (baton->err).append("Overlay image is of an unsupported image format");
        return Error();
      }
      if (image->BandFmt != VIPS_FORMAT_UCHAR && image->BandFmt != VIPS_FORMAT_FLOAT) {
        (baton->err).append("Expected image band format to be uchar or float: ");
        (baton->err).append(vips_enum_nick(VIPS_TYPE_BAND_FORMAT, image->BandFmt));
        return Error();
      }
      if (overlayImage->BandFmt != VIPS_FORMAT_UCHAR && overlayImage->BandFmt != VIPS_FORMAT_FLOAT) {
        (baton->err).append("Expected overlay image band format to be uchar or float: ");
        (baton->err).append(vips_enum_nick(VIPS_TYPE_BAND_FORMAT, overlayImage->BandFmt));
        return Error();
      }
      if (!HasAlpha(overlayImage)) {
        (baton->err).append("Overlay image must have an alpha channel");
        return Error();
      }
      if (overlayImage->Xsize != image->Xsize && overlayImage->Ysize != image->Ysize) {
        (baton->err).append("Overlay image must have same dimensions as resized image");
        return Error();
      }

      // Ensure overlay is sRGB
      VipsImage *overlayImageRGB;
      if (vips_colourspace(overlayImage, &overlayImageRGB, VIPS_INTERPRETATION_sRGB, nullptr)) {
        return Error();
      }
      vips_object_local(hook, overlayImageRGB);

      // Premultiply overlay
      VipsImage *overlayImagePremultiplied;
      if (vips_premultiply(overlayImageRGB, &overlayImagePremultiplied, nullptr)) {
        (baton->err).append("Failed to premultiply alpha channel of overlay image");
        return Error();
      }
      vips_object_local(hook, overlayImagePremultiplied);

      VipsImage *composited;
      if (Composite(hook, overlayImagePremultiplied, image, &composited)) {
        (baton->err).append("Failed to composite images");
        return Error();
      }
      vips_object_local(hook, composited);
      image = composited;
    }

    // Reverse premultiplication after all transformations:
    if (shouldPremultiplyAlpha) {
      VipsImage *imageUnpremultiplied;
      if (vips_unpremultiply(image, &imageUnpremultiplied, "max_alpha", maxAlpha, nullptr)) {
        (baton->err).append("Failed to unpremultiply alpha channel");
        return Error();
      }
      vips_object_local(hook, imageUnpremultiplied);
      image = imageUnpremultiplied;
    }

    // Gamma decoding (brighten)
    if (baton->gamma >= 1 && baton->gamma <= 3 && !HasAlpha(image)) {
      VipsImage *gammaDecoded;
      if (vips_gamma(image, &gammaDecoded, "exponent", baton->gamma, nullptr)) {
        return Error();
      }
      vips_object_local(hook, gammaDecoded);
      image = gammaDecoded;
    }

    // Apply normalization - stretch luminance to cover full dynamic range
    if (baton->normalize) {
      VipsImage *normalized;
      if (Normalize(hook, image, &normalized)) {
        return Error();
      }
      image = normalized;
    }

    // Convert image to sRGB, if not already
    if (image->Type == VIPS_INTERPRETATION_RGB16) {
      // Ensure 16-bit integer
      VipsImage *ushort;
      if (vips_cast_ushort(image, &ushort, nullptr)) {
        return Error();
      }
      vips_object_local(hook, ushort);
      image = ushort;
      // Fast conversion to 8-bit integer by discarding least-significant byte
      VipsImage *msb;
      if (vips_msb(image, &msb, nullptr)) {
        return Error();
      }
      vips_object_local(hook, msb);
      image = msb;
      // Explicitly set to sRGB
      image->Type = VIPS_INTERPRETATION_sRGB;
    } else if (image->Type != VIPS_INTERPRETATION_sRGB) {
      // Switch interpretation to sRGB
      VipsImage *rgb;
      if (vips_colourspace(image, &rgb, VIPS_INTERPRETATION_sRGB, nullptr)) {
        return Error();
      }
      vips_object_local(hook, rgb);
      image = rgb;
      // Transform colours from embedded profile to sRGB profile
      if (baton->withMetadata && HasProfile(image)) {
        VipsImage *profiled;
        if (vips_icc_transform(image, &profiled, srgbProfile.data(), "embedded", TRUE, nullptr)) {
          return Error();
        }
        vips_object_local(hook, profiled);
        image = profiled;
      }
    }

    // Override EXIF Orientation tag
    if (baton->withMetadata && baton->withMetadataOrientation != -1) {
      SetExifOrientation(image, baton->withMetadataOrientation);
    }

    // Output
    if (baton->output == "__jpeg" || (baton->output == "__input" && inputImageType == ImageType::JPEG)) {
      // Write JPEG to buffer
      if (vips_jpegsave_buffer(
        image, &baton->bufferOut, &baton->bufferOutLength,
        "strip", !baton->withMetadata,
        "Q", baton->quality,
        "optimize_coding", TRUE,
        "no_subsample", baton->withoutChromaSubsampling,
        "trellis_quant", baton->trellisQuantisation,
        "overshoot_deringing", baton->overshootDeringing,
        "optimize_scans", baton->optimiseScans,
        "interlace", baton->progressive,
        nullptr
      )) {
        return Error();
      }
      baton->outputFormat = "jpeg";
    } else if (baton->output == "__png" || (baton->output == "__input" && inputImageType == ImageType::PNG)) {
      // Write PNG to buffer
      if (vips_pngsave_buffer(
        image, &baton->bufferOut, &baton->bufferOutLength,
        "strip", !baton->withMetadata,
        "compression", baton->compressionLevel,
        "interlace", baton->progressive,
        "filter", baton->withoutAdaptiveFiltering ? VIPS_FOREIGN_PNG_FILTER_NONE : VIPS_FOREIGN_PNG_FILTER_ALL,
        nullptr
      )) {
        return Error();
      }
      baton->outputFormat = "png";
    } else if (baton->output == "__webp" || (baton->output == "__input" && inputImageType == ImageType::WEBP)) {
      // Write WEBP to buffer
      if (vips_webpsave_buffer(
        image, &baton->bufferOut, &baton->bufferOutLength,
        "strip", !baton->withMetadata,
        "Q", baton->quality,
        nullptr
      )) {
        return Error();
      }
      baton->outputFormat = "webp";
    } else if (baton->output == "__raw") {
      // Write raw, uncompressed image data to buffer
      if (baton->greyscale || image->Type == VIPS_INTERPRETATION_B_W) {
        // Extract first band for greyscale image
        VipsImage *grey;
        if (vips_extract_band(image, &grey, 0, nullptr)) {
          return Error();
        }
        vips_object_local(hook, grey);
        image = grey;
      }
      if (image->BandFmt != VIPS_FORMAT_UCHAR) {
        // Cast pixels to uint8 (unsigned char)
        VipsImage *uchar;
        if (vips_cast(image, &uchar, VIPS_FORMAT_UCHAR, nullptr)) {
          return Error();
        }
        vips_object_local(hook, uchar);
        image = uchar;
      }
      // Get raw image data
      baton->bufferOut = vips_image_write_to_memory(image, &baton->bufferOutLength);
      if (baton->bufferOut == nullptr) {
        (baton->err).append("Could not allocate enough memory for raw output");
        return Error();
      }
      baton->outputFormat = "raw";
    } else {
      bool outputJpeg = IsJpeg(baton->output);
      bool outputPng = IsPng(baton->output);
      bool outputWebp = IsWebp(baton->output);
      bool outputTiff = IsTiff(baton->output);
      bool outputDz = IsDz(baton->output);
      bool matchInput = !(outputJpeg || outputPng || outputWebp || outputTiff || outputDz);
      if (outputJpeg || (matchInput && inputImageType == ImageType::JPEG)) {
        // Write JPEG to file
        if (vips_jpegsave(
          image, baton->output.data(),
          "strip", !baton->withMetadata,
          "Q", baton->quality,
          "optimize_coding", TRUE,
          "no_subsample", baton->withoutChromaSubsampling,
          "trellis_quant", baton->trellisQuantisation,
          "overshoot_deringing", baton->overshootDeringing,
          "optimize_scans", baton->optimiseScans,
          "interlace", baton->progressive,
          nullptr
        )) {
          return Error();
        }
        baton->outputFormat = "jpeg";
      } else if (outputPng || (matchInput && inputImageType == ImageType::PNG)) {
        // Write PNG to file
        if (vips_pngsave(
          image, baton->output.data(),
          "strip", !baton->withMetadata,
          "compression", baton->compressionLevel,
          "interlace", baton->progressive,
          "filter", baton->withoutAdaptiveFiltering ? VIPS_FOREIGN_PNG_FILTER_NONE : VIPS_FOREIGN_PNG_FILTER_ALL,
          nullptr
        )) {
          return Error();
        }
        baton->outputFormat = "png";
      } else if (outputWebp || (matchInput && inputImageType == ImageType::WEBP)) {
        // Write WEBP to file
        if (vips_webpsave(
          image, baton->output.data(),
          "strip", !baton->withMetadata,
          "Q", baton->quality,
          nullptr
        )) {
          return Error();
        }
        baton->outputFormat = "webp";
      } else if (outputTiff || (matchInput && inputImageType == ImageType::TIFF)) {
        // Write TIFF to file
        if (vips_tiffsave(
          image, baton->output.data(),
          "strip", !baton->withMetadata,
          "compression", VIPS_FOREIGN_TIFF_COMPRESSION_JPEG,
          "Q", baton->quality,
          nullptr
        )) {
          return Error();
        }
        baton->outputFormat = "tiff";
      } else if (outputDz) {
        // Write DZ to file
        if (vips_dzsave(
          image, baton->output.data(),
          "strip", !baton->withMetadata,
          "tile_size", baton->tileSize,
          "overlap", baton->tileOverlap,
          nullptr
        )) {
          return Error();
        }
        baton->outputFormat = "dz";
      } else {
        (baton->err).append("Unsupported output " + baton->output);
        return Error();
      }
    }
    // Clean up any dangling image references
    g_object_unref(hook);
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
      Set(info, New("format").ToLocalChecked(), New<String>(baton->outputFormat).ToLocalChecked());
      Set(info, New("width").ToLocalChecked(), New<Uint32>(static_cast<uint32_t>(width)));
      Set(info, New("height").ToLocalChecked(), New<Uint32>(static_cast<uint32_t>(height)));

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
        g_stat(baton->output.data(), &st);
        Set(info, New("size").ToLocalChecked(), New<Uint32>(static_cast<uint32_t>(st.st_size)));
        argv[1] = info;
      }
    }

    // Dispose of Persistent wrapper around input Buffer so it can be garbage collected
    if (baton->bufferInLength > 0) {
      GetFromPersistent("bufferIn");
    }
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
  VipsObject *hook;

  /*
    Calculate the angle of rotation and need-to-flip for the output image.
    In order of priority:
     1. Use explicitly requested angle (supports 90, 180, 270)
     2. Use input image EXIF Orientation header - supports mirroring
     3. Otherwise default to zero, i.e. no rotation
  */
  std::tuple<Angle, bool, bool>
  CalculateRotationAndFlip(int const angle, VipsImage const *input) {
    Angle rotate = Angle::D0;
    bool flip = FALSE;
    bool flop = FALSE;
    if (angle == -1) {
      switch(ExifOrientation(input)) {
        case 6: rotate = Angle::D90; break;
        case 3: rotate = Angle::D180; break;
        case 8: rotate = Angle::D270; break;
        case 2: flop = TRUE; break; // flop 1
        case 7: flip = TRUE; rotate = Angle::D90; break; // flip 6
        case 4: flop = TRUE; rotate = Angle::D180; break; // flop 3
        case 5: flip = TRUE; rotate = Angle::D270; break; // flip 8
      }
    } else {
      if (angle == 90) {
        rotate = Angle::D90;
      } else if (angle == 180) {
        rotate = Angle::D180;
      } else if (angle == 270) {
        rotate = Angle::D270;
      }
    }
    return std::make_tuple(rotate, flip, flop);
  }

  /*
    Calculate the (left, top) coordinates of the output image
    within the input image, applying the given gravity.
  */
  std::tuple<int, int>
  CalculateCrop(int const inWidth, int const inHeight, int const outWidth, int const outHeight, int const gravity) {
    int left = 0;
    int top = 0;
    switch (gravity) {
      case 1: // North
        left = (inWidth - outWidth + 1) / 2;
        break;
      case 2: // East
        left = inWidth - outWidth;
        top = (inHeight - outHeight + 1) / 2;
        break;
      case 3: // South
        left = (inWidth - outWidth + 1) / 2;
        top = inHeight - outHeight;
        break;
      case 4: // West
        top = (inHeight - outHeight + 1) / 2;
        break;
      case 5: // Northeast
        left = inWidth - outWidth;
        break;
      case 6: // Southeast
        left = inWidth - outWidth;
        top = inHeight - outHeight;
      case 7: // Southwest
        top = inHeight - outHeight;
      case 8: // Northwest
        break;
      default: // Centre
        left = (inWidth - outWidth + 1) / 2;
        top = (inHeight - outHeight + 1) / 2;
    }
    return std::make_tuple(left, top);
  }

  /*
    Calculate integral shrink given factor and interpolator window size
  */
  int CalculateShrink(double factor, int interpolatorWindowSize) {
    int shrink = 1;
    if (factor >= 2 && interpolatorWindowSize > 3) {
      // Shrink less, affine more with interpolators that use at least 4x4 pixel window, e.g. bicubic
      shrink = static_cast<int>(floor(factor * 3.0 / interpolatorWindowSize));
    } else {
      shrink = static_cast<int>(floor(factor));
    }
    if (shrink < 1) {
      shrink = 1;
    }
    return shrink;
  }

  /*
    Calculate residual given shrink and factor
  */
  double CalculateResidual(int shrink, double factor) {
    return static_cast<double>(shrink) / factor;
  }

  /*
    Copy then clear the error message.
    Unref all transitional images on the hook.
    Clear all thread-local data.
  */
  void Error() {
    // Get libvips' error message
    (baton->err).append(vips_error_buffer());
    // Clean up any dangling image references
    g_object_unref(hook);
    // Clean up libvips' per-request data and threads
    vips_error_clear();
    vips_thread_shutdown();
  }
};

/*
  pipeline(options, output, callback)
*/
NAN_METHOD(pipeline) {
  HandleScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  PipelineBaton *baton = new PipelineBaton;
  Local<Object> options = info[0].As<Object>();

  // Input filename
  baton->fileIn = *Utf8String(Get(options, New("fileIn").ToLocalChecked()).ToLocalChecked());
  baton->accessMethod =
    To<bool>(Get(options, New("sequentialRead").ToLocalChecked()).ToLocalChecked()).FromJust() ?
    VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;
  // Input Buffer object
  Local<Object> bufferIn;
  if (node::Buffer::HasInstance(Get(options, New("bufferIn").ToLocalChecked()).ToLocalChecked())) {
    bufferIn = Get(options, New("bufferIn").ToLocalChecked()).ToLocalChecked().As<Object>();
    baton->bufferInLength = node::Buffer::Length(bufferIn);
    baton->bufferIn = node::Buffer::Data(bufferIn);
  }
  // ICC profile to use when input CMYK image has no embedded profile
  baton->iccProfilePath = *Utf8String(Get(options, New("iccProfilePath").ToLocalChecked()).ToLocalChecked());
  // Limit input images to a given number of pixels, where pixels = width * height
  baton->limitInputPixels = To<int32_t>(Get(options, New("limitInputPixels").ToLocalChecked()).ToLocalChecked()).FromJust();
  // Extract image options
  baton->topOffsetPre = To<int32_t>(Get(options, New("topOffsetPre").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->leftOffsetPre = To<int32_t>(Get(options, New("leftOffsetPre").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->widthPre = To<int32_t>(Get(options, New("widthPre").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->heightPre = To<int32_t>(Get(options, New("heightPre").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->topOffsetPost = To<int32_t>(Get(options, New("topOffsetPost").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->leftOffsetPost = To<int32_t>(Get(options, New("leftOffsetPost").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->widthPost = To<int32_t>(Get(options, New("widthPost").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->heightPost = To<int32_t>(Get(options, New("heightPost").ToLocalChecked()).ToLocalChecked()).FromJust();
  // Output image dimensions
  baton->width = To<int32_t>(Get(options, New("width").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->height = To<int32_t>(Get(options, New("height").ToLocalChecked()).ToLocalChecked()).FromJust();
  // Canvas option
  Local<String> canvas = To<String>(Get(options, New("canvas").ToLocalChecked()).ToLocalChecked()).ToLocalChecked();
  if (Equals(canvas, New("crop").ToLocalChecked()).FromJust()) {
    baton->canvas = Canvas::CROP;
  } else if (Equals(canvas, New("embed").ToLocalChecked()).FromJust()) {
    baton->canvas = Canvas::EMBED;
  } else if (Equals(canvas, New("max").ToLocalChecked()).FromJust()) {
    baton->canvas = Canvas::MAX;
  } else if (Equals(canvas, New("min").ToLocalChecked()).FromJust()) {
    baton->canvas = Canvas::MIN;
  } else if (Equals(canvas, New("ignore_aspect").ToLocalChecked()).FromJust()) {
    baton->canvas = Canvas::IGNORE_ASPECT;
  }
  // Background colour
  Local<Object> background = Get(options, New("background").ToLocalChecked()).ToLocalChecked().As<Object>();
  for (int i = 0; i < 4; i++) {
    baton->background[i] = To<int32_t>(Get(background, i).ToLocalChecked()).FromJust();
  }
  // Overlay options
  baton->overlayPath = *Utf8String(Get(options, New("overlayPath").ToLocalChecked()).ToLocalChecked());
  // Resize options
  baton->withoutEnlargement = To<bool>(Get(options, New("withoutEnlargement").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->gravity = To<int32_t>(Get(options, New("gravity").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->interpolator = *Utf8String(Get(options, New("interpolator").ToLocalChecked()).ToLocalChecked());
  // Operators
  baton->flatten = To<bool>(Get(options, New("flatten").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->negate = To<bool>(Get(options, New("negate").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->blurSigma = To<double>(Get(options, New("blurSigma").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->sharpenRadius = To<int32_t>(Get(options, New("sharpenRadius").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->sharpenFlat = To<double>(Get(options, New("sharpenFlat").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->sharpenJagged = To<double>(Get(options, New("sharpenJagged").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->threshold = To<int32_t>(Get(options, New("threshold").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->gamma = To<int32_t>(Get(options, New("gamma").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->greyscale = To<bool>(Get(options, New("greyscale").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->normalize = To<bool>(Get(options, New("normalize").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->angle = To<int32_t>(Get(options, New("angle").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->rotateBeforePreExtract = To<bool>(Get(options, New("rotateBeforePreExtract").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->flip = To<bool>(Get(options, New("flip").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->flop = To<bool>(Get(options, New("flop").ToLocalChecked()).ToLocalChecked()).FromJust();
  // Output options
  baton->progressive = To<bool>(Get(options, New("progressive").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->quality = To<int32_t>(Get(options, New("quality").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->compressionLevel = To<int32_t>(Get(options, New("compressionLevel").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->withoutAdaptiveFiltering = To<bool>(Get(options, New("withoutAdaptiveFiltering").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->withoutChromaSubsampling = To<bool>(Get(options, New("withoutChromaSubsampling").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->trellisQuantisation = To<bool>(Get(options, New("trellisQuantisation").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->overshootDeringing = To<bool>(Get(options, New("overshootDeringing").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->optimiseScans = To<bool>(Get(options, New("optimiseScans").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->withMetadata = To<bool>(Get(options, New("withMetadata").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->withMetadataOrientation = To<int32_t>(Get(options, New("withMetadataOrientation").ToLocalChecked()).ToLocalChecked()).FromJust();
  // Output filename or __format for Buffer
  baton->output = *Utf8String(Get(options, New("output").ToLocalChecked()).ToLocalChecked());
  baton->tileSize = To<int32_t>(Get(options, New("tileSize").ToLocalChecked()).ToLocalChecked()).FromJust();
  baton->tileOverlap = To<int32_t>(Get(options, New("tileOverlap").ToLocalChecked()).ToLocalChecked()).FromJust();
  // Function to notify of queue length changes
  Callback *queueListener = new Callback(Get(options, New("queueListener").ToLocalChecked()).ToLocalChecked().As<Function>());

  // Join queue for worker thread
  Callback *callback = new Callback(info[1].As<Function>());
  AsyncQueueWorker(new PipelineWorker(callback, baton, queueListener, bufferIn));

  // Increment queued task counter
  g_atomic_int_inc(&counterQueue);
  Local<Value> queueLength[1] = { New<Uint32>(counterQueue) };
  queueListener->Call(1, queueLength);
}
