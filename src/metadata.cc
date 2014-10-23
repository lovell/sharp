#include <node.h>
#include <vips/vips.h>

#include "nan.h"

#include "common.h"
#include "metadata.h"

using namespace v8;

struct MetadataBaton {
  // Input
  std::string fileIn;
  void* bufferIn;
  size_t bufferInLength;
  // Output
  std::string format;
  int width;
  int height;
  std::string space;
  int channels;
  bool hasAlpha;
  int orientation;
  std::string err;

  MetadataBaton():
    bufferInLength(0),
    orientation(0) {}
};

class MetadataWorker : public NanAsyncWorker {

 public:
  MetadataWorker(NanCallback *callback, MetadataBaton *baton) : NanAsyncWorker(callback), baton(baton) {}
  ~MetadataWorker() {}

  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&counter_queue);

    ImageType imageType = UNKNOWN;
    VipsImage *image;
    if (baton->bufferInLength > 1) {
      // From buffer
      imageType = sharp_init_image_from_buffer(&image, baton->bufferIn, baton->bufferInLength, VIPS_ACCESS_RANDOM);
      if (imageType == UNKNOWN) {
        (baton->err).append("Input buffer contains unsupported image format");
      }
    } else {
      // From file
      imageType = sharp_init_image_from_file(&image, baton->fileIn.c_str(), VIPS_ACCESS_RANDOM);
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
      baton->hasAlpha = sharp_image_has_alpha(image);
      // EXIF Orientation
      const char *exif;
      if (!vips_image_get_string(image, "exif-ifd0-Orientation", &exif)) {
        baton->orientation = atoi(&exif[0]);
      }
    }
    // Clean up
    if (imageType != UNKNOWN) {
      g_object_unref(image);
    }
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
      info->Set(NanNew<String>("hasAlpha"), NanNew<Boolean>(baton->hasAlpha));
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
  MetadataBaton* baton;
};

/*
  metadata(options, callback)
*/
NAN_METHOD(metadata) {
  NanScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  MetadataBaton *baton = new MetadataBaton;
  Local<Object> options = args[0]->ToObject();

  // Input filename
  baton->fileIn = *String::Utf8Value(options->Get(NanNew<String>("fileIn"))->ToString());
  // Input Buffer object
  if (options->Get(NanNew<String>("bufferIn"))->IsObject()) {
    Local<Object> buffer = options->Get(NanNew<String>("bufferIn"))->ToObject();
    baton->bufferInLength = node::Buffer::Length(buffer);
    baton->bufferIn = node::Buffer::Data(buffer);
  }

  // Join queue for worker thread
  NanCallback *callback = new NanCallback(args[1].As<v8::Function>());
  NanAsyncQueueWorker(new MetadataWorker(callback, baton));

  // Increment queued task counter
  g_atomic_int_inc(&counter_queue);

  NanReturnUndefined();
}
