#include <vips/vips.h>

#include "common.h"
#include "operations.h"

namespace sharp {

  /*
    Alpha composite src over dst
    Assumes alpha channels are already premultiplied and will be unpremultiplied after
   */
  int Composite(VipsObject *context, VipsImage *src, VipsImage *dst, VipsImage **out) {
    using sharp::HasAlpha;

    // Split src into non-alpha and alpha
    VipsImage *srcWithoutAlpha;
    if (vips_extract_band(src, &srcWithoutAlpha, 0, "n", src->Bands - 1, nullptr))
      return -1;
    vips_object_local(context, srcWithoutAlpha);
    VipsImage *srcAlpha;
    if (vips_extract_band(src, &srcAlpha, src->Bands - 1, "n", 1, nullptr))
      return -1;
    vips_object_local(context, srcAlpha);

    // Split dst into non-alpha and alpha channels
    VipsImage *dstWithoutAlpha;
    VipsImage *dstAlpha;
    if (HasAlpha(dst)) {
      // Non-alpha: extract all-but-last channel
      if (vips_extract_band(dst, &dstWithoutAlpha, 0, "n", dst->Bands - 1, nullptr)) {
        return -1;
      }
      vips_object_local(context, dstWithoutAlpha);
      // Alpha: Extract last channel
      if (vips_extract_band(dst, &dstAlpha, dst->Bands - 1, "n", 1, nullptr)) {
        return -1;
      }
      vips_object_local(context, dstAlpha);
    } else {
      // Non-alpha: Copy reference
      dstWithoutAlpha = dst;
      // Alpha: Use blank, opaque (0xFF) image
      VipsImage *black;
      if (vips_black(&black, dst->Xsize, dst->Ysize, nullptr)) {
        return -1;
      }
      vips_object_local(context, black);
      if (vips_invert(black, &dstAlpha, nullptr)) {
        return -1;
      }
      vips_object_local(context, dstAlpha);
    }

    // Compute normalized input alpha channels:
    VipsImage *srcAlphaNormalized;
    if (vips_linear1(srcAlpha, &srcAlphaNormalized, 1.0 / 255.0, 0.0, nullptr))
      return -1;
    vips_object_local(context, srcAlphaNormalized);

    VipsImage *dstAlphaNormalized;
    if (vips_linear1(dstAlpha, &dstAlphaNormalized, 1.0 / 255.0, 0.0, nullptr))
      return -1;
    vips_object_local(context, dstAlphaNormalized);

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
    //                 ^^^^^^^^^^^^^^^^^^^
    //                         t1
    VipsImage *t0;
    if (vips_linear1(srcAlphaNormalized, &t0, -1.0, 1.0, nullptr))
      return -1;
    vips_object_local(context, t0);

    VipsImage *t1;
    if (vips_multiply(dstAlphaNormalized, t0, &t1, nullptr))
      return -1;
    vips_object_local(context, t1);

    VipsImage *outAlphaNormalized;
    if (vips_add(srcAlphaNormalized, t1, &outAlphaNormalized, nullptr))
      return -1;
    vips_object_local(context, outAlphaNormalized);

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
    VipsImage *t2;
    if (vips_multiply(dstWithoutAlpha, t0, &t2, nullptr))
      return -1;
    vips_object_local(context, t2);

    VipsImage *outRGBPremultiplied;
    if (vips_add(srcWithoutAlpha, t2, &outRGBPremultiplied, nullptr))
      return -1;
    vips_object_local(context, outRGBPremultiplied);

    // Denormalize output alpha channel:
    VipsImage *outAlpha;
    if (vips_linear1(outAlphaNormalized, &outAlpha, 255.0, 0.0, nullptr))
      return -1;
    vips_object_local(context, outAlpha);

    // Combine RGB and alpha channel into output image:
    return vips_bandjoin2(outRGBPremultiplied, outAlpha, out, nullptr);
  }

