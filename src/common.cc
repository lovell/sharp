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

#include <cstdlib>
#include <string>
#include <string.h>
#include <vector>
#include <queue>
#include <map>
#include <mutex>  // NOLINT(build/c++11)

#include <napi.h>
#include <vips/vips8>

#include "common.h"

using vips::VImage;

namespace sharp {

  // Convenience methods to access the attributes of a Napi::Object
  bool HasAttr(Napi::Object obj, std::string attr) {
    return obj.Has(attr);
  }
  std::string AttrAsStr(Napi::Object obj, std::string attr) {
    return obj.Get(attr).As<Napi::String>();
  }
  std::string AttrAsStr(Napi::Object obj, unsigned int const attr) {
    return obj.Get(attr).As<Napi::String>();
  }
  uint32_t AttrAsUint32(Napi::Object obj, std::string attr) {
    return obj.Get(attr).As<Napi::Number>().Uint32Value();
  }
  int32_t AttrAsInt32(Napi::Object obj, std::string attr) {
    return obj.Get(attr).As<Napi::Number>().Int32Value();
  }
  int32_t AttrAsInt32(Napi::Object obj, unsigned int const attr) {
    return obj.Get(attr).As<Napi::Number>().Int32Value();
  }
  double AttrAsDouble(Napi::Object obj, std::string attr) {
    return obj.Get(attr).As<Napi::Number>().DoubleValue();
  }
  double AttrAsDouble(Napi::Object obj, unsigned int const attr) {
    return obj.Get(attr).As<Napi::Number>().DoubleValue();
  }
  bool AttrAsBool(Napi::Object obj, std::string attr) {
    return obj.Get(attr).As<Napi::Boolean>().Value();
  }
  std::vector<double> AttrAsVectorOfDouble(Napi::Object obj, std::string attr) {
    Napi::Array napiArray = obj.Get(attr).As<Napi::Array>();
    std::vector<double> vectorOfDouble(napiArray.Length());
    for (unsigned int i = 0; i < napiArray.Length(); i++) {
      vectorOfDouble[i] = AttrAsDouble(napiArray, i);
    }
    return vectorOfDouble;
  }
  std::vector<int32_t> AttrAsInt32Vector(Napi::Object obj, std::string attr) {
    Napi::Array array = obj.Get(attr).As<Napi::Array>();
    std::vector<int32_t> vector(array.Length());
    for (unsigned int i = 0; i < array.Length(); i++) {
      vector[i] = AttrAsInt32(array, i);
    }
    return vector;
  }

