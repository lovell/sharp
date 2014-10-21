#ifndef SHARP_COMMON_H
#define SHARP_COMMON_H

typedef enum {
  UNKNOWN,
  JPEG,
  PNG,
  WEBP,
  TIFF,
  MAGICK
} ImageType;

// Filename extension checkers
bool is_jpeg(std::string const &str);
bool is_png(std::string const &str);
bool is_webp(std::string const &str);
bool is_tiff(std::string const &str);

// How many tasks are in the queue?
extern volatile int counter_queue;

// How many tasks are being processed?
extern volatile int counter_process;

/*
  Initialise a VipsImage from a buffer. Supports JPEG, PNG and WebP.
  Returns the ImageType detected, if any.
*/
ImageType
sharp_init_image_from_buffer(VipsImage **image, void *buffer, size_t const length, VipsAccess const access);

/*
  Initialise a VipsImage from a file.
  Returns the ImageType detected, if any.
*/
ImageType
sharp_init_image_from_file(VipsImage **image, char const *file, VipsAccess const access);

/*
  Does this image have an alpha channel?
  Uses colour space interpretation with number of channels to guess this.
*/
bool
sharp_image_has_alpha(VipsImage *image);

#endif
