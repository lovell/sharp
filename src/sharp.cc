#include <node.h>
#include <node_buffer.h>
#include <math.h>
#include <string>
#include <string.h>
#include <tuple>
#include <vips/vips.h>

#include "nan.h"

using namespace v8;
using namespace node;

struct resize_baton {
  std::string file_in;
  void* buffer_in;
  size_t buffer_in_len;
  std::string output;
  void* buffer_out;
  size_t buffer_out_len;
  int width;
  int height;
  bool crop;
  int gravity;
  bool max;
  VipsExtend extend;
  bool sharpen;
  std::string interpolator;
  bool progressive;
  bool without_enlargement;
  VipsAccess access_method;
  int quality;
  int compressionLevel;
  int angle;
  std::string err;
  bool withMetadata;

  resize_baton():
    buffer_in_len(0),
    buffer_out_len(0),
    crop(false),
    gravity(0),
    max(false),
    sharpen(false),
    progressive(false),
    without_enlargement(false),
    withMetadata(false) {}
};

typedef enum {
  UNKNOWN,
  JPEG,
  PNG,
  WEBP,
  TIFF,
  MAGICK
} ImageType;

unsigned char const MARKER_JPEG[] = {0xff, 0xd8};
unsigned char const MARKER_PNG[] = {0x89, 0x50};
unsigned char const MARKER_WEBP[] = {0x52, 0x49};

// How many tasks are in the queue?
volatile int counter_queue = 0;
// How many tasks are being processed?
volatile int counter_process = 0;

static bool ends_with(std::string const &str, std::string const &end) {
  return str.length() >= end.length() && 0 == str.compare(str.length() - end.length(), end.length(), end);
}

static bool is_jpeg(std::string const &str) {
  return ends_with(str, ".jpg") || ends_with(str, ".jpeg") || ends_with(str, ".JPG") || ends_with(str, ".JPEG");
}

static bool is_png(std::string const &str) {
  return ends_with(str, ".png") || ends_with(str, ".PNG");
}

static bool is_webp(std::string const &str) {
  return ends_with(str, ".webp") || ends_with(str, ".WEBP");
}

static bool is_tiff(std::string const &str) {
  return ends_with(str, ".tif") || ends_with(str, ".tiff") || ends_with(str, ".TIF") || ends_with(str, ".TIFF");
}

static void resize_error(resize_baton *baton, VipsImage *unref) {
  (baton->err).append(vips_error_buffer());
  vips_error_clear();
  g_object_unref(unref);
  vips_thread_shutdown();
  return;
}

/*
  Calculate the angle of rotation for the output image.
  In order of priority:
   1. Use explicitly requested angle (supports 90, 180, 270)
   2. Use input image EXIF Orientation header (does not support mirroring)
   3. Otherwise default to zero, i.e. no rotation
*/
static VipsAngle
sharp_calc_rotation(int const angle, VipsImage const *input) {
  VipsAngle rotate = VIPS_ANGLE_0;
  if (angle == -1) {
    const char *exif;
    if (!vips_image_get_string(input, "exif-ifd0-Orientation", &exif)) {
      if (exif[0] == 0x36) { // "6"
        rotate = VIPS_ANGLE_90;
      } else if (exif[0] == 0x33) { // "3"
        rotate = VIPS_ANGLE_180;
      } else if (exif[0] == 0x38) { // "8"
        rotate = VIPS_ANGLE_270;
      }
    }
  } else {
    if (angle == 90) {
      rotate = VIPS_ANGLE_90;
    } else if (angle == 180) {
      rotate = VIPS_ANGLE_180;
    } else if (angle == 270) {
      rotate = VIPS_ANGLE_270;
    }
  }
  return rotate;
}

