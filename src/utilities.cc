#include <cmath>
#include <node.h>
#include <vips/vips.h>
#include <vips/vector.h>

#include "nan.h"

#include "common.h"
#include "operations.h"
#include "utilities.h"

using v8::Boolean;
using v8::Integer;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;

using Nan::HandleScope;
using Nan::New;
using Nan::Set;
using Nan::ThrowError;
using Nan::To;
using Nan::Utf8String;

/*
  Get and set cache memory and item limits
*/
NAN_METHOD(cache) {
  HandleScope();

  // Set cache memory limit
  if (info[0]->IsInt32()) {
    vips_cache_set_max_mem(To<int32_t>(info[0]).FromJust() * 1048576);
  }

  // Set cache items limit
  if (info[1]->IsInt32()) {
    vips_cache_set_max(To<int32_t>(info[1]).FromJust());
  }

  // Get cache statistics
  Local<Object> cache = New<Object>();
  Set(cache, New("current").ToLocalChecked(),
    New<Integer>(static_cast<int>(round(vips_tracked_get_mem() / 1048576)))
  );
  Set(cache, New("high").ToLocalChecked(),
    New<Integer>(static_cast<int>(round(vips_tracked_get_mem_highwater() / 1048576)))
  );
  Set(cache, New("memory").ToLocalChecked(),
    New<Integer>(static_cast<int>(round(vips_cache_get_max_mem() / 1048576)))
  );
  Set(cache, New("items").ToLocalChecked(), New<Integer>(vips_cache_get_max()));
  info.GetReturnValue().Set(cache);
}

/*
  Get and set size of thread pool
*/
NAN_METHOD(concurrency) {
  HandleScope();

  // Set concurrency
  if (info[0]->IsInt32()) {
    vips_concurrency_set(To<int32_t>(info[0]).FromJust());
  }
  // Get concurrency
  info.GetReturnValue().Set(New<Integer>(vips_concurrency_get()));
}

/*
  Get internal counters (queued tasks, processing tasks)
*/
NAN_METHOD(counters) {
  using sharp::counterProcess;
  using sharp::counterQueue;

  HandleScope();
  Local<Object> counters = New<Object>();
  Set(counters, New("queue").ToLocalChecked(), New<Integer>(counterQueue));
  Set(counters, New("process").ToLocalChecked(), New<Integer>(counterProcess));
  info.GetReturnValue().Set(counters);
}

/*
  Get and set use of SIMD vector unit instructions
*/
NAN_METHOD(simd) {
  HandleScope();

  // Set state
  if (info[0]->IsBoolean()) {
    vips_vector_set_enabled(To<bool>(info[0]).FromJust());
  }
  // Get state
  info.GetReturnValue().Set(New<Boolean>(vips_vector_isenabled()));
}

/*
  Get libvips version
*/
NAN_METHOD(libvipsVersion) {
  HandleScope();
  char version[9];
  g_snprintf(version, sizeof(version), "%d.%d.%d", vips_version(0), vips_version(1), vips_version(2));
  info.GetReturnValue().Set(New(version).ToLocalChecked());
}

/*
  Get available input/output file/buffer/stream formats
*/
NAN_METHOD(format) {
  HandleScope();

  // Attribute names
  Local<String> attrId = New("id").ToLocalChecked();
  Local<String> attrInput = New("input").ToLocalChecked();
  Local<String> attrOutput = New("output").ToLocalChecked();
  Local<String> attrFile = New("file").ToLocalChecked();
  Local<String> attrBuffer = New("buffer").ToLocalChecked();
  Local<String> attrStream = New("stream").ToLocalChecked();

  // Which load/save operations are available for each compressed format?
  Local<Object> format = New<Object>();
  for (std::string f : {"jpeg", "png", "webp", "tiff", "magick", "openslide", "dz"}) {
    // Input
    Local<Boolean> hasInputFile =
      New<Boolean>(vips_type_find("VipsOperation", (f + "load").c_str()));
    Local<Boolean> hasInputBuffer =
      New<Boolean>(vips_type_find("VipsOperation", (f + "load_buffer").c_str()));
    Local<Object> input = New<Object>();
    Set(input, attrFile, hasInputFile);
    Set(input, attrBuffer, hasInputBuffer);
    Set(input, attrStream, hasInputBuffer);
    // Output
    Local<Boolean> hasOutputFile =
      New<Boolean>(vips_type_find("VipsOperation", (f + "save").c_str()));
    Local<Boolean> hasOutputBuffer =
      New<Boolean>(vips_type_find("VipsOperation", (f + "save_buffer").c_str()));
    Local<Object> output = New<Object>();
    Set(output, attrFile, hasOutputFile);
    Set(output, attrBuffer, hasOutputBuffer);
    Set(output, attrStream, hasOutputBuffer);
    // Other attributes
    Local<Object> container = New<Object>();
    Local<String> formatId = New(f).ToLocalChecked();
    Set(container, attrId, formatId);
    Set(container, attrInput, input);
    Set(container, attrOutput, output);
    // Add to set of formats
    Set(format, formatId, container);
  }

  // Raw, uncompressed data
  Local<Object> raw = New<Object>();
  Local<String> rawId = New("raw").ToLocalChecked();
  Set(raw, attrId, rawId);
  Set(format, rawId, raw);
  // No support for raw input yet, so always false
  Local<Boolean> unsupported = New<Boolean>(false);
  Local<Object> rawInput = New<Object>();
  Set(rawInput, attrFile, unsupported);
  Set(rawInput, attrBuffer, unsupported);
  Set(rawInput, attrStream, unsupported);
  Set(raw, attrInput, rawInput);
  // Raw output via Buffer/Stream is available in libvips >= 7.42.0
  Local<Boolean> hasOutputBufferRaw = New<Boolean>(vips_version(0) >= 8 || (vips_version(0) == 7 && vips_version(1) >= 42));
  Local<Object> rawOutput = New<Object>();
  Set(rawOutput, attrFile, unsupported);
  Set(rawOutput, attrBuffer, hasOutputBufferRaw);
  Set(rawOutput, attrStream, hasOutputBufferRaw);
  Set(raw, attrOutput, rawOutput);

  info.GetReturnValue().Set(format);
}

