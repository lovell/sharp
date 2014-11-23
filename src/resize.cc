#include <tuple>
#include <algorithm>
#include <cmath>
#include <node.h>
#include <node_buffer.h>
#include <vips/vips.h>

#include "nan.h"

#include "common.h"
#include "resize.h"

using namespace v8;
using namespace sharp;

enum class Canvas {
  CROP,
  MAX,
  EMBED
};

enum class Angle {
	D0,
	D90,
	D180,
	D270,
	DLAST
};

struct ResizeBaton {
  std::string fileIn;
  void* bufferIn;
  size_t bufferInLength;
  std::string iccProfileCmyk;
  std::string output;
  std::string outputFormat;
  void* bufferOut;
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
  double blurSigma;
  int sharpenRadius;
  double sharpenFlat;
  double sharpenJagged;
  double gamma;
  bool greyscale;
  int angle;
  bool flip;
  bool flop;
  bool progressive;
  bool withoutEnlargement;
  VipsAccess accessMethod;
  int quality;
  int compressionLevel;
  bool withoutAdaptiveFiltering;
  std::string err;
  bool withMetadata;

  ResizeBaton():
    bufferInLength(0),
    outputFormat(""),
    bufferOutLength(0),
    topOffsetPre(-1),
    topOffsetPost(-1),
    canvas(Canvas::CROP),
    gravity(0),
    flatten(false),
    blurSigma(0.0),
    sharpenRadius(0),
    sharpenFlat(1.0),
    sharpenJagged(2.0),
    gamma(0.0),
    greyscale(false),
    angle(0),
    flip(false),
    flop(false),
    progressive(false),
    withoutEnlargement(false),
    quality(80),
    compressionLevel(6),
    withoutAdaptiveFiltering(false),
    withMetadata(false) {
      background[0] = 0.0;
      background[1] = 0.0;
      background[2] = 0.0;
      background[3] = 255.0;
    }
};

class ResizeWorker : public NanAsyncWorker {

 public:
  ResizeWorker(NanCallback *callback, ResizeBaton *baton) : NanAsyncWorker(callback), baton(baton) {}
  ~ResizeWorker() {}

