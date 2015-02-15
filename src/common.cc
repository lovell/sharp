#include <string>
#include <string.h>
#include <vips/vips.h>

#include "common.h"

namespace sharp {

  // How many tasks are in the queue?
  volatile int counterQueue = 0;

  // How many tasks are being processed?
  volatile int counterProcess = 0;

  // Filename extension checkers
  static bool EndsWith(std::string const &str, std::string const &end) {
    return str.length() >= end.length() && 0 == str.compare(str.length() - end.length(), end.length(), end);
  }
  bool IsJpeg(std::string const &str) {
    return EndsWith(str, ".jpg") || EndsWith(str, ".jpeg") || EndsWith(str, ".JPG") || EndsWith(str, ".JPEG");
  }
  bool IsPng(std::string const &str) {
    return EndsWith(str, ".png") || EndsWith(str, ".PNG");
  }
  bool IsWebp(std::string const &str) {
    return EndsWith(str, ".webp") || EndsWith(str, ".WEBP");
  }
  bool IsTiff(std::string const &str) {
    return EndsWith(str, ".tif") || EndsWith(str, ".tiff") || EndsWith(str, ".TIF") || EndsWith(str, ".TIFF");
  }

  /*
    Determine image format of a buffer.
  */
  ImageType DetermineImageType(void *buffer, size_t const length) {
    ImageType imageType = ImageType::UNKNOWN;
#if (VIPS_MAJOR_VERSION >= 8)
    if (vips_foreign_is_a_buffer("jpegload_buffer", buffer, length)) {
      imageType = ImageType::JPEG;
    } else if (vips_foreign_is_a_buffer("pngload_buffer", buffer, length)) {
      imageType = ImageType::PNG;
    } else if (vips_foreign_is_a_buffer("webpload_buffer", buffer, length)) {
      imageType = ImageType::WEBP;
    } else if (vips_foreign_is_a_buffer("tiffload_buffer", buffer, length)) {
      imageType = ImageType::TIFF;
    } else if(vips_foreign_is_a_buffer("magickload_buffer", buffer, length)) {
      imageType = ImageType::MAGICK;
    }
#else
    const char* loader = vips_foreign_find_load_buffer(buffer, length);

    if (loader != NULL) {
      if (!strcmp(loader, "VipsForeignLoadJpegBuffer")) {
        imageType = ImageType::JPEG;
      } else if (!strcmp(loader, "VipsForeignLoadPngBuffer")) {
        imageType = ImageType::PNG;
      } else if (!strcmp(loader, "VipsForeignLoadWebpBuffer")) {
        imageType = ImageType::WEBP;
      } else if (!strcmp(loader, "VipsForeignLoadTiffBuffer")) {
        imageType = ImageType::TIFF;
      } else if (!strcmp(loader, "VipsForeignLoadMagickBuffer")) {
        imageType = ImageType::MAGICK;
      }
    }
#endif
    return imageType;
  }

  /*
    Initialise and return a VipsImage from a buffer. Supports JPEG, PNG, WebP and TIFF.
  */
  VipsImage* InitImage(ImageType imageType, void *buffer, size_t const length, VipsAccess const access) {
    VipsImage *image = NULL;
    if (imageType == ImageType::JPEG) {
      vips_jpegload_buffer(buffer, length, &image, "access", access, NULL);
    } else if (imageType == ImageType::PNG) {
      vips_pngload_buffer(buffer, length, &image, "access", access, NULL);
    } else if (imageType == ImageType::WEBP) {
      vips_webpload_buffer(buffer, length, &image, "access", access, NULL);
    } else if (imageType == ImageType::TIFF) {
      vips_tiffload_buffer(buffer, length, &image, "access", access, NULL);
#if (VIPS_MAJOR_VERSION >= 8)
    } else if (imageType == ImageType::MAGICK) {
      vips_magickload_buffer(buffer, length, &image, "access", access, NULL);
#endif
    }
    return image;
  }

  /*
    Inpect the first 2-4 bytes of a file to determine image format
  */
  ImageType DetermineImageType(char const *file) {
    ImageType imageType = ImageType::UNKNOWN;
    if (vips_foreign_is_a("jpegload", file)) {
      imageType = ImageType::JPEG;
    } else if (vips_foreign_is_a("pngload", file)) {
      imageType = ImageType::PNG;
    } else if (vips_foreign_is_a("webpload", file)) {
      imageType = ImageType::WEBP;
    } else if (vips_foreign_is_a("tiffload", file)) {
      imageType = ImageType::TIFF;
    } else if(vips_foreign_is_a("magickload", file)) {
      imageType = ImageType::MAGICK;
    }
    return imageType;
  }

  /*
    Initialise and return a VipsImage from a file.
  */
  VipsImage* InitImage(ImageType imageType, char const *file, VipsAccess const access) {
    VipsImage *image = NULL;
    if (imageType == ImageType::JPEG) {
      vips_jpegload(file, &image, "access", access, NULL);
    } else if (imageType == ImageType::PNG) {
      vips_pngload(file, &image, "access", access, NULL);
    } else if (imageType == ImageType::WEBP) {
      vips_webpload(file, &image, "access", access, NULL);
    } else if (imageType == ImageType::TIFF) {
      vips_tiffload(file, &image, "access", access, NULL);
    } else if (imageType == ImageType::MAGICK) {
      vips_magickload(file, &image, "access", access, NULL);
    }
    return image;
  }

  /*
    Does this image have an embedded profile?
  */
  bool HasProfile(VipsImage *image) {
    return (vips_image_get_typeof(image, VIPS_META_ICC_NAME) > 0) ? TRUE : FALSE;
  }

  /*
    Does this image have an alpha channel?
    Uses colour space interpretation with number of channels to guess this.
  */
  bool HasAlpha(VipsImage *image) {
    return (
      (image->Bands == 2 && image->Type == VIPS_INTERPRETATION_B_W) ||
      (image->Bands == 4 && image->Type != VIPS_INTERPRETATION_CMYK) ||
      (image->Bands == 5 && image->Type == VIPS_INTERPRETATION_CMYK)
    );
  }

  /*
    Get EXIF Orientation of image, if any.
  */
  int ExifOrientation(VipsImage const *image) {
    int orientation = 0;
    const char *exif;
    if (
      vips_image_get_typeof(image, "exif-ifd0-Orientation") != 0 &&
      !vips_image_get_string(image, "exif-ifd0-Orientation", &exif)
    ) {
      orientation = atoi(&exif[0]);
    }
    return orientation;
  }

  /*
    Returns the window size for the named interpolator. For example,
    a window size of 3 means a 3x3 pixel grid is used for the calculation.
  */
  int InterpolatorWindowSize(char const *name) {
    VipsInterpolate *interpolator = vips_interpolate_new(name);
    int window_size = vips_interpolate_get_window_size(interpolator);
    g_object_unref(interpolator);
    return window_size;
  }

} // namespace sharp
