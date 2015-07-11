#ifndef SRC_OPERATIONS_H_
#define SRC_OPERATIONS_H_

namespace sharp {

  /*
    Composite images `src` and `dst` with premultiplied alpha channel and output
    image with premultiplied alpha.
   */
  int Composite(VipsObject *context, VipsImage *src, VipsImage *dst, VipsImage **out);

  /*
   * Premultiply alpha channel of `image`.
   */
  int Premultiply(VipsObject *context, VipsImage *image, VipsImage **out);

  /*
   * Unpremultiply alpha channel of `image`.
   */
  int Unpremultiply(VipsObject *context, VipsImage *image, VipsImage **out);

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

}  // namespace sharp

#endif  // SRC_OPERATIONS_H_
