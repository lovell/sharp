#include <node.h>
#include <node_buffer.h>
#include <math.h>
#include <string>
#include <string.h>
#include <vips/vips.h>

#include "nan.h"

using namespace v8;
using namespace node;

struct resize_baton {
  std::string file_in;
  void* buffer_in;
  size_t buffer_in_len;
  std::string file_out;
  void* buffer_out;
  size_t buffer_out_len;
  int width;
  int height;
  bool crop;
  VipsExtend extend;
  bool sharpen;
  bool progessive;
  VipsAccess access_method;
  int quality;
  int compressionLevel;
  std::string err;

  resize_baton(): buffer_in_len(0), buffer_out_len(0) {}
};

typedef enum {
  JPEG,
  PNG,
  WEBP,
  TIFF,
  MAGICK
} ImageType;

unsigned char MARKER_JPEG[] = {0xff, 0xd8};
unsigned char MARKER_PNG[] = {0x89, 0x50};
unsigned char MARKER_WEBP[] = {0x52, 0x49};

bool ends_with(std::string const &str, std::string const &end) {
  return str.length() >= end.length() && 0 == str.compare(str.length() - end.length(), end.length(), end);
}

bool is_jpeg(std::string const &str) {
  return ends_with(str, ".jpg") || ends_with(str, ".jpeg") || ends_with(str, ".JPG") || ends_with(str, ".JPEG");
}

bool is_png(std::string const &str) {
  return ends_with(str, ".png") || ends_with(str, ".PNG");
}

bool is_webp(std::string const &str) {
  return ends_with(str, ".webp") || ends_with(str, ".WEBP");
}

bool is_tiff(std::string const &str) {
  return ends_with(str, ".tif") || ends_with(str, ".tiff") || ends_with(str, ".TIF") || ends_with(str, ".TIFF");
}

void resize_error(resize_baton *baton, VipsImage *unref) {
  (baton->err).append(vips_error_buffer());
  vips_error_clear();
  g_object_unref(unref);
  vips_thread_shutdown();
  return;
}

class ResizeWorker : public NanAsyncWorker {
 public:
  ResizeWorker(NanCallback *callback, resize_baton *baton)
    : NanAsyncWorker(callback), baton(baton) {}
  ~ResizeWorker() {}

  void Execute () {
    // Input
    ImageType inputImageType = JPEG;
    VipsImage *in = vips_image_new();
    if (baton->buffer_in_len > 1) {
      if (memcmp(MARKER_JPEG, baton->buffer_in, 2) == 0) {
        if (vips_jpegload_buffer(baton->buffer_in, baton->buffer_in_len, &in, "access", baton->access_method, NULL)) {
          return resize_error(baton, in);
        }
      } else if(memcmp(MARKER_PNG, baton->buffer_in, 2) == 0) {
        inputImageType = PNG;
        if (vips_pngload_buffer(baton->buffer_in, baton->buffer_in_len, &in, "access", baton->access_method, NULL)) {
          return resize_error(baton, in);
        }
      } else if(memcmp(MARKER_WEBP, baton->buffer_in, 2) == 0) {
        inputImageType = WEBP;
        if (vips_webpload_buffer(baton->buffer_in, baton->buffer_in_len, &in, "access", baton->access_method, NULL)) {
          return resize_error(baton, in);
        }
      } else {
        resize_error(baton, in);
        (baton->err).append("Unsupported input buffer");
        return;
      }
    } else if (vips_foreign_is_a("jpegload", baton->file_in.c_str())) {
      if (vips_jpegload((baton->file_in).c_str(), &in, "access", baton->access_method, NULL)) {
        return resize_error(baton, in);
      }
    } else if (vips_foreign_is_a("pngload", baton->file_in.c_str())) {
      inputImageType = PNG;
      if (vips_pngload((baton->file_in).c_str(), &in, "access", baton->access_method, NULL)) {
        return resize_error(baton, in);
      }
    } else if (vips_foreign_is_a("webpload", baton->file_in.c_str())) {
      inputImageType = WEBP;
      if (vips_webpload((baton->file_in).c_str(), &in, "access", baton->access_method, NULL)) {
        return resize_error(baton, in);
      }
    } else if (vips_foreign_is_a("tiffload", baton->file_in.c_str())) {
      inputImageType = TIFF;
      if (vips_tiffload((baton->file_in).c_str(), &in, "access", baton->access_method, NULL)) {
        return resize_error(baton, in);
      }
    } else if(vips_foreign_is_a("magickload", (baton->file_in).c_str())) {
      inputImageType = MAGICK;
      if (vips_magickload((baton->file_in).c_str(), &in, "access", baton->access_method, NULL)) {
        return resize_error(baton, in);
      }
    } else {
      resize_error(baton, in);
      (baton->err).append("Unsupported input file " + baton->file_in);
      return;
    }

    // Scaling calculations
    double factor;
    if (baton->width > 0 && baton->height > 0) {
      // Fixed width and height
      double xfactor = (double)(in->Xsize) / (double)(baton->width);
      double yfactor = (double)(in->Ysize) / (double)(baton->height);
      factor = baton->crop ? std::min(xfactor, yfactor) : std::max(xfactor, yfactor);
    } else if (baton->width > 0) {
      // Fixed width, auto height
      factor = (double)(in->Xsize) / (double)(baton->width);
      baton->height = floor((double)(in->Ysize) / factor);
    } else if (baton->height > 0) {
      // Fixed height, auto width
      factor = (double)(in->Ysize) / (double)(baton->height);
      baton->width = floor((double)(in->Xsize) / factor);
    } else {
      // Identity transform
      factor = 1;
      baton->width = in->Xsize;
      baton->height = in->Ysize;
    }
    int shrink = floor(factor);
    if (shrink < 1) {
      shrink = 1;
    }
    double residual = shrink / (double)factor;

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
      residual = shrink / factor;
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
    } else {
      vips_copy(shrunk_on_load, &shrunk, NULL);
    }
    g_object_unref(shrunk_on_load);

