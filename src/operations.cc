// Copyright 2013, 2014, 2015, 2016, 2017 Lovell Fuller and contributors.
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
    Composite overlayImage over image at given position
    Assumes alpha channels are already premultiplied and will be unpremultiplied after
   */
  VImage Composite(VImage image, VImage overlayImage, int const left, int const top) {
    if (HasAlpha(overlayImage)) {
      // Alpha composite
      if (overlayImage.width() < image.width() || overlayImage.height() < image.height()) {
        // Enlarge overlay
        std::vector<double> const background { 0.0, 0.0, 0.0, 0.0 };
        overlayImage = overlayImage.embed(left, top, image.width(), image.height(), VImage::option()
          ->set("extend", VIPS_EXTEND_BACKGROUND)
          ->set("background", background));
      }
      return AlphaComposite(image, overlayImage);
    } else {
      if (HasAlpha(image)) {
        // Add alpha channel to overlayImage so channels match
        double const multiplier = sharp::Is16Bit(overlayImage.interpretation()) ? 256.0 : 1.0;
        overlayImage = overlayImage.bandjoin(
          VImage::new_matrix(overlayImage.width(), overlayImage.height()).new_from_image(255 * multiplier));
      }
      return image.insert(overlayImage, left, top);
    }
  }

  VImage AlphaComposite(VImage dst, VImage src) {
    // Split src into non-alpha and alpha channels
    VImage srcWithoutAlpha = src.extract_band(0, VImage::option()->set("n", src.bands() - 1));
    VImage srcAlpha = src[src.bands() - 1] * (1.0 / 255.0);

    // Split dst into non-alpha and alpha channels
    VImage dstWithoutAlpha = dst.extract_band(0, VImage::option()->set("n", dst.bands() - 1));
    VImage dstAlpha = dst[dst.bands() - 1] * (1.0 / 255.0);

    //
    // Compute normalized output alpha channel:
    //
    // References:
    // - http://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending
    // - https://github.com/jcupitt/ruby-vips/issues/28#issuecomment-9014826
    //
    // out_a = src_a + dst_a * (1 - src_a)
    //                         ^^^^^^^^^^^
    //                            t0
    VImage t0 = srcAlpha.linear(-1.0, 1.0);
    VImage outAlphaNormalized = srcAlpha + dstAlpha * t0;

    //
    // Compute output RGB channels:
    //
    // Wikipedia:
    // out_rgb = (src_rgb * src_a + dst_rgb * dst_a * (1 - src_a)) / out_a
    //                                                ^^^^^^^^^^^
    //                                                    t0
    //
    // Omit division by `out_a` since `Compose` is supposed to output a
    // premultiplied RGBA image as reversal of premultiplication is handled
    // externally.
    //
    VImage outRGBPremultiplied = srcWithoutAlpha + dstWithoutAlpha * t0;

    // Combine RGB and alpha channel into output image:
    return outRGBPremultiplied.bandjoin(outAlphaNormalized * 255.0);
  }

  /*
    Cutout src over dst with given gravity.
   */
  VImage Cutout(VImage mask, VImage dst, const int gravity) {
    using sharp::CalculateCrop;
    using sharp::HasAlpha;
    using sharp::MaximumImageAlpha;

    bool maskHasAlpha = HasAlpha(mask);

    if (!maskHasAlpha && mask.bands() > 1) {
      throw VError("Overlay image must have an alpha channel or one band");
    }
    if (!HasAlpha(dst)) {
      throw VError("Image to be overlaid must have an alpha channel");
    }
    if (mask.width() > dst.width() || mask.height() > dst.height()) {
      throw VError("Overlay image must have same dimensions or smaller");
    }

    // Enlarge overlay mask, if required
    if (mask.width() < dst.width() || mask.height() < dst.height()) {
      // Calculate the (left, top) coordinates of the output image within the input image, applying the given gravity.
      int left;
      int top;
      std::tie(left, top) = CalculateCrop(dst.width(), dst.height(), mask.width(), mask.height(), gravity);
      // Embed onto transparent background
      std::vector<double> background { 0.0, 0.0, 0.0, 0.0 };
      mask = mask.embed(left, top, dst.width(), dst.height(), VImage::option()
              ->set("extend", VIPS_EXTEND_BACKGROUND)
              ->set("background", background));
    }

    // we use the mask alpha if it has alpha
    if (maskHasAlpha) {
      mask = mask.extract_band(mask.bands() - 1, VImage::option()->set("n", 1));;
    }

    // Split dst into an optional alpha
    VImage dstAlpha = dst.extract_band(dst.bands() - 1, VImage::option()->set("n", 1));

    // we use the dst non-alpha
    dst = dst.extract_band(0, VImage::option()->set("n", dst.bands() - 1));

    // the range of the mask and the image need to match .. one could be
    // 16-bit, one 8-bit
    double const dstMax = MaximumImageAlpha(dst.interpretation());
    double const maskMax = MaximumImageAlpha(mask.interpretation());

    // combine the new mask and the existing alpha ... there are
    // many ways of doing this, mult is the simplest
    mask = dstMax * ((mask / maskMax) * (dstAlpha / dstMax));

    // append the mask to the image data ... the mask might be float now,
    // we must cast the format down to match the image data
    return dst.bandjoin(mask.cast(dst.format()));
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
   * Gamma encoding/decoding
   */
  VImage Gamma(VImage image, double const exponent) {
    if (HasAlpha(image)) {
      // Separate alpha channel
      VImage imageWithoutAlpha = image.extract_band(0,
        VImage::option()->set("n", image.bands() - 1));
      VImage alpha = image[image.bands() - 1];
      return imageWithoutAlpha.gamma(VImage::option()->set("exponent", exponent)).bandjoin(alpha);
    } else {
      return image.gamma(VImage::option()->set("exponent", exponent));
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

  /*
    Insert a tile cache to prevent over-computation of any previous operations in the pipeline
  */
  VImage TileCache(VImage image, double const factor) {
    int tile_width;
    int tile_height;
    int scanline_count;
    vips_get_tile_size(image.get_image(), &tile_width, &tile_height, &scanline_count);
    double const need_lines = 1.2 * scanline_count / factor;
    return image.tilecache(VImage::option()
      ->set("tile_width", image.width())
      ->set("tile_height", 10)
      ->set("max_tiles", static_cast<int>(round(1.0 + need_lines / 10.0)))
      ->set("access", VIPS_ACCESS_SEQUENTIAL)
      ->set("threaded", TRUE));
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

  VImage Trim(VImage image, int const tolerance) {
    using sharp::MaximumImageAlpha;
    // An equivalent of ImageMagick's -trim in C++ ... automatically remove
    // "boring" image edges.

    // We use .project to sum the rows and columns of a 0/255 mask image, the first
    // non-zero row or column is the object edge. We make the mask image with an
    // amount-different-from-background image plus a threshold.

    // find the value of the pixel at (0, 0) ... we will search for all pixels
    // significantly different from this
    std::vector<double> background = image(0, 0);

    double const max = MaximumImageAlpha(image.interpretation());

    // we need to smooth the image, subtract the background from every pixel, take
    // the absolute value of the difference, then threshold
    VImage mask = (image.median(3) - background).abs() > (max * tolerance / 100);

    // sum mask rows and columns, then search for the first non-zero sum in each
    // direction
    VImage rows;
    VImage columns = mask.project(&rows);

    VImage profileLeftV;
    VImage profileLeftH = columns.profile(&profileLeftV);

    VImage profileRightV;
    VImage profileRightH = columns.fliphor().profile(&profileRightV);

    VImage profileTopV;
    VImage profileTopH = rows.profile(&profileTopV);

    VImage profileBottomV;
    VImage profileBottomH = rows.flipver().profile(&profileBottomV);

    int left = static_cast<int>(floor(profileLeftV.min()));
    int right = columns.width() - static_cast<int>(floor(profileRightV.min()));
    int top = static_cast<int>(floor(profileTopH.min()));
    int bottom = rows.height() - static_cast<int>(floor(profileBottomH.min()));

    int width = right - left;
    int height = bottom - top;

    if (width <= 0 || height <= 0) {
      throw VError("Unexpected error while trimming. Try to lower the tolerance");
    }

    // and now crop the original image
    return image.extract_area(left, top, width, height);
  }

}  // namespace sharp
