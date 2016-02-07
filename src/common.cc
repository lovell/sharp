#include <cstdlib>
#include <string>
#include <string.h>
#include <vips/vips8>

#include "common.h"

// Verify platform and compiler compatibility

#if (VIPS_MAJOR_VERSION < 8 || (VIPS_MAJOR_VERSION == 8 && VIPS_MINOR_VERSION < 2))
#error libvips version 8.2.0+ required - see http://sharp.dimens.io/page/install
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

using vips::VImage;

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
    Provide a string identifier for the given image type.
  */
  std::string ImageTypeId(ImageType const imageType) {
    std::string id;
    switch (imageType) {
      case ImageType::JPEG: id = "jpeg"; break;
      case ImageType::PNG: id = "png"; break;
      case ImageType::WEBP: id = "webp"; break;
      case ImageType::TIFF: id = "tiff"; break;
      case ImageType::MAGICK: id = "magick"; break;
      case ImageType::OPENSLIDE: id = "openslide"; break;
      case ImageType::PPM: id = "ppm"; break;
      case ImageType::FITS: id = "fits"; break;
      case ImageType::RAW: id = "raw"; break;
      case ImageType::UNKNOWN: id = "unknown"; break;
    }
    return id;
  }

  /*
    Determine image format of a buffer.
  */
  ImageType DetermineImageType(void *buffer, size_t const length) {
    ImageType imageType = ImageType::UNKNOWN;
    char const *load = vips_foreign_find_load_buffer(buffer, length);
    if (load != NULL) {
      std::string const loader = load;
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
    Determine image format, reads the first few bytes of the file
  */
  ImageType DetermineImageType(char const *file) {
    ImageType imageType = ImageType::UNKNOWN;
    char const *load = vips_foreign_find_load(file);
    if (load != nullptr) {
      std::string const loader = load;
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
      } else if (EndsWith(loader, "Ppm")) {
        imageType = ImageType::PPM;
      } else if (EndsWith(loader, "Fits")) {
        imageType = ImageType::FITS;
      } else if (EndsWith(loader, "Magick") || EndsWith(loader, "MagickFile")) {
        imageType = ImageType::MAGICK;
      }
    }
    return imageType;
  }

  /*
    Does this image have an embedded profile?
  */
  bool HasProfile(VImage image) {
    return (image.get_typeof(VIPS_META_ICC_NAME) != 0) ? TRUE : FALSE;
  }

  /*
    Does this image have an alpha channel?
    Uses colour space interpretation with number of channels to guess this.
  */
  bool HasAlpha(VImage image) {
    int const bands = image.bands();
    VipsInterpretation const interpretation = image.interpretation();
    return (
      (bands == 2 && interpretation == VIPS_INTERPRETATION_B_W) ||
      (bands == 4 && interpretation != VIPS_INTERPRETATION_CMYK) ||
      (bands == 5 && interpretation == VIPS_INTERPRETATION_CMYK)
    );
  }

  /*
    Get EXIF Orientation of image, if any.
  */
  int ExifOrientation(VImage image) {
    int orientation = 0;
    if (image.get_typeof(EXIF_IFD0_ORIENTATION) != 0) {
      char const *exif = image.get_string(EXIF_IFD0_ORIENTATION);
      if (exif != nullptr) {
        orientation = atoi(&exif[0]);
      }
    }
    return orientation;
  }

  /*
    Set EXIF Orientation of image.
  */
  void SetExifOrientation(VImage image, int const orientation) {
    char exif[3];
    g_snprintf(exif, sizeof(exif), "%d", orientation);
    image.set(EXIF_IFD0_ORIENTATION, exif);
  }

  /*
    Remove EXIF Orientation from image.
  */
  void RemoveExifOrientation(VImage image) {
    SetExifOrientation(image, 0);
  }

  /*
    Called when a Buffer undergoes GC, required to support mixed runtime libraries in Windows
  */
  void FreeCallback(char* data, void* hint) {
    if (data != nullptr) {
      g_free(data);
    }
  }

} // namespace sharp