  /*
    libuv worker
  */
  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&counterQueue);
    // Increment processing task counter
    g_atomic_int_inc(&counterProcess);

    // Hang image references from this hook object
    VipsObject *hook = reinterpret_cast<VipsObject*>(vips_image_new());

    // Input
    ImageType inputImageType = ImageType::UNKNOWN;
    VipsImage *image;
    if (baton->bufferInLength > 1) {
      // From buffer
      inputImageType = DetermineImageType(baton->bufferIn, baton->bufferInLength);
      if (inputImageType != ImageType::UNKNOWN) {
        image = InitImage(inputImageType, baton->bufferIn, baton->bufferInLength, baton->accessMethod);
      } else {
        (baton->err).append("Input buffer contains unsupported image format");
      }
    } else {
      // From file
      inputImageType = DetermineImageType(baton->fileIn.c_str());
      if (inputImageType != ImageType::UNKNOWN) {
        image = InitImage(inputImageType, baton->fileIn.c_str(), baton->accessMethod);
      } else {
        (baton->err).append("File is of an unsupported image format");
      }
    }
    if (inputImageType == ImageType::UNKNOWN) {
      return Error(baton, hook);
    }
    vips_object_local(hook, image);

    // Pre extraction
    if (baton->topOffsetPre != -1) {
      VipsImage *extractedPre;
      if (vips_extract_area(image, &extractedPre, baton->leftOffsetPre, baton->topOffsetPre, baton->widthPre, baton->heightPre, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, extractedPre);
      image = extractedPre;
    }

    // Get input image width and height
    int inputWidth = image->Xsize;
    int inputHeight = image->Ysize;

    // Calculate angle of rotation, to be carried out later
    Angle rotation;
    bool flip;
    std::tie(rotation, flip) = CalculateRotationAndFlip(baton->angle, image);
    if (rotation == Angle::D90 || rotation == Angle::D270) {
      // Swap input output width and height when rotating by 90 or 270 degrees
      int swap = inputWidth;
      inputWidth = inputHeight;
      inputHeight = swap;
    }
    if (flip && !baton->flip) {
      // Add flip operation due to EXIF mirroring
      baton->flip = TRUE;
    }

    // Get window size of interpolator, used for determining shrink vs affine
    int interpolatorWindowSize = InterpolatorWindowSize(baton->interpolator.c_str());

    // Scaling calculations
    double factor;
    if (baton->width > 0 && baton->height > 0) {
      // Fixed width and height
      double xfactor = static_cast<double>(inputWidth) / static_cast<double>(baton->width);
      double yfactor = static_cast<double>(inputHeight) / static_cast<double>(baton->height);
      factor = (baton->canvas == Canvas::CROP) ? std::min(xfactor, yfactor) : std::max(xfactor, yfactor);
      // if max is set, we need to compute the real size of the thumb image
      if (baton->canvas == Canvas::MAX) {
        if (xfactor > yfactor) {
          baton->height = round(static_cast<double>(inputHeight) / xfactor);
        } else {
          baton->width = round(static_cast<double>(inputWidth) / yfactor);
        }
      }
    } else if (baton->width > 0) {
      // Fixed width, auto height
      factor = static_cast<double>(inputWidth) / static_cast<double>(baton->width);
      baton->height = floor(static_cast<double>(inputHeight) / factor);
    } else if (baton->height > 0) {
      // Fixed height, auto width
      factor = static_cast<double>(inputHeight) / static_cast<double>(baton->height);
      baton->width = floor(static_cast<double>(inputWidth) / factor);
    } else {
      // Identity transform
      factor = 1;
      baton->width = inputWidth;
      baton->height = inputHeight;
    }

    // Calculate integral box shrink
    int shrink = 1;
    if (factor >= 2 && interpolatorWindowSize > 3) {
      // Shrink less, affine more with interpolators that use at least 4x4 pixel window, e.g. bicubic
      shrink = floor(factor * 3.0 / interpolatorWindowSize);
    } else {
      shrink = floor(factor);
    }
    if (shrink < 1) {
      shrink = 1;
    }

    // Calculate residual float affine transformation
    double residual = static_cast<double>(shrink) / factor;

    // Do not enlarge the output if the input width *or* height are already less than the required dimensions
    if (baton->withoutEnlargement) {
      if (inputWidth < baton->width || inputHeight < baton->height) {
        factor = 1;
        shrink = 1;
        residual = 0;
        baton->width = inputWidth;
        baton->height = inputHeight;
      }
    }

    // Try to use libjpeg shrink-on-load, but not when applying gamma correction or pre-resize extract
    int shrink_on_load = 1;
    if (inputImageType == ImageType::JPEG && shrink >= 2 && baton->gamma == 0 && baton->topOffsetPre == -1) {
      if (shrink >= 8) {
        factor = factor / 8;
        shrink_on_load = 8;
      } else if (shrink >= 4) {
        factor = factor / 4;
        shrink_on_load = 4;
      } else if (shrink >= 2) {
        factor = factor / 2;
        shrink_on_load = 2;
      }
    }
    if (shrink_on_load > 1) {
      // Recalculate integral shrink and double residual
      factor = std::max(factor, 1.0);
      if (factor >= 2 && interpolatorWindowSize > 3) {
        shrink = floor(factor * 3.0 / interpolatorWindowSize);
      } else {
        shrink = floor(factor);
      }
      residual = static_cast<double>(shrink) / factor;
      // Reload input using shrink-on-load
      VipsImage *shrunkOnLoad;
      if (baton->bufferInLength > 1) {
        if (vips_jpegload_buffer(baton->bufferIn, baton->bufferInLength, &shrunkOnLoad, "shrink", shrink_on_load, NULL)) {
          return Error(baton, hook);
        }
      } else {
        if (vips_jpegload((baton->fileIn).c_str(), &shrunkOnLoad, "shrink", shrink_on_load, NULL)) {
          return Error(baton, hook);
        }
      }
      vips_object_local(hook, shrunkOnLoad);
      image = shrunkOnLoad;
    }

    // Handle colour profile, if any, for non sRGB images
    if (image->Type != VIPS_INTERPRETATION_sRGB) {
      // Get the input colour profile
      if (vips_image_get_typeof(image, VIPS_META_ICC_NAME)) {
        VipsImage *profile;
        // Use embedded profile
        if (vips_icc_import(image, &profile, "pcs", VIPS_PCS_XYZ, "embedded", TRUE, NULL)) {
          return Error(baton, hook);
        }
        vips_object_local(hook, profile);
        image = profile;
      } else if (image->Type == VIPS_INTERPRETATION_CMYK) {
        VipsImage *profile;
        // CMYK with no embedded profile
        if (vips_icc_import(image, &profile, "pcs", VIPS_PCS_XYZ, "input_profile", (baton->iccProfileCmyk).c_str(), NULL)) {
          return Error(baton, hook);
        }
        vips_object_local(hook, profile);
        image = profile;
      }
      // Attempt to convert to sRGB colour space
      VipsImage *colourspaced;
      if (vips_colourspace(image, &colourspaced, VIPS_INTERPRETATION_sRGB, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, colourspaced);
      image = colourspaced;
    }

    // Flatten image to remove alpha channel
    if (baton->flatten && HasAlpha(image)) {
      // Background colour
      VipsArrayDouble *background = vips_array_double_newv(
        3, // Ignore alpha channel as we're about to remove it
        baton->background[0],
        baton->background[1],
        baton->background[2]
      );
      VipsImage *flattened;
      if (vips_flatten(image, &flattened, "background", background, NULL)) {
        vips_area_unref(reinterpret_cast<VipsArea*>(background));
        return Error(baton, hook);
      };
      vips_area_unref(reinterpret_cast<VipsArea*>(background));
      vips_object_local(hook, flattened);
      image = flattened;
    }

    // Gamma encoding (darken)
    if (baton->gamma >= 1 && baton->gamma <= 3) {
      VipsImage *gammaEncoded;
      if (vips_gamma(image, &gammaEncoded, "exponent", 1.0 / baton->gamma, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, gammaEncoded);
      image = gammaEncoded;
    }

    // Convert to greyscale (linear, therefore after gamma encoding, if any)
    if (baton->greyscale) {
      VipsImage *greyscale;
      if (vips_colourspace(image, &greyscale, VIPS_INTERPRETATION_B_W, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, greyscale);
      image = greyscale;
    }

    if (shrink > 1) {
      VipsImage *shrunk;
      // Use vips_shrink with the integral reduction
      if (vips_shrink(image, &shrunk, shrink, shrink, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, shrunk);
      image = shrunk;
      // Recalculate residual float based on dimensions of required vs shrunk images
      double shrunkWidth = shrunk->Xsize;
      double shrunkHeight = shrunk->Ysize;
      if (rotation == Angle::D90 || rotation == Angle::D270) {
        // Swap input output width and height when rotating by 90 or 270 degrees
        int swap = shrunkWidth;
        shrunkWidth = shrunkHeight;
        shrunkHeight = swap;
      }
      double residualx = static_cast<double>(baton->width) / static_cast<double>(shrunkWidth);
      double residualy = static_cast<double>(baton->height) / static_cast<double>(shrunkHeight);
      if (baton->canvas == Canvas::EMBED) {
        residual = std::min(residualx, residualy);
      } else {
        residual = std::max(residualx, residualy);
      }
    }

    // Use vips_affine with the remaining float part
    if (residual != 0.0) {
      // Apply Gaussian blur before large affine reductions
      if (residual < 1.0) {
        // Calculate standard deviation
        double sigma = ((1.0 / residual) - 0.5) / 1.5;
        if (sigma >= 0.3) {
          // Create Gaussian function for standard deviation
          VipsImage *gaussian;
          if (vips_gaussmat(&gaussian, sigma, 0.2, "separable", TRUE, "integer", TRUE, NULL)) {
            return Error(baton, hook);
          }
          vips_object_local(hook, gaussian);
          // Apply Gaussian function
          VipsImage *blurred;
          if (vips_convsep(image, &blurred, gaussian, "precision", VIPS_PRECISION_INTEGER, NULL)) {
            return Error(baton, hook);
          }
          vips_object_local(hook, blurred);
          image = blurred;
        }
      }
      // Create interpolator - "bilinear" (default), "bicubic" or "nohalo"
      VipsInterpolate *interpolator = vips_interpolate_new(baton->interpolator.c_str());
      vips_object_local(hook, interpolator);
      // Perform affine transformation
      VipsImage *affined;
      if (vips_affine(image, &affined, residual, 0.0, 0.0, residual, "interpolate", interpolator, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, affined);
      image = affined;
    }

    // Rotate
    if (rotation != Angle::D0) {
      VipsImage *rotated;
      if (vips_rot(image, &rotated, static_cast<VipsAngle>(rotation), NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, rotated);
      image = rotated;
    }

    // Flip (mirror about Y axis)
    if (baton->flip) {
      VipsImage *flipped;
      if (vips_flip(image, &flipped, VIPS_DIRECTION_VERTICAL, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, flipped);
      image = flipped;
    }

    // Flop (mirror about X axis)
    if (baton->flop) {
      VipsImage *flopped;
      if (vips_flip(image, &flopped, VIPS_DIRECTION_HORIZONTAL, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, flopped);
      image = flopped;
    }

    // Crop/embed
    if (image->Xsize != baton->width || image->Ysize != baton->height) {
      if (baton->canvas == Canvas::EMBED) {
        // Match background colour space, namely sRGB
        if (image->Type != VIPS_INTERPRETATION_sRGB) {
          // Convert to sRGB colour space
          VipsImage *colourspaced;
          if (vips_colourspace(image, &colourspaced, VIPS_INTERPRETATION_sRGB, NULL)) {
            return Error(baton, hook);
          }
          vips_object_local(hook, colourspaced);
          image = colourspaced;
        }
        // Add non-transparent alpha channel, if required
        if (baton->background[3] < 255.0 && !HasAlpha(image)) {
          // Create single-channel transparency
          VipsImage *black;
          if (vips_black(&black, image->Xsize, image->Ysize, "bands", 1, NULL)) {
            return Error(baton, hook);
          }
          vips_object_local(hook, black);
          // Invert to become non-transparent
          VipsImage *alpha;
          if (vips_invert(black, &alpha, NULL)) {
            return Error(baton, hook);
          }
          vips_object_local(hook, alpha);
          // Append alpha channel to existing image
          VipsImage *joined;
          if (vips_bandjoin2(image, alpha, &joined, NULL)) {
            return Error(baton, hook);
          }
          vips_object_local(hook, joined);
          image = joined;
        }
        // Create background
        VipsArrayDouble *background;
        if (baton->background[3] < 255.0) {
          background = vips_array_double_newv(
            4, baton->background[0], baton->background[1], baton->background[2], baton->background[3]
          );
        } else {
          background = vips_array_double_newv(
            3, baton->background[0], baton->background[1], baton->background[2]
          );
        }
        // Embed
        int left = (baton->width - image->Xsize) / 2;
        int top = (baton->height - image->Ysize) / 2;
        VipsImage *embedded;
        if (vips_embed(image, &embedded, left, top, baton->width, baton->height,
          "extend", VIPS_EXTEND_BACKGROUND, "background", background, NULL
        )) {
          vips_area_unref(reinterpret_cast<VipsArea*>(background));
          return Error(baton, hook);
        }
        vips_area_unref(reinterpret_cast<VipsArea*>(background));
        vips_object_local(hook, embedded);
        image = embedded;
      } else {
        // Crop/max
        int left;
        int top;
        std::tie(left, top) = CalculateCrop(image->Xsize, image->Ysize, baton->width, baton->height, baton->gravity);
        int width = std::min(image->Xsize, baton->width);
        int height = std::min(image->Ysize, baton->height);
        VipsImage *extracted;
        if (vips_extract_area(image, &extracted, left, top, width, height, NULL)) {
          return Error(baton, hook);
        }
        vips_object_local(hook, extracted);
        image = extracted;
      }
    }

    // Post extraction
    if (baton->topOffsetPost != -1) {
      VipsImage *extractedPost;
      if (vips_extract_area(image, &extractedPost, baton->leftOffsetPost, baton->topOffsetPost, baton->widthPost, baton->heightPost, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, extractedPost);
      image = extractedPost;
    }

    // Blur
    if (baton->blurSigma != 0.0) {
      VipsImage *blurred;
      if (baton->blurSigma < 0.0) {
        // Fast, mild blur - averages neighbouring pixels
        VipsImage *blur = vips_image_new_matrixv(3, 3,
          1.0, 1.0, 1.0,
          1.0, 1.0, 1.0,
          1.0, 1.0, 1.0);
        vips_image_set_double(blur, "scale", 9);
        vips_object_local(hook, blur);
        if (vips_conv(image, &blurred, blur, NULL)) {
          return Error(baton, hook);
        }
      } else {
        // Slower, accurate Gaussian blur
        // Create Gaussian function for standard deviation
        VipsImage *gaussian;
        if (vips_gaussmat(&gaussian, baton->blurSigma, 0.2, "separable", TRUE, "integer", TRUE, NULL)) {
          return Error(baton, hook);
        }
        vips_object_local(hook, gaussian);
        // Apply Gaussian function
        VipsImage *blurred;
        if (vips_convsep(image, &blurred, gaussian, "precision", VIPS_PRECISION_INTEGER, NULL)) {
          return Error(baton, hook);
        }
      }
      vips_object_local(hook, blurred);
      image = blurred;
    }

    // Sharpen
    if (baton->sharpenRadius != 0) {
      VipsImage *sharpened;
      if (baton->sharpenRadius == -1) {
        // Fast, mild sharpen
        VipsImage *sharpen = vips_image_new_matrixv(3, 3,
          -1.0, -1.0, -1.0,
          -1.0, 32.0, -1.0,
          -1.0, -1.0, -1.0);
        vips_image_set_double(sharpen, "scale", 24);
        vips_object_local(hook, sharpen);
        if (vips_conv(image, &sharpened, sharpen, NULL)) {
          return Error(baton, hook);
        }
      } else {
        // Slow, accurate sharpen in LAB colour space, with control over flat vs jagged areas
        if (vips_sharpen(image, &sharpened, "radius", baton->sharpenRadius, "m1", baton->sharpenFlat, "m2", baton->sharpenJagged, NULL)) {
          return Error(baton, hook);
        }
      }
      vips_object_local(hook, sharpened);
      image = sharpened;
    }

    // Gamma decoding (brighten)
    if (baton->gamma >= 1 && baton->gamma <= 3) {
      VipsImage *gammaDecoded;
      if (vips_gamma(image, &gammaDecoded, "exponent", baton->gamma, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, gammaDecoded);
      image = gammaDecoded;
    }

    // Convert to sRGB colour space, if not already
    if (image->Type != VIPS_INTERPRETATION_sRGB) {
      VipsImage *colourspaced;
      if (vips_colourspace(image, &colourspaced, VIPS_INTERPRETATION_sRGB, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, colourspaced);
      image = colourspaced;
    }

#if !(VIPS_MAJOR_VERSION >= 7 && VIPS_MINOR_VERSION >= 40 && VIPS_MINOR_VERSION >= 5)
    // Generate image tile cache when interlace output is required - no longer required as of libvips 7.40.5+
    if (baton->progressive) {
      VipsImage *cached;
      if (vips_tilecache(image, &cached, "threaded", TRUE, "persistent", TRUE, "max_tiles", -1, NULL)) {
        return Error(baton, hook);
      }
      vips_object_local(hook, cached);
      image = cached;
    }
#endif

    // Output
    if (baton->output == "__jpeg" || (baton->output == "__input" && inputImageType == ImageType::JPEG)) {
      // Write JPEG to buffer
      if (vips_jpegsave_buffer(image, &baton->bufferOut, &baton->bufferOutLength, "strip", !baton->withMetadata,
        "Q", baton->quality, "optimize_coding", TRUE, "interlace", baton->progressive, NULL)) {
        return Error(baton, hook);
      }
      baton->outputFormat = "jpeg";
    } else if (baton->output == "__png" || (baton->output == "__input" && inputImageType == ImageType::PNG)) {
#if (VIPS_MAJOR_VERSION >= 7 && VIPS_MINOR_VERSION >= 41)
      // Select PNG row filter
      int filter = baton->withoutAdaptiveFiltering ? VIPS_FOREIGN_PNG_FILTER_NONE : VIPS_FOREIGN_PNG_FILTER_ALL;
      // Write PNG to buffer
      if (vips_pngsave_buffer(image, &baton->bufferOut, &baton->bufferOutLength, "strip", !baton->withMetadata,
        "compression", baton->compressionLevel, "interlace", baton->progressive, "filter", filter, NULL)) {
        return Error(baton, hook);
      }
#else
      // Write PNG to buffer
      if (vips_pngsave_buffer(image, &baton->bufferOut, &baton->bufferOutLength, "strip", !baton->withMetadata,
        "compression", baton->compressionLevel, "interlace", baton->progressive, NULL)) {
        return Error(baton, hook);
      }
#endif
      baton->outputFormat = "png";
    } else if (baton->output == "__webp" || (baton->output == "__input" && inputImageType == ImageType::WEBP)) {
      // Write WEBP to buffer
      if (vips_webpsave_buffer(image, &baton->bufferOut, &baton->bufferOutLength, "strip", !baton->withMetadata,
        "Q", baton->quality, NULL)) {
        return Error(baton, hook);
      }
      baton->outputFormat = "webp";
    } else {
      bool outputJpeg = IsJpeg(baton->output);
      bool outputPng = IsPng(baton->output);
      bool outputWebp = IsWebp(baton->output);
      bool outputTiff = IsTiff(baton->output);
      bool matchInput = !(outputJpeg || outputPng || outputWebp || outputTiff);
      if (outputJpeg || (matchInput && inputImageType == ImageType::JPEG)) {
        // Write JPEG to file
        if (vips_jpegsave(image, baton->output.c_str(), "strip", !baton->withMetadata,
          "Q", baton->quality, "optimize_coding", TRUE, "interlace", baton->progressive, NULL)) {
          return Error(baton, hook);
        }
        baton->outputFormat = "jpeg";
      } else if (outputPng || (matchInput && inputImageType == ImageType::PNG)) {
#if (VIPS_MAJOR_VERSION >= 7 && VIPS_MINOR_VERSION >= 41)
        // Select PNG row filter
        int filter = baton->withoutAdaptiveFiltering ? VIPS_FOREIGN_PNG_FILTER_NONE : VIPS_FOREIGN_PNG_FILTER_ALL;
        // Write PNG to file
        if (vips_pngsave(image, baton->output.c_str(), "strip", !baton->withMetadata,
          "compression", baton->compressionLevel, "interlace", baton->progressive, "filter", filter, NULL)) {
          return Error(baton, hook);
        }
#else
        // Write PNG to file
        if (vips_pngsave(image, baton->output.c_str(), "strip", !baton->withMetadata,
          "compression", baton->compressionLevel, "interlace", baton->progressive, NULL)) {
          return Error(baton, hook);
        }
#endif
        baton->outputFormat = "png";
      } else if (outputWebp || (matchInput && inputImageType == ImageType::WEBP)) {
        // Write WEBP to file
        if (vips_webpsave(image, baton->output.c_str(), "strip", !baton->withMetadata,
          "Q", baton->quality, NULL)) {
          return Error(baton, hook);
        }
        baton->outputFormat = "webp";
      } else if (outputTiff || (matchInput && inputImageType == ImageType::TIFF)) {
        // Write TIFF to file
        if (vips_tiffsave(image, baton->output.c_str(), "strip", !baton->withMetadata,
          "compression", VIPS_FOREIGN_TIFF_COMPRESSION_JPEG, "Q", baton->quality, NULL)) {
          return Error(baton, hook);
        }
        baton->outputFormat = "tiff";
      } else {
        (baton->err).append("Unsupported output " + baton->output);
        return Error(baton, hook);
      }
    }
    // Clean up any dangling image references
    g_object_unref(hook);
    // Clean up libvips' per-request data and threads
    vips_error_clear();
    vips_thread_shutdown();
  }

  void HandleOKCallback () {
    NanScope();

    Handle<Value> argv[3] = { NanNull(), NanNull(),  NanNull() };
    if (!baton->err.empty()) {
      // Error
      argv[0] = Exception::Error(NanNew<String>(baton->err.data(), baton->err.size()));
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
      Local<Object> info = NanNew<Object>();
      info->Set(NanNew<String>("format"), NanNew<String>(baton->outputFormat));
      info->Set(NanNew<String>("width"), NanNew<Number>(width));
      info->Set(NanNew<String>("height"), NanNew<Number>(height));

      if (baton->bufferOutLength > 0) {
        // Buffer
        argv[1] = NanNewBufferHandle(static_cast<char*>(baton->bufferOut), baton->bufferOutLength);
        g_free(baton->bufferOut);
        argv[2] = info;
      } else {
        // File
        argv[1] = info;
      }
    }
    delete baton;

    // Decrement processing task counter
    g_atomic_int_dec_and_test(&counterProcess);

    // Return to JavaScript
    callback->Call(3, argv);
  }

 private:
  ResizeBaton* baton;

  /*
    Calculate the angle of rotation and need-to-flip for the output image.
    In order of priority:
     1. Use explicitly requested angle (supports 90, 180, 270)
     2. Use input image EXIF Orientation header - supports mirroring
     3. Otherwise default to zero, i.e. no rotation
  */
  std::tuple<Angle, bool>
  CalculateRotationAndFlip(int const angle, VipsImage const *input) {
    Angle rotate = Angle::D0;
    bool flip = FALSE;
    if (angle == -1) {
      switch(ExifOrientation(input)) {
        case 6: rotate = Angle::D90; break;
        case 3: rotate = Angle::D180; break;
        case 8: rotate = Angle::D270; break;
        case 2: flip = TRUE; break; // flip 1
        case 7: flip = TRUE; rotate = Angle::D90; break; // flip 6
        case 4: flip = TRUE; rotate = Angle::D180; break; // flip 3
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
    return std::make_tuple(rotate, flip);
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
      default: // Centre
        left = (inWidth - outWidth + 1) / 2;
        top = (inHeight - outHeight + 1) / 2;
    }
    return std::make_tuple(left, top);
  }

  /*
    Copy then clear the error message.
    Unref all transitional images on the hook.
    Clear all thread-local data.
  */
  void Error(ResizeBaton *baton, VipsObject *hook) {
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
  resize(options, output, callback)
*/
NAN_METHOD(resize) {
  NanScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  ResizeBaton *baton = new ResizeBaton;
  Local<Object> options = args[0]->ToObject();

  // Input filename
  baton->fileIn = *String::Utf8Value(options->Get(NanNew<String>("fileIn"))->ToString());
  baton->accessMethod = options->Get(NanNew<String>("sequentialRead"))->BooleanValue() ? VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;
  // Input Buffer object
  if (options->Get(NanNew<String>("bufferIn"))->IsObject()) {
    Local<Object> buffer = options->Get(NanNew<String>("bufferIn"))->ToObject();
    baton->bufferInLength = node::Buffer::Length(buffer);
    baton->bufferIn = node::Buffer::Data(buffer);
  }
  // ICC profile to use when input CMYK image has no embedded profile
  baton->iccProfileCmyk = *String::Utf8Value(options->Get(NanNew<String>("iccProfileCmyk"))->ToString());
  // Extract image options
  baton->topOffsetPre = options->Get(NanNew<String>("topOffsetPre"))->Int32Value();
  baton->leftOffsetPre = options->Get(NanNew<String>("leftOffsetPre"))->Int32Value();
  baton->widthPre = options->Get(NanNew<String>("widthPre"))->Int32Value();
  baton->heightPre = options->Get(NanNew<String>("heightPre"))->Int32Value();
  baton->topOffsetPost = options->Get(NanNew<String>("topOffsetPost"))->Int32Value();
  baton->leftOffsetPost = options->Get(NanNew<String>("leftOffsetPost"))->Int32Value();
  baton->widthPost = options->Get(NanNew<String>("widthPost"))->Int32Value();
  baton->heightPost = options->Get(NanNew<String>("heightPost"))->Int32Value();
  // Output image dimensions
  baton->width = options->Get(NanNew<String>("width"))->Int32Value();
  baton->height = options->Get(NanNew<String>("height"))->Int32Value();
  // Canvas option
  Local<String> canvas = options->Get(NanNew<String>("canvas"))->ToString();
  if (canvas->Equals(NanNew<String>("c"))) {
    baton->canvas = Canvas::CROP;
  } else if (canvas->Equals(NanNew<String>("m"))) {
    baton->canvas = Canvas::MAX;
  } else if (canvas->Equals(NanNew<String>("e"))) {
    baton->canvas = Canvas::EMBED;
  }
  // Background colour
  Local<Array> background = Local<Array>::Cast(options->Get(NanNew<String>("background")));
  for (int i = 0; i < 4; i++) {
    baton->background[i] = background->Get(i)->NumberValue();
  }
  // Resize options
  baton->withoutEnlargement = options->Get(NanNew<String>("withoutEnlargement"))->BooleanValue();
  baton->gravity = options->Get(NanNew<String>("gravity"))->Int32Value();
  baton->interpolator = *String::Utf8Value(options->Get(NanNew<String>("interpolator"))->ToString());
  // Operators
  baton->flatten = options->Get(NanNew<String>("flatten"))->BooleanValue();
  baton->blurSigma = options->Get(NanNew<String>("blurSigma"))->NumberValue();
  baton->sharpenRadius = options->Get(NanNew<String>("sharpenRadius"))->Int32Value();
  baton->sharpenFlat = options->Get(NanNew<String>("sharpenFlat"))->NumberValue();
  baton->sharpenJagged = options->Get(NanNew<String>("sharpenJagged"))->NumberValue();
  baton->gamma = options->Get(NanNew<String>("gamma"))->NumberValue();
  baton->greyscale = options->Get(NanNew<String>("greyscale"))->BooleanValue();
  baton->angle = options->Get(NanNew<String>("angle"))->Int32Value();
  baton->flip = options->Get(NanNew<String>("flip"))->BooleanValue();
  baton->flop = options->Get(NanNew<String>("flop"))->BooleanValue();
  // Output options
  baton->progressive = options->Get(NanNew<String>("progressive"))->BooleanValue();
  baton->quality = options->Get(NanNew<String>("quality"))->Int32Value();
  baton->compressionLevel = options->Get(NanNew<String>("compressionLevel"))->Int32Value();
  baton->withoutAdaptiveFiltering = options->Get(NanNew<String>("withoutAdaptiveFiltering"))->BooleanValue();
  baton->withMetadata = options->Get(NanNew<String>("withMetadata"))->BooleanValue();
  // Output filename or __format for Buffer
  baton->output = *String::Utf8Value(options->Get(NanNew<String>("output"))->ToString());

  // Join queue for worker thread
  NanCallback *callback = new NanCallback(args[1].As<v8::Function>());
  NanAsyncQueueWorker(new ResizeWorker(callback, baton));

  // Increment queued task counter
  g_atomic_int_inc(&counterQueue);

  NanReturnUndefined();
}
