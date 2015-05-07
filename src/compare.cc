#include <node.h>
#include <vips/vips.h>

#include "nan.h"

#include "common.h"
#include "compare-internal.h"

using v8::Boolean;
using v8::Exception;
using v8::Function;
using v8::Handle;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

using sharp::ImageType;
using sharp::DetermineImageType;
using sharp::InitImage;
using sharp::counterQueue;

struct CompareBaton {
  // Input
  std::string fileIn1;
  std::string fileIn2;

  // Output
  bool isEqual;
  float meanSquaredError;
  std::string err;
  std::string status;

  CompareBaton():
    isEqual(false),
    meanSquaredError(0.0) {}
};

class CompareWorker : public NanAsyncWorker {

 public:
  CompareWorker(NanCallback *callback, CompareBaton *baton) : NanAsyncWorker(callback), baton(baton) {}
  ~CompareWorker() {}

  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&counterQueue);

    ImageType imageType1 = ImageType::UNKNOWN;
    ImageType imageType2 = ImageType::UNKNOWN;
    VipsImage *image1 = NULL;
    VipsImage *image2 = NULL;

    // Create "hook" VipsObject to hang image references from
    hook = reinterpret_cast<VipsObject*>(vips_image_new());

    // From files
    imageType1 = DetermineImageType(baton->fileIn1.c_str());
    imageType2 = DetermineImageType(baton->fileIn2.c_str());

    if (imageType1 != ImageType::UNKNOWN) {
      image1 = InitImage(baton->fileIn1.c_str(), VIPS_ACCESS_RANDOM);
      if (image1 == NULL) {
        (baton->err).append("Input file 1 has corrupt header");
        imageType1 = ImageType::UNKNOWN;
      } else {
        vips_object_local(hook, image1);
      }
    } else {
      (baton->err).append("Input file 1 is of an unsupported image format");
    }

    if (imageType2 != ImageType::UNKNOWN) {
      image2 = InitImage(baton->fileIn2.c_str(), VIPS_ACCESS_RANDOM);
      if (image2 == NULL) {
        (baton->err).append("Input file 2 has corrupt header");
        imageType2 = ImageType::UNKNOWN;
      } else {
        vips_object_local(hook, image2);
      }
    } else {
      (baton->err).append("Input file 2 is of an unsupported image format");
    }

    if (image1 != NULL && imageType1 != ImageType::UNKNOWN && image2 != NULL && imageType2 != ImageType::UNKNOWN) {
      double meanSquaredError;

      baton->meanSquaredError = -1.0;
      baton->isEqual = FALSE;

      if (image1->Type != image2->Type) {
        baton->status = "mismatchedTypes";
      } else if (image1->Bands != image2->Bands) {
        baton->status = "mismatchedBands";
      } else if (image1->Xsize != image2->Xsize || image1->Ysize != image2->Ysize) {
        baton->status = "mismatchedDimensions";
      } else {
        if (Compare(hook, image1, image2, &meanSquaredError)) {
          (baton->err).append("Failed to compare two images");
          return Error();
        } else {
          baton->status = "success";
          baton->meanSquaredError = meanSquaredError;
          baton->isEqual = meanSquaredError == 0.0;
        }
      }
    } else {
      return Error();
    }

    CleanUp();
  }

  void CleanUp() {
    // Clean up any dangling image references
    g_object_unref(hook);

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
      // Compare Object
      Local<Object> info = NanNew<Object>();
      info->Set(NanNew<String>("isEqual"), NanNew<Boolean>(baton->isEqual));
      info->Set(NanNew<String>("status"), NanNew<String>(baton->status));
      if (baton->meanSquaredError >= 0.0) {
        info->Set(NanNew<String>("meanSquaredError"), NanNew<Number>(baton->meanSquaredError));
      }
      argv[1] = info;
    }
    delete baton;

    // Return to JavaScript
    callback->Call(2, argv);
  }

  /*
    Copy then clear the error message.
    Unref all transitional images on the hook.
    Clear all thread-local data.
  */
  void Error() {
    // Get libvips' error message
    (baton->err).append(vips_error_buffer());

    CleanUp();
  }

 private:
  CompareBaton* baton;
  VipsObject *hook;
};

/*
  compare(options, callback)
*/
NAN_METHOD(compare) {
  NanScope();

  // V8 objects are converted to non-V8 types held in the baton struct
  CompareBaton *baton = new CompareBaton;
  Local<Object> options = args[0]->ToObject();

  // Input filename
  baton->fileIn1 = *String::Utf8Value(options->Get(NanNew<String>("fileIn1"))->ToString());
  baton->fileIn2 = *String::Utf8Value(options->Get(NanNew<String>("fileIn2"))->ToString());

  // Join queue for worker thread
  NanCallback *callback = new NanCallback(args[1].As<v8::Function>());
  NanAsyncQueueWorker(new CompareWorker(callback, baton));

  // Increment queued task counter
  g_atomic_int_inc(&counterQueue);

  NanReturnUndefined();
}
