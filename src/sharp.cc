#include <node.h>
#include <node_buffer.h>
#include <math.h>
#include <string>
#include <string.h>
#include <vips/vips.h>

using namespace v8;
using namespace node;

struct resize_baton {
  std::string file_in;
  void* buffer_in;
  size_t buffer_in_len;
  std::string file_out;
  void* buffer_out;
  size_t buffer_out_len;
  int  width;
  int  height;
  bool crop;
  int  embed;
  bool sharpen;
  bool progessive;
  VipsAccess access_method;
  std::string err;
  Persistent<Function> callback;

  resize_baton(): buffer_in_len(0), buffer_out_len(0) {}
};

typedef enum {
  JPEG,
  PNG
} ImageType;

unsigned char MARKER_JPEG[] = {0xff, 0xd8};
unsigned char MARKER_PNG[] = {0x89, 0x50};

bool ends_with(std::string const &str, std::string const &end) {
  return str.length() >= end.length() && 0 == str.compare(str.length() - end.length(), end.length(), end);
}

bool is_jpeg(std::string const &str) {
  return ends_with(str, ".jpg") || ends_with(str, ".jpeg");
}

bool is_png(std::string const &str) {
  return ends_with(str, ".png");
}

void resize_error(resize_baton *baton, VipsImage *unref) {
  (baton->err).append(vips_error_buffer());
  vips_error_clear();
  g_object_unref(unref);
  vips_thread_shutdown();
  return;
}

void resize_async(uv_work_t *work) {
  resize_baton* baton = static_cast<resize_baton*>(work->data);

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
    }
  } else if (is_jpeg(baton->file_in)) {
    if (vips_jpegload((baton->file_in).c_str(), &in, "access", baton->access_method, NULL)) {
      return resize_error(baton, in);
    }
  } else if (is_png(baton->file_in)) {
    inputImageType = PNG;
    if (vips_pngload((baton->file_in).c_str(), &in, "access", baton->access_method, NULL)) {
      return resize_error(baton, in);
    }
  } else {
    resize_error(baton, in);
    (baton->err).append("Unsupported input " + baton->file_in);
    return;
  }

  double xfactor = static_cast<double>(in->Xsize) / std::max(baton->width, 1);
  double yfactor = static_cast<double>(in->Ysize) / std::max(baton->height, 1);
  double factor = baton->crop ? std::min(xfactor, yfactor) : std::max(xfactor, yfactor);
  factor = std::max(factor, 1.0);
  int shrink = floor(factor);
  double residual = shrink / factor;

  // Try to use libjpeg shrink-on-load
  int shrink_on_load = 1;
  if (inputImageType == JPEG) {
    if (shrink >= 8) {
      residual = residual * shrink / 8;
      shrink_on_load = 8;
      shrink = 1;
    } else if (shrink >= 4) {
      residual = residual * shrink / 4;
      shrink_on_load = 4;
      shrink = 1;
    } else if (shrink >= 2) {
      residual = residual * shrink / 2;
      shrink_on_load = 2;
      shrink = 1;
    }
    if (shrink_on_load > 1) {
      g_object_unref(in);
      in = vips_image_new();
      if (baton->buffer_in_len > 1) {
        if (vips_jpegload_buffer(baton->buffer_in, baton->buffer_in_len, &in, "shrink", shrink_on_load, NULL)) {
          return resize_error(baton, in);
        }
      } else {
        if (vips_jpegload((baton->file_in).c_str(), &in, "shrink", shrink_on_load, NULL)) {
          return resize_error(baton, in);
        }
      }
    }
  }

  VipsImage *shrunk = vips_image_new();
  if (shrink > 1) {
    // Use vips_shrink with the integral reduction
    if (vips_shrink(in, &shrunk, shrink, shrink, NULL)) {
      return resize_error(baton, in);
    }
  } else {
    vips_copy(in, &shrunk, NULL);
  }
  g_object_unref(in);

  // Use vips_affine with the remaining float part using bilinear interpolation
  VipsImage *affined = vips_image_new();
  if (vips_affine(shrunk, &affined, residual, 0, 0, residual, "interpolate", vips_interpolate_bilinear_static(), NULL)) {
    return resize_error(baton, shrunk);
  }
  g_object_unref(shrunk);

  VipsImage *canvased = vips_image_new();
  if (baton->crop) {
    int width = std::min(affined->Xsize, baton->width);
    int height = std::min(affined->Ysize, baton->height);
    int left = (affined->Xsize - width + 1) / 2;
    int top = (affined->Ysize - height + 1) / 2;
    if (vips_extract_area(affined, &canvased, left, top, width, height, NULL)) {
      return resize_error(baton, affined);
    }
  } else {
    int left = (baton->width - affined->Xsize) / 2;
    int top = (baton->height - affined->Ysize) / 2;
    if (vips_embed(affined, &canvased, baton->embed, left, top, baton->width, baton->height, NULL)) {
      return resize_error(baton, affined);
    }
  }
  g_object_unref(affined);

  // Mild sharpen
  VipsImage *sharpened = vips_image_new();
  if (baton->sharpen) {
    INTMASK* sharpen = im_create_imaskv("sharpen", 3, 3,
      -1, -1, -1,
      -1, 32, -1,
      -1, -1, -1);
    sharpen->scale = 24;
    if (im_conv(canvased, sharpened, sharpen)) {
      return resize_error(baton, canvased);
    }
  } else {
    vips_copy(canvased, &sharpened, NULL);
  }
  g_object_unref(canvased);

  if (baton->file_out == "__jpeg") {
    // Write JPEG to buffer
    if (vips_jpegsave_buffer(canvased, &baton->buffer_out, &baton->buffer_out_len, "strip", TRUE, "Q", 80, "optimize_coding", TRUE, "interlace", baton->progessive, NULL)) {
      return resize_error(baton, canvased);
    }
  } else if (baton->file_out == "__png") {
    // Write PNG to buffer
    if (vips_pngsave_buffer(canvased, &baton->buffer_out, &baton->buffer_out_len, "strip", TRUE, "compression", 6, "interlace", baton->progessive, NULL)) {
      return resize_error(baton, canvased);
    }
  } else if (is_jpeg(baton->file_out))  {
    // Write JPEG to file
    if (vips_jpegsave(canvased, baton->file_out.c_str(), "strip", TRUE, "Q", 80, "optimize_coding", TRUE, "interlace", baton->progessive, NULL)) {
      return resize_error(baton, canvased);
    }
  } else if (is_png(baton->file_out)) {
    // Write PNG to file
    if (vips_pngsave(canvased, baton->file_out.c_str(), "strip", TRUE, "compression", 6, "interlace", baton->progessive, NULL)) {
      return resize_error(baton, canvased);
    }
  } else {
    (baton->err).append("Unsupported output " + baton->file_out);
  }
  g_object_unref(canvased);
  vips_thread_shutdown();
}

