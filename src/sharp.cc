#include <node.h>
#include <node_buffer.h>
#include <math.h>
#include <string>
#include <vips/vips.h>

using namespace v8;
using namespace node;

struct ResizeBaton {
  std::string src;
  std::string dst;
  void* buffer_out;
  size_t buffer_out_len;
  int  cols;
  int  rows;
  bool crop;
  int  embed;
  std::string err;
  Persistent<Function> callback;

  ResizeBaton() : buffer_out_len(0) {}
};

bool EndsWith(std::string const &str, std::string const &end) {
  return str.length() >= end.length() && 0 == str.compare(str.length() - end.length(), end.length(), end);
}

bool IsJpeg(std::string const &str) {
  return EndsWith(str, ".jpg") || EndsWith(str, ".jpeg");
}

bool IsPng(std::string const &str) {
  return EndsWith(str, ".png");
}

void ResizeAsync(uv_work_t *work) {
  ResizeBaton* baton = static_cast<ResizeBaton*>(work->data);

  VipsImage *in = vips_image_new();
  if (IsJpeg(baton->src)) {
    vips_jpegload((baton->src).c_str(), &in, NULL);
  } else if (IsPng(baton->src)) {
    vips_pngload((baton->src).c_str(), &in, NULL);
  } else {
    (baton->err).append("Unsupported input file type");
    return;
  }
  if (in == NULL) {
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
    return;
  }

  double xfactor = static_cast<double>(in->Xsize) / std::max(baton->cols, 1);
  double yfactor = static_cast<double>(in->Ysize) / std::max(baton->rows, 1);
  double factor = baton->crop ? std::min(xfactor, yfactor) : std::max(xfactor, yfactor);
  factor = std::max(factor, 1.0);
  int shrink = floor(factor);
  double residual = shrink / factor;

  // Try to use libjpeg shrink-on-load
  int shrink_on_load = 1;
  if (IsJpeg(baton->src)) {
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
      if (vips_jpegload((baton->src).c_str(), &in, "shrink", shrink_on_load, NULL)) {
        (baton->err).append(vips_error_buffer());
        vips_error_clear();
        g_object_unref(in);
        return;
      }
    }
  }

  VipsImage* img = in;
  VipsImage* t[4];
  if (im_open_local_array(img, t, 4, "temp", "p")) {
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
    g_object_unref(in);
    return;
  }

  if (shrink > 1) {
    // Use vips_shrink with the integral reduction
    if (vips_shrink(img, &t[0], shrink, shrink, NULL)) {
      (baton->err).append(vips_error_buffer());
      vips_error_clear();
      g_object_unref(in);
      return;
    }
  } else {
    t[0] = img;
  }

  // Use vips_affine with the remaining float part using bilinear interpolation
  if (vips_affine(t[0], &t[1], residual, 0, 0, residual, "interpolate", vips_interpolate_bilinear_static(), NULL)) {
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
    g_object_unref(in);
    return;
  }
  img = t[1];

  if (baton->crop) {
    int width = std::min(img->Xsize, baton->cols);
    int height = std::min(img->Ysize, baton->rows);
    int left = (img->Xsize - width + 1) / 2;
    int top = (img->Ysize - height + 1) / 2;
    if (im_extract_area(img, t[2], left, top, width, height)) {
      (baton->err).append(vips_error_buffer());
      vips_error_clear();
      g_object_unref(in);
      return;
    }
    img = t[2];
  } else {
    int left = (baton->cols - img->Xsize) / 2;
    int top = (baton->rows - img->Ysize) / 2;
    if (im_embed(img, t[2], baton->embed, left, top, baton->cols, baton->rows)) {
      (baton->err).append(vips_error_buffer());
      vips_error_clear();
      g_object_unref(in);
      return;
    }
    img = t[2];
  }

  // Mild sharpen
  INTMASK* sharpen = im_create_imaskv("sharpen", 3, 3,
    -1, -1, -1,
    -1, 32, -1,
    -1, -1, -1);
  sharpen->scale = 24;
  if (im_conv(img, t[3], sharpen)) { 
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
    g_object_unref(in);
    return;
  }
  img = t[3];

  if (baton->dst == "__jpeg") {
    // Write JPEG to buffer
    if (vips_jpegsave_buffer(img, &baton->buffer_out, &baton->buffer_out_len, "strip", TRUE, "Q", 80, "optimize_coding", TRUE, NULL)) {
      (baton->err).append(vips_error_buffer());
      vips_error_clear();
    }
  } else if (baton->dst == "__png") {
    // Write PNG to buffer
    if (vips_pngsave_buffer(img, &baton->buffer_out, &baton->buffer_out_len, "strip", TRUE, "compression", 6, "interlace", FALSE, NULL)) {
      (baton->err).append(vips_error_buffer());
      vips_error_clear();
    }
  } else if (EndsWith(baton->dst, ".jpg") || EndsWith(baton->dst, ".jpeg"))  {
    // Write JPEG to file
    if (vips_foreign_save(img, baton->dst.c_str(), "strip", TRUE, "Q", 80, "optimize_coding", TRUE, NULL)) {
      (baton->err).append(vips_error_buffer());
      vips_error_clear();
    }
  } else if (EndsWith(baton->dst, ".png")) {
    // Write PNG to file
    if (vips_foreign_save(img, baton->dst.c_str(), "strip", TRUE, "compression", 6, "interlace", FALSE, NULL)) {
      (baton->err).append(vips_error_buffer());
      vips_error_clear();
    }
  } else {
    (baton->err).append("Unsupported output file type");
  }
  g_object_unref(in);
  vips_thread_shutdown();
}

