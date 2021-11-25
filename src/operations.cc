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

#include <algorithm>
#include <functional>
#include <memory>
#include <tuple>
#include <vector>

#include <vips/vips8>

#include "common.h"
#include "operations.h"

using vips::VImage;
using vips::VError;

namespace sharp {
  /*
   * Tint an image using the specified chroma, preserving the original image luminance
   */
  VImage Tint(VImage image, double const a, double const b) {
    // Get original colourspace
    VipsInterpretation typeBeforeTint = image.interpretation();
    if (typeBeforeTint == VIPS_INTERPRETATION_RGB) {
      typeBeforeTint = VIPS_INTERPRETATION_sRGB;
    }
    // Extract luminance
    VImage luminance = image.colourspace(VIPS_INTERPRETATION_LAB)[0];
    // Create the tinted version by combining the L from the original and the chroma from the tint
    std::vector<double> chroma {a, b};
    VImage tinted = luminance
      .bandjoin(chroma)
      .copy(VImage::option()->set("interpretation", VIPS_INTERPRETATION_LAB))
      .colourspace(typeBeforeTint);
    // Attach original alpha channel, if any
    if (HasAlpha(image)) {
      // Extract original alpha channel
      VImage alpha = image[image.bands() - 1];
      // Join alpha channel to normalised image
      tinted = tinted.bandjoin(alpha);
    }
    return tinted;
  }

  /*
   * Stretch luminance to cover full dynamic range.
   */
  VImage Normalise(VImage image) {
    // Get original colourspace
    VipsInterpretation typeBeforeNormalize = image.interpretation();
    if (typeBeforeNormalize == VIPS_INTERPRETATION_RGB) {
      typeBeforeNormalize = VIPS_INTERPRETATION_sRGB;
    }
    // Convert to LAB colourspace
    VImage lab = image.colourspace(VIPS_INTERPRETATION_LAB);
    // Extract luminance
    VImage luminance = lab[0];
    // Find luminance range
    VImage stats = luminance.stats();
    double min = stats(0, 0)[0];
    double max = stats(1, 0)[0];
    if (min != max) {
      // Extract chroma
      VImage chroma = lab.extract_band(1, VImage::option()->set("n", 2));
      // Calculate multiplication factor and addition
      double f = 100.0 / (max - min);
      double a = -(min * f);
      // Scale luminance, join to chroma, convert back to original colourspace
      VImage normalized = luminance.linear(f, a).bandjoin(chroma).colourspace(typeBeforeNormalize);
      // Attach original alpha channel, if any
      if (HasAlpha(image)) {
        // Extract original alpha channel
        VImage alpha = image[image.bands() - 1];
        // Join alpha channel to normalised image
        return normalized.bandjoin(alpha);
      } else {
        return normalized;
      }
    }
    return image;
  }

  /*
   * Contrast limiting adapative histogram equalization (CLAHE)
   */
  VImage Clahe(VImage image, int const width, int const height, int const maxSlope) {
    return image.hist_local(width, height, VImage::option()->set("max_slope", maxSlope));
  }

  /*
   * Gamma encoding/decoding
   */
  VImage Gamma(VImage image, double const exponent) {
    if (HasAlpha(image)) {
      // Separate alpha channel
      VImage alpha = image[image.bands() - 1];
      return RemoveAlpha(image).gamma(VImage::option()->set("exponent", exponent)).bandjoin(alpha);
    } else {
      return image.gamma(VImage::option()->set("exponent", exponent));
    }
  }

  /**
   * Produce the "negative" of the image.
   */
  VImage Negate(VImage image, bool const negateAlpha) {
    if (HasAlpha(image) && !negateAlpha) {
      // Separate alpha channel
      VImage alpha = image[image.bands() - 1];
      return RemoveAlpha(image).invert().bandjoin(alpha);
    } else {
      return image.invert();
    }
  }

  /*
   * Gaussian blur. Use sigma of -1.0 for fast blur.
   */
  VImage Blur(VImage image, double const sigma) {
    if (sigma == -1.0) {
      // Fast, mild blur - averages neighbouring pixels
      VImage blur = VImage::new_matrixv(3, 3,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0);
      blur.set("scale", 9.0);
      return image.conv(blur);
    } else {
      // Slower, accurate Gaussian blur
      return image.gaussblur(sigma);
    }
  }