    // Use vips_affine with the remaining float part using bilinear interpolation
    VipsImage *affined = vips_image_new();
    if (residual != 0) {
      if (vips_affine(shrunk, &affined, residual, 0, 0, residual, "interpolate", vips_interpolate_bilinear_static(), NULL)) {
        return resize_error(baton, shrunk);
      }
    } else {
      vips_copy(shrunk, &affined, NULL);
    }
    g_object_unref(shrunk);

    // Crop/embed
    VipsImage *canvased = vips_image_new();
    if (affined->Xsize != baton->width || affined->Ysize != baton->height) {
      if (baton->crop) {
        // Crop
        int width = std::min(affined->Xsize, baton->width);
        int height = std::min(affined->Ysize, baton->height);
        int left = (affined->Xsize - width + 1) / 2;
        int top = (affined->Ysize - height + 1) / 2;
        if (vips_extract_area(affined, &canvased, left, top, width, height, NULL)) {
          return resize_error(baton, affined);
        }
      } else {
        // Embed
        int left = (baton->width - affined->Xsize) / 2;
        int top = (baton->height - affined->Ysize) / 2;
        if (vips_embed(affined, &canvased, left, top, baton->width, baton->height, "extend", baton->extend, NULL)) {
          return resize_error(baton, affined);
        }
      }
    } else {
      vips_copy(affined, &canvased, NULL);
    }
    g_object_unref(affined);

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