  /*
   * Stretch luminance to cover full dynamic range.
   */
  int Normalize(VipsObject *context, VipsImage *image, VipsImage **out) {
    // Get original colourspace
    VipsInterpretation typeBeforeNormalize = image->Type;
    if (typeBeforeNormalize == VIPS_INTERPRETATION_RGB) {
      typeBeforeNormalize = VIPS_INTERPRETATION_sRGB;
    }
    // Convert to LAB colourspace
    VipsImage *lab;
    if (vips_colourspace(image, &lab, VIPS_INTERPRETATION_LAB, nullptr)) {
      return -1;
    }
    vips_object_local(context, lab);
    // Extract luminance
    VipsImage *luminance;
    if (vips_extract_band(lab, &luminance, 0, "n", 1, nullptr)) {
      return -1;
    }
    vips_object_local(context, luminance);
    // Extract chroma
    VipsImage *chroma;
    if (vips_extract_band(lab, &chroma, 1, "n", 2, nullptr)) {
      return -1;
    }
    vips_object_local(context, chroma);
    // Find luminance range
    VipsImage *stats;
    if (vips_stats(luminance, &stats, nullptr)) {
      return -1;
    }
    vips_object_local(context, stats);
    double min = *VIPS_MATRIX(stats, 0, 0);
    double max = *VIPS_MATRIX(stats, 1, 0);
    if (min != max) {
      double f = 100.0 / (max - min);
      double a = -(min * f);
      // Scale luminance
      VipsImage *luminance100;
      if (vips_linear1(luminance, &luminance100, f, a, nullptr)) {
        return -1;
      }
      vips_object_local(context, luminance100);
      // Join scaled luminance to chroma
      VipsImage *normalizedLab;
      if (vips_bandjoin2(luminance100, chroma, &normalizedLab, nullptr)) {
        return -1;
      }
      vips_object_local(context, normalizedLab);
      // Convert to original colourspace
      VipsImage *normalized;
      if (vips_colourspace(normalizedLab, &normalized, typeBeforeNormalize, nullptr)) {
        return -1;
      }
      vips_object_local(context, normalized);
      // Attach original alpha channel, if any
      if (HasAlpha(image)) {
        // Extract original alpha channel
        VipsImage *alpha;
        if (vips_extract_band(image, &alpha, image->Bands - 1, "n", 1, nullptr)) {
          return -1;
        }
        vips_object_local(context, alpha);
        // Join alpha channel to normalised image
        VipsImage *normalizedAlpha;
        if (vips_bandjoin2(normalized, alpha, &normalizedAlpha, nullptr)) {
          return -1;
        }
        vips_object_local(context, normalizedAlpha);
        *out = normalizedAlpha;
      } else {
        *out = normalized;
      }
    } else {
      // Cannot normalise zero-range image
      *out = image;
    }
    return 0;
  }

  /*
   * Gaussian blur (use sigma <0 for fast blur)
   */
  int Blur(VipsObject *context, VipsImage *image, VipsImage **out, double sigma) {
    VipsImage *blurred;
    if (sigma < 0.0) {
      // Fast, mild blur - averages neighbouring pixels
      VipsImage *blur = vips_image_new_matrixv(3, 3,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0);
      vips_image_set_double(blur, "scale", 9);
      vips_object_local(context, blur);
      if (vips_conv(image, &blurred, blur, nullptr)) {
        return -1;
      }
    } else {
      // Slower, accurate Gaussian blur
      // Create Gaussian function for standard deviation
      VipsImage *gaussian;
      if (vips_gaussmat(&gaussian, sigma, 0.2, "separable", TRUE, "integer", TRUE, nullptr)) {
        return -1;
      }
      vips_object_local(context, gaussian);
      // Apply Gaussian function
      if (vips_convsep(image, &blurred, gaussian, "precision", VIPS_PRECISION_INTEGER, nullptr)) {
        return -1;
      }
    }
    vips_object_local(context, blurred);
    *out = blurred;
    return 0;
  }

  /*
   * Sharpen flat and jagged areas. Use radius of -1 for fast sharpen.
   */
  int Sharpen(VipsObject *context, VipsImage *image, VipsImage **out, int radius, double flat, double jagged) {
    VipsImage *sharpened;
    if (radius == -1) {
      // Fast, mild sharpen
      VipsImage *sharpen = vips_image_new_matrixv(3, 3,
        -1.0, -1.0, -1.0,
        -1.0, 32.0, -1.0,
        -1.0, -1.0, -1.0);
      vips_image_set_double(sharpen, "scale", 24);
      vips_object_local(context, sharpen);
      if (vips_conv(image, &sharpened, sharpen, nullptr)) {
        return -1;
      }
    } else {
      // Slow, accurate sharpen in LAB colour space, with control over flat vs jagged areas
      if (vips_sharpen(image, &sharpened, "radius", radius, "m1", flat, "m2", jagged, nullptr)) {
        return -1;
      }
    }
    vips_object_local(context, sharpened);
    *out = sharpened;
    return 0;
  }

  int Threshold(VipsObject *context, VipsImage *image, VipsImage **out, int threshold) {
      VipsImage *greyscale;
      if (vips_colourspace(image, &greyscale, VIPS_INTERPRETATION_B_W, nullptr)) {
        return -1;
      }
      vips_object_local(context, greyscale);
      image = greyscale;

      VipsImage *thresholded;
      if (vips_moreeq_const1(image, &thresholded, threshold, nullptr)) {
          return -1;
      }
      vips_object_local(context, thresholded);
      *out = thresholded;
      return 0;
  }
}  // namespace sharp
