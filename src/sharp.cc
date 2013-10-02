#include <node.h>
#include <math.h>
#include <string>
#include <vector>
#include <vips/vips.h>

using namespace v8;

// Free VipsImage children when object goes out of scope
// Thanks due to https://github.com/dosx/node-vips
class ImageFreer {
  public:
    ImageFreer() {}
    ~ImageFreer() {
      for (uint16_t i = 0; i < v_.size(); i++) {
        if (v_[i] != NULL) {
          g_object_unref(v_[i]);
        }
      }
      v_.clear();
    }
    void add(VipsImage* i) { v_.push_back(i); }
  private:
    std::vector<VipsImage*> v_;
};

struct ResizeBaton {
  std::string src;
  std::string dst;
  int  cols;
  int  rows;
  bool crop;
  int  embed;
  std::string err;
  Persistent<Function> callback;
};

void ResizeAsync(uv_work_t *work) {
  ResizeBaton* baton = static_cast<ResizeBaton*>(work->data);

  VipsImage *in = vips_image_new_mode((baton->src).c_str(), "p");
  vips_jpegload((baton->src).c_str(), &in, NULL);
  if (in == NULL) {
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
    return;
  }
  ImageFreer freer;
  freer.add(in);

  VipsImage* img = in;
  VipsImage* t[4];

  if (im_open_local_array(img, t, 4, "temp", "p")) {
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
    return;
  }

  double xfactor = static_cast<double>(img->Xsize) / std::max(baton->cols, 1);
  double yfactor = static_cast<double>(img->Ysize) / std::max(baton->rows, 1);
  double factor = baton->crop ? std::min(xfactor, yfactor) : std::max(xfactor, yfactor);
  factor = std::max(factor, 1.0);
  int shrink = floor(factor);
  double residual = shrink / factor;

  // Use im_shrink with the integral reduction
  if (im_shrink(img, t[0], shrink, shrink)) {
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
    return;
  }

  // Use im_affinei with the remaining float part using bilinear interpolation
  if (im_affinei_all(t[0], t[1], vips_interpolate_bilinear_static(), residual, 0, 0, residual, 0, 0)) {
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
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
      return;
    }
    img = t[2];
  } else {
    int left = (baton->cols - img->Xsize) / 2;
    int top = (baton->rows - img->Ysize) / 2;
    if (im_embed(img, t[2], baton->embed, left, top, baton->cols, baton->rows)) {
      (baton->err).append(vips_error_buffer());
      vips_error_clear();
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
    return;
  }
  img = t[3];

  if (vips_jpegsave(img, baton->dst.c_str(), "Q", 80, "profile", "none", "optimize_coding", TRUE, NULL)) {
    (baton->err).append(vips_error_buffer());
    vips_error_clear();
  }
}

void ResizeAsyncAfter(uv_work_t *work, int status) {
  HandleScope scope;

  ResizeBaton *baton = static_cast<ResizeBaton*>(work->data);

  Local<Value> argv[1];
  if (!baton->err.empty()) {
    argv[0] = String::New(baton->err.data(), baton->err.size());
  } else {
    argv[0] = Local<Value>::New(Null());
  }

  baton->callback->Call(Context::GetCurrent()->Global(), 1, argv);
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

extern "C" void init(Handle<Object> target) {
  HandleScope scope;
  vips_init("");
  NODE_SET_METHOD(target, "resize", Resize);
};

NODE_MODULE(sharp, init)
