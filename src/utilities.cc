#include <node.h>
#include <vips/vips.h>

#include "nan.h"

#include "common.h"
#include "utilities.h"

using v8::Local;
using v8::Object;
using v8::Number;
using v8::String;
using v8::Boolean;

using sharp::counterQueue;
using sharp::counterProcess;

/*
  Get and set cache memory and item limits
*/
NAN_METHOD(cache) {
  NanScope();

  // Set cache memory limit
  if (args[0]->IsInt32()) {
    int newMax = args[0]->Int32Value() * 1048576;
    int oldMax = vips_cache_get_max_mem();
    vips_cache_set_max_mem(newMax);

    // Notify the V8 garbage collector of delta in max cache size
    NanAdjustExternalMemory(newMax - oldMax);
  }

  // Set cache items limit
  if (args[1]->IsInt32()) {
    vips_cache_set_max(args[1]->Int32Value());
  }

  // Get cache statistics
  Local<Object> cache = NanNew<Object>();
  cache->Set(NanNew<String>("current"), NanNew<Number>(vips_tracked_get_mem() / 1048576));
  cache->Set(NanNew<String>("high"), NanNew<Number>(vips_tracked_get_mem_highwater() / 1048576));
  cache->Set(NanNew<String>("memory"), NanNew<Number>(vips_cache_get_max_mem() / 1048576));
  cache->Set(NanNew<String>("items"), NanNew<Number>(vips_cache_get_max()));
  NanReturnValue(cache);
}

/*
  Get and set size of thread pool
*/
NAN_METHOD(concurrency) {
  NanScope();

  // Set concurrency
  if (args[0]->IsInt32()) {
    vips_concurrency_set(args[0]->Int32Value());
  }
  // Get concurrency
  NanReturnValue(NanNew<Number>(vips_concurrency_get()));
}

/*
  Get internal counters (queued tasks, processing tasks)
*/
NAN_METHOD(counters) {
  NanScope();
  Local<Object> counters = NanNew<Object>();
  counters->Set(NanNew<String>("queue"), NanNew<Number>(counterQueue));
  counters->Set(NanNew<String>("process"), NanNew<Number>(counterProcess));
  NanReturnValue(counters);
}

/*
  Get libvips version
*/
NAN_METHOD(libvipsVersion) {
  NanScope();
  char version[9];
  snprintf(version, sizeof(version), "%d.%d.%d", vips_version(0), vips_version(1), vips_version(2));
  NanReturnValue(NanNew<String>(version));
}

/*
  Get available input/output file/buffer/stream formats
*/
NAN_METHOD(format) {
  NanScope();

  // Attribute names
  Local<String> attrId =  NanNew<String>("id");
  Local<String> attrInput =  NanNew<String>("input");
  Local<String> attrOutput =  NanNew<String>("output");
  Local<String> attrFile =  NanNew<String>("file");
  Local<String> attrBuffer =  NanNew<String>("buffer");
  Local<String> attrStream =  NanNew<String>("stream");

  // Which load/save operations are available for each compressed format?
  Local<Object> format = NanNew<Object>();
  for (std::string f : {"jpeg", "png", "webp", "tiff", "magick", "openslide", "dz"}) {
    // Input
    Local<Object> input = NanNew<Object>();
    input->Set(attrFile, NanNew<Boolean>(
      vips_type_find("VipsOperation", (f + "load").c_str())));
    input->Set(attrBuffer, NanNew<Boolean>(
      vips_type_find("VipsOperation", (f + "load_buffer").c_str())));
    input->Set(attrStream, input->Get(attrBuffer));
    // Output
    Local<Object> output = NanNew<Object>();
    output->Set(attrFile, NanNew<Boolean>(
      vips_type_find("VipsOperation", (f + "save").c_str())));
    output->Set(attrBuffer, NanNew<Boolean>(
      vips_type_find("VipsOperation", (f + "save_buffer").c_str())));
    output->Set(attrStream, output->Get(attrBuffer));
    // Other attributes
    Local<Object> container = NanNew<Object>();
    Local<String> formatId = NanNew<String>(f);
    container->Set(attrId, formatId);
    container->Set(attrInput, input);
    container->Set(attrOutput, output);
    // Add to set of formats
    format->Set(formatId, container);
  }

  // Raw, uncompressed data
  Local<Object> raw = NanNew<Object>();
  raw->Set(attrId, NanNew<String>("raw"));
  format->Set(NanNew<String>("raw"), raw);
  // No support for raw input yet, so always false
  Local<Boolean> unsupported = NanNew<Boolean>(false);
  Local<Object> rawInput = NanNew<Object>();
  rawInput->Set(attrFile, unsupported);
  rawInput->Set(attrBuffer, unsupported);
  rawInput->Set(attrStream, unsupported);
  raw->Set(attrInput, rawInput);
  // Raw output via Buffer/Stream is available in libvips >= 7.42.0
  Local<Boolean> supportsRawOutput = NanNew<Boolean>(vips_version(0) >= 8 || (vips_version(0) == 7 && vips_version(1) >= 42));
  Local<Object> rawOutput = NanNew<Object>();
  rawOutput->Set(attrFile, unsupported);
  rawOutput->Set(attrBuffer, supportsRawOutput);
  rawOutput->Set(attrStream, supportsRawOutput);
  raw->Set(attrOutput, rawOutput);

  NanReturnValue(format);
}