/*
  Calculate the (left, top) coordinates of the output image
  within the input image, applying the given gravity.
*/
static std::tuple<int, int>
sharp_calc_crop(int const inWidth, int const inHeight, int const outWidth, int const outHeight, int const gravity) {
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
  Initialise a VipsImage from a buffer. Supports JPEG, PNG and WebP.
  Returns the ImageType detected, if any.
*/
static ImageType
sharp_init_image_from_buffer(VipsImage **image, void *buffer, size_t const length, VipsAccess const access) {
  ImageType imageType = UNKNOWN;
  if (memcmp(MARKER_JPEG, buffer, 2) == 0) {
    if (!vips_jpegload_buffer(buffer, length, image, "access", access, NULL)) {
      imageType = JPEG;
    }
  } else if(memcmp(MARKER_PNG, buffer, 2) == 0) {
    if (!vips_pngload_buffer(buffer, length, image, "access", access, NULL)) {
      imageType = PNG;
    }
  } else if(memcmp(MARKER_WEBP, buffer, 2) == 0) {
    if (!vips_webpload_buffer(buffer, length, image, "access", access, NULL)) {
      imageType = WEBP;
    }
  }
  return imageType;
}

/*
  Initialise a VipsImage from a file.
  Returns the ImageType detected, if any.
*/
static ImageType
sharp_init_image_from_file(VipsImage **image, char const *file, VipsAccess const access) {
  ImageType imageType = UNKNOWN;
  if (vips_foreign_is_a("jpegload", file)) {
    if (!vips_jpegload(file, image, "access", access, NULL)) {
      imageType = JPEG;
    }
  } else if (vips_foreign_is_a("pngload", file)) {
    if (!vips_pngload(file, image, "access", access, NULL)) {
      imageType = PNG;
    }
  } else if (vips_foreign_is_a("webpload", file)) {
    if (!vips_webpload(file, image, "access", access, NULL)) {
      imageType = WEBP;
    }
  } else if (vips_foreign_is_a("tiffload", file)) {
    if (!vips_tiffload(file, image, "access", access, NULL)) {
      imageType = TIFF;
    }
  } else if(vips_foreign_is_a("magickload", file)) {
    if (!vips_magickload(file, image, "access", access, NULL)) {
      imageType = MAGICK;
    }
  }
  return imageType;
}

// Metadata

struct metadata_baton {
  // Input
  std::string file_in;
  void* buffer_in;
  size_t buffer_in_len;
  // Output
  std::string format;
  int width;
  int height;
  std::string space;
  int channels;
  int orientation;
  std::string err;

  metadata_baton():
    buffer_in_len(0),
    orientation(0) {}
};

class MetadataWorker : public NanAsyncWorker {

  public:
    MetadataWorker(NanCallback *callback, metadata_baton *baton) : NanAsyncWorker(callback), baton(baton) {}
    ~MetadataWorker() {}

  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&counter_queue);

    ImageType imageType = UNKNOWN;
    VipsImage *image = vips_image_new();
    if (baton->buffer_in_len > 1) {
      // From buffer
      imageType = sharp_init_image_from_buffer(&image, baton->buffer_in, baton->buffer_in_len, VIPS_ACCESS_RANDOM);
      if (imageType == UNKNOWN) {
        (baton->err).append("Input buffer contains unsupported image format");
      }
    } else {
      // From file
      imageType = sharp_init_image_from_file(&image, baton->file_in.c_str(), VIPS_ACCESS_RANDOM);
      if (imageType == UNKNOWN) {
        (baton->err).append("File is of an unsupported image format");
      }
    }
    if (imageType != UNKNOWN) {
      // Image type
      switch (imageType) {
        case JPEG: baton->format = "jpeg"; break;
        case PNG: baton->format = "png"; break;
        case WEBP: baton->format = "webp"; break;
        case TIFF: baton->format = "tiff"; break;
        case MAGICK: baton->format = "magick"; break;
        case UNKNOWN: default: baton->format = "";
      }
      // VipsImage attributes
      baton->width = image->Xsize;
      baton->height = image->Ysize;
      baton->space = vips_enum_nick(VIPS_TYPE_INTERPRETATION, image->Type);
      baton->channels = image->Bands;
      // EXIF Orientation
      const char *exif;
      if (!vips_image_get_string(image, "exif-ifd0-Orientation", &exif)) {
        baton->orientation = atoi(&exif[0]);
      }
    }
    // Clean up
    g_object_unref(image);
    vips_error_clear();
    vips_thread_shutdown();
  }

  void HandleOKCallback () {
    NanScope();

    Handle<Value> argv[2] = { NanNull(), NanNull() };
    if (!baton->err.empty()) {
      // Error
      argv[0] = NanNew<String>(baton->err.data(), baton->err.size());
    } else {
      // Metadata Object
      Local<Object> info = NanNew<Object>();
      info->Set(NanNew<String>("format"), NanNew<String>(baton->format));
      info->Set(NanNew<String>("width"), NanNew<Number>(baton->width));
      info->Set(NanNew<String>("height"), NanNew<Number>(baton->height));
      info->Set(NanNew<String>("space"), NanNew<String>(baton->space));
      info->Set(NanNew<String>("channels"), NanNew<Number>(baton->channels));
      if (baton->orientation > 0) {
        info->Set(NanNew<String>("orientation"), NanNew<Number>(baton->orientation));
      }
      argv[1] = info;
    }
    delete baton;

    // Return to JavaScript
    callback->Call(2, argv);
  }

  private:
    metadata_baton* baton;
};