  /*
   * Convolution with a kernel.
   */
  VImage Convolve(VImage image, int const width, int const height,
    double const scale, double const offset,
    std::unique_ptr<double[]> const &kernel_v
  ) {
    VImage kernel = VImage::new_from_memory(
      kernel_v.get(),
      width * height * sizeof(double),
      width,
      height,
      1,
      VIPS_FORMAT_DOUBLE);
    kernel.set("scale", scale);
    kernel.set("offset", offset);

    return image.conv(kernel);
  }

  /*
   * Recomb with a Matrix of the given bands/channel size.
   * Eg. RGB will be a 3x3 matrix.
   */
  VImage Recomb(VImage image, std::unique_ptr<double[]> const &matrix) {
    double *m = matrix.get();
    image = image.colourspace(VIPS_INTERPRETATION_sRGB);
    return image
      .recomb(image.bands() == 3
        ? VImage::new_from_memory(
          m, 9 * sizeof(double), 3, 3, 1, VIPS_FORMAT_DOUBLE
        )
        : VImage::new_matrixv(4, 4,
          m[0], m[1], m[2], 0.0,
          m[3], m[4], m[5], 0.0,
          m[6], m[7], m[8], 0.0,
          0.0, 0.0, 0.0, 1.0));
  }

  VImage Modulate(VImage image, double const brightness, double const saturation,
                  int const hue, double const lightness) {
    if (HasAlpha(image)) {
      // Separate alpha channel
      VImage alpha = image[image.bands() - 1];
      return RemoveAlpha(image)
        .colourspace(VIPS_INTERPRETATION_LCH)
        .linear(
          { brightness, saturation, 1},
          { lightness, 0.0, static_cast<double>(hue) }
        )
        .colourspace(VIPS_INTERPRETATION_sRGB)
        .bandjoin(alpha);
    } else {
      return image
        .colourspace(VIPS_INTERPRETATION_LCH)
        .linear(
          { brightness, saturation, 1 },
          { lightness, 0.0, static_cast<double>(hue) }
        )
        .colourspace(VIPS_INTERPRETATION_sRGB);
    }
  }

  /*
   * Sharpen flat and jagged areas. Use sigma of -1.0 for fast sharpen.
   */
  VImage Sharpen(VImage image, double const sigma, double const flat, double const jagged) {
    if (sigma == -1.0) {
      // Fast, mild sharpen
      VImage sharpen = VImage::new_matrixv(3, 3,
        -1.0, -1.0, -1.0,
        -1.0, 32.0, -1.0,
        -1.0, -1.0, -1.0);
      sharpen.set("scale", 24.0);
      return image.conv(sharpen);
    } else {
      // Slow, accurate sharpen in LAB colour space, with control over flat vs jagged areas
      VipsInterpretation colourspaceBeforeSharpen = image.interpretation();
      if (colourspaceBeforeSharpen == VIPS_INTERPRETATION_RGB) {
        colourspaceBeforeSharpen = VIPS_INTERPRETATION_sRGB;
      }
      return image.sharpen(
        VImage::option()->set("sigma", sigma)->set("m1", flat)->set("m2", jagged))
        .colourspace(colourspaceBeforeSharpen);
    }
  }

  VImage Threshold(VImage image, double const threshold, bool const thresholdGrayscale) {
    if (!thresholdGrayscale) {
      return image >= threshold;
    }
    return image.colourspace(VIPS_INTERPRETATION_B_W) >= threshold;
  }

  /*
    Perform boolean/bitwise operation on image color channels - results in one channel image
  */
  VImage Bandbool(VImage image, VipsOperationBoolean const boolean) {
    image = image.bandbool(boolean);
    return image.copy(VImage::option()->set("interpretation", VIPS_INTERPRETATION_B_W));
  }

  /*
    Perform bitwise boolean operation between images
  */
  VImage Boolean(VImage image, VImage imageR, VipsOperationBoolean const boolean) {
    return image.boolean(imageR, boolean);
  }

