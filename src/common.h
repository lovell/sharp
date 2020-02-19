// Copyright 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020 Lovell Fuller and contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#ifndef SRC_COMMON_H_
#define SRC_COMMON_H_

#include <string>
#include <tuple>
#include <vector>

#include <napi.h>
#include <vips/vips8>

// Verify platform and compiler compatibility

#if (VIPS_MAJOR_VERSION < 8 || (VIPS_MAJOR_VERSION == 8 && VIPS_MINOR_VERSION < 9))
#error "libvips version 8.9.1+ is required - please see https://sharp.pixelplumbing.com/install"
#endif

#if ((!defined(__clang__)) && defined(__GNUC__) && (__GNUC__ < 4 || (__GNUC__ == 4 && __GNUC_MINOR__ < 6)))
#error "GCC version 4.6+ is required for C++11 features - please see https://sharp.pixelplumbing.com/install"
#endif

#if (defined(__clang__) && defined(__has_feature))
#if (!__has_feature(cxx_range_for))
#error "clang version 3.0+ is required for C++11 features - please see https://sharp.pixelplumbing.com/install"
#endif
#endif

using vips::VImage;

namespace sharp {

  struct InputDescriptor {  // NOLINT(runtime/indentation_namespace)
    std::string name;
    std::string file;
    char *buffer;
    bool failOnError;
    int limitInputPixels;
    VipsAccess access;
    size_t bufferLength;
    bool isBuffer;
    double density;
    int rawChannels;
    int rawWidth;
    int rawHeight;
    int pages;
    int page;
    int createChannels;
    int createWidth;
    int createHeight;
    std::vector<double> createBackground;

    InputDescriptor():
      buffer(nullptr),
      failOnError(TRUE),
      limitInputPixels(0x3FFF * 0x3FFF),
      access(VIPS_ACCESS_RANDOM),
      bufferLength(0),
      isBuffer(FALSE),
      density(72.0),
      rawChannels(0),
      rawWidth(0),
      rawHeight(0),
      pages(1),
      page(0),
      createChannels(0),
      createWidth(0),
      createHeight(0),
      createBackground{ 0.0, 0.0, 0.0, 255.0 } {}
  };

  // Convenience methods to access the attributes of a Napi::Object
  bool HasAttr(Napi::Object obj, std::string attr);
  std::string AttrAsStr(Napi::Object obj, std::string attr);
  uint32_t AttrAsUint32(Napi::Object obj, std::string attr);
  int32_t AttrAsInt32(Napi::Object obj, std::string attr);
  double AttrAsDouble(Napi::Object obj, std::string attr);
  double AttrAsDouble(Napi::Object obj, unsigned int const attr);
  bool AttrAsBool(Napi::Object obj, std::string attr);
  std::vector<double> AttrAsRgba(Napi::Object obj, std::string attr);

  // Create an InputDescriptor instance from a Napi::Object describing an input image
  InputDescriptor* CreateInputDescriptor(Napi::Object input);

  enum class ImageType {
    JPEG,
    PNG,
    WEBP,
    TIFF,
    GIF,
    SVG,
    HEIF,
    PDF,
    MAGICK,
    OPENSLIDE,
    PPM,
    FITS,
    VIPS,
    RAW,
    UNKNOWN,
    MISSING
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
  bool IsHeic(std::string const &str);
  bool IsHeif(std::string const &str);
  bool IsAvif(std::string const &str);
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
    Does this image type support multiple pages?
  */
  bool ImageTypeSupportsPage(ImageType imageType);

  /*
    Open an image from the given InputDescriptor (filesystem, compressed buffer, raw pixel data)
  */
  std::tuple<VImage, ImageType> OpenInput(InputDescriptor *descriptor);

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
  VImage SetExifOrientation(VImage image, int const orientation);

  /*
    Remove EXIF Orientation from image.
  */
  VImage RemoveExifOrientation(VImage image);

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
  VImage SetDensity(VImage image, const double density);

  /*
    Check the proposed format supports the current dimensions.
  */
  void AssertImageTypeDimensions(VImage image, ImageType const imageType);

  /*
    Called when a Buffer undergoes GC, required to support mixed runtime libraries in Windows
  */
  extern std::function<void(void*, char*)> FreeCallback;

  /*
    Called with warnings from the glib-registered "VIPS" domain
  */
  void VipsWarningCallback(char const* log_domain, GLogLevelFlags log_level, char const* message, void* ignore);

  /*
    Pop the oldest warning message from the queue
  */
  std::string VipsWarningPop();

  /*
    Calculate the (left, top) coordinates of the output image
    within the input image, applying the given gravity during an embed.
  */
  std::tuple<int, int> CalculateEmbedPosition(int const inWidth, int const inHeight,
    int const outWidth, int const outHeight, int const gravity);

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

  /*
    Get interpretation type from string
  */
  VipsInterpretation GetInterpretation(std::string const typeStr);

  /*
    Convert RGBA value to another colourspace
  */
  std::vector<double> GetRgbaAsColourspace(std::vector<double> const rgba, VipsInterpretation const interpretation);

  /*
    Apply the alpha channel to a given colour
   */
  std::tuple<VImage, std::vector<double>> ApplyAlpha(VImage image, std::vector<double> colour);

}  // namespace sharp

#endif  // SRC_COMMON_H_