  // Create an InputDescriptor instance from a Napi::Object describing an input image
  InputDescriptor* CreateInputDescriptor(Napi::Object input) {
    InputDescriptor *descriptor = new InputDescriptor;
    if (HasAttr(input, "file")) {
      descriptor->file = AttrAsStr(input, "file");
    } else if (HasAttr(input, "buffer")) {
      Napi::Buffer<char> buffer = input.Get("buffer").As<Napi::Buffer<char>>();
      descriptor->bufferLength = buffer.Length();
      descriptor->buffer = buffer.Data();
      descriptor->isBuffer = TRUE;
    }
    descriptor->failOnError = AttrAsBool(input, "failOnError");
    // Density for vector-based input
    if (HasAttr(input, "density")) {
      descriptor->density = AttrAsDouble(input, "density");
    }
    // Raw pixel input
    if (HasAttr(input, "rawChannels")) {
      descriptor->rawChannels = AttrAsUint32(input, "rawChannels");
      descriptor->rawWidth = AttrAsUint32(input, "rawWidth");
      descriptor->rawHeight = AttrAsUint32(input, "rawHeight");
      descriptor->rawPremultiplied = AttrAsBool(input, "rawPremultiplied");
    }
    // Multi-page input (GIF, TIFF, PDF)
    if (HasAttr(input, "pages")) {
      descriptor->pages = AttrAsInt32(input, "pages");
    }
    if (HasAttr(input, "page")) {
      descriptor->page = AttrAsUint32(input, "page");
    }
    // Multi-level input (OpenSlide)
    if (HasAttr(input, "level")) {
      descriptor->level = AttrAsUint32(input, "level");
    }
    // subIFD (OME-TIFF)
    if (HasAttr(input, "subifd")) {
      descriptor->subifd = AttrAsInt32(input, "subifd");
    }
    // Create new image
    if (HasAttr(input, "createChannels")) {
      descriptor->createChannels = AttrAsUint32(input, "createChannels");
      descriptor->createWidth = AttrAsUint32(input, "createWidth");
      descriptor->createHeight = AttrAsUint32(input, "createHeight");
      if (HasAttr(input, "createNoiseType")) {
        descriptor->createNoiseType = AttrAsStr(input, "createNoiseType");
        descriptor->createNoiseMean = AttrAsDouble(input, "createNoiseMean");
        descriptor->createNoiseSigma = AttrAsDouble(input, "createNoiseSigma");
      } else {
        descriptor->createBackground = AttrAsVectorOfDouble(input, "createBackground");
      }
    }
    // Limit input images to a given number of pixels, where pixels = width * height
    descriptor->limitInputPixels = AttrAsUint32(input, "limitInputPixels");
    // Allow switch from random to sequential access
    descriptor->access = AttrAsBool(input, "sequentialRead") ? VIPS_ACCESS_SEQUENTIAL : VIPS_ACCESS_RANDOM;
    return descriptor;
  }

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
  bool IsGif(std::string const &str) {
    return EndsWith(str, ".gif") || EndsWith(str, ".GIF");
  }
  bool IsTiff(std::string const &str) {
    return EndsWith(str, ".tif") || EndsWith(str, ".tiff") || EndsWith(str, ".TIF") || EndsWith(str, ".TIFF");
  }
  bool IsHeic(std::string const &str) {
    return EndsWith(str, ".heic") || EndsWith(str, ".HEIC");
  }
  bool IsHeif(std::string const &str) {
    return EndsWith(str, ".heif") || EndsWith(str, ".HEIF") || IsHeic(str) || IsAvif(str);
  }
  bool IsAvif(std::string const &str) {
    return EndsWith(str, ".avif") || EndsWith(str, ".AVIF");
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
      case ImageType::HEIF: id = "heif"; break;
      case ImageType::PDF: id = "pdf"; break;
      case ImageType::MAGICK: id = "magick"; break;
      case ImageType::OPENSLIDE: id = "openslide"; break;
      case ImageType::PPM: id = "ppm"; break;
      case ImageType::FITS: id = "fits"; break;
      case ImageType::EXR: id = "exr"; break;
      case ImageType::VIPS: id = "vips"; break;
      case ImageType::RAW: id = "raw"; break;
      case ImageType::UNKNOWN: id = "unknown"; break;
      case ImageType::MISSING: id = "missing"; break;
    }
    return id;
  }

  /**
   * Regenerate this table with something like:
   *
   * $ vips -l foreign | grep -i load | awk '{ print $2, $1; }'
   *
   * Plus a bit of editing.
   */
  std::map<std::string, ImageType> loaderToType = {
    { "VipsForeignLoadJpegFile", ImageType::JPEG },
    { "VipsForeignLoadJpegBuffer", ImageType::JPEG },
    { "VipsForeignLoadPngFile", ImageType::PNG },
    { "VipsForeignLoadPngBuffer", ImageType::PNG },
    { "VipsForeignLoadWebpFile", ImageType::WEBP },
    { "VipsForeignLoadWebpBuffer", ImageType::WEBP },
    { "VipsForeignLoadTiffFile", ImageType::TIFF },
    { "VipsForeignLoadTiffBuffer", ImageType::TIFF },
    { "VipsForeignLoadGifFile", ImageType::GIF },
    { "VipsForeignLoadGifBuffer", ImageType::GIF },
    { "VipsForeignLoadNsgifFile", ImageType::GIF },
    { "VipsForeignLoadNsgifBuffer", ImageType::GIF },
    { "VipsForeignLoadSvgFile", ImageType::SVG },
    { "VipsForeignLoadSvgBuffer", ImageType::SVG },
    { "VipsForeignLoadHeifFile", ImageType::HEIF },
    { "VipsForeignLoadHeifBuffer", ImageType::HEIF },
    { "VipsForeignLoadPdfFile", ImageType::PDF },
    { "VipsForeignLoadPdfBuffer", ImageType::PDF },
    { "VipsForeignLoadMagickFile", ImageType::MAGICK },
    { "VipsForeignLoadMagickBuffer", ImageType::MAGICK },
    { "VipsForeignLoadOpenslide", ImageType::OPENSLIDE },
    { "VipsForeignLoadPpmFile", ImageType::PPM },
    { "VipsForeignLoadFits", ImageType::FITS },
    { "VipsForeignLoadOpenexr", ImageType::EXR },
    { "VipsForeignLoadVips", ImageType::VIPS },
    { "VipsForeignLoadVipsFile", ImageType::VIPS },
    { "VipsForeignLoadRaw", ImageType::RAW }
  };

  /*
    Determine image format of a buffer.
  */
  ImageType DetermineImageType(void *buffer, size_t const length) {
    ImageType imageType = ImageType::UNKNOWN;
    char const *load = vips_foreign_find_load_buffer(buffer, length);
    if (load != nullptr) {
      auto it = loaderToType.find(load);
      if (it != loaderToType.end()) {
        imageType = it->second;
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
      auto it = loaderToType.find(load);
      if (it != loaderToType.end()) {
        imageType = it->second;
      }
    } else {
      if (EndsWith(vips::VError().what(), " does not exist\n")) {
        imageType = ImageType::MISSING;
      }
    }
    return imageType;
  }

  /*
    Does this image type support multiple pages?
  */
  bool ImageTypeSupportsPage(ImageType imageType) {
    return
      imageType == ImageType::WEBP ||
      imageType == ImageType::MAGICK ||
      imageType == ImageType::GIF ||
      imageType == ImageType::TIFF ||
      imageType == ImageType::HEIF ||
      imageType == ImageType::PDF;
  }

  /*
    Open an image from the given InputDescriptor (filesystem, compressed buffer, raw pixel data)
  */
  std::tuple<VImage, ImageType> OpenInput(InputDescriptor *descriptor) {
    VImage image;
    ImageType imageType;
    if (descriptor->isBuffer) {
      if (descriptor->rawChannels > 0) {
        // Raw, uncompressed pixel data
        image = VImage::new_from_memory(descriptor->buffer, descriptor->bufferLength,
          descriptor->rawWidth, descriptor->rawHeight, descriptor->rawChannels, VIPS_FORMAT_UCHAR);
        if (descriptor->rawChannels < 3) {
          image.get_image()->Type = VIPS_INTERPRETATION_B_W;
        } else {
          image.get_image()->Type = VIPS_INTERPRETATION_sRGB;
        }
        if (descriptor->rawPremultiplied) {
          image = image.unpremultiply();
        }
        imageType = ImageType::RAW;
      } else {
        // Compressed data
        imageType = DetermineImageType(descriptor->buffer, descriptor->bufferLength);
        if (imageType != ImageType::UNKNOWN) {
          try {
            vips::VOption *option = VImage::option()
              ->set("access", descriptor->access)
              ->set("fail", descriptor->failOnError);
            if (imageType == ImageType::SVG) {
              option->set("unlimited", TRUE);
            }
            if (imageType == ImageType::SVG || imageType == ImageType::PDF) {
              option->set("dpi", descriptor->density);
            }
            if (imageType == ImageType::MAGICK) {
              option->set("density", std::to_string(descriptor->density).data());
            }
            if (ImageTypeSupportsPage(imageType)) {
              option->set("n", descriptor->pages);
              option->set("page", descriptor->page);
            }
            if (imageType == ImageType::OPENSLIDE) {
              option->set("level", descriptor->level);
            }
            if (imageType == ImageType::TIFF) {
              option->set("subifd", descriptor->subifd);
            }
            image = VImage::new_from_buffer(descriptor->buffer, descriptor->bufferLength, nullptr, option);
            if (imageType == ImageType::SVG || imageType == ImageType::PDF || imageType == ImageType::MAGICK) {
              image = SetDensity(image, descriptor->density);
            }
          } catch (vips::VError const &err) {
            throw vips::VError(std::string("Input buffer has corrupt header: ") + err.what());
          }
        } else {
          throw vips::VError("Input buffer contains unsupported image format");
        }
      }
    } else {
      if (descriptor->createChannels > 0) {
        // Create new image
        if (descriptor->createNoiseType == "gaussian") {
          int const channels = descriptor->createChannels;
          image = VImage::new_matrix(descriptor->createWidth, descriptor->createHeight);
          std::vector<VImage> bands = {};
          bands.reserve(channels);
          for (int _band = 0; _band < channels; _band++) {
            bands.push_back(image.gaussnoise(
              descriptor->createWidth,
              descriptor->createHeight,
              VImage::option()->set("mean", descriptor->createNoiseMean)->set("sigma", descriptor->createNoiseSigma)));
          }
          image = image.bandjoin(bands);
          image = image.cast(VipsBandFormat::VIPS_FORMAT_UCHAR);
          if (channels < 3) {
            image = image.colourspace(VIPS_INTERPRETATION_B_W);
          } else {
            image = image.colourspace(VIPS_INTERPRETATION_sRGB);
          }
        } else {
          std::vector<double> background = {
            descriptor->createBackground[0],
            descriptor->createBackground[1],
            descriptor->createBackground[2]
          };
          if (descriptor->createChannels == 4) {
            background.push_back(descriptor->createBackground[3]);
          }
          image = VImage::new_matrix(descriptor->createWidth, descriptor->createHeight).new_from_image(background);
        }
        image.get_image()->Type = VIPS_INTERPRETATION_sRGB;
        imageType = ImageType::RAW;
      } else {
        // From filesystem
        imageType = DetermineImageType(descriptor->file.data());
        if (imageType == ImageType::MISSING) {
          throw vips::VError("Input file is missing");
        }
        if (imageType != ImageType::UNKNOWN) {
          try {
            vips::VOption *option = VImage::option()
              ->set("access", descriptor->access)
              ->set("fail", descriptor->failOnError);
            if (imageType == ImageType::SVG) {
              option->set("unlimited", TRUE);
            }
            if (imageType == ImageType::SVG || imageType == ImageType::PDF) {
              option->set("dpi", descriptor->density);
            }
            if (imageType == ImageType::MAGICK) {
              option->set("density", std::to_string(descriptor->density).data());
            }
            if (ImageTypeSupportsPage(imageType)) {
              option->set("n", descriptor->pages);
              option->set("page", descriptor->page);
            }
            if (imageType == ImageType::OPENSLIDE) {
              option->set("level", descriptor->level);
            }
            if (imageType == ImageType::TIFF) {
              option->set("subifd", descriptor->subifd);
            }
            image = VImage::new_from_file(descriptor->file.data(), option);
            if (imageType == ImageType::SVG || imageType == ImageType::PDF || imageType == ImageType::MAGICK) {
              image = SetDensity(image, descriptor->density);
            }
          } catch (vips::VError const &err) {
            throw vips::VError(std::string("Input file has corrupt header: ") + err.what());
          }
        } else {
          throw vips::VError("Input file contains unsupported image format");
        }
      }
    }
    // Limit input images to a given number of pixels, where pixels = width * height
    if (descriptor->limitInputPixels > 0 &&
      static_cast<uint64_t>(image.width() * image.height()) > static_cast<uint64_t>(descriptor->limitInputPixels)) {
      throw vips::VError("Input image exceeds pixel limit");
    }
    return std::make_tuple(image, imageType);
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
    return image.has_alpha();
  }

  /*
    Get EXIF Orientation of image, if any.
  */
  int ExifOrientation(VImage image) {
    int orientation = 0;
    if (image.get_typeof(VIPS_META_ORIENTATION) != 0) {
      orientation = image.get_int(VIPS_META_ORIENTATION);
    }
    return orientation;
  }

  /*
    Set EXIF Orientation of image.
  */
  VImage SetExifOrientation(VImage image, int const orientation) {
    VImage copy = image.copy();
    copy.set(VIPS_META_ORIENTATION, orientation);
    return copy;
  }

  /*
    Remove EXIF Orientation from image.
  */
  VImage RemoveExifOrientation(VImage image) {
    VImage copy = image.copy();
    copy.remove(VIPS_META_ORIENTATION);
    return copy;
  }

  /*
    Set animation properties if necessary.
    Non-provided properties will be loaded from image.
  */
  VImage SetAnimationProperties(VImage image, int pageHeight, std::vector<int> delay, int loop) {
    bool hasDelay = delay.size() != 1 || delay.front() != -1;

    if (pageHeight == 0 && image.get_typeof(VIPS_META_PAGE_HEIGHT) == G_TYPE_INT) {
      pageHeight = image.get_int(VIPS_META_PAGE_HEIGHT);
    }

    if (!hasDelay && image.get_typeof("delay") == VIPS_TYPE_ARRAY_INT) {
      delay = image.get_array_int("delay");
      hasDelay = true;
    }

    if (loop == -1 && image.get_typeof("loop") == G_TYPE_INT) {
      loop = image.get_int("loop");
    }

    if (pageHeight == 0) return image;

    // It is necessary to create the copy as otherwise, pageHeight will be ignored!
    VImage copy = image.copy();

    copy.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    if (hasDelay) copy.set("delay", delay);
    if (loop != -1) copy.set("loop", loop);

    return copy;
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
  VImage SetDensity(VImage image, const double density) {
    const double pixelsPerMm = density / 25.4;
    VImage copy = image.copy();
    copy.get_image()->Xres = pixelsPerMm;
    copy.get_image()->Yres = pixelsPerMm;
    return copy;
  }

  /*
    Check the proposed format supports the current dimensions.
  */
  void AssertImageTypeDimensions(VImage image, ImageType const imageType) {
    const int height = image.get_typeof(VIPS_META_PAGE_HEIGHT) == G_TYPE_INT
      ? image.get_int(VIPS_META_PAGE_HEIGHT)
      : image.height();
    if (imageType == ImageType::JPEG) {
      if (image.width() > 65535 || height > 65535) {
        throw vips::VError("Processed image is too large for the JPEG format");
      }
    } else if (imageType == ImageType::WEBP) {
      if (image.width() > 16383 || height > 16383) {
        throw vips::VError("Processed image is too large for the WebP format");
      }
    } else if (imageType == ImageType::GIF) {
      if (image.width() > 65535 || height > 65535) {
        throw vips::VError("Processed image is too large for the GIF format");
      }
    }
  }

  /*
    Called when a Buffer undergoes GC, required to support mixed runtime libraries in Windows
  */
  std::function<void(void*, char*)> FreeCallback = [](void*, char* data) {
    g_free(data);
  };

  /*
    Temporary buffer of warnings
  */
  std::queue<std::string> vipsWarnings;
  std::mutex vipsWarningsMutex;

  /*
    Called with warnings from the glib-registered "VIPS" domain
  */
  void VipsWarningCallback(char const* log_domain, GLogLevelFlags log_level, char const* message, void* ignore) {
    std::lock_guard<std::mutex> lock(vipsWarningsMutex);
    vipsWarnings.emplace(message);
  }

  /*
    Pop the oldest warning message from the queue
  */
  std::string VipsWarningPop() {
    std::string warning;
    std::lock_guard<std::mutex> lock(vipsWarningsMutex);
    if (!vipsWarnings.empty()) {
      warning = vipsWarnings.front();
      vipsWarnings.pop();
    }
    return warning;
  }

  /*
    Calculate the (left, top) coordinates of the output image
    within the input image, applying the given gravity during an embed.

    @Azurebyte: We are basically swapping the inWidth and outWidth, inHeight and outHeight from the CalculateCrop function.
  */
  std::tuple<int, int> CalculateEmbedPosition(int const inWidth, int const inHeight,
    int const outWidth, int const outHeight, int const gravity) {

    int left = 0;
    int top = 0;
    switch (gravity) {
      case 1:
        // North
        left = (outWidth - inWidth) / 2;
        break;
      case 2:
        // East
        left = outWidth - inWidth;
        top = (outHeight - inHeight) / 2;
        break;
      case 3:
        // South
        left = (outWidth - inWidth) / 2;
        top = outHeight - inHeight;
        break;
      case 4:
        // West
        top = (outHeight - inHeight) / 2;
        break;
      case 5:
        // Northeast
        left = outWidth - inWidth;
        break;
      case 6:
        // Southeast
        left = outWidth - inWidth;
        top = outHeight - inHeight;
        break;
      case 7:
        // Southwest
        top = outHeight - inHeight;
        break;
      case 8:
        // Northwest
        // Which is the default is 0,0 so we do not assign anything here.
        break;
      default:
        // Centre
        left = (outWidth - inWidth) / 2;
        top = (outHeight - inHeight) / 2;
    }
    return std::make_tuple(left, top);
  }

  /*
    Calculate the (left, top) coordinates of the output image
    within the input image, applying the given gravity during a crop.
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
        break;
      case 7:
        // Southwest
        top = inHeight - outHeight;
        break;
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
    if (x < (inWidth - outWidth)) {
      left = x;
    } else if (x >= (inWidth - outWidth)) {
      left = inWidth - outWidth;
    }

    if (y < (inHeight - outHeight)) {
      top = y;
    } else if (y >= (inHeight - outHeight)) {
      top = inHeight - outHeight;
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
      vips_enum_from_nick(nullptr, VIPS_TYPE_OPERATION_BOOLEAN, opStr.data()));
  }

  /*
    Get interpretation type from string
  */
  VipsInterpretation GetInterpretation(std::string const typeStr) {
    return static_cast<VipsInterpretation>(
      vips_enum_from_nick(nullptr, VIPS_TYPE_INTERPRETATION, typeStr.data()));
  }

  /*
    Convert RGBA value to another colourspace
  */
  std::vector<double> GetRgbaAsColourspace(std::vector<double> const rgba, VipsInterpretation const interpretation) {
    int const bands = static_cast<int>(rgba.size());
    if (bands < 3 || interpretation == VIPS_INTERPRETATION_sRGB || interpretation == VIPS_INTERPRETATION_RGB) {
      return rgba;
    } else {
      VImage pixel = VImage::new_matrix(1, 1);
      pixel.set("bands", bands);
      pixel = pixel.new_from_image(rgba);
      pixel = pixel.colourspace(interpretation, VImage::option()->set("source_space", VIPS_INTERPRETATION_sRGB));
      return pixel(0, 0);
    }
  }

  /*
    Apply the alpha channel to a given colour
  */
  std::tuple<VImage, std::vector<double>> ApplyAlpha(VImage image, std::vector<double> colour) {
    // Scale up 8-bit values to match 16-bit input image
    double const multiplier = sharp::Is16Bit(image.interpretation()) ? 256.0 : 1.0;
    // Create alphaColour colour
    std::vector<double> alphaColour;
    if (image.bands() > 2) {
      alphaColour = {
        multiplier * colour[0],
        multiplier * colour[1],
        multiplier * colour[2]
      };
    } else {
      // Convert sRGB to greyscale
      alphaColour = { multiplier * (
        0.2126 * colour[0] +
        0.7152 * colour[1] +
        0.0722 * colour[2])
      };
    }
    // Add alpha channel to alphaColour colour
    if (colour[3] < 255.0 || HasAlpha(image)) {
      alphaColour.push_back(colour[3] * multiplier);
    }
    // Ensure alphaColour colour uses correct colourspace
    alphaColour = sharp::GetRgbaAsColourspace(alphaColour, image.interpretation());
    // Add non-transparent alpha channel, if required
    if (colour[3] < 255.0 && !HasAlpha(image)) {
      image = image.bandjoin(
        VImage::new_matrix(image.width(), image.height()).new_from_image(255 * multiplier));
    }
    return std::make_tuple(image, alphaColour);
  }

  /*
    Removes alpha channel, if any.
  */
  VImage RemoveAlpha(VImage image) {
    if (HasAlpha(image)) {
      image = image.extract_band(0, VImage::option()->set("n", image.bands() - 1));
    }
    return image;
  }

  /*
    Ensures alpha channel, if missing.
  */
  VImage EnsureAlpha(VImage image, double const value) {
    if (!HasAlpha(image)) {
      std::vector<double> alpha;
      alpha.push_back(value * sharp::MaximumImageAlpha(image.interpretation()));
      image = image.bandjoin_const(alpha);
    }
    return image;
  }
}  // namespace sharp
