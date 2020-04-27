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

#include <napi.h>
#include <vips/vips8>

#include "common.h"
#include "stats.h"

class StatsWorker : public Napi::AsyncWorker {
 public:
  StatsWorker(Napi::Function callback, StatsBaton *baton, Napi::Function debuglog) :
    Napi::AsyncWorker(callback), baton(baton), debuglog(Napi::Persistent(debuglog)) {}
  ~StatsWorker() {}

  const int STAT_MIN_INDEX = 0;
  const int STAT_MAX_INDEX = 1;
  const int STAT_SUM_INDEX = 2;
  const int STAT_SQ_SUM_INDEX = 3;
  const int STAT_MEAN_INDEX = 4;
  const int STAT_STDEV_INDEX = 5;
  const int STAT_MINX_INDEX = 6;
  const int STAT_MINY_INDEX = 7;
  const int STAT_MAXX_INDEX = 8;
  const int STAT_MAXY_INDEX = 9;

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
    if (imageType != sharp::ImageType::UNKNOWN) {
      try {
        vips::VImage stats = image.stats();
        int const bands = image.bands();
        for (int b = 1; b <= bands; b++) {
          ChannelStats cStats(
            static_cast<int>(stats.getpoint(STAT_MIN_INDEX, b).front()),
            static_cast<int>(stats.getpoint(STAT_MAX_INDEX, b).front()),
            stats.getpoint(STAT_SUM_INDEX, b).front(),
            stats.getpoint(STAT_SQ_SUM_INDEX, b).front(),
            stats.getpoint(STAT_MEAN_INDEX, b).front(),
            stats.getpoint(STAT_STDEV_INDEX, b).front(),
            static_cast<int>(stats.getpoint(STAT_MINX_INDEX, b).front()),
            static_cast<int>(stats.getpoint(STAT_MINY_INDEX, b).front()),
            static_cast<int>(stats.getpoint(STAT_MAXX_INDEX, b).front()),
            static_cast<int>(stats.getpoint(STAT_MAXY_INDEX, b).front()));
          baton->channelStats.push_back(cStats);
        }
        // Image is not opaque when alpha layer is present and contains a non-mamixa value
        if (sharp::HasAlpha(image)) {
          double const minAlpha = static_cast<double>(stats.getpoint(STAT_MIN_INDEX, bands).front());
          if (minAlpha != sharp::MaximumImageAlpha(image.interpretation())) {
            baton->isOpaque = false;
          }
        }
        // Estimate entropy via histogram of greyscale value frequency
        baton->entropy = std::abs(image.colourspace(VIPS_INTERPRETATION_B_W)[0].hist_find().hist_entropy());
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
      // Stats Object
      Napi::Object info = Napi::Object::New(env);
      Napi::Array channels = Napi::Array::New(env);

      std::vector<ChannelStats>::iterator it;
      int i = 0;
      for (it = baton->channelStats.begin(); it < baton->channelStats.end(); it++, i++) {
        Napi::Object channelStat = Napi::Object::New(env);
        channelStat.Set("min", it->min);
        channelStat.Set("max", it->max);
        channelStat.Set("sum", it->sum);
        channelStat.Set("squaresSum", it->squaresSum);
        channelStat.Set("mean", it->mean);
        channelStat.Set("stdev", it->stdev);
        channelStat.Set("minX", it->minX);
        channelStat.Set("minY", it->minY);
        channelStat.Set("maxX", it->maxX);
        channelStat.Set("maxY", it->maxY);
        channels.Set(i, channelStat);
      }

      info.Set("channels", channels);
      info.Set("isOpaque", baton->isOpaque);
      info.Set("entropy", baton->entropy);
      Callback().MakeCallback(Receiver().Value(), { env.Null(), info });
    } else {
      Callback().MakeCallback(Receiver().Value(), { Napi::Error::New(env, baton->err).Value() });
    }

    delete baton->input;
    delete baton;
  }

 private:
  StatsBaton* baton;
  Napi::FunctionReference debuglog;
};

/*
  stats(options, callback)
*/
Napi::Value stats(const Napi::CallbackInfo& info) {
  // V8 objects are converted to non-V8 types held in the baton struct
  StatsBaton *baton = new StatsBaton;
  Napi::Object options = info[0].As<Napi::Object>();

  // Input
  baton->input = sharp::CreateInputDescriptor(options.Get("input").As<Napi::Object>());

  // Function to notify of libvips warnings
  Napi::Function debuglog = options.Get("debuglog").As<Napi::Function>();

  // Join queue for worker thread
  Napi::Function callback = info[1].As<Napi::Function>();
  StatsWorker *worker = new StatsWorker(callback, baton, debuglog);
  worker->Receiver().Set("options", options);
  worker->Queue();

  // Increment queued task counter
  g_atomic_int_inc(&sharp::counterQueue);

  return info.Env().Undefined();
}
