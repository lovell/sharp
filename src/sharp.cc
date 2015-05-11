#include <node.h>
#include <vips/vips.h>

#include "nan.h"

#include "common.h"
#include "metadata.h"
#include "resize.h"
#include "utilities.h"

extern "C" void init(v8::Handle<v8::Object> target) {
  NanScope();
  vips_init("sharp");

  // Set libvips operation cache limits
  vips_cache_set_max_mem(100 * 1024 * 1024); // 100 MB
  vips_cache_set_max(500); // 500 operations

  // Methods available to JavaScript
  NODE_SET_METHOD(target, "metadata", metadata);
  NODE_SET_METHOD(target, "resize", resize);
  NODE_SET_METHOD(target, "cache", cache);
  NODE_SET_METHOD(target, "concurrency", concurrency);
  NODE_SET_METHOD(target, "counters", counters);
  NODE_SET_METHOD(target, "libvipsVersion", libvipsVersion);
  NODE_SET_METHOD(target, "format", format);
}

NODE_MODULE(sharp, init)
