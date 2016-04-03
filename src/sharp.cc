#include <node.h>
#include <vips/vips8>

#include "nan.h"

#include "common.h"
#include "metadata.h"
#include "pipeline.h"
#include "utilities.h"

NAN_MODULE_INIT(init) {
  vips_init("sharp");

  // Methods available to JavaScript
  Nan::Set(target, Nan::New("metadata").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(metadata)).ToLocalChecked());
  Nan::Set(target, Nan::New("pipeline").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(pipeline)).ToLocalChecked());
  Nan::Set(target, Nan::New("cache").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(cache)).ToLocalChecked());
  Nan::Set(target, Nan::New("concurrency").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(concurrency)).ToLocalChecked());
  Nan::Set(target, Nan::New("counters").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(counters)).ToLocalChecked());
  Nan::Set(target, Nan::New("simd").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(simd)).ToLocalChecked());
  Nan::Set(target, Nan::New("libvipsVersion").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(libvipsVersion)).ToLocalChecked());
  Nan::Set(target, Nan::New("format").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(format)).ToLocalChecked());
  Nan::Set(target, Nan::New("_maxColourDistance").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(_maxColourDistance)).ToLocalChecked());
}

NODE_MODULE(sharp, init)