    // Output
    if (baton->file_out == "__jpeg" || (baton->file_out == "__input" && inputImageType == JPEG)) {
      // Write JPEG to buffer
      if (vips_jpegsave_buffer(sharpened, &baton->buffer_out, &baton->buffer_out_len, "strip", TRUE, "Q", baton->quality, "optimize_coding", TRUE, "interlace", baton->progessive, NULL)) {
        return resize_error(baton, sharpened);
      }
    } else if (baton->file_out == "__png" || (baton->file_out == "__input" && inputImageType == PNG)) {
      // Write PNG to buffer
      if (vips_pngsave_buffer(sharpened, &baton->buffer_out, &baton->buffer_out_len, "strip", TRUE, "compression", baton->compressionLevel, "interlace", baton->progessive, NULL)) {
        return resize_error(baton, sharpened);
      }
    } else if (baton->file_out == "__webp" || (baton->file_out == "__input" && inputImageType == WEBP)) {
      // Write WEBP to buffer
      if (vips_webpsave_buffer(sharpened, &baton->buffer_out, &baton->buffer_out_len, "strip", TRUE, "Q", baton->quality, NULL)) {
        return resize_error(baton, sharpened);
      }
    } else if (is_jpeg(baton->file_out))  {
      // Write JPEG to file
      if (vips_jpegsave(sharpened, baton->file_out.c_str(), "strip", TRUE, "Q", baton->quality, "optimize_coding", TRUE, "interlace", baton->progessive, NULL)) {
        return resize_error(baton, sharpened);
      }
    } else if (is_png(baton->file_out)) {
      // Write PNG to file
      if (vips_pngsave(sharpened, baton->file_out.c_str(), "strip", TRUE, "compression", baton->compressionLevel, "interlace", baton->progessive, NULL)) {
        return resize_error(baton, sharpened);
      }
    } else if (is_webp(baton->file_out)) {
      // Write WEBP to file
      if (vips_webpsave(sharpened, baton->file_out.c_str(), "strip", TRUE, "Q", baton->quality, NULL)) {
        return resize_error(baton, sharpened);
      }
    } else if (is_tiff(baton->file_out)) {
      // Write TIFF to file
      if (vips_tiffsave(sharpened, baton->file_out.c_str(), "strip", TRUE, "compression", VIPS_FOREIGN_TIFF_COMPRESSION_JPEG, "Q", baton->quality, NULL)) {
        return resize_error(baton, sharpened);
      }
    } else {
      (baton->err).append("Unsupported output " + baton->file_out);
    }
    g_object_unref(sharpened);
    vips_thread_shutdown();
  }

  void HandleOKCallback () {
    NanScope();

    Handle<Value> argv[2] = { NanNull(), NanNull() };
    if (!baton->err.empty()) {
      // Error
      argv[0] = NanNew<String>(baton->err.data(), baton->err.size());
    } else if (baton->buffer_out_len > 0) {
      // Buffer
      argv[1] = NanNewBufferHandle((char *)baton->buffer_out, baton->buffer_out_len);
      g_free(baton->buffer_out);
    }
    delete baton;
    callback->Call(2, argv);
  }

 private:
  resize_baton* baton;
};

NAN_METHOD(resize) {
  NanScope();
  
  resize_baton *baton = new resize_baton;
  baton->file_in = *String::Utf8Value(args[0]->ToString());
  if (args[1]->IsObject()) {
    Local<Object> buffer = args[1]->ToObject();
    baton->buffer_in_len = Buffer::Length(buffer);
    baton->buffer_in = Buffer::Data(buffer);
  }
  baton->file_out = *String::Utf8Value(args[2]->ToString());
  baton->width = args[3]->Int32Value();
  baton->height = args[4]->Int32Value();
  Local<String> canvas = args[5]->ToString();
  if (canvas->Equals(NanSymbol("c"))) {
    baton->crop = true;
  } else if (canvas->Equals(NanSymbol("w"))) {
    baton->crop = false;
    baton->extend = VIPS_EXTEND_WHITE;
  } else if (canvas->Equals(NanSymbol("b"))) {
    baton->crop = false;
    baton->extend = VIPS_EXTEND_BLACK;
  }
  baton->sharpen = args[6]->BooleanValue();
  baton->progessive = args[7]->BooleanValue();
  baton->access_method = args[8]->BooleanValue() ? VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;
  baton->quality = args[9]->Int32Value();
  baton->compressionLevel = args[10]->Int32Value();

  NanCallback *callback = new NanCallback(args[11].As<v8::Function>());

  NanAsyncQueueWorker(new ResizeWorker(callback, baton));
  NanReturnUndefined();
}

NAN_METHOD(cache) {
  NanScope();
  
  // Set cache limit
  if (args[0]->IsInt32()) {
    vips_cache_set_max_mem(args[0]->Int32Value() * 1048576);
  }

  // Get cache statistics
  Local<Object> cache = NanNew<Object>();
  cache->Set(NanSymbol("current"), NanNew<Number>(vips_tracked_get_mem() / 1048576));
  cache->Set(NanSymbol("high"), NanNew<Number>(vips_tracked_get_mem_highwater() / 1048576));
  cache->Set(NanSymbol("limit"), NanNew<Number>(vips_cache_get_max_mem() / 1048576));
  NanReturnValue(cache);
}

static void at_exit(void* arg) {
  NanScope();
  vips_shutdown();
}

extern "C" void init(Handle<Object> target) {
  NanScope();
  vips_init("");
  AtExit(at_exit);
  NODE_SET_METHOD(target, "resize", resize);
  NODE_SET_METHOD(target, "cache", cache);
}

NODE_MODULE(sharp, init)
