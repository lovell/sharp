// Copyright 2013, 2014, 2015, 2016, 2017 Lovell Fuller and contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#ifndef SRC_OPERATIONS_H_
#define SRC_OPERATIONS_H_

#include <algorithm>
#include <functional>
#include <memory>
#include <tuple>
#include <vips/vips8>

using vips::VImage;

namespace sharp {

  /*
    Removes alpha channel, if any.
  */
  VImage RemoveAlpha(VImage image);

  /*
    Alpha composite src over dst with given gravity.
    Assumes alpha channels are already premultiplied and will be unpremultiplied after.
   */
  VImage Composite(VImage src, VImage dst, const int gravity);

  /*
    Composite overlayImage over image at given position
   */
  VImage Composite(VImage image, VImage overlayImage, int const x, int const y);

  /*
    Alpha composite overlayImage over image, assumes matching dimensions
  */
  VImage AlphaComposite(VImage image, VImage overlayImage);

  /*
    Cutout src over dst with given gravity.
  */
  VImage Cutout(VImage src, VImage dst, const int gravity);

  /*
   * Tint an image using the specified chroma, preserving the original image luminance
   */
  VImage Tint(VImage image, double const a, double const b);

  /*
   * Stretch luminance to cover full dynamic range.
   */
  VImage Normalise(VImage image);

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
  VImage Trim(VImage image, double const threshold);

  /*
   * Linear adjustment (a * in + b)
   */
  VImage Linear(VImage image, double const a, double const b);

}  // namespace sharp

#endif  // SRC_OPERATIONS_H_
