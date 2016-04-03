#ifndef SRC_UTILITIES_H_
#define SRC_UTILITIES_H_

#include "nan.h"

NAN_METHOD(cache);
NAN_METHOD(concurrency);
NAN_METHOD(counters);
NAN_METHOD(simd);
NAN_METHOD(libvipsVersion);
NAN_METHOD(format);
NAN_METHOD(_maxColourDistance);

#endif  // SRC_UTILITIES_H_
