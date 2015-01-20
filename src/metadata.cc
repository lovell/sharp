#include <node.h>
#include <vips/vips.h>

#include "nan.h"

#include "common.h"
#include "metadata.h"

using v8::Handle;
using v8::Local;
using v8::Value;
using v8::Object;
using v8::Number;
using v8::String;
using v8::Boolean;
using v8::Function;
using v8::Exception;

using sharp::ImageType;
using sharp::DetermineImageType;
using sharp::InitImage;
using sharp::HasProfile;
using sharp::HasAlpha;
using sharp::ExifOrientation;
using sharp::counterQueue;

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
  bool hasProfile;
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
    g_atomic_int_dec_and_test(&counterQueue);

    ImageType imageType = ImageType::UNKNOWN;
    VipsImage *image = NULL;
    if (baton->bufferInLength > 1) {
      // From buffer
      imageType = DetermineImageType(baton->bufferIn, baton->bufferInLength);
      if (imageType != ImageType::UNKNOWN) {
        image = InitImage(imageType, baton->bufferIn, baton->bufferInLength, VIPS_ACCESS_RANDOM);
        if (image == NULL) {
          (baton->err).append("Input buffer has corrupt header");
          imageType = ImageType::UNKNOWN;
        }
      } else {
        (baton->err).append("Input buffer contains unsupported image format");
      }
    } else {
      // From file
      imageType = DetermineImageType(baton->fileIn.c_str());
      if (imageType != ImageType::UNKNOWN) {
        image = InitImage(imageType, baton->fileIn.c_str(), VIPS_ACCESS_RANDOM);
        if (image == NULL) {
          (baton->err).append("Input file has corrupt header");
          imageType = ImageType::UNKNOWN;
        }
      } else {
        (baton->err).append("Input file is of an unsupported image format");
      }
    }
    if (image != NULL && imageType != ImageType::UNKNOWN) {
      // Image type
      switch (imageType) {
        case ImageType::JPEG: baton->format = "jpeg"; break;
        case ImageType::PNG: baton->format = "png"; break;
        case ImageType::WEBP: baton->format = "webp"; break;
        case ImageType::TIFF: baton->format = "tiff"; break;
        case ImageType::MAGICK: baton->format = "magick"; break;
        case ImageType::UNKNOWN: break;
      }
      // VipsImage attributes
      baton->width = image->Xsize;
      baton->height = image->Ysize;
      baton->space = vips_enum_nick(VIPS_TYPE_INTERPRETATION, image->Type);
      baton->channels = image->Bands;
      baton->hasProfile = HasProfile(image);
      // Derived attributes
      baton->hasAlpha = HasAlpha(image);
      baton->orientation = ExifOrientation(image);
      // Drop image reference
      g_object_unref(image);
    }
    // Clean up
    vips_error_clear();
    vips_thread_shutdown();
  }

  void HandleOKCallback () {
    NanScope();

    Handle<Value> argv[2] = { NanNull(), NanNull() };
    if (!baton->err.empty()) {
      // Error
      argv[0] = Exception::Error(NanNew<String>(baton->err.data(), baton->err.size()));
    } else {
      // Metadata Object
      Local<Object> info = NanNew<Object>();
      info->Set(NanNew<String>("format"), NanNew<String>(baton->format));
      info->Set(NanNew<String>("width"), NanNew<Number>(baton->width));
      info->Set(NanNew<String>("height"), NanNew<Number>(baton->height));
      info->Set(NanNew<String>("space"), NanNew<String>(baton->space));
      info->Set(NanNew<String>("channels"), NanNew<Number>(baton->channels));
      info->Set(NanNew<String>("hasProfile"), NanNew<Boolean>(baton->hasProfile));
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
  g_atomic_int_inc(&counterQueue);

  NanReturnUndefined();
}