  /*
    Trim an image
  */
  VImage Trim(VImage image, double const threshold) {
    if (image.width() < 3 && image.height() < 3) {
      throw VError("Image to trim must be at least 3x3 pixels");
    }
    // Top-left pixel provides the background colour
    VImage background = image.extract_area(0, 0, 1, 1);
    if (HasAlpha(background)) {
      background = background.flatten();
    }
    int left, top, width, height;
    left = image.find_trim(&top, &width, &height, VImage::option()
      ->set("background", background(0, 0))
      ->set("threshold", threshold));
    if (width == 0 || height == 0) {
      if (HasAlpha(image)) {
        // Search alpha channel
        VImage alpha = image[image.bands() - 1];
        VImage backgroundAlpha = alpha.extract_area(0, 0, 1, 1);
        left = alpha.find_trim(&top, &width, &height, VImage::option()
          ->set("background", backgroundAlpha(0, 0))
          ->set("threshold", threshold));
      }
      if (width == 0 || height == 0) {
        throw VError("Unexpected error while trimming. Try to lower the tolerance");
      }
    }
    return image.extract_area(left, top, width, height);
  }

  /*
   * Calculate (a * in + b)
   */
  VImage Linear(VImage image, double const a, double const b) {
    if (HasAlpha(image)) {
      // Separate alpha channel
      VImage alpha = image[image.bands() - 1];
      return RemoveAlpha(image).linear(a, b).bandjoin(alpha);
    } else {
      return image.linear(a, b);
    }
  }

  /*
   * Ensure the image is in a given colourspace
   */
  VImage EnsureColourspace(VImage image, VipsInterpretation colourspace) {
    if (colourspace != VIPS_INTERPRETATION_LAST && image.interpretation() != colourspace) {
      image = image.colourspace(colourspace,
        VImage::option()->set("source_space", image.interpretation()));
    }
    return image;
  }

  /*
   * Split and crop each frame, reassemble, and update pageHeight.
   */
  VImage CropMultiPage(VImage image, int left, int top, int width, int height,
                       int nPages, int *pageHeight) {
    if (top == 0 && height == *pageHeight) {
      // Fast path; no need to adjust the height of the multi-page image
      return image.extract_area(left, 0, width, image.height());
    } else {
      std::vector<VImage> pages;
      pages.reserve(nPages);

      // Split the image into cropped frames
      for (int i = 0; i < nPages; i++) {
        pages.push_back(
          image.extract_area(left, *pageHeight * i + top, width, height));
      }

      // Reassemble the frames into a tall, thin image
      VImage assembled = VImage::arrayjoin(pages,
        VImage::option()->set("across", 1));

      // Update the page height
      *pageHeight = height;

      return assembled;
    }
  }

  /*
   * Split into frames, embed each frame, reassemble, and update pageHeight.
   */
  VImage EmbedMultiPage(VImage image, int left, int top, int width, int height,
                        std::vector<double> background, int nPages, int *pageHeight) {
    if (top == 0 && height == *pageHeight) {
      // Fast path; no need to adjust the height of the multi-page image
      return image.embed(left, 0, width, image.height(), VImage::option()
        ->set("extend", VIPS_EXTEND_BACKGROUND)
        ->set("background", background));
    } else if (left == 0 && width == image.width()) {
      // Fast path; no need to adjust the width of the multi-page image
      std::vector<VImage> pages;
      pages.reserve(nPages);

      // Rearrange the tall image into a vertical grid
      image = image.grid(*pageHeight, nPages, 1);

      // Do the embed on the wide image
      image = image.embed(0, top, image.width(), height, VImage::option()
        ->set("extend", VIPS_EXTEND_BACKGROUND)
        ->set("background", background));

      // Split the wide image into frames
      for (int i = 0; i < nPages; i++) {
        pages.push_back(
          image.extract_area(width * i, 0, width, height));
      }

      // Reassemble the frames into a tall, thin image
      VImage assembled = VImage::arrayjoin(pages,
        VImage::option()->set("across", 1));

      // Update the page height
      *pageHeight = height;

      return assembled;
    } else {
      std::vector<VImage> pages;
      pages.reserve(nPages);

      // Split the image into frames
      for (int i = 0; i < nPages; i++) {
        pages.push_back(
          image.extract_area(0, *pageHeight * i, image.width(), *pageHeight));
      }

      // Embed each frame in the target size
      for (int i = 0; i < nPages; i++) {
        pages[i] = pages[i].embed(left, top, width, height, VImage::option()
          ->set("extend", VIPS_EXTEND_BACKGROUND)
          ->set("background", background));
      }

      // Reassemble the frames into a tall, thin image
      VImage assembled = VImage::arrayjoin(pages,
        VImage::option()->set("across", 1));

      // Update the page height
      *pageHeight = height;

      return assembled;
    }
  }

}  // namespace sharp
