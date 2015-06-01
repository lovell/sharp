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

}  // namespace sharp

#endif  // SRC_OPERATIONS_H_
