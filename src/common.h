#ifndef SRC_COMMON_H_
#define SRC_COMMON_H_

#include <string>
#include <vips/vips8>

using vips::VImage;

namespace sharp {

  enum class ImageType {
    UNKNOWN,
    JPEG,
    PNG,
    WEBP,
    TIFF,
    MAGICK,
    OPENSLIDE,
    PPM,
    FITS,
    RAW
  };

  // How many tasks are in the queue?
  extern volatile int counterQueue;

  // How many tasks are being processed?
  extern volatile int counterProcess;

  // Filename extension checkers
  bool IsJpeg(std::string const &str);
  bool IsPng(std::string const &str);
  bool IsWebp(std::string const &str);
  bool IsTiff(std::string const &str);
  bool IsDz(std::string const &str);

  /*
    Provide a string identifier for the given image type.
  */
  std::string ImageTypeId(ImageType const imageType);

  /*
    Determine image format of a buffer.
  */
  ImageType DetermineImageType(void *buffer, size_t const length);

  /*
    Determine image format of a file.
  */
  ImageType DetermineImageType(char const *file);

  /*
    Does this image have an embedded profile?
  */
  bool HasProfile(VImage image);

  /*
    Does this image have an alpha channel?
    Uses colour space interpretation with number of channels to guess this.
  */
  bool HasAlpha(VImage image);

  /*
    Get EXIF Orientation of image, if any.
  */
  int ExifOrientation(VImage image);

  /*
    Set EXIF Orientation of image.
  */
  void SetExifOrientation(VImage image, int const orientation);

  /*
    Remove EXIF Orientation from image.
  */
  void RemoveExifOrientation(VImage image);

  /*
    Called when a Buffer undergoes GC, required to support mixed runtime libraries in Windows
  */
  void FreeCallback(char* data, void* hint);

}  // namespace sharp

#endif  // SRC_COMMON_H_
