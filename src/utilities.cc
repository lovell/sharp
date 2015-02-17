#include <node.h>
#include <vips/vips.h>
#ifdef HAVE_OPENSLIDE_3_4
#include <openslide.h>
#endif

#include "nan.h"

#include "common.h"
#include "utilities.h"

using namespace v8;
using namespace sharp;

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
  snprintf(version, 9, "%d.%d.%d", vips_version(0), vips_version(1), vips_version(2));
  NanReturnValue(NanNew<String>(version));
}

/*
  Is openslide present?
*/
NAN_METHOD(hasOpenslide) {
  NanScope();
  bool hasOpenslide = false;
#ifdef HAVE_OPENSLIDE_3_4
  hasOpenslide = true;
#endif
  NanReturnValue(NanNew<Boolean>(hasOpenslide));
}

#ifdef HAVE_OPENSLIDE_3_4
/*
  Get openslide version
*/
NAN_METHOD(libopenslideVersion) {
  NanScope();
  char version[9];
  //version = openslide_get_version();
  snprintf(version, 9, "%s", openslide_get_version());
  NanReturnValue(NanNew<String>(version));
}
#endif
