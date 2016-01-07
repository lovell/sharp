#ifndef SRC_OPERATIONS_H_
#define SRC_OPERATIONS_H_

namespace sharp {

  /*
    Composite images `src` and `dst` with premultiplied alpha channel and output
    image with premultiplied alpha.
   */
  int Composite(VipsObject *context, VipsImage *src, VipsImage *dst, VipsImage **out);

  /*
   * Stretch luminance to cover full dynamic range.
   */
  int Normalize(VipsObject *context, VipsImage *image, VipsImage **out);

  /*
   * Gaussian blur. Use sigma of -1 for fast blur.
   */
  int Blur(VipsObject *context, VipsImage *image, VipsImage **out, double sigma);

  /*
   * Sharpen flat and jagged areas. Use radius of -1 for fast sharpen.
   */
  int Sharpen(VipsObject *context, VipsImage *image, VipsImage **out, int radius, double flat, double jagged);

  /*
   * Perform thresholding on an image.  If the image is not greyscale, will convert before thresholding.
   * Pixels with a greyscale value greater-than-or-equal-to `threshold` will be pure white.  All others will be pure black.
   */
  int Threshold(VipsObject *context, VipsImage *image, VipsImage **out, int threshold);
}  // namespace sharp

#endif  // SRC_OPERATIONS_H_
