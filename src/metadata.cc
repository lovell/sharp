#include <node.h>
#include <vips/vips8>

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

using Nan::AsyncQueueWorker;
using Nan::AsyncWorker;
using Nan::Callback;
using Nan::HandleScope;
using Nan::Utf8String;
using Nan::Has;
using Nan::Get;
using Nan::Set;
using Nan::New;
using Nan::NewBuffer;
using Nan::Null;
using Nan::Error;

using vips::VImage;
using vips::VError;

using sharp::ImageType;
using sharp::ImageTypeId;
using sharp::DetermineImageType;
using sharp::HasProfile;
using sharp::HasAlpha;
using sharp::ExifOrientation;
using sharp::FreeCallback;
using sharp::counterQueue;

struct MetadataBaton {
  // Input
  std::string fileIn;
  char *bufferIn;
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
  char *exif;
  size_t exifLength;
  char *icc;
  size_t iccLength;
  std::string err;

  MetadataBaton():
    bufferInLength(0),
    orientation(0),
    exifLength(0),
    iccLength(0) {}
};

class MetadataWorker : public AsyncWorker {

 public:
  MetadataWorker(Callback *callback, MetadataBaton *baton, const Local<Object> &bufferIn) :
    AsyncWorker(callback), baton(baton) {
      if (baton->bufferInLength > 0) {
        SaveToPersistent("bufferIn", bufferIn);
      }
    }
  ~MetadataWorker() {}

  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&counterQueue);

    ImageType imageType = ImageType::UNKNOWN;
    VImage image;
    if (baton->bufferInLength > 0) {
      // From buffer
      imageType = DetermineImageType(baton->bufferIn, baton->bufferInLength);
      if (imageType != ImageType::UNKNOWN) {
        try {
          image = VImage::new_from_buffer(baton->bufferIn, baton->bufferInLength, nullptr);
        } catch (...) {
          (baton->err).append("Input buffer has corrupt header");
          imageType = ImageType::UNKNOWN;
        }
      } else {
        (baton->err).append("Input buffer contains unsupported image format");
      }
    } else {
      // From file
      imageType = DetermineImageType(baton->fileIn.data());
      if (imageType != ImageType::UNKNOWN) {
        try {
          image = VImage::new_from_file(baton->fileIn.data());
        } catch (...) {
          (baton->err).append("Input file has corrupt header");
          imageType = ImageType::UNKNOWN;
        }
      } else {
        (baton->err).append("Input file is missing or of an unsupported image format");
      }
    }
    if (imageType != ImageType::UNKNOWN) {
      // Image type
      baton->format = ImageTypeId(imageType);
      // VipsImage attributes
      baton->width = image.width();
      baton->height = image.height();
      baton->space = vips_enum_nick(VIPS_TYPE_INTERPRETATION, image.interpretation());
      baton->channels = image.bands();
      baton->hasProfile = HasProfile(image);
      // Derived attributes
      baton->hasAlpha = HasAlpha(image);
      baton->orientation = ExifOrientation(image);
      // EXIF
      if (image.get_typeof(VIPS_META_EXIF_NAME) == VIPS_TYPE_BLOB) {
        size_t exifLength;
        void const *exif = image.get_blob(VIPS_META_EXIF_NAME, &exifLength);
        baton->exif = static_cast<char*>(g_malloc(exifLength));
        memcpy(baton->exif, exif, exifLength);
        baton->exifLength = exifLength;
      }
      // ICC profile
      if (image.get_typeof(VIPS_META_ICC_NAME) == VIPS_TYPE_BLOB) {
        size_t iccLength;
        void const *icc = image.get_blob(VIPS_META_ICC_NAME, &iccLength);
        baton->icc = static_cast<char*>(g_malloc(iccLength));
        memcpy(baton->icc, icc, iccLength);
        baton->iccLength = iccLength;
      }
    }
    // Clean up
    vips_error_clear();
    vips_thread_shutdown();
  }

  void HandleOKCallback () {
    HandleScope();

    Local<Value> argv[2] = { Null(), Null() };
    if (!baton->err.empty()) {
      // Error
      argv[0] = Error(baton->err.data());
    } else {
      // Metadata Object
      Local<Object> info = New<Object>();
      Set(info, New("format").ToLocalChecked(), New<String>(baton->format).ToLocalChecked());
      Set(info, New("width").ToLocalChecked(), New<Number>(baton->width));
      Set(info, New("height").ToLocalChecked(), New<Number>(baton->height));
      Set(info, New("space").ToLocalChecked(), New<String>(baton->space).ToLocalChecked());
      Set(info, New("channels").ToLocalChecked(), New<Number>(baton->channels));
      Set(info, New("hasProfile").ToLocalChecked(), New<Boolean>(baton->hasProfile));
      Set(info, New("hasAlpha").ToLocalChecked(), New<Boolean>(baton->hasAlpha));
      if (baton->orientation > 0) {
        Set(info, New("orientation").ToLocalChecked(), New<Number>(baton->orientation));
      }
      if (baton->exifLength > 0) {
        Set(info,
          New("exif").ToLocalChecked(),
          NewBuffer(baton->exif, baton->exifLength, FreeCallback, nullptr).ToLocalChecked()
        );
      }
      if (baton->iccLength > 0) {
        Set(info,
          New("icc").ToLocalChecked(),
          NewBuffer(baton->icc, baton->iccLength, FreeCallback, nullptr).ToLocalChecked()
        );
      }
      argv[1] = info;
    }

    // Dispose of Persistent wrapper around input Buffer so it can be garbage collected
    if (baton->bufferInLength > 0) {
      GetFromPersistent("bufferIn");
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
  HandleScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  MetadataBaton *baton = new MetadataBaton;
  Local<Object> options = info[0].As<Object>();

  // Input filename
  baton->fileIn = *Utf8String(Get(options, New("fileIn").ToLocalChecked()).ToLocalChecked());
  // Input Buffer object
  Local<Object> bufferIn;
  if (node::Buffer::HasInstance(Get(options, New("bufferIn").ToLocalChecked()).ToLocalChecked())) {
    bufferIn = Get(options, New("bufferIn").ToLocalChecked()).ToLocalChecked().As<Object>();
    baton->bufferInLength = node::Buffer::Length(bufferIn);
    baton->bufferIn = node::Buffer::Data(bufferIn);
  }

  // Join queue for worker thread
  Callback *callback = new Callback(info[1].As<Function>());
  AsyncQueueWorker(new MetadataWorker(callback, baton, bufferIn));

  // Increment queued task counter
  g_atomic_int_inc(&counterQueue);
}
