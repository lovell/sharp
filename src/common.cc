#include <string>
#include <string.h>
#include <vips/vips.h>

#include "common.h"

// How many tasks are in the queue?
volatile int counter_queue = 0;

// How many tasks are being processed?
volatile int counter_process = 0;

// Filename extension checkers
static bool ends_with(std::string const &str, std::string const &end) {
  return str.length() >= end.length() && 0 == str.compare(str.length() - end.length(), end.length(), end);
}
bool is_jpeg(std::string const &str) {
  return ends_with(str, ".jpg") || ends_with(str, ".jpeg") || ends_with(str, ".JPG") || ends_with(str, ".JPEG");
}
bool is_png(std::string const &str) {
  return ends_with(str, ".png") || ends_with(str, ".PNG");
}
bool is_webp(std::string const &str) {
  return ends_with(str, ".webp") || ends_with(str, ".WEBP");
}
bool is_tiff(std::string const &str) {
  return ends_with(str, ".tif") || ends_with(str, ".tiff") || ends_with(str, ".TIF") || ends_with(str, ".TIFF");
}

unsigned char const MARKER_JPEG[] = {0xff, 0xd8};
unsigned char const MARKER_PNG[] = {0x89, 0x50};
unsigned char const MARKER_WEBP[] = {0x52, 0x49};

/*
  Initialise a VipsImage from a buffer. Supports JPEG, PNG and WebP.
  Returns the ImageType detected, if any.
*/
ImageType
sharp_init_image_from_buffer(VipsImage **image, void *buffer, size_t const length, VipsAccess const access) {
  ImageType imageType = UNKNOWN;
  if (memcmp(MARKER_JPEG, buffer, 2) == 0) {
    if (!vips_jpegload_buffer(buffer, length, image, "access", access, NULL)) {
      imageType = JPEG;
    }
  } else if(memcmp(MARKER_PNG, buffer, 2) == 0) {
    if (!vips_pngload_buffer(buffer, length, image, "access", access, NULL)) {
      imageType = PNG;
    }
  } else if(memcmp(MARKER_WEBP, buffer, 2) == 0) {
    if (!vips_webpload_buffer(buffer, length, image, "access", access, NULL)) {
      imageType = WEBP;
    }
  }
  return imageType;
}

/*
  Initialise a VipsImage from a file.
  Returns the ImageType detected, if any.
*/
ImageType
sharp_init_image_from_file(VipsImage **image, char const *file, VipsAccess const access) {
  ImageType imageType = UNKNOWN;
  if (vips_foreign_is_a("jpegload", file)) {
    if (!vips_jpegload(file, image, "access", access, NULL)) {
      imageType = JPEG;
    }
  } else if (vips_foreign_is_a("pngload", file)) {
    if (!vips_pngload(file, image, "access", access, NULL)) {
      imageType = PNG;
    }
  } else if (vips_foreign_is_a("webpload", file)) {
    if (!vips_webpload(file, image, "access", access, NULL)) {
      imageType = WEBP;
    }
  } else if (vips_foreign_is_a("tiffload", file)) {
    if (!vips_tiffload(file, image, "access", access, NULL)) {
      imageType = TIFF;
    }
  } else if(vips_foreign_is_a("magickload", file)) {
    if (!vips_magickload(file, image, "access", access, NULL)) {
      imageType = MAGICK;
    }
  }
  return imageType;
}

/*
  Does this image have an alpha channel?
  Uses colour space interpretation with number of channels to guess this.
*/
bool
sharp_image_has_alpha(VipsImage *image) {
  return (
    (image->Bands == 2 && image->Type == VIPS_INTERPRETATION_B_W) ||
    (image->Bands == 4 && image->Type != VIPS_INTERPRETATION_CMYK) ||
    (image->Bands == 5 && image->Type == VIPS_INTERPRETATION_CMYK)
  );
}
