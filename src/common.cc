#include <cstdlib>
#include <string>
#include <string.h>
#include <vips/vips8>

#include "common.h"

// Verify platform and compiler compatibility

#if (VIPS_MAJOR_VERSION < 8 || (VIPS_MAJOR_VERSION == 8 && VIPS_MINOR_VERSION < 2))
#error libvips version 8.2.0+ required - see sharp.dimens.io/page/install
#endif

#if ((!defined(__clang__)) && defined(__GNUC__) && (__GNUC__ < 4 || (__GNUC__ == 4 && __GNUC_MINOR__ < 6)))
#error GCC version 4.6+ is required for C++11 features - see sharp.dimens.io/page/install#prerequisites
#endif

#if (defined(__clang__) && defined(__has_feature))
#if (!__has_feature(cxx_range_for))
#error clang version 3.0+ is required for C++11 features - see sharp.dimens.io/page/install#prerequisites
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
  bool IsDzZip(std::string const &str) {
    return EndsWith(str, ".zip") || EndsWith(str, ".ZIP") || EndsWith(str, ".szi") || EndsWith(str, ".SZI");
  }
  bool IsV(std::string const &str) {
    return EndsWith(str, ".v") || EndsWith(str, ".V") || EndsWith(str, ".vips") || EndsWith(str, ".VIPS");
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
      case ImageType::GIF: id = "gif"; break;
      case ImageType::SVG: id = "svg"; break;
      case ImageType::PDF: id = "pdf"; break;
      case ImageType::MAGICK: id = "magick"; break;
      case ImageType::OPENSLIDE: id = "openslide"; break;
      case ImageType::PPM: id = "ppm"; break;
      case ImageType::FITS: id = "fits"; break;
      case ImageType::VIPS: id = "v"; break;
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
      } else if (EndsWith(loader, "GifBuffer")) {
        imageType = ImageType::GIF;
      } else if (EndsWith(loader, "SvgBuffer")) {
        imageType = ImageType::SVG;
      } else if (EndsWith(loader, "PdfBuffer")) {
        imageType = ImageType::PDF;
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
      } else if (EndsWith(loader, "GifFile")) {
        imageType = ImageType::GIF;
      } else if (EndsWith(loader, "SvgFile")) {
        imageType = ImageType::SVG;
      } else if (EndsWith(loader, "PdfFile")) {
        imageType = ImageType::PDF;
      } else if (EndsWith(loader, "Ppm")) {
        imageType = ImageType::PPM;
      } else if (EndsWith(loader, "Fits")) {
        imageType = ImageType::FITS;
      } else if (EndsWith(loader, "Vips")) {
        imageType = ImageType::VIPS;
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
    Does this image have a non-default density?
  */
  bool HasDensity(VImage image) {
    return image.xres() > 1.0;
  }

  /*
    Get pixels/mm resolution as pixels/inch density.
  */
  int GetDensity(VImage image) {
    return static_cast<int>(round(image.xres() * 25.4));
  }

  /*
    Set pixels/mm resolution based on a pixels/inch density.
  */
  void SetDensity(VImage image, const int density) {
    const double pixelsPerMm = static_cast<double>(density) / 25.4;
    image.set("Xres", pixelsPerMm);
    image.set("Yres", pixelsPerMm);
    image.set(VIPS_META_RESOLUTION_UNIT, "in");
  }

  /*
    Called when a Buffer undergoes GC, required to support mixed runtime libraries in Windows
  */
  void FreeCallback(char* data, void* hint) {
    if (data != nullptr) {
      g_free(data);
    }
  }

  /*
    Calculate the (left, top) coordinates of the output image
    within the input image, applying the given gravity.
  */
  std::tuple<int, int> CalculateCrop(int const inWidth, int const inHeight,
    int const outWidth, int const outHeight, int const gravity) {

    int left = 0;
    int top = 0;
    switch (gravity) {
      case 1:
        // North
        left = (inWidth - outWidth + 1) / 2;
        break;
      case 2:
        // East
        left = inWidth - outWidth;
        top = (inHeight - outHeight + 1) / 2;
        break;
      case 3:
        // South
        left = (inWidth - outWidth + 1) / 2;
        top = inHeight - outHeight;
        break;
      case 4:
        // West
        top = (inHeight - outHeight + 1) / 2;
        break;
      case 5:
        // Northeast
        left = inWidth - outWidth;
        break;
      case 6:
        // Southeast
        left = inWidth - outWidth;
        top = inHeight - outHeight;
      case 7:
        // Southwest
        top = inHeight - outHeight;
      case 8:
        // Northwest
        break;
      default:
        // Centre
        left = (inWidth - outWidth + 1) / 2;
        top = (inHeight - outHeight + 1) / 2;
    }
    return std::make_tuple(left, top);
  }

  /*
    Calculate the (left, top) coordinates of the output image
    within the input image, applying the given x and y offsets.
  */
  std::tuple<int, int> CalculateCrop(int const inWidth, int const inHeight,
    int const outWidth, int const outHeight, int const x, int const y) {

    // default values
    int left = 0;
    int top = 0;

    // assign only if valid
    if(x >= 0 && x < (inWidth - outWidth)) {
      left = x;
    } else if(x >= (inWidth - outWidth)) {
      left = inWidth - outWidth;
    }

    if(y >= 0 && y < (inHeight - outHeight)) {
      top = y;
    } else if(x >= (inHeight - outHeight)) {
      top = inHeight - outHeight;
    }

    // the resulting left and top could have been outside the image after calculation from bottom/right edges
    if(left < 0) {
      left = 0;
    }
    if(top < 0) {
      top = 0;
    }

    return std::make_tuple(left, top);
  }

  /*
    Are pixel values in this image 16-bit integer?
  */
  bool Is16Bit(VipsInterpretation const interpretation) {
    return interpretation == VIPS_INTERPRETATION_RGB16 || interpretation == VIPS_INTERPRETATION_GREY16;
  }

  /*
    Return the image alpha maximum. Useful for combining alpha bands. scRGB
    images are 0 - 1 for image data, but the alpha is 0 - 255.
  */
  double MaximumImageAlpha(VipsInterpretation const interpretation) {
    return Is16Bit(interpretation) ? 65535.0 : 255.0;
  }

  /*
    Get boolean operation type from string
  */
  VipsOperationBoolean GetBooleanOperation(std::string const opStr) {
    return static_cast<VipsOperationBoolean>(
      vips_enum_from_nick(nullptr, VIPS_TYPE_OPERATION_BOOLEAN, opStr.data())
    );
  }

}  // namespace sharp
