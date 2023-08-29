## metadata
> metadata([callback]) ⇒ <code>Promise.&lt;Object&gt;</code> \| <code>Sharp</code>

Fast access to (uncached) image metadata without decoding any compressed pixel data.

This is read from the header of the input image.
It does not take into consideration any operations to be applied to the output image,
such as resize or rotate.

Dimensions in the response will respect the `page` and `pages` properties of the
[constructor parameters](/api-constructor#parameters).

A `Promise` is returned when `callback` is not provided.

- `format`: Name of decoder used to decompress image data e.g. `jpeg`, `png`, `webp`, `gif`, `svg`
- `size`: Total size of image in bytes, for Stream and Buffer input only
- `width`: Number of pixels wide (EXIF orientation is not taken into consideration, see example below)
- `height`: Number of pixels high (EXIF orientation is not taken into consideration, see example below)
- `space`: Name of colour space interpretation e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://www.libvips.org/API/current/VipsImage.html#VipsInterpretation)
- `channels`: Number of bands e.g. `3` for sRGB, `4` for CMYK
- `depth`: Name of pixel depth format e.g. `uchar`, `char`, `ushort`, `float` [...](https://www.libvips.org/API/current/VipsImage.html#VipsBandFormat)
- `density`: Number of pixels per inch (DPI), if present
- `chromaSubsampling`: String containing JPEG chroma subsampling, `4:2:0` or `4:4:4` for RGB, `4:2:0:4` or `4:4:4:4` for CMYK
- `isProgressive`: Boolean indicating whether the image is interlaced using a progressive scan
- `pages`: Number of pages/frames contained within the image, with support for TIFF, HEIF, PDF, animated GIF and animated WebP
- `pageHeight`: Number of pixels high each page in a multi-page image will be.
- `paletteBitDepth`: Bit depth of palette-based image (GIF, PNG).
- `loop`: Number of times to loop an animated image, zero refers to a continuous loop.
- `delay`: Delay in ms between each page in an animated image, provided as an array of integers.
- `pagePrimary`: Number of the primary page in a HEIF image
- `levels`: Details of each level in a multi-level image provided as an array of objects, requires libvips compiled with support for OpenSlide
- `subifds`: Number of Sub Image File Directories in an OME-TIFF image
- `background`: Default background colour, if present, for PNG (bKGD) and GIF images, either an RGB Object or a single greyscale value
- `compression`: The encoder used to compress an HEIF file, `av1` (AVIF) or `hevc` (HEIC)
- `resolutionUnit`: The unit of resolution (density), either `inch` or `cm`, if present
- `hasProfile`: Boolean indicating the presence of an embedded ICC profile
- `hasAlpha`: Boolean indicating the presence of an alpha transparency channel
- `orientation`: Number value of the EXIF Orientation header, if present
- `exif`: Buffer containing raw EXIF data, if present
- `icc`: Buffer containing raw [ICC](https://www.npmjs.com/package/icc) profile data, if present
- `iptc`: Buffer containing raw IPTC data, if present
- `xmp`: Buffer containing raw XMP data, if present
- `tifftagPhotoshop`: Buffer containing raw TIFFTAG_PHOTOSHOP data, if present
- `formatMagick`: String containing format for images loaded via *magick



| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | called with the arguments `(err, metadata)` |

**Example**  
```js
const metadata = await sharp(input).metadata();
```
**Example**  
```js
const image = sharp(inputJpg);
image
  .metadata()
  .then(function(metadata) {
    return image
      .resize(Math.round(metadata.width / 2))
      .webp()
      .toBuffer();
  })
  .then(function(data) {
    // data contains a WebP image half the width and height of the original JPEG
  });
```
**Example**  
```js
// Based on EXIF rotation metadata, get the right-side-up width and height:

const size = getNormalSize(await sharp(input).metadata());

function getNormalSize({ width, height, orientation }) {
  return (orientation || 0) >= 5
    ? { width: height, height: width }
    : { width, height };
}
```


## stats
> stats([callback]) ⇒ <code>Promise.&lt;Object&gt;</code>

Access to pixel-derived image statistics for every channel in the image.
A `Promise` is returned when `callback` is not provided.

- `channels`: Array of channel statistics for each channel in the image. Each channel statistic contains
    - `min` (minimum value in the channel)
    - `max` (maximum value in the channel)
    - `sum` (sum of all values in a channel)
    - `squaresSum` (sum of squared values in a channel)
    - `mean` (mean of the values in a channel)
    - `stdev` (standard deviation for the values in a channel)
    - `minX` (x-coordinate of one of the pixel where the minimum lies)
    - `minY` (y-coordinate of one of the pixel where the minimum lies)
    - `maxX` (x-coordinate of one of the pixel where the maximum lies)
    - `maxY` (y-coordinate of one of the pixel where the maximum lies)
- `isOpaque`: Is the image fully opaque? Will be `true` if the image has no alpha channel or if every pixel is fully opaque.
- `entropy`: Histogram-based estimation of greyscale entropy, discarding alpha channel if any.
- `sharpness`: Estimation of greyscale sharpness based on the standard deviation of a Laplacian convolution, discarding alpha channel if any.
- `dominant`: Object containing most dominant sRGB colour based on a 4096-bin 3D histogram.

**Note**: Statistics are derived from the original input image. Any operations performed on the image must first be
written to a buffer in order to run `stats` on the result (see third example).



| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | called with the arguments `(err, stats)` |

**Example**  
```js
const image = sharp(inputJpg);
image
  .stats()
  .then(function(stats) {
     // stats contains the channel-wise statistics array and the isOpaque value
  });
```
**Example**  
```js
const { entropy, sharpness, dominant } = await sharp(input).stats();
const { r, g, b } = dominant;
```
**Example**  
```js
const image = sharp(input);
// store intermediate result
const part = await image.extract(region).toBuffer();
// create new instance to obtain statistics of extracted region
const stats = await sharp(part).stats();
```