/*
  metadata(options, callback)
*/
NAN_METHOD(metadata) {
  NanScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  metadata_baton *baton = new metadata_baton;
  Local<Object> options = args[0]->ToObject();

  // Input filename
  baton->file_in = *String::Utf8Value(options->Get(NanNew<String>("fileIn"))->ToString());
  // Input Buffer object
  if (options->Get(NanNew<String>("bufferIn"))->IsObject()) {
    Local<Object> buffer = options->Get(NanNew<String>("bufferIn"))->ToObject();
    baton->buffer_in_len = Buffer::Length(buffer);
    baton->buffer_in = Buffer::Data(buffer);
  }

  // Join queue for worker thread
  NanCallback *callback = new NanCallback(args[1].As<v8::Function>());
  NanAsyncQueueWorker(new MetadataWorker(callback, baton));

  // Increment queued task counter
  g_atomic_int_inc(&counter_queue);

  NanReturnUndefined();
}

// Resize

class ResizeWorker : public NanAsyncWorker {
  public:
    ResizeWorker(NanCallback *callback, resize_baton *baton) : NanAsyncWorker(callback), baton(baton) {}
    ~ResizeWorker() {}

  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&counter_queue);
    // Increment processing task counter
    g_atomic_int_inc(&counter_process);

    // Input
    ImageType inputImageType = UNKNOWN;
    VipsImage *in = vips_image_new();
    if (baton->buffer_in_len > 1) {
      // From buffer
      inputImageType = sharp_init_image_from_buffer(&in, baton->buffer_in, baton->buffer_in_len, baton->access_method);
      if (inputImageType == UNKNOWN) {
        (baton->err).append("Input buffer contains unsupported image format");
      }
    } else {
      // From file
      inputImageType = sharp_init_image_from_file(&in, baton->file_in.c_str(), baton->access_method);
      if (inputImageType == UNKNOWN) {
        (baton->err).append("File is of an unsupported image format");
      }
    }
    if (inputImageType == UNKNOWN) {
      return resize_error(baton, in);
    }

    // Get input image width and height
    int inputWidth = in->Xsize;
    int inputHeight = in->Ysize;

    // Calculate angle of rotation, to be carried out later
    VipsAngle rotation = sharp_calc_rotation(baton->angle, in);
    if (rotation == VIPS_ANGLE_90 || rotation == VIPS_ANGLE_270) {
      // Swap input output width and height when rotating by 90 or 270 degrees
      int swap = inputWidth;
      inputWidth = inputHeight;
      inputHeight = swap;
    }

    // Scaling calculations
    double factor;
    if (baton->width > 0 && baton->height > 0) {
      // Fixed width and height
      double xfactor = static_cast<double>(inputWidth) / static_cast<double>(baton->width);
      double yfactor = static_cast<double>(inputHeight) / static_cast<double>(baton->height);
      factor = baton->crop ? std::min(xfactor, yfactor) : std::max(xfactor, yfactor);
      // if max is set, we need to compute the real size of the thumb image
      if (baton->max) {
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
    int shrink = floor(factor);
    if (shrink < 1) {
      shrink = 1;
    }
    double residual = static_cast<double>(shrink) / factor;

    // Do not enlarge the output if the input width *or* height are already less than the required dimensions
    if (baton->without_enlargement) {
      if (inputWidth < baton->width || inputHeight < baton->height) {
        factor = 1;
        shrink = 1;
        residual = 0;
        baton->width = inputWidth;
        baton->height = inputHeight;
      }
    }

    // Try to use libjpeg shrink-on-load
    int shrink_on_load = 1;
    if (inputImageType == JPEG) {
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
    VipsImage *shrunk_on_load = vips_image_new();
    if (shrink_on_load > 1) {
      // Recalculate integral shrink and double residual
      factor = std::max(factor, 1.0);
      shrink = floor(factor);
      residual = static_cast<double>(shrink) / factor;
      // Reload input using shrink-on-load
      if (baton->buffer_in_len > 1) {
        if (vips_jpegload_buffer(baton->buffer_in, baton->buffer_in_len, &shrunk_on_load, "shrink", shrink_on_load, NULL)) {
          return resize_error(baton, in);
        }
      } else {
        if (vips_jpegload((baton->file_in).c_str(), &shrunk_on_load, "shrink", shrink_on_load, NULL)) {
          return resize_error(baton, in);
        }
      }
    } else {
      vips_copy(in, &shrunk_on_load, NULL);
    }
    g_object_unref(in);

    VipsImage *shrunk = vips_image_new();
    if (shrink > 1) {
      // Use vips_shrink with the integral reduction
      if (vips_shrink(shrunk_on_load, &shrunk, shrink, shrink, NULL)) {
        return resize_error(baton, shrunk_on_load);
      }
      // Recalculate residual float based on dimensions of required vs shrunk images
      double shrunkWidth = shrunk->Xsize;
      double shrunkHeight = shrunk->Ysize;
      if (rotation == VIPS_ANGLE_90 || rotation == VIPS_ANGLE_270) {
        // Swap input output width and height when rotating by 90 or 270 degrees
        int swap = shrunkWidth;
        shrunkWidth = shrunkHeight;
        shrunkHeight = swap;
      }
      double residualx = static_cast<double>(baton->width) / static_cast<double>(shrunkWidth);
      double residualy = static_cast<double>(baton->height) / static_cast<double>(shrunkHeight);
      if (baton->crop || baton->max) {
        residual = std::max(residualx, residualy);
      } else {
        residual = std::min(residualx, residualy);
      }
    } else {
      vips_copy(shrunk_on_load, &shrunk, NULL);
    }
    g_object_unref(shrunk_on_load);

    // Use vips_affine with the remaining float part
    VipsImage *affined = vips_image_new();
    if (residual != 0) {
      // Create interpolator - "bilinear" (default), "bicubic" or "nohalo"
      VipsInterpolate *interpolator = vips_interpolate_new(baton->interpolator.c_str());
      // Perform affine transformation
      if (vips_affine(shrunk, &affined, residual, 0, 0, residual, "interpolate", interpolator, NULL)) {
        g_object_unref(interpolator);
        return resize_error(baton, shrunk);
      }
      g_object_unref(interpolator);
    } else {
      vips_copy(shrunk, &affined, NULL);
    }
    g_object_unref(shrunk);

    // Rotate
    VipsImage *rotated = vips_image_new();
    if (rotation != VIPS_ANGLE_0) {
      if (vips_rot(affined, &rotated, rotation, NULL)) {
        return resize_error(baton, affined);
      }
    } else {
      vips_copy(affined, &rotated, NULL);
    }
    g_object_unref(affined);

    // Crop/embed
    VipsImage *canvased = vips_image_new();
    if (rotated->Xsize != baton->width || rotated->Ysize != baton->height) {
      if (baton->crop || baton->max) {
        // Crop/max
        int left;
        int top;
        std::tie(left, top) = sharp_calc_crop(rotated->Xsize, rotated->Ysize, baton->width, baton->height, baton->gravity);
        int width = std::min(rotated->Xsize, baton->width);
        int height = std::min(rotated->Ysize, baton->height);
        if (vips_extract_area(rotated, &canvased, left, top, width, height, NULL)) {
          return resize_error(baton, rotated);
        }
      } else {
        // Embed
        int left = (baton->width - rotated->Xsize) / 2;
        int top = (baton->height - rotated->Ysize) / 2;
        if (vips_embed(rotated, &canvased, left, top, baton->width, baton->height, "extend", baton->extend, NULL)) {
          return resize_error(baton, rotated);
        }
      }
    } else {
      vips_copy(rotated, &canvased, NULL);
    }
    g_object_unref(rotated);

    // Mild sharpen
    VipsImage *sharpened = vips_image_new();
    if (baton->sharpen) {
      VipsImage *sharpen = vips_image_new_matrixv(3, 3,
        -1.0, -1.0, -1.0,
        -1.0, 32.0, -1.0,
        -1.0, -1.0, -1.0);
      vips_image_set_double(sharpen, "scale", 24);
      if (vips_conv(canvased, &sharpened, sharpen, NULL)) {
        g_object_unref(sharpen);
        return resize_error(baton, canvased);
      }
      g_object_unref(sharpen);
    } else {
      vips_copy(canvased, &sharpened, NULL);
    }
    g_object_unref(canvased);

    // Always convert to sRGB colour space
    VipsImage *colourspaced = vips_image_new();
    vips_colourspace(sharpened, &colourspaced, VIPS_INTERPRETATION_sRGB, NULL);
    g_object_unref(sharpened);

    // Generate image tile cache when interlace output is required
    VipsImage *cached = vips_image_new();
    if (baton->progressive) {
      if (vips_tilecache(colourspaced, &cached, "threaded", TRUE, "persistent", TRUE, "max_tiles", -1, NULL)) {
        return resize_error(baton, colourspaced);
      }
    } else {
      vips_copy(colourspaced, &cached, NULL);
    }
    g_object_unref(colourspaced);

    // Output
    VipsImage *output = cached;
    if (baton->output == "__jpeg" || (baton->output == "__input" && inputImageType == JPEG)) {
      // Write JPEG to buffer
      if (vips_jpegsave_buffer(output, &baton->buffer_out, &baton->buffer_out_len, "strip", !baton->withMetadata, "Q", baton->quality, "optimize_coding", TRUE, "interlace", baton->progressive, NULL)) {
        return resize_error(baton, output);
      }
    } else if (baton->output == "__png" || (baton->output == "__input" && inputImageType == PNG)) {
      // Write PNG to buffer
      if (vips_pngsave_buffer(output, &baton->buffer_out, &baton->buffer_out_len, "strip", !baton->withMetadata, "compression", baton->compressionLevel, "interlace", baton->progressive, NULL)) {
        return resize_error(baton, output);
      }
    } else if (baton->output == "__webp" || (baton->output == "__input" && inputImageType == WEBP)) {
      // Write WEBP to buffer
      if (vips_webpsave_buffer(output, &baton->buffer_out, &baton->buffer_out_len, "strip", !baton->withMetadata, "Q", baton->quality, NULL)) {
        return resize_error(baton, output);
      }
    } else if (is_jpeg(baton->output))  {
      // Write JPEG to file
      if (vips_jpegsave(output, baton->output.c_str(), "strip", !baton->withMetadata, "Q", baton->quality, "optimize_coding", TRUE, "interlace", baton->progressive, NULL)) {
        return resize_error(baton, output);
      }
    } else if (is_png(baton->output)) {
      // Write PNG to file
      if (vips_pngsave(output, baton->output.c_str(), "strip", !baton->withMetadata, "compression", baton->compressionLevel, "interlace", baton->progressive, NULL)) {
        return resize_error(baton, output);
      }
    } else if (is_webp(baton->output)) {
      // Write WEBP to file
      if (vips_webpsave(output, baton->output.c_str(), "strip", !baton->withMetadata, "Q", baton->quality, NULL)) {
        return resize_error(baton, output);
      }
    } else if (is_tiff(baton->output)) {
      // Write TIFF to file
      if (vips_tiffsave(output, baton->output.c_str(), "strip", !baton->withMetadata, "compression", VIPS_FOREIGN_TIFF_COMPRESSION_JPEG, "Q", baton->quality, NULL)) {
        return resize_error(baton, output);
      }
    } else {
      (baton->err).append("Unsupported output " + baton->output);
    }
    g_object_unref(output);

    // Clean up libvips' per-request data and threads
    vips_error_clear();
    vips_thread_shutdown();
  }

  void HandleOKCallback () {
    NanScope();

    Handle<Value> argv[3] = { NanNull(), NanNull(),  NanNull() };
    if (!baton->err.empty()) {
      // Error
      argv[0] = NanNew<String>(baton->err.data(), baton->err.size());
    } else {
      // Info Object
      Local<Object> info = NanNew<Object>();
      info->Set(NanNew<String>("width"), NanNew<Number>(baton->width));
      info->Set(NanNew<String>("height"), NanNew<Number>(baton->height));

      if (baton->buffer_out_len > 0) {
        // Buffer
        argv[1] = NanNewBufferHandle(static_cast<char*>(baton->buffer_out), baton->buffer_out_len);
        g_free(baton->buffer_out);
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
  resize_baton* baton;
};

/*
  resize(options, output, callback)
*/
NAN_METHOD(resize) {
  NanScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  resize_baton *baton = new resize_baton;
  Local<Object> options = args[0]->ToObject();

  // Input filename
  baton->file_in = *String::Utf8Value(options->Get(NanNew<String>("fileIn"))->ToString());
  // Input Buffer object
  if (options->Get(NanNew<String>("bufferIn"))->IsObject()) {
    Local<Object> buffer = options->Get(NanNew<String>("bufferIn"))->ToObject();
    baton->buffer_in_len = Buffer::Length(buffer);
    baton->buffer_in = Buffer::Data(buffer);
  }
  // Output image dimensions
  baton->width = options->Get(NanNew<String>("width"))->Int32Value();
  baton->height = options->Get(NanNew<String>("height"))->Int32Value();
  // Canvas options
  Local<String> canvas = options->Get(NanNew<String>("canvas"))->ToString();
  if (canvas->Equals(NanNew<String>("c"))) {
    baton->crop = true;
  } else if (canvas->Equals(NanNew<String>("w"))) {
    baton->extend = VIPS_EXTEND_WHITE;
  } else if (canvas->Equals(NanNew<String>("b"))) {
    baton->extend = VIPS_EXTEND_BLACK;
  } else if (canvas->Equals(NanNew<String>("m"))) {
    baton->max = true;
  }
  // Other options
  baton->gravity = options->Get(NanNew<String>("gravity"))->Int32Value();
  baton->sharpen = options->Get(NanNew<String>("sharpen"))->BooleanValue();
  baton->interpolator = *String::Utf8Value(options->Get(NanNew<String>("interpolator"))->ToString());
  baton->progressive = options->Get(NanNew<String>("progressive"))->BooleanValue();
  baton->without_enlargement = options->Get(NanNew<String>("withoutEnlargement"))->BooleanValue();
  baton->access_method = options->Get(NanNew<String>("sequentialRead"))->BooleanValue() ? VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;
  baton->quality = options->Get(NanNew<String>("quality"))->Int32Value();
  baton->compressionLevel = options->Get(NanNew<String>("compressionLevel"))->Int32Value();
  baton->angle = options->Get(NanNew<String>("angle"))->Int32Value();
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

/*
  Get and set cache memory and item limits
*/
NAN_METHOD(cache) {
  NanScope();

  // Set cache memory limit
  if (args[0]->IsInt32()) {
    int newMax = args[0]->Int32Value() * 1048576;
    int oldMax = vips_cache_get_max_mem();
    vips_cache_set_max_mem(newMax);

    // Notify the V8 garbage collector of delta in max cache size
    NanAdjustExternalMemory(newMax - oldMax);
  }

  // Set cache items limit
  if (args[1]->IsInt32()) {
    vips_cache_set_max(args[1]->Int32Value());
  }

  // Get cache statistics
  Local<Object> cache = NanNew<Object>();
  cache->Set(NanNew<String>("current"), NanNew<Number>(vips_tracked_get_mem() / 1048576));
  cache->Set(NanNew<String>("high"), NanNew<Number>(vips_tracked_get_mem_highwater() / 1048576));
  cache->Set(NanNew<String>("memory"), NanNew<Number>(vips_cache_get_max_mem() / 1048576));
  cache->Set(NanNew<String>("items"), NanNew<Number>(vips_cache_get_max()));
  NanReturnValue(cache);
}

/*
  Get internal counters (queued tasks, processing tasks)
*/
NAN_METHOD(counters) {
  NanScope();
  Local<Object> counters = NanNew<Object>();
  counters->Set(NanNew<String>("queue"), NanNew<Number>(counter_queue));
  counters->Set(NanNew<String>("process"), NanNew<Number>(counter_process));
  NanReturnValue(counters);
}

static void at_exit(void* arg) {
  NanScope();
  vips_shutdown();
}

extern "C" void init(Handle<Object> target) {
  NanScope();
  vips_init("sharp");
  AtExit(at_exit);

  // Set libvips operation cache limits
  vips_cache_set_max_mem(100 * 1048576); // 100 MB
  vips_cache_set_max(500); // 500 operations

  // Notify the V8 garbage collector of max cache size
  NanAdjustExternalMemory(vips_cache_get_max_mem());

  // Methods available to JavaScript
  NODE_SET_METHOD(target, "metadata", metadata);
  NODE_SET_METHOD(target, "resize", resize);
  NODE_SET_METHOD(target, "cache", cache);
  NODE_SET_METHOD(target, "counters", counters);
}

NODE_MODULE(sharp, init)
