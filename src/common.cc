#include <cstdlib>
#include <string>
#include <string.h>
#include <vips/vips.h>

#include "common.h"

// Verify platform and compiler compatibility

#if (VIPS_MAJOR_VERSION < 7 || (VIPS_MAJOR_VERSION == 7 && VIPS_MINOR_VERSION < 40))
#error libvips version 7.40.0+ required - see http://sharp.dimens.io/page/install
#endif

#ifdef _WIN64
#error Windows 64-bit is currently unsupported - see http://sharp.dimens.io/page/install#windows
#endif

#if ((!defined(__clang__)) && defined(__GNUC__) && (__GNUC__ < 4 || (__GNUC__ == 4 && __GNUC_MINOR__ < 6)))
#error GCC version 4.6+ is required for C++11 features - see http://sharp.dimens.io/page/install#prerequisites
#endif

#if (defined(__clang__) && defined(__has_feature))
#if (!__has_feature(cxx_range_for))
#error clang version 3.0+ is required for C++11 features - see http://sharp.dimens.io/page/install#prerequisites
#endif
#endif

#define EXIF_IFD0_ORIENTATION "exif-ifd0-Orientation"

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
  bool IsDz(std::string const &str) {
    return EndsWith(str, ".dzi") || EndsWith(str, ".DZI");
  }

  /*
    Determine image format of a buffer.
  */
  ImageType DetermineImageType(void *buffer, size_t const length) {
    ImageType imageType = ImageType::UNKNOWN;
    char const *load = vips_foreign_find_load_buffer(buffer, length);
    if (load != NULL) {
      std::string loader = load;
      if (EndsWith(loader, "JpegBuffer")) {
        imageType = ImageType::JPEG;
      } else if (EndsWith(loader, "PngBuffer")) {
        imageType = ImageType::PNG;
      } else if (EndsWith(loader, "WebpBuffer")) {
        imageType = ImageType::WEBP;
      } else if (EndsWith(loader, "TiffBuffer")) {
        imageType = ImageType::TIFF;
      } else if (EndsWith(loader, "MagickBuffer")) {
        imageType = ImageType::MAGICK;
      }
    }
    return imageType;
  }

  /*
    Initialise and return a VipsImage from a buffer. Supports JPEG, PNG, WebP and TIFF.
  */
  VipsImage* InitImage(void *buffer, size_t const length, VipsAccess const access) {
    return vips_image_new_from_buffer(buffer, length, NULL, "access", access, NULL);
  }

  /*
    Determine image format, reads the first few bytes of the file
  */
  ImageType DetermineImageType(char const *file) {
    ImageType imageType = ImageType::UNKNOWN;
    char const *load = vips_foreign_find_load(file);
    if (load != NULL) {
      std::string loader = load;
      if (EndsWith(loader, "JpegFile")) {
        imageType = ImageType::JPEG;
      } else if (EndsWith(loader, "Png")) {
        imageType = ImageType::PNG;
      } else if (EndsWith(loader, "WebpFile")) {
        imageType = ImageType::WEBP;
      } else if (EndsWith(loader, "Openslide")) {
        imageType = ImageType::OPENSLIDE;
      } else if (EndsWith(loader, "TiffFile")) {
        imageType = ImageType::TIFF;
      } else if (EndsWith(loader, "Magick") || EndsWith(loader, "MagickFile")) {
        imageType = ImageType::MAGICK;
      }
    }
    return imageType;
  }

  /*
    Initialise and return a VipsImage from a file.
  */
  VipsImage* InitImage(char const *file, VipsAccess const access) {
    return vips_image_new_from_file(file, "access", access, NULL);
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
      vips_image_get_typeof(image, EXIF_IFD0_ORIENTATION) != 0 &&
      !vips_image_get_string(image, EXIF_IFD0_ORIENTATION, &exif)
    ) {
      orientation = atoi(&exif[0]);
    }
    return orientation;
  }

  /*
    Set EXIF Orientation of image.
  */
  void SetExifOrientation(VipsImage *image, int const orientation) {
    char exif[3];
    g_snprintf(exif, sizeof(exif), "%d", orientation);
    vips_image_set_string(image, EXIF_IFD0_ORIENTATION, exif);
  }

  /*
    Remove EXIF Orientation from image.
  */
  void RemoveExifOrientation(VipsImage *image) {
    SetExifOrientation(image, 0);
  }

  /*
    Returns the window size for the named interpolator. For example,
    a window size of 3 means a 3x3 pixel grid is used for the calculation.
  */
  int InterpolatorWindowSize(char const *name) {
    VipsInterpolate *interpolator = vips_interpolate_new(name);
    if (interpolator == NULL) {
      return -1;
    }
    int window_size = vips_interpolate_get_window_size(interpolator);
    g_object_unref(interpolator);
    return window_size;
  }

} // namespace sharp
