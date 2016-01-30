#ifndef SRC_OPERATIONS_H_
#define SRC_OPERATIONS_H_

#include <vips/vips8>

using vips::VImage;

namespace sharp {

  /*
    Composite images `src` and `dst` with premultiplied alpha channel and output
    image with premultiplied alpha.
   */
  VImage Composite(VImage src, VImage dst);

  /*
   * Stretch luminance to cover full dynamic range.
   */
  VImage Normalize(VImage image);

  /*
   * Gamma encoding/decoding
   */
  VImage Gamma(VImage image, double const exponent);

  /*
   * Gaussian blur. Use sigma of -1 for fast blur.
   */
  VImage Blur(VImage image, double const sigma);

  /*
   * Sharpen flat and jagged areas. Use radius of -1 for fast sharpen.
   */
  VImage Sharpen(VImage image, int const radius, double const flat, double const jagged);
}  // namespace sharp

#endif  // SRC_OPERATIONS_H_
