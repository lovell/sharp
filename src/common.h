#ifndef SRC_COMMON_H_
#define SRC_COMMON_H_

#include <string>
#include <tuple>

#include <vips/vips8>

using vips::VImage;

namespace sharp {

  enum class ImageType {
    JPEG,
    PNG,
    WEBP,
    TIFF,
    GIF,
    SVG,
    PDF,
    MAGICK,
    OPENSLIDE,
    PPM,
    FITS,
    VIPS,
    RAW,
    UNKNOWN
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
  bool IsDzZip(std::string const &str);
  bool IsV(std::string const &str);

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
    Does this image have a non-default density?
  */
  bool HasDensity(VImage image);

  /*
    Get pixels/mm resolution as pixels/inch density.
  */
  int GetDensity(VImage image);

  /*
    Set pixels/mm resolution based on a pixels/inch density.
  */
  void SetDensity(VImage image, const int density);

  /*
    Called when a Buffer undergoes GC, required to support mixed runtime libraries in Windows
  */
  void FreeCallback(char* data, void* hint);

  /*
    Calculate the (left, top) coordinates of the output image
    within the input image, applying the given gravity.
  */
  std::tuple<int, int> CalculateCrop(int const inWidth, int const inHeight,
    int const outWidth, int const outHeight, int const gravity);

  /*
    Calculate the (left, top) coordinates of the output image
    within the input image, applying the given x and y offsets of the output image.
  */
  std::tuple<int, int> CalculateCrop(int const inWidth, int const inHeight,
    int const outWidth, int const outHeight, int const x, int const y);

  /*
    Are pixel values in this image 16-bit integer?
  */
  bool Is16Bit(VipsInterpretation const interpretation);

  /*
    Return the image alpha maximum. Useful for combining alpha bands. scRGB
    images are 0 - 1 for image data, but the alpha is 0 - 255.
  */
  double MaximumImageAlpha(VipsInterpretation const interpretation);

  /*
    Get boolean operation type from string
  */
  VipsOperationBoolean GetBooleanOperation(std::string const opStr);

}  // namespace sharp

#endif  // SRC_COMMON_H_
