#ifndef SRC_METADATA_H_
#define SRC_METADATA_H_

#include "nan.h"
#include "common.h"

struct MetadataBaton {
  // Input
  sharp::InputDescriptor *input;
  // Output
  std::string format;
  int width;
  int height;
  std::string space;
  int channels;
  int density;
  bool hasProfile;
  bool hasAlpha;
  int orientation;
  char *exif;
  size_t exifLength;
  char *icc;
  size_t iccLength;
  std::string err;

  MetadataBaton():
    input(nullptr),
    width(0),
    height(0),
    channels(0),
    density(0),
    hasProfile(false),
    hasAlpha(false),
    orientation(0),
    exif(nullptr),
    exifLength(0),
    icc(nullptr),
    iccLength(0) {}
};

NAN_METHOD(metadata);

#endif  // SRC_METADATA_H_
