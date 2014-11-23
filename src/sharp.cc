#include <node.h>
#include <vips/vips.h>

#include "nan.h"

#include "common.h"
#include "metadata.h"
#include "resize.h"
#include "utilities.h"

using namespace v8;

static void at_exit(void* arg) {
  NanScope();
  vips_shutdown();
}

extern "C" void init(Handle<Object> target) {
  NanScope();
  vips_init("sharp");
  node::AtExit(at_exit);

  // Set libvips operation cache limits
  vips_cache_set_max_mem(100 * 1048576); // 100 MB
  vips_cache_set_max(500); // 500 operations

  // Notify the V8 garbage collector of max cache size
  NanAdjustExternalMemory(vips_cache_get_max_mem());

  // Methods available to JavaScript
  NODE_SET_METHOD(target, "metadata", metadata);
  NODE_SET_METHOD(target, "resize", resize);
  NODE_SET_METHOD(target, "cache", cache);
  NODE_SET_METHOD(target, "concurrency", concurrency);
  NODE_SET_METHOD(target, "counters", counters);
  NODE_SET_METHOD(target, "libvipsVersion", libvipsVersion);
}

NODE_MODULE(sharp, init)