/*
  Synchronous, internal-only method used by some of the functional tests.
  Calculates the maximum colour distance using the DE2000 algorithm
  between two images of the same dimensions and number of channels.
*/
NAN_METHOD(_maxColourDistance) {
  using sharp::DetermineImageType;
  using sharp::ImageType;
  using sharp::InitImage;
  using sharp::HasAlpha;

  HandleScope();

  // Create "hook" VipsObject to hang image references from
  VipsObject *hook = reinterpret_cast<VipsObject*>(vips_image_new());

  // Open input files
  VipsImage *image1 = nullptr;
  ImageType imageType1 = DetermineImageType(*Utf8String(info[0]));
  if (imageType1 != ImageType::UNKNOWN) {
    image1 = InitImage(*Utf8String(info[0]), VIPS_ACCESS_SEQUENTIAL);
    if (image1 == nullptr) {
      g_object_unref(hook);
      return ThrowError("Input file 1 has corrupt header");
    } else {
      vips_object_local(hook, image1);
    }
  } else {
    g_object_unref(hook);
    return ThrowError("Input file 1 is of an unsupported image format");
  }
  VipsImage *image2 = nullptr;
  ImageType imageType2 = DetermineImageType(*Utf8String(info[1]));
  if (imageType2 != ImageType::UNKNOWN) {
    image2 = InitImage(*Utf8String(info[1]), VIPS_ACCESS_SEQUENTIAL);
    if (image2 == nullptr) {
      g_object_unref(hook);
      return ThrowError("Input file 2 has corrupt header");
    } else {
      vips_object_local(hook, image2);
    }
  } else {
    g_object_unref(hook);
    return ThrowError("Input file 2 is of an unsupported image format");
  }

  // Ensure same number of channels
  if (image1->Bands != image2->Bands) {
    g_object_unref(hook);
    return ThrowError("mismatchedBands");
  }
  // Ensure same dimensions
  if (image1->Xsize != image2->Xsize || image1->Ysize != image2->Ysize) {
    g_object_unref(hook);
    return ThrowError("mismatchedDimensions");
  }

  // Premultiply and remove alpha
  if (HasAlpha(image1)) {
    VipsImage *imagePremultiplied1;
    if (vips_premultiply(image1, &imagePremultiplied1, nullptr)) {
      g_object_unref(hook);
      return ThrowError(vips_error_buffer());
    }
    vips_object_local(hook, imagePremultiplied1);
    VipsImage *imagePremultipliedNoAlpha1;
    if (vips_extract_band(image1, &imagePremultipliedNoAlpha1, 1, "n", image1->Bands - 1, nullptr)) {
      g_object_unref(hook);
      return ThrowError(vips_error_buffer());
    }
    vips_object_local(hook, imagePremultipliedNoAlpha1);
    image1 = imagePremultipliedNoAlpha1;
  }
  if (HasAlpha(image2)) {
    VipsImage *imagePremultiplied2;
    if (vips_premultiply(image2, &imagePremultiplied2, nullptr)) {
      g_object_unref(hook);
      return ThrowError(vips_error_buffer());
    }
    vips_object_local(hook, imagePremultiplied2);
    VipsImage *imagePremultipliedNoAlpha2;
    if (vips_extract_band(image2, &imagePremultipliedNoAlpha2, 1, "n", image2->Bands - 1, nullptr)) {
      g_object_unref(hook);
      return ThrowError(vips_error_buffer());
    }
    vips_object_local(hook, imagePremultipliedNoAlpha2);
    image2 = imagePremultipliedNoAlpha2;
  }
  // Calculate colour distance
  VipsImage *difference;
  if (vips_dE00(image1, image2, &difference, nullptr)) {
    g_object_unref(hook);
    return ThrowError(vips_error_buffer());
  }
  vips_object_local(hook, difference);
  // Extract maximum distance
  double maxColourDistance;
  if (vips_max(difference, &maxColourDistance, nullptr)) {
    g_object_unref(hook);
    return ThrowError(vips_error_buffer());
  }
  g_object_unref(hook);
  info.GetReturnValue().Set(New<Number>(maxColourDistance));
}