void resize_async_after(uv_work_t *work, int status) {
  HandleScope scope;

  resize_baton *baton = static_cast<resize_baton*>(work->data);

  Handle<Value> argv[2] = { Null(), Null() };
  if (!baton->err.empty()) {
    // Error
    argv[0] = String::New(baton->err.data(), baton->err.size());
  } else if (baton->buffer_out_len > 0) {
    // Buffer
    Buffer *slowBuffer = Buffer::New(baton->buffer_out_len);
    memcpy(Buffer::Data(slowBuffer), baton->buffer_out, baton->buffer_out_len);
    Local<Object> globalObj = Context::GetCurrent()->Global();
    Local<Function> bufferConstructor = Local<Function>::Cast(globalObj->Get(String::New("Buffer")));
    Handle<Value> constructorArgs[3] = { slowBuffer->handle_, v8::Integer::New(baton->buffer_out_len), v8::Integer::New(0) };
    argv[1] = bufferConstructor->NewInstance(3, constructorArgs);
    g_free(baton->buffer_out);
  }

  baton->callback->Call(Context::GetCurrent()->Global(), 2, argv);
  baton->callback.Dispose();
  delete baton;
  delete work;
}

Handle<Value> resize(const Arguments& args) {
  HandleScope scope;
  
  resize_baton *baton = new resize_baton;
  baton->file_in = *String::Utf8Value(args[0]->ToString());
  if (args[1]->IsObject()) {
    Local<Object> buffer = args[1]->ToObject();
    baton->buffer_in = Buffer::Data(buffer);
    baton->buffer_in_len = Buffer::Length(buffer);
  }
  baton->file_out = *String::Utf8Value(args[2]->ToString());
  baton->width = args[3]->Int32Value();
  baton->height = args[4]->Int32Value();
  Local<String> canvas = args[5]->ToString();
  if (canvas->Equals(String::NewSymbol("c"))) {
    baton->crop = true;
  } else if (canvas->Equals(String::NewSymbol("w"))) {
    baton->crop = false;
    baton->embed = 4;
  } else if (canvas->Equals(String::NewSymbol("b"))) {
    baton->crop = false;
    baton->embed = 0;
  }
  baton->sharpen = args[6]->BooleanValue();
  baton->progessive = args[7]->BooleanValue();
  baton->access_method = args[8]->BooleanValue() ? VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;
  baton->callback = Persistent<Function>::New(Local<Function>::Cast(args[9]));

  uv_work_t *work = new uv_work_t;
  work->data = baton;
  uv_queue_work(uv_default_loop(), work, resize_async, (uv_after_work_cb)resize_async_after);
  return scope.Close(Undefined());
}

static void at_exit(void* arg) {
  HandleScope scope;
  vips_shutdown();
}

extern "C" void init(Handle<Object> target) {
  HandleScope scope;
  vips_init("");
  AtExit(at_exit);
  NODE_SET_METHOD(target, "resize", resize);
};

NODE_MODULE(sharp, init);
