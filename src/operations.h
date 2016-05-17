#ifndef SRC_OPERATIONS_H_
#define SRC_OPERATIONS_H_

#include <tuple>
#include <vips/vips8>

using vips::VImage;

namespace sharp {

  /*
    Alpha composite src over dst with given gravity.
    Assumes alpha channels are already premultiplied and will be unpremultiplied after.
   */
  VImage Composite(VImage src, VImage dst, const int gravity);

  /*
   * Stretch luminance to cover full dynamic range.
   */
  VImage Normalize(VImage image);

  /*
   * Gamma encoding/decoding
   */
  VImage Gamma(VImage image, double const exponent);

  /*
   * Gaussian blur. Use sigma of -1.0 for fast blur.
   */
  VImage Blur(VImage image, double const sigma);

  /*
   * Sharpen flat and jagged areas. Use sigma of -1.0 for fast sharpen.
   */
  VImage Sharpen(VImage image, double const sigma, double const flat, double const jagged);

  /*
    Calculate crop area based on image entropy
  */
  std::tuple<int, int> EntropyCrop(VImage image, int const outWidth, int const outHeight);

  /*
    Calculate the Shannon entropy for an image
  */
  double Entropy(VImage image);

  /*
    Insert a tile cache to prevent over-computation of any previous operations in the pipeline
  */
  VImage TileCache(VImage image, double const factor);

}  // namespace sharp

#endif  // SRC_OPERATIONS_H_
