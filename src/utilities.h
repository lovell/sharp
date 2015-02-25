#ifndef SHARP_UTILITIES_H
#define SHARP_UTILITIES_H

#include "nan.h"

NAN_METHOD(cache);
NAN_METHOD(concurrency);
NAN_METHOD(counters);
NAN_METHOD(libvipsVersion);
NAN_METHOD(hasOpenslide);
#ifdef HAS_OPENSLIDE
NAN_METHOD(libopenslideVersion);
#endif

#endif
