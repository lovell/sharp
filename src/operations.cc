#include <vips/vips8>

#include "common.h"
#include "operations.h"

using vips::VImage;

namespace sharp {

  /*
    Alpha composite src over dst
    Assumes alpha channels are already premultiplied and will be unpremultiplied after
   */
  VImage Composite(VImage src, VImage dst) {
    using sharp::HasAlpha;

    // Split src into non-alpha and alpha
    VImage srcWithoutAlpha = src.extract_band(0, VImage::option()->set("n", src.bands() - 1));
    VImage srcAlpha = src[src.bands() - 1] * (1.0 / 255.0);

    // Split dst into non-alpha and alpha channels
    VImage dstWithoutAlpha;
    VImage dstAlpha;
    if (HasAlpha(dst)) {
      // Non-alpha: extract all-but-last channel
      dstWithoutAlpha = dst.extract_band(0, VImage::option()->set("n", dst.bands() - 1));
      // Alpha: Extract last channel
      dstAlpha = dst[dst.bands() - 1] * (1.0 / 255.0);
    } else {
      // Non-alpha: Copy reference
      dstWithoutAlpha = dst;
      // Alpha: Use blank, opaque (0xFF) image
      dstAlpha = VImage::black(dst.width(), dst.height()).invert();
    }

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
   * Stretch luminance to cover full dynamic range.
   */
  VImage Normalize(VImage image) {
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
   * Gaussian blur (use sigma <0 for fast blur)
   */
  VImage Blur(VImage image, double const sigma) {
    if (sigma < 0.0) {
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
   * Sharpen flat and jagged areas. Use radius of -1 for fast sharpen.
   */
  VImage Sharpen(VImage image, int const radius, double const flat, double const jagged) {
    if (radius == -1) {
      // Fast, mild sharpen
      VImage sharpen = VImage::new_matrixv(3, 3,
        -1.0, -1.0, -1.0,
        -1.0, 32.0, -1.0,
        -1.0, -1.0, -1.0);
      sharpen.set("scale", 24.0);
      return image.conv(sharpen);
    } else {
      // Slow, accurate sharpen in LAB colour space, with control over flat vs jagged areas
      return image.sharpen(
        VImage::option()->set("radius", radius)->set("m1", flat)->set("m2", jagged)
      );
    }
  }
}  // namespace sharp
