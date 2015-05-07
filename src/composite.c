#include <stdio.h>
#include <vips/vips.h>


// Constants
const int ALPHA_BAND_INDEX = 3;
const int NUM_COLOR_BANDS = 3;

// TODO: Copied from `common.cc`. Deduplicate once this becomes a C++ module.
int HasAlpha(VipsImage *image) {
  return (
    (image->Bands == 2 && image->Type == VIPS_INTERPRETATION_B_W) ||
    (image->Bands == 4 && image->Type != VIPS_INTERPRETATION_CMYK) ||
    (image->Bands == 5 && image->Type == VIPS_INTERPRETATION_CMYK)
  );
}

/*
  Composite images `src` and `dst` with premultiplied alpha channel and output
  image with premultiplied alpha.
 */
int Composite(VipsObject *context, VipsImage *srcPremultiplied, VipsImage *dstPremultiplied, VipsImage **outPremultiplied) {
  if (srcPremultiplied->Bands != 4 || dstPremultiplied->Bands != 4)
    return -1;

  // Extract RGB bands:
  VipsImage *srcRGBPremultiplied;
  if (vips_extract_band(srcPremultiplied, &srcRGBPremultiplied, 0, "n", NUM_COLOR_BANDS, NULL))
    return -1;
  vips_object_local(context, srcRGBPremultiplied);

  VipsImage *dstRGBPremultiplied;
  if (vips_extract_band(dstPremultiplied, &dstRGBPremultiplied, 0, "n", NUM_COLOR_BANDS, NULL))
    return -1;
  vips_object_local(context, dstRGBPremultiplied);

  // Extract alpha bands:
  VipsImage *srcAlpha;
  if (vips_extract_band(srcPremultiplied, &srcAlpha, ALPHA_BAND_INDEX, "n", 1, NULL))
    return -1;
  vips_object_local(context, srcAlpha);

  VipsImage *dstAlpha;
  if (vips_extract_band(dstPremultiplied, &dstAlpha, ALPHA_BAND_INDEX, "n", 1, NULL))
    return -1;
  vips_object_local(context, dstAlpha);

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
  if (vips_multiply(dstRGBPremultiplied, t0, &t2, NULL))
    return -1;
  vips_object_local(context, t2);

  VipsImage *outRGBPremultiplied;
  if (vips_add(srcRGBPremultiplied, t2, &outRGBPremultiplied, NULL))
    return -1;
  vips_object_local(context, outRGBPremultiplied);

  // Denormalize output alpha channel:
  VipsImage *outAlpha;
  if (vips_linear1(outAlphaNormalized, &outAlpha, 255.0, 0.0, NULL))
    return -1;
  vips_object_local(context, outAlpha);

  // Combine RGB and alpha channel into output image:
  VipsImage *joined;
  if (vips_bandjoin2(outRGBPremultiplied, outAlpha, &joined, NULL))
    return -1;

  // Return a reference to the composited output image:
  *outPremultiplied = joined;

  return 0;
}

/*
 * Premultiply alpha channel of `image`.
 */
int Premultiply(VipsObject *context, VipsImage *image, VipsImage **out) {
  VipsImage *imagePremultiplied;

  // Trivial case: Copy images without alpha channel:
  if (!HasAlpha(image)) {
    return vips_image_write(image, *out);
  }

#if (VIPS_MAJOR_VERSION >= 9 || (VIPS_MAJOR_VERSION >= 8 && VIPS_MINOR_VERSION >= 1))

  if (vips_premultiply(image, &imagePremultiplied, NULL))
    return -1;

#else

  if (image->Bands != 4)
    return -1;

  VipsImage *imageRGB;
  if (vips_extract_band(image, &imageRGB, 0, "n", NUM_COLOR_BANDS, NULL))
    return -1;
  vips_object_local(context, imageRGB);

  VipsImage *imageAlpha;
  if (vips_extract_band(image, &imageAlpha, ALPHA_BAND_INDEX, "n", 1, NULL))
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

  if (vips_bandjoin2(imageRGBPremultiplied, imageAlpha, &imagePremultiplied, NULL))
    return -1;

#endif

  // Return a reference to the premultiplied output image:
  *out = imagePremultiplied;

  return 0;

}

/*
 * Unpremultiply alpha channel of `image`.
 */
int Unpremultiply(VipsObject *context, VipsImage *image, VipsImage **out) {
  VipsImage *imageUnpremultiplied;

  // Trivial case: Copy images without alpha channel:
  if (!HasAlpha(image)) {
    return vips_image_write(image, *out);
  }

#if (VIPS_MAJOR_VERSION >= 9 || (VIPS_MAJOR_VERSION >= 8 && VIPS_MINOR_VERSION >= 1))

  if (vips_unpremultiply(image, &imageUnpremultiplied, NULL))
    return -1;

#else

  if (image->Bands != 4)
    return -1;

  VipsImage *imageRGBPremultipliedTransformed;
  if (vips_extract_band(image, &imageRGBPremultipliedTransformed, 0, "n", NUM_COLOR_BANDS, NULL))
    return -1;
  vips_object_local(context, imageRGBPremultipliedTransformed);

  VipsImage *imageAlphaTransformed;
  if (vips_extract_band(image, &imageAlphaTransformed, ALPHA_BAND_INDEX, "n", 1, NULL))
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

  if (vips_bandjoin2(imageRGBUnpremultipliedTransformed, imageAlphaTransformed, &imageUnpremultiplied, NULL))
    return -1;


#endif

  // Return a reference to the unpremultiplied output image:
  *out = imageUnpremultiplied;

  return 0;
}
