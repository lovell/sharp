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

/*
  Delete input char[] buffer and notify V8 of memory deallocation
  Used as the callback function for the "postclose" signal
*/
static void DeleteBuffer(VipsObject *object, char *buffer) {
  if (buffer != NULL) {
    delete[] buffer;
  }
}

class MetadataWorker : public AsyncWorker {

 public:
  MetadataWorker(Callback *callback, MetadataBaton *baton) : AsyncWorker(callback), baton(baton) {}
  ~MetadataWorker() {}

  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&counterQueue);

    ImageType imageType = ImageType::UNKNOWN;
    VipsImage *image = NULL;
    if (baton->bufferInLength > 0) {
      // From buffer
      imageType = DetermineImageType(baton->bufferIn, baton->bufferInLength);
      if (imageType != ImageType::UNKNOWN) {
        image = InitImage(baton->bufferIn, baton->bufferInLength, VIPS_ACCESS_RANDOM);
        if (image != NULL) {
          // Listen for "postclose" signal to delete input buffer
          g_signal_connect(image, "postclose", G_CALLBACK(DeleteBuffer), baton->bufferIn);
        } else {
          (baton->err).append("Input buffer has corrupt header");
          imageType = ImageType::UNKNOWN;
          DeleteBuffer(NULL, baton->bufferIn);
        }
      } else {
        (baton->err).append("Input buffer contains unsupported image format");
        DeleteBuffer(NULL, baton->bufferIn);
      }
    } else {
      // From file
      imageType = DetermineImageType(baton->fileIn.c_str());
      if (imageType != ImageType::UNKNOWN) {
        image = InitImage(baton->fileIn.c_str(), VIPS_ACCESS_RANDOM);
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
        case ImageType::OPENSLIDE: baton->format = "openslide"; break;
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
      // EXIF
      if (vips_image_get_typeof(image, VIPS_META_EXIF_NAME) == VIPS_TYPE_BLOB) {
        void* exif;
        size_t exifLength;
        if (!vips_image_get_blob(image, VIPS_META_EXIF_NAME, &exif, &exifLength)) {
          baton->exifLength = exifLength;
          baton->exif = static_cast<char*>(malloc(exifLength));
          memcpy(baton->exif, exif, exifLength);
        }
      }
      // ICC profile
      if (vips_image_get_typeof(image, VIPS_META_ICC_NAME) == VIPS_TYPE_BLOB) {
        void* icc;
        size_t iccLength;
        if (!vips_image_get_blob(image, VIPS_META_ICC_NAME, &icc, &iccLength)) {
          baton->iccLength = iccLength;
          baton->icc = static_cast<char*>(malloc(iccLength));
          memcpy(baton->icc, icc, iccLength);
        }
      }
      // Drop image reference
      g_object_unref(image);
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
      argv[0] = Error(baton->err.c_str());
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
        Set(info, New("exif").ToLocalChecked(), NewBuffer(baton->exif, baton->exifLength).ToLocalChecked());
      }
      if (baton->iccLength > 0) {
        Set(info, New("icc").ToLocalChecked(), NewBuffer(baton->icc, baton->iccLength).ToLocalChecked());
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
  HandleScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  MetadataBaton *baton = new MetadataBaton;
  Local<Object> options = info[0].As<Object>();

  // Input filename
  baton->fileIn = *Utf8String(Get(options, New("fileIn").ToLocalChecked()).ToLocalChecked());
  // Input Buffer object
  if (node::Buffer::HasInstance(Get(options, New("bufferIn").ToLocalChecked()).ToLocalChecked())) {
    Local<Object> buffer = Get(options, New("bufferIn").ToLocalChecked()).ToLocalChecked().As<Object>();
    // Take a copy of the input Buffer to avoid problems with V8 heap compaction
    baton->bufferInLength = node::Buffer::Length(buffer);
    baton->bufferIn = new char[baton->bufferInLength];
    memcpy(baton->bufferIn, node::Buffer::Data(buffer), baton->bufferInLength);
  }

  // Join queue for worker thread
  Callback *callback = new Callback(info[1].As<Function>());
  AsyncQueueWorker(new MetadataWorker(callback, baton));

  // Increment queued task counter
  g_atomic_int_inc(&counterQueue);
}