void ResizeAsyncAfter(uv_work_t *work, int status) {
  HandleScope scope;

  ResizeBaton *baton = static_cast<ResizeBaton*>(work->data);

  Local<Value> null = Local<Value>::New(Null());
  Local<Value> argv[2] = {null, null};
  if (!baton->err.empty()) {
    // Error
    argv[0] = String::New(baton->err.data(), baton->err.size());
  } else if (baton->buffer_out_len > 0) {
    // Buffer
    Buffer *buffer = Buffer::New((const char*)(baton->buffer_out), baton->buffer_out_len);
    argv[1] = Local<Object>::New(buffer->handle_);
    vips_free(baton->buffer_out);
  }

  baton->callback->Call(Context::GetCurrent()->Global(), 2, argv);
  baton->callback.Dispose();
  delete baton;
  delete work;
}

Handle<Value> Resize(const Arguments& args) {
  HandleScope scope;
  
  ResizeBaton *baton = new ResizeBaton;
  baton->src = *String::Utf8Value(args[0]->ToString());
  baton->dst = *String::Utf8Value(args[1]->ToString());
  baton->cols = args[2]->Int32Value();
  baton->rows = args[3]->Int32Value();
  Local<String> canvas = args[4]->ToString();
  if (canvas->Equals(String::NewSymbol("c"))) {
    baton->crop = true;
  } else if (canvas->Equals(String::NewSymbol("w"))) {
    baton->crop = false;
    baton->embed = 4;
  } else if (canvas->Equals(String::NewSymbol("b"))) {
    baton->crop = false;
    baton->embed = 0;
  }
  baton->callback = Persistent<Function>::New(Local<Function>::Cast(args[5]));

  uv_work_t *work = new uv_work_t;
  work->data = baton;
  uv_queue_work(uv_default_loop(), work, ResizeAsync, (uv_after_work_cb)ResizeAsyncAfter);
  return Undefined();
}

static void at_exit(void* arg) {
  HandleScope scope;
  vips_shutdown();
}

extern "C" void init(Handle<Object> target) {
  HandleScope scope;
  vips_init("");
  AtExit(at_exit);
  NODE_SET_METHOD(target, "resize", Resize);
};

NODE_MODULE(sharp, init);
