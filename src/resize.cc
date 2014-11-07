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

typedef enum {
  CROP,
  MAX,
  EMBED
} Canvas;

typedef enum {
	ANGLE_0,
	ANGLE_90,
	ANGLE_180,
	ANGLE_270,
	ANGLE_LAST
} Angle;

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
  bool sharpen;
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
    canvas(CROP),
    gravity(0),
    flatten(false),
    sharpen(false),
    gamma(0.0),
    greyscale(false),
    flip(false),
    flop(false),
    progressive(false),
    withoutEnlargement(false),
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
    g_atomic_int_dec_and_test(&counter_queue);
    // Increment processing task counter
    g_atomic_int_inc(&counter_process);

    // Hang image references from this hook object
    VipsObject *hook = reinterpret_cast<VipsObject*>(vips_image_new());

    // Input
    ImageType inputImageType = UNKNOWN;
    VipsImage *image = vips_image_new();
    vips_object_local(hook, image);

    if (baton->bufferInLength > 1) {
      // From buffer
      inputImageType = sharp_init_image_from_buffer(&image, baton->bufferIn, baton->bufferInLength, baton->accessMethod);
      if (inputImageType == UNKNOWN) {
        (baton->err).append("Input buffer contains unsupported image format");
      }
    } else {
      // From file
      inputImageType = sharp_init_image_from_file(&image, baton->fileIn.c_str(), baton->accessMethod);
      if (inputImageType == UNKNOWN) {
        (baton->err).append("File is of an unsupported image format");
      }
    }
    if (inputImageType == UNKNOWN) {
      return Error(baton, hook);
    }

    // Pre extraction
    if (baton->topOffsetPre != -1) {
      VipsImage *extractedPre = vips_image_new();
      vips_object_local(hook, extractedPre);
      if (vips_extract_area(image, &extractedPre, baton->leftOffsetPre, baton->topOffsetPre, baton->widthPre, baton->heightPre, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = extractedPre;
    }

    // Get input image width and height
    int inputWidth = image->Xsize;
    int inputHeight = image->Ysize;

    // Calculate angle of rotation, to be carried out later
    Angle rotation;
    bool flip;
    std::tie(rotation, flip) = CalculateRotationAndFlip(baton->angle, image);
    if (rotation == ANGLE_90 || rotation == ANGLE_270) {
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
    int interpolatorWindowSize = sharp_interpolator_window_size(baton->interpolator.c_str());

    // Scaling calculations
    double factor;
    if (baton->width > 0 && baton->height > 0) {
      // Fixed width and height
      double xfactor = static_cast<double>(inputWidth) / static_cast<double>(baton->width);
      double yfactor = static_cast<double>(inputHeight) / static_cast<double>(baton->height);
      factor = (baton->canvas == CROP) ? std::min(xfactor, yfactor) : std::max(xfactor, yfactor);
      // if max is set, we need to compute the real size of the thumb image
      if (baton->canvas == MAX) {
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
    if (inputImageType == JPEG && shrink >= 2 && baton->gamma == 0 && baton->topOffsetPre == -1) {
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
      g_object_unref(image);
      if (baton->bufferInLength > 1) {
        if (vips_jpegload_buffer(baton->bufferIn, baton->bufferInLength, &image, "shrink", shrink_on_load, NULL)) {
          return Error(baton, hook);
        }
      } else {
        if (vips_jpegload((baton->fileIn).c_str(), &image, "shrink", shrink_on_load, NULL)) {
          return Error(baton, hook);
        }
      }
    }

    // Handle colour profile, if any, for non sRGB images
    if (image->Type != VIPS_INTERPRETATION_sRGB) {
      // Get the input colour profile
      if (vips_image_get_typeof(image, VIPS_META_ICC_NAME)) {
        // Use embedded profile
        VipsImage *profile = vips_image_new();
        vips_object_local(hook, profile);
        if (vips_icc_import(image, &profile, "pcs", VIPS_PCS_XYZ, "embedded", TRUE, NULL)) {
          return Error(baton, hook);
        }
        g_object_unref(image);
        image = profile;
      } else if (image->Type == VIPS_INTERPRETATION_CMYK) {
        // CMYK with no embedded profile
        VipsImage *profile = vips_image_new();
        vips_object_local(hook, profile);
        if (vips_icc_import(image, &profile, "pcs", VIPS_PCS_XYZ, "input_profile", (baton->iccProfileCmyk).c_str(), NULL)) {
          return Error(baton, hook);
        }
        g_object_unref(image);
        image = profile;
      }
      // Attempt to convert to sRGB colour space
      VipsImage *colourspaced = vips_image_new();
      vips_object_local(hook, colourspaced);
      if (vips_colourspace(image, &colourspaced, VIPS_INTERPRETATION_sRGB, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = colourspaced;
    }

    // Flatten image to remove alpha channel
    if (baton->flatten && sharp_image_has_alpha(image)) {
      // Background colour
      VipsArrayDouble *background = vips_array_double_newv(
        3, // Ignore alpha channel as we're about to remove it
        baton->background[0],
        baton->background[1],
        baton->background[2]
      );
      VipsImage *flattened = vips_image_new();
      vips_object_local(hook, flattened);
      if (vips_flatten(image, &flattened, "background", background, NULL)) {
        vips_area_unref(reinterpret_cast<VipsArea*>(background));
        return Error(baton, hook);
      };
      vips_area_unref(reinterpret_cast<VipsArea*>(background));
      g_object_unref(image);
      image = flattened;
    }

    // Gamma encoding (darken)
    if (baton->gamma >= 1 && baton->gamma <= 3) {
      VipsImage *gammaEncoded = vips_image_new();
      vips_object_local(hook, gammaEncoded);
      if (vips_gamma(image, &gammaEncoded, "exponent", 1.0 / baton->gamma, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = gammaEncoded;
    }

    // Convert to greyscale (linear, therefore after gamma encoding, if any)
    if (baton->greyscale) {
      VipsImage *greyscale = vips_image_new();
      vips_object_local(hook, greyscale);
      if (vips_colourspace(image, &greyscale, VIPS_INTERPRETATION_B_W, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = greyscale;
    }

    if (shrink > 1) {
      VipsImage *shrunk = vips_image_new();
      vips_object_local(hook, shrunk);
      // Use vips_shrink with the integral reduction
      if (vips_shrink(image, &shrunk, shrink, shrink, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = shrunk;
      // Recalculate residual float based on dimensions of required vs shrunk images
      double shrunkWidth = shrunk->Xsize;
      double shrunkHeight = shrunk->Ysize;
      if (rotation == ANGLE_90 || rotation == ANGLE_270) {
        // Swap input output width and height when rotating by 90 or 270 degrees
        int swap = shrunkWidth;
        shrunkWidth = shrunkHeight;
        shrunkHeight = swap;
      }
      double residualx = static_cast<double>(baton->width) / static_cast<double>(shrunkWidth);
      double residualy = static_cast<double>(baton->height) / static_cast<double>(shrunkHeight);
      if (baton->canvas == EMBED) {
        residual = std::min(residualx, residualy);
      } else {
        residual = std::max(residualx, residualy);
      }
    }

    // Use vips_affine with the remaining float part
    if (residual != 0) {
      // Apply variable blur radius of floor(residual) before large affine reductions
      if (residual >= 1) {
        VipsImage *blurred = vips_image_new();
        vips_object_local(hook, blurred);
        if (vips_gaussblur(image, &blurred, floor(residual), NULL)) {
          return Error(baton, hook);
        }
        g_object_unref(image);
        image = blurred;
      }
      // Create interpolator - "bilinear" (default), "bicubic" or "nohalo"
      VipsInterpolate *interpolator = vips_interpolate_new(baton->interpolator.c_str());
      // Perform affine transformation
      VipsImage *affined = vips_image_new();
      vips_object_local(hook, affined);
      if (vips_affine(image, &affined, residual, 0, 0, residual, "interpolate", interpolator, NULL)) {
        g_object_unref(interpolator);
        return Error(baton, hook);
      }
      g_object_unref(interpolator);
      g_object_unref(image);
      image = affined;
    }

    // Rotate
    if (rotation != ANGLE_0) {
      VipsImage *rotated = vips_image_new();
      vips_object_local(hook, rotated);
      if (vips_rot(image, &rotated, static_cast<VipsAngle>(rotation), NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = rotated;
    }

    // Flip (mirror about Y axis)
    if (baton->flip) {
      VipsImage *flipped = vips_image_new();
      vips_object_local(hook, flipped);
      if (vips_flip(image, &flipped, VIPS_DIRECTION_VERTICAL, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = flipped;
    }

    // Flop (mirror about X axis)
    if (baton->flop) {
      VipsImage *flopped = vips_image_new();
      vips_object_local(hook, flopped);
      if (vips_flip(image, &flopped, VIPS_DIRECTION_HORIZONTAL, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = flopped;
    }

    // Crop/embed
    if (image->Xsize != baton->width || image->Ysize != baton->height) {
      if (baton->canvas == EMBED) {
        // Match background colour space, namely sRGB
        if (image->Type != VIPS_INTERPRETATION_sRGB) {
          // Convert to sRGB colour space
          VipsImage *colourspaced = vips_image_new();
          vips_object_local(hook, colourspaced);
          if (vips_colourspace(image, &colourspaced, VIPS_INTERPRETATION_sRGB, NULL)) {
            return Error(baton, hook);
          }
          g_object_unref(image);
          image = colourspaced;
        }
        // Add non-transparent alpha channel, if required
        if (baton->background[3] < 255.0 && !sharp_image_has_alpha(image)) {
          // Create single-channel transparency
          VipsImage *black = vips_image_new();
          vips_object_local(hook, black);
          if (vips_black(&black, image->Xsize, image->Ysize, "bands", 1, NULL)) {
            return Error(baton, hook);
          }
          // Invert to become non-transparent
          VipsImage *alpha = vips_image_new();
          vips_object_local(hook, alpha);
          if (vips_invert(black, &alpha, NULL)) {
            return Error(baton, hook);
          }
          g_object_unref(black);
          // Append alpha channel to existing image
          VipsImage *joined = vips_image_new();
          vips_object_local(hook, joined);
          if (vips_bandjoin2(image, alpha, &joined, NULL)) {
            return Error(baton, hook);
          }
          g_object_unref(alpha);
          g_object_unref(image);
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
        VipsImage *embedded = vips_image_new();
        vips_object_local(hook, embedded);
        if (vips_embed(image, &embedded, left, top, baton->width, baton->height,
          "extend", VIPS_EXTEND_BACKGROUND, "background", background, NULL
        )) {
          vips_area_unref(reinterpret_cast<VipsArea*>(background));
          return Error(baton, hook);
        }
        vips_area_unref(reinterpret_cast<VipsArea*>(background));
        g_object_unref(image);
        image = embedded;
      } else {
        // Crop/max
        int left;
        int top;
        std::tie(left, top) = CalculateCrop(image->Xsize, image->Ysize, baton->width, baton->height, baton->gravity);
        int width = std::min(image->Xsize, baton->width);
        int height = std::min(image->Ysize, baton->height);
        VipsImage *extracted = vips_image_new();
        vips_object_local(hook, extracted);
        if (vips_extract_area(image, &extracted, left, top, width, height, NULL)) {
          return Error(baton, hook);
        }
        g_object_unref(image);
        image = extracted;
      }
    }

    // Post extraction
    if (baton->topOffsetPost != -1) {
      VipsImage *extractedPost = vips_image_new();
      vips_object_local(hook, extractedPost);
      if (vips_extract_area(image, &extractedPost, baton->leftOffsetPost, baton->topOffsetPost, baton->widthPost, baton->heightPost, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = extractedPost;
    }

    // Mild sharpen
    if (baton->sharpen) {
      VipsImage *sharpened = vips_image_new();
      vips_object_local(hook, sharpened);
      VipsImage *sharpen = vips_image_new_matrixv(3, 3,
        -1.0, -1.0, -1.0,
        -1.0, 32.0, -1.0,
        -1.0, -1.0, -1.0);
      vips_image_set_double(sharpen, "scale", 24);
      vips_object_local(hook, sharpen);
      if (vips_conv(image, &sharpened, sharpen, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = sharpened;
    }

    // Gamma decoding (brighten)
    if (baton->gamma >= 1 && baton->gamma <= 3) {
      VipsImage *gammaDecoded = vips_image_new();
      vips_object_local(hook, gammaDecoded);
      if (vips_gamma(image, &gammaDecoded, "exponent", baton->gamma, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = gammaDecoded;
    }

    // Convert to sRGB colour space, if not already
    if (image->Type != VIPS_INTERPRETATION_sRGB) {
      VipsImage *colourspaced = vips_image_new();
      vips_object_local(hook, colourspaced);
      if (vips_colourspace(image, &colourspaced, VIPS_INTERPRETATION_sRGB, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = colourspaced;
    }

#if !(VIPS_MAJOR_VERSION >= 7 && VIPS_MINOR_VERSION >= 40 && VIPS_MINOR_VERSION >= 5)
    // Generate image tile cache when interlace output is required - no longer required as of libvips 7.40.5+
    if (baton->progressive) {
      VipsImage *cached = vips_image_new();
      vips_object_local(hook, cached);
      if (vips_tilecache(image, &cached, "threaded", TRUE, "persistent", TRUE, "max_tiles", -1, NULL)) {
        return Error(baton, hook);
      }
      g_object_unref(image);
      image = cached;
    }
#endif

    // Output
    if (baton->output == "__jpeg" || (baton->output == "__input" && inputImageType == JPEG)) {
      // Write JPEG to buffer
      if (vips_jpegsave_buffer(image, &baton->bufferOut, &baton->bufferOutLength, "strip", !baton->withMetadata,
        "Q", baton->quality, "optimize_coding", TRUE, "interlace", baton->progressive, NULL)) {
        return Error(baton, hook);
      }
      baton->outputFormat = "jpeg";
    } else if (baton->output == "__png" || (baton->output == "__input" && inputImageType == PNG)) {
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
    } else if (baton->output == "__webp" || (baton->output == "__input" && inputImageType == WEBP)) {
      // Write WEBP to buffer
      if (vips_webpsave_buffer(image, &baton->bufferOut, &baton->bufferOutLength, "strip", !baton->withMetadata,
        "Q", baton->quality, NULL)) {
        return Error(baton, hook);
      }
      baton->outputFormat = "webp";
    } else {
      bool output_jpeg = is_jpeg(baton->output);
      bool output_png = is_png(baton->output);
      bool output_webp = is_webp(baton->output);
      bool output_tiff = is_tiff(baton->output);
      bool match_input = !(output_jpeg || output_png || output_webp || output_tiff);
      if (output_jpeg || (match_input && inputImageType == JPEG)) {
        // Write JPEG to file
        if (vips_jpegsave(image, baton->output.c_str(), "strip", !baton->withMetadata,
          "Q", baton->quality, "optimize_coding", TRUE, "interlace", baton->progressive, NULL)) {
          return Error(baton, hook);
        }
        baton->outputFormat = "jpeg";
      } else if (output_png || (match_input && inputImageType == PNG)) {
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
      } else if (output_webp || (match_input && inputImageType == WEBP)) {
        // Write WEBP to file
        if (vips_webpsave(image, baton->output.c_str(), "strip", !baton->withMetadata,
          "Q", baton->quality, NULL)) {
          return Error(baton, hook);
        }
        baton->outputFormat = "webp";
      } else if (output_tiff || (match_input && inputImageType == TIFF)) {
        // Write TIFF to file
        if (vips_tiffsave(image, baton->output.c_str(), "strip", !baton->withMetadata,
          "compression", VIPS_FOREIGN_TIFF_COMPRESSION_JPEG, "Q", baton->quality, NULL)) {
          return Error(baton, hook);
        }
        baton->outputFormat = "tiff";
      } else {
        (baton->err).append("Unsupported output " + baton->output);
        g_object_unref(image);
        return Error(baton, hook);
      }
    }
    // Clean up any dangling image references
    g_object_unref(image);
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
    g_atomic_int_dec_and_test(&counter_process);

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
    Angle rotate = ANGLE_0;
    bool flip = FALSE;
    if (angle == -1) {
      const char *exif;
      if (
        vips_image_get_typeof(input, "exif-ifd0-Orientation") != 0 &&
        !vips_image_get_string(input, "exif-ifd0-Orientation", &exif)
      ) {
        if (exif[0] == 0x36) { // "6"
          rotate = ANGLE_90;
        } else if (exif[0] == 0x33) { // "3"
          rotate = ANGLE_180;
        } else if (exif[0] == 0x38) { // "8"
          rotate = ANGLE_270;
        } else if (exif[0] == 0x32) { // "2" (flip 1)
          flip = TRUE;
        } else if (exif[0] == 0x37) { // "7" (flip 6)
          rotate = ANGLE_90;
          flip = TRUE;
        } else if (exif[0] == 0x34) { // "4" (flip 3)
          rotate = ANGLE_180;
          flip = TRUE;
        } else if (exif[0] == 0x35) { // "5" (flip 8)
          rotate = ANGLE_270;
          flip = TRUE;
        }
      }
    } else {
      if (angle == 90) {
        rotate = ANGLE_90;
      } else if (angle == 180) {
        rotate = ANGLE_180;
      } else if (angle == 270) {
        rotate = ANGLE_270;
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
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
    g_object_unref(hook);
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
    baton->canvas = CROP;
  } else if (canvas->Equals(NanNew<String>("m"))) {
    baton->canvas = MAX;
  } else if (canvas->Equals(NanNew<String>("e"))) {
    baton->canvas = EMBED;
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
  baton->sharpen = options->Get(NanNew<String>("sharpen"))->BooleanValue();
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
  g_atomic_int_inc(&counter_queue);

  NanReturnUndefined();
}
