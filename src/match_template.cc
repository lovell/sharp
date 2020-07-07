// Copyright 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020 Lovell Fuller and contributors.
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
#include <iostream>
#include <math.h>

#include <napi.h>
#include <vips/vips8>

#include "common.h"
#include "match_template.h"

class MatchTemplateWorker : public Napi::AsyncWorker {
 public:
  MatchTemplateWorker(Napi::Function callback, MatchTemplateBaton *baton, Napi::Function debuglog) :
    Napi::AsyncWorker(callback), baton(baton), debuglog(Napi::Persistent(debuglog)) {}
  ~MatchTemplateWorker() {}

  const int STAT_SUM_INDEX = 2;
  const int STAT_SQ_SUM_INDEX = 3;

  void Execute() {
    // Decrement queued task counter
    g_atomic_int_dec_and_test(&sharp::counterQueue);

    vips::VImage image;
    sharp::ImageType imageType = sharp::ImageType::UNKNOWN;
    try {
      std::tie(image, imageType) = OpenInput(baton->input);
    } catch (vips::VError const &err) {
      (baton->err).append(err.what());
    }

    vips::VImage referenceImage;
    sharp::ImageType referenceImageType = sharp::ImageType::UNKNOWN;
    try {
      std::tie(referenceImage, referenceImageType) = OpenInput(baton->referenceInput);
    } catch (vips::VError const &err) {
      (baton->err).append(err.what());
    }

    if (imageType != sharp::ImageType::UNKNOWN && referenceImageType != sharp::ImageType::UNKNOWN) {
      try {
        // Get correlation and get minimum point.
        vips::VImage correlation = image.fastcor(referenceImage);
        vips::VOption *option = VImage::option()
        ->set("x", &(baton->minX))
        ->set("y", &(baton->minY));
        correlation.minpos(option);
        baton->min = correlation.min();

        // In order calculate normalized match, need to get sum of squares.
        vips::VImage refStats = referenceImage.stats();
        int const refBands = referenceImage.bands();
        for (int b = 1; b <= refBands; b++) {
            baton->referenceSumSquares += refStats.getpoint(STAT_SQ_SUM_INDEX, b).front();
        }

        baton->score = 1.0 - ((double)(baton->min) / (double)(baton->referenceSumSquares));
      } catch (vips::VError const &err) {
        (baton->err).append(err.what());
      }
    }

    // Clean up
    vips_error_clear();
    vips_thread_shutdown();
  }

  void OnOK() {
    Napi::Env env = Env();
    Napi::HandleScope scope(env);

    // Handle warnings
    std::string warning = sharp::VipsWarningPop();
    while (!warning.empty()) {
      debuglog.Call({ Napi::String::New(env, warning) });
      warning = sharp::VipsWarningPop();
    }

    if (baton->err.empty()) {
      // Object that gets returned via Node.
      Napi::Object info = Napi::Object::New(env);
      
      info.Set("min", baton->min);
      info.Set("minX", baton->minX);
      info.Set("minY", baton->minY);
      info.Set("referenceSumSquares", baton->referenceSumSquares);
      info.Set("score", baton->score);
      Callback().MakeCallback(Receiver().Value(), { env.Null(), info });
    } else {
      Callback().MakeCallback(Receiver().Value(), { Napi::Error::New(env, baton->err).Value() });
    }

    delete baton->input;
    delete baton->referenceInput;
    delete baton;
  }

 private:
  MatchTemplateBaton* baton;
  Napi::FunctionReference debuglog;
};

/*
  match(options, referenceImage, callback)
*/
Napi::Value matchTemplate(const Napi::CallbackInfo& info) {
  // V8 objects are converted to non-V8 types held in the baton struct
  MatchTemplateBaton *baton = new MatchTemplateBaton;
  Napi::Object options = info[0].As<Napi::Object>();

  // Input
  baton->input = sharp::CreateInputDescriptor(options.Get("input").As<Napi::Object>());
  baton->referenceInput = sharp::CreateInputDescriptor(options.Get("referenceImage").As<Napi::Object>());

  // Function to notify of libvips warnings
  Napi::Function debuglog = options.Get("debuglog").As<Napi::Function>();

  // Join queue for worker thread
  Napi::Function callback = info[1].As<Napi::Function>();
  MatchTemplateWorker *worker = new MatchTemplateWorker(callback, baton, debuglog);
  worker->Receiver().Set("options", options);
  worker->Queue();

  // Increment queued task counter
  g_atomic_int_inc(&sharp::counterQueue);

  return info.Env().Undefined();
}