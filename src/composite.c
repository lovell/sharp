#include <stdio.h>
#include <vips/vips.h>


const int ALPHA_BAND_INDEX = 3;
const int NUM_COLOR_BANDS = 3;


/*
  Composite images `src` and `dst`
 */
int Composite(VipsObject *context, VipsImage *src, VipsImage *dst, VipsImage **out) {
  if (src->Bands != 4 || dst->Bands != 4)
    return -1;

  // Extract RGB bands:
  VipsImage *srcRGB;
  VipsImage *dstRGB;
  if (vips_extract_band(src, &srcRGB, 0, "n", NUM_COLOR_BANDS, NULL) ||
      vips_extract_band(dst, &dstRGB, 0, "n", NUM_COLOR_BANDS, NULL))
    return -1;

  vips_object_local(context, srcRGB);
  vips_object_local(context, dstRGB);

  // Extract alpha bands:
  VipsImage *srcAlpha;
  VipsImage *dstAlpha;
  if (vips_extract_band(src, &srcAlpha, ALPHA_BAND_INDEX, NULL) ||
      vips_extract_band(dst, &dstAlpha, ALPHA_BAND_INDEX, NULL))
    return -1;

  vips_object_local(context, srcAlpha);
  vips_object_local(context, dstAlpha);

  // Compute normalized input alpha channels:
  VipsImage *srcAlphaNormalized;
  VipsImage *dstAlphaNormalized;
  if (vips_linear1(srcAlpha, &srcAlphaNormalized, 1.0 / 255.0, 0.0, NULL) ||
      vips_linear1(dstAlpha, &dstAlphaNormalized, 1.0 / 255.0, 0.0, NULL))
    return -1;

  vips_object_local(context, srcAlphaNormalized);
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
  VipsImage *t1;
  VipsImage *outAlphaNormalized;
  if (vips_linear1(srcAlphaNormalized, &t0, -1.0, 1.0, NULL) ||
      vips_multiply(dstAlphaNormalized, t0, &t1, NULL) ||
      vips_add(srcAlphaNormalized, t1, &outAlphaNormalized, NULL))
    return -1;

  vips_object_local(context, t0);
  vips_object_local(context, t1);
  vips_object_local(context, outAlphaNormalized);

  //
  // Compute output RGB channels:
  //
  // Wikipedia:
  // out_rgb = (src_rgb * src_a + dst_rgb * dst_a * (1 - src_a)) / out_a
  //
  // `vips_ifthenelse` with `blend=TRUE`: http://bit.ly/1KoSsga
  // out = (cond / 255) * in1 + (1 - cond / 255) * in2
  //
  // Substitutions:
  //
  //     cond --> src_a
  //     in1 --> src_rgb
  //     in2 --> dst_rgb * dst_a (premultiplied destination RGB)
  //
  // Finally, manually divide by `out_a` to unpremultiply the RGB channels.
  // Failing to do so results in darker than expected output with low
  // opacity images.
  //
  VipsImage *dstRGBPremultiplied;
  if (vips_multiply(dstRGB, dstAlphaNormalized, &dstRGBPremultiplied, NULL))
    return -1;

  vips_object_local(context, dstRGBPremultiplied);

  VipsImage *outRGBPremultiplied;
  if (vips_ifthenelse(srcAlpha, srcRGB, dstRGBPremultiplied,
      &outRGBPremultiplied, "blend", TRUE, NULL))
    return -1;

  vips_object_local(context, outRGBPremultiplied);

  // Unpremultiply RGB channels:
  VipsImage *outRGB;
  if (vips_divide(outRGBPremultiplied, outAlphaNormalized, &outRGB, NULL))
    return -1;

  vips_object_local(context, outRGB);

  // Denormalize output alpha channel:
  VipsImage *outAlpha;
  if (vips_linear1(outAlphaNormalized, &outAlpha, 255.0, 0.0, NULL))
    return -1;

  vips_object_local(context, outAlpha);

  // Combine RGB and alpha channel into output image:
  VipsImage *joined;
  if (vips_bandjoin2(outRGB, outAlpha, &joined, NULL))
    return -1;

  // Return a reference to the output image:
  *out = joined;

  return 0;
}
