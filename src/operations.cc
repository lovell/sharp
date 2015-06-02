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
    if (vips_extract_band(src, &srcWithoutAlpha, 0, "n", src->Bands - 1, NULL))
      return -1;
    vips_object_local(context, srcWithoutAlpha);
    VipsImage *srcAlpha;
    if (vips_extract_band(src, &srcAlpha, src->Bands - 1, "n", 1, NULL))
      return -1;
    vips_object_local(context, srcAlpha);

    // Split dst into non-alpha and alpha channels
    VipsImage *dstWithoutAlpha;
    VipsImage *dstAlpha;
    if (HasAlpha(dst)) {
      // Non-alpha: extract all-but-last channel
      if (vips_extract_band(dst, &dstWithoutAlpha, 0, "n", dst->Bands - 1, NULL)) {
        return -1;
      }
      vips_object_local(context, dstWithoutAlpha);
      // Alpha: Extract last channel
      if (vips_extract_band(dst, &dstAlpha, dst->Bands - 1, "n", 1, NULL)) {
        return -1;
      }
      vips_object_local(context, dstAlpha);
    } else {
      // Non-alpha: Copy reference
      dstWithoutAlpha = dst;
      // Alpha: Use blank, opaque (0xFF) image
      VipsImage *black;
      if (vips_black(&black, dst->Xsize, dst->Ysize, NULL)) {
        return -1;
      }
      vips_object_local(context, black);
      if (vips_invert(black, &dstAlpha, NULL)) {
        return -1;
      }
      vips_object_local(context, dstAlpha);
    }

    // Compute normalized input alpha channels:
    VipsImage *srcAlphaNormalized;
    if (vips_linear1(srcAlpha, &srcAlphaNormalized, 1.0 / 255.0, 0.0, NULL))
      return -1;
    vips_object_local(context, srcAlphaNormalized);

    VipsImage *dstAlphaNormalized;
    if (vips_linear1(dstAlpha, &dstAlphaNormalized, 1.0 / 255.0, 0.0, NULL))
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
    if (vips_linear1(srcAlphaNormalized, &t0, -1.0, 1.0, NULL))
      return -1;
    vips_object_local(context, t0);

    VipsImage *t1;
    if (vips_multiply(dstAlphaNormalized, t0, &t1, NULL))
      return -1;
    vips_object_local(context, t1);

    VipsImage *outAlphaNormalized;
    if (vips_add(srcAlphaNormalized, t1, &outAlphaNormalized, NULL))
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
    if (vips_multiply(dstWithoutAlpha, t0, &t2, NULL))
      return -1;
    vips_object_local(context, t2);

    VipsImage *outRGBPremultiplied;
    if (vips_add(srcWithoutAlpha, t2, &outRGBPremultiplied, NULL))
      return -1;
    vips_object_local(context, outRGBPremultiplied);

    // Denormalize output alpha channel:
    VipsImage *outAlpha;
    if (vips_linear1(outAlphaNormalized, &outAlpha, 255.0, 0.0, NULL))
      return -1;
    vips_object_local(context, outAlpha);

    // Combine RGB and alpha channel into output image:
    return vips_bandjoin2(outRGBPremultiplied, outAlpha, out, NULL);
  }

  /*
   * Premultiply alpha channel of `image`.
   */
  int Premultiply(VipsObject *context, VipsImage *image, VipsImage **out) {
#if (VIPS_MAJOR_VERSION >= 9 || (VIPS_MAJOR_VERSION >= 8 && VIPS_MINOR_VERSION >= 1))
    return vips_premultiply(image, out, NULL);
#else
    VipsImage *imageRGB;
    if (vips_extract_band(image, &imageRGB, 0, "n", image->Bands - 1, NULL))
      return -1;
    vips_object_local(context, imageRGB);

    VipsImage *imageAlpha;
    if (vips_extract_band(image, &imageAlpha, image->Bands - 1, "n", 1, NULL))
      return -1;
    vips_object_local(context, imageAlpha);

    VipsImage *imageAlphaNormalized;
    if (vips_linear1(imageAlpha, &imageAlphaNormalized, 1.0 / 255.0, 0.0, NULL))
      return -1;
    vips_object_local(context, imageAlphaNormalized);

    VipsImage *imageRGBPremultiplied;
    if (vips_multiply(imageRGB, imageAlphaNormalized, &imageRGBPremultiplied, NULL))
      return -1;
    vips_object_local(context, imageRGBPremultiplied);

    return vips_bandjoin2(imageRGBPremultiplied, imageAlpha, out, NULL);
#endif
  }

  /*
   * Unpremultiply alpha channel of `image`.
   */
  int Unpremultiply(VipsObject *context, VipsImage *image, VipsImage **out) {
#if (VIPS_MAJOR_VERSION >= 9 || (VIPS_MAJOR_VERSION >= 8 && VIPS_MINOR_VERSION >= 1))
    return vips_unpremultiply(image, out, NULL);
#else
    VipsImage *imageRGBPremultipliedTransformed;
    if (vips_extract_band(image, &imageRGBPremultipliedTransformed, 0, "n", image->Bands - 1, NULL))
      return -1;
    vips_object_local(context, imageRGBPremultipliedTransformed);

    VipsImage *imageAlphaTransformed;
    if (vips_extract_band(image, &imageAlphaTransformed, image->Bands - 1, "n", 1, NULL))
      return -1;
    vips_object_local(context, imageAlphaTransformed);

    VipsImage *imageAlphaNormalizedTransformed;
    if (vips_linear1(imageAlphaTransformed, &imageAlphaNormalizedTransformed, 1.0 / 255.0, 0.0, NULL))
      return -1;
    vips_object_local(context, imageAlphaNormalizedTransformed);

    VipsImage *imageRGBUnpremultipliedTransformed;
    if (vips_divide(imageRGBPremultipliedTransformed, imageAlphaNormalizedTransformed, &imageRGBUnpremultipliedTransformed, NULL))
      return -1;
    vips_object_local(context, imageRGBUnpremultipliedTransformed);

    return vips_bandjoin2(imageRGBUnpremultipliedTransformed, imageAlphaTransformed, out, NULL);
#endif
  }

}  // namespace sharp
