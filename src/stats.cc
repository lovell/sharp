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
#include <iostream>

#include <node.h>
#include <nan.h>
#include <vips/vips8>

#include "common.h"
#include "stats.h"

class StatsWorker : public Nan::AsyncWorker {
 public:
  StatsWorker(
    Nan::Callback *callback, StatsBaton *baton, Nan::Callback *debuglog,
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
    using Nan::New;
    using Nan::Set;
    using sharp::MaximumImageAlpha;

    vips::VImage image;
    vips::VImage stats;
    sharp::ImageType imageType = sharp::ImageType::UNKNOWN;

    try {
      std::tie(image, imageType) = OpenInput(baton->input, baton->accessMethod);
    } catch (vips::VError const &err) {
      (baton->err).append(err.what());
    }
    if (imageType != sharp::ImageType::UNKNOWN) {
      try {
        stats = image.stats();
        int bands = image.bands();
        double const max = MaximumImageAlpha(image.interpretation());
        for (int b = 1; b <= bands; b++) {
          ChannelStats cStats(static_cast<int>(stats.getpoint(STAT_MIN_INDEX, b).front()),
                              static_cast<int>(stats.getpoint(STAT_MAX_INDEX, b).front()),
                              stats.getpoint(STAT_SUM_INDEX, b).front(), stats.getpoint(STAT_SQ_SUM_INDEX, b).front(),
                              stats.getpoint(STAT_MEAN_INDEX, b).front(), stats.getpoint(STAT_STDEV_INDEX, b).front(),
                              static_cast<int>(stats.getpoint(STAT_MINX_INDEX, b).front()),
                              static_cast<int>(stats.getpoint(STAT_MINY_INDEX, b).front()),
                              static_cast<int>(stats.getpoint(STAT_MAXX_INDEX, b).front()),
                              static_cast<int>(stats.getpoint(STAT_MAXY_INDEX, b).front()));
          baton->channelStats.push_back(cStats);
        }

        // alpha layer is there and the last band i.e. alpha has its max value greater than 0)
        if (sharp::HasAlpha(image) && stats.getpoint(STAT_MIN_INDEX, bands).front() != max) {
          baton->isOpaque = false;
        }
      } catch (vips::VError const &err) {
        (baton->err).append(err.what());
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
      // Stats Object
      v8::Local<v8::Object> info = New<v8::Object>();
      v8::Local<v8::Array> channels = New<v8::Array>();

      std::vector<ChannelStats>::iterator it;
      int i = 0;
      for (it=baton->channelStats.begin() ; it < baton->channelStats.end(); it++, i++) {
        v8::Local<v8::Object> channelStat = New<v8::Object>();
        Set(channelStat, New("min").ToLocalChecked(), New<v8::Number>(it->min));
        Set(channelStat, New("max").ToLocalChecked(), New<v8::Number>(it->max));
        Set(channelStat, New("sum").ToLocalChecked(), New<v8::Number>(it->sum));
        Set(channelStat, New("squaresSum").ToLocalChecked(), New<v8::Number>(it->squaresSum));
        Set(channelStat, New("mean").ToLocalChecked(), New<v8::Number>(it->mean));
        Set(channelStat, New("stdev").ToLocalChecked(), New<v8::Number>(it->stdev));
        Set(channelStat, New("minX").ToLocalChecked(), New<v8::Number>(it->minX));
        Set(channelStat, New("minY").ToLocalChecked(), New<v8::Number>(it->minY));
        Set(channelStat, New("maxX").ToLocalChecked(), New<v8::Number>(it->maxX));
        Set(channelStat, New("maxY").ToLocalChecked(), New<v8::Number>(it->maxY));
        channels->Set(i, channelStat);
      }

      Set(info, New("channels").ToLocalChecked(), channels);
      Set(info, New("isOpaque").ToLocalChecked(), New<v8::Boolean>(baton->isOpaque));
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
  StatsBaton* baton;
  Nan::Callback *debuglog;
  std::vector<v8::Local<v8::Object>> buffersToPersist;
};

/*
  stats(options, callback)
*/
NAN_METHOD(stats) {
  using sharp::AttrTo;

  // Input Buffers must not undergo GC compaction during processing
  std::vector<v8::Local<v8::Object>> buffersToPersist;

  // V8 objects are converted to non-V8 types held in the baton struct
  StatsBaton *baton = new StatsBaton;
  v8::Local<v8::Object> options = info[0].As<v8::Object>();

  // Input
  baton->input = sharp::CreateInputDescriptor(sharp::AttrAs<v8::Object>(options, "input"), buffersToPersist);
  baton->accessMethod = AttrTo<bool>(options, "sequentialRead") ? VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;

  // Function to notify of libvips warnings
  Nan::Callback *debuglog = new Nan::Callback(sharp::AttrAs<v8::Function>(options, "debuglog"));

  // Join queue for worker thread
  Nan::Callback *callback = new Nan::Callback(info[1].As<v8::Function>());
  Nan::AsyncQueueWorker(new StatsWorker(callback, baton, debuglog, buffersToPersist));

  // Increment queued task counter
  g_atomic_int_inc(&sharp::counterQueue);
}
