// Copyright 2013, 2014, 2015, 2016, 2017 Lovell Fuller and contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include <numeric>
#include <vector>

#include <node.h>
#include <nan.h>
#include <vips/vips8>

#include "common.h"
#include "metadata.h"

class MetadataWorker : public Nan::AsyncWorker {
 public:
  MetadataWorker(
    Nan::Callback *callback, MetadataBaton *baton, Nan::Callback *debuglog,
    std::vector<v8::Local<v8::Object>> const buffersToPersist) :
    Nan::AsyncWorker(callback), baton(baton), debuglog(debuglog),
    buffersToPersist(buffersToPersist) {
    // Protect Buffer objects from GC, keyed on index
    std::accumulate(buffersToPersist.begin(), buffersToPersist.end(), 0,
      [this](uint32_t index, v8::Local<v8::Object> const buffer) -> uint32_t {
        SaveToPersistent(index, buffer);
        return index + 1;
      });
  }
  ~MetadataWorker() {}

  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&sharp::counterQueue);

    vips::VImage image;
    sharp::ImageType imageType = sharp::ImageType::UNKNOWN;
    try {
      std::tie(image, imageType) = OpenInput(baton->input, VIPS_ACCESS_SEQUENTIAL);
    } catch (vips::VError const &err) {
      (baton->err).append(err.what());
    }
    if (imageType != sharp::ImageType::UNKNOWN) {
      // Image type
      baton->format = sharp::ImageTypeId(imageType);
      // VipsImage attributes
      baton->width = image.width();
      baton->height = image.height();
      baton->space = vips_enum_nick(VIPS_TYPE_INTERPRETATION, image.interpretation());
      baton->channels = image.bands();
      baton->depth = vips_enum_nick(VIPS_TYPE_BAND_FORMAT, image.format());
      if (sharp::HasDensity(image)) {
        baton->density = sharp::GetDensity(image);
      }
      baton->hasProfile = sharp::HasProfile(image);
      // Derived attributes
      baton->hasAlpha = sharp::HasAlpha(image);
      baton->orientation = sharp::ExifOrientation(image);
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

  void HandleOKCallback() {
    using Nan::New;
    using Nan::Set;
    Nan::HandleScope();

    v8::Local<v8::Value> argv[2] = { Nan::Null(), Nan::Null() };
    if (!baton->err.empty()) {
      argv[0] = Nan::Error(baton->err.data());
    } else {
      // Metadata Object
      v8::Local<v8::Object> info = New<v8::Object>();
      Set(info, New("format").ToLocalChecked(), New<v8::String>(baton->format).ToLocalChecked());
      Set(info, New("width").ToLocalChecked(), New<v8::Uint32>(baton->width));
      Set(info, New("height").ToLocalChecked(), New<v8::Uint32>(baton->height));
      Set(info, New("space").ToLocalChecked(), New<v8::String>(baton->space).ToLocalChecked());
      Set(info, New("channels").ToLocalChecked(), New<v8::Uint32>(baton->channels));
      Set(info, New("depth").ToLocalChecked(), New<v8::String>(baton->depth).ToLocalChecked());
      if (baton->density > 0) {
        Set(info, New("density").ToLocalChecked(), New<v8::Uint32>(baton->density));
      }
      Set(info, New("hasProfile").ToLocalChecked(), New<v8::Boolean>(baton->hasProfile));
      Set(info, New("hasAlpha").ToLocalChecked(), New<v8::Boolean>(baton->hasAlpha));
      if (baton->orientation > 0) {
        Set(info, New("orientation").ToLocalChecked(), New<v8::Uint32>(baton->orientation));
      }
      if (baton->exifLength > 0) {
        Set(info,
          New("exif").ToLocalChecked(),
          Nan::NewBuffer(baton->exif, baton->exifLength, sharp::FreeCallback, nullptr).ToLocalChecked());
      }
      if (baton->iccLength > 0) {
        Set(info,
          New("icc").ToLocalChecked(),
          Nan::NewBuffer(baton->icc, baton->iccLength, sharp::FreeCallback, nullptr).ToLocalChecked());
      }
      argv[1] = info;
    }

    // Dispose of Persistent wrapper around input Buffers so they can be garbage collected
    std::accumulate(buffersToPersist.begin(), buffersToPersist.end(), 0,
      [this](uint32_t index, v8::Local<v8::Object> const buffer) -> uint32_t {
        GetFromPersistent(index);
        return index + 1;
      });
    delete baton->input;
    delete baton;

    // Handle warnings
    std::string warning = sharp::VipsWarningPop();
    while (!warning.empty()) {
      v8::Local<v8::Value> message[1] = { New(warning).ToLocalChecked() };
      debuglog->Call(1, message);
      warning = sharp::VipsWarningPop();
    }

    // Return to JavaScript
    callback->Call(2, argv);
  }

 private:
  MetadataBaton* baton;
  Nan::Callback *debuglog;
  std::vector<v8::Local<v8::Object>> buffersToPersist;
};

/*
  metadata(options, callback)
*/
NAN_METHOD(metadata) {
  // Input Buffers must not undergo GC compaction during processing
  std::vector<v8::Local<v8::Object>> buffersToPersist;

  // V8 objects are converted to non-V8 types held in the baton struct
  MetadataBaton *baton = new MetadataBaton;
  v8::Local<v8::Object> options = info[0].As<v8::Object>();

  // Input
  baton->input = sharp::CreateInputDescriptor(sharp::AttrAs<v8::Object>(options, "input"), buffersToPersist);

  // Function to notify of libvips warnings
  Nan::Callback *debuglog = new Nan::Callback(sharp::AttrAs<v8::Function>(options, "debuglog"));

  // Join queue for worker thread
  Nan::Callback *callback = new Nan::Callback(info[1].As<v8::Function>());
  Nan::AsyncQueueWorker(new MetadataWorker(callback, baton, debuglog, buffersToPersist));

  // Increment queued task counter
  g_atomic_int_inc(&sharp::counterQueue);
}
