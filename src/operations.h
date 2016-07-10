#ifndef SRC_OPERATIONS_H_
#define SRC_OPERATIONS_H_

#include <tuple>
#include <memory>
#include <vips/vips8>

using vips::VImage;

namespace sharp {

  /*
    Alpha composite src over dst with given gravity.
    Assumes alpha channels are already premultiplied and will be unpremultiplied after.
   */
  VImage Composite(VImage src, VImage dst, const int gravity);

  /*
    Alpha composite src over dst with given x and y offsets.
    Assumes alpha channels are already premultiplied and will be unpremultiplied after.
   */
  VImage Composite(VImage src, VImage dst, const int x, const int y);

  /*
    Check if the src and dst Images for composition operation are valid
  */
  bool IsInputValidForComposition(VImage src, VImage dst);

  /*
    Given a valid src and dst, returns the composite of the two images
  */
  VImage CompositeImage(VImage src, VImage dst);

  /*
    Cutout src over dst with given gravity.
  */
  VImage Cutout(VImage src, VImage dst, const int gravity);

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
   * Convolution with a kernel.
   */
  VImage Convolve(VImage image, int const width, int const height,
    double const scale, double const offset, std::unique_ptr<double[]> const &kernel_v);

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

  /*
    Threshold an image
  */
  VImage Threshold(VImage image, double const threshold, bool const thresholdColor);

  /*
    Perform boolean/bitwise operation on image color channels - results in one channel image
  */
  VImage Bandbool(VImage image, VipsOperationBoolean const boolean);

  /*
    Perform bitwise boolean operation between images
  */
  VImage Boolean(VImage image, VImage imageR, VipsOperationBoolean const boolean);

  /*
    Trim an image
  */
  VImage Trim(VImage image, int const tolerance);

}  // namespace sharp

#endif  // SRC_OPERATIONS_H_
