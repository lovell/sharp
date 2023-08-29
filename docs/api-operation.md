## rotate
> rotate([angle], [options]) ⇒ <code>Sharp</code>

Rotate the output image by either an explicit angle
or auto-orient based on the EXIF `Orientation` tag.

If an angle is provided, it is converted to a valid positive degree rotation.
For example, `-450` will produce a 270 degree rotation.

When rotating by an angle other than a multiple of 90,
the background colour can be provided with the `background` option.

If no angle is provided, it is determined from the EXIF data.
Mirroring is supported and may infer the use of a flip operation.

The use of `rotate` without an angle will remove the EXIF `Orientation` tag, if any.

Only one rotation can occur per pipeline.
Previous calls to `rotate` in the same pipeline will be ignored.

Method order is important when rotating, resizing and/or extracting regions,
for example `.rotate(x).extract(y)` will produce a different result to `.extract(y).rotate(x)`.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [angle] | <code>number</code> | <code>auto</code> | angle of rotation. |
| [options] | <code>Object</code> |  | if present, is an Object with optional attributes. |
| [options.background] | <code>string</code> \| <code>Object</code> | <code>&quot;\&quot;#000000\&quot;&quot;</code> | parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha. |

**Example**  
```js
const pipeline = sharp()
  .rotate()
  .resize(null, 200)
  .toBuffer(function (err, outputBuffer, info) {
    // outputBuffer contains 200px high JPEG image data,
    // auto-rotated using EXIF Orientation tag
    // info.width and info.height contain the dimensions of the resized image
  });
readableStream.pipe(pipeline);
```
**Example**  
```js
const rotateThenResize = await sharp(input)
  .rotate(90)
  .resize({ width: 16, height: 8, fit: 'fill' })
  .toBuffer();
const resizeThenRotate = await sharp(input)
  .resize({ width: 16, height: 8, fit: 'fill' })
  .rotate(90)
  .toBuffer();
```


## flip
> flip([flip]) ⇒ <code>Sharp</code>

Mirror the image vertically (up-down) about the x-axis.
This always occurs before rotation, if any.

This operation does not work correctly with multi-page images.



| Param | Type | Default |
| --- | --- | --- |
| [flip] | <code>Boolean</code> | <code>true</code> | 

**Example**  
```js
const output = await sharp(input).flip().toBuffer();
```


## flop
> flop([flop]) ⇒ <code>Sharp</code>

Mirror the image horizontally (left-right) about the y-axis.
This always occurs before rotation, if any.



| Param | Type | Default |
| --- | --- | --- |
| [flop] | <code>Boolean</code> | <code>true</code> | 

**Example**  
```js
const output = await sharp(input).flop().toBuffer();
```


## affine
> affine(matrix, [options]) ⇒ <code>Sharp</code>

Perform an affine transform on an image. This operation will always occur after resizing, extraction and rotation, if any.

You must provide an array of length 4 or a 2x2 affine transformation matrix.
By default, new pixels are filled with a black background. You can provide a background color with the `background` option.
A particular interpolator may also be specified. Set the `interpolator` option to an attribute of the `sharp.interpolators` Object e.g. `sharp.interpolators.nohalo`.

In the case of a 2x2 matrix, the transform is:
- X = `matrix[0, 0]` \* (x + `idx`) + `matrix[0, 1]` \* (y + `idy`) + `odx`
- Y = `matrix[1, 0]` \* (x + `idx`) + `matrix[1, 1]` \* (y + `idy`) + `ody`

where:
- x and y are the coordinates in input image.
- X and Y are the coordinates in output image.
- (0,0) is the upper left corner.


**Throws**:

- <code>Error</code> Invalid parameters

**Since**: 0.27.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| matrix | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> \| <code>Array.&lt;number&gt;</code> |  | affine transformation matrix |
| [options] | <code>Object</code> |  | if present, is an Object with optional attributes. |
| [options.background] | <code>String</code> \| <code>Object</code> | <code>&quot;#000000&quot;</code> | parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha. |
| [options.idx] | <code>Number</code> | <code>0</code> | input horizontal offset |
| [options.idy] | <code>Number</code> | <code>0</code> | input vertical offset |
| [options.odx] | <code>Number</code> | <code>0</code> | output horizontal offset |
| [options.ody] | <code>Number</code> | <code>0</code> | output vertical offset |
| [options.interpolator] | <code>String</code> | <code>sharp.interpolators.bicubic</code> | interpolator |

**Example**  
```js
const pipeline = sharp()
  .affine([[1, 0.3], [0.1, 0.7]], {
     background: 'white',
     interpolator: sharp.interpolators.nohalo
  })
  .toBuffer((err, outputBuffer, info) => {
     // outputBuffer contains the transformed image
     // info.width and info.height contain the new dimensions
  });

inputStream
  .pipe(pipeline);
```


## sharpen
> sharpen([options], [flat], [jagged]) ⇒ <code>Sharp</code>

Sharpen the image.

When used without parameters, performs a fast, mild sharpen of the output image.

When a `sigma` is provided, performs a slower, more accurate sharpen of the L channel in the LAB colour space.
Fine-grained control over the level of sharpening in "flat" (m1) and "jagged" (m2) areas is available.

See [libvips sharpen](https://www.libvips.org/API/current/libvips-convolution.html#vips-sharpen) operation.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> \| <code>number</code> |  | if present, is an Object with attributes |
| [options.sigma] | <code>number</code> |  | the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`, between 0.000001 and 10 |
| [options.m1] | <code>number</code> | <code>1.0</code> | the level of sharpening to apply to "flat" areas, between 0 and 1000000 |
| [options.m2] | <code>number</code> | <code>2.0</code> | the level of sharpening to apply to "jagged" areas, between 0 and 1000000 |
| [options.x1] | <code>number</code> | <code>2.0</code> | threshold between "flat" and "jagged", between 0 and 1000000 |
| [options.y2] | <code>number</code> | <code>10.0</code> | maximum amount of brightening, between 0 and 1000000 |
| [options.y3] | <code>number</code> | <code>20.0</code> | maximum amount of darkening, between 0 and 1000000 |
| [flat] | <code>number</code> |  | (deprecated) see `options.m1`. |
| [jagged] | <code>number</code> |  | (deprecated) see `options.m2`. |

**Example**  
```js
const data = await sharp(input).sharpen().toBuffer();
```
**Example**  
```js
const data = await sharp(input).sharpen({ sigma: 2 }).toBuffer();
```
**Example**  
```js
const data = await sharp(input)
  .sharpen({
    sigma: 2,
    m1: 0,
    m2: 3,
    x1: 3,
    y2: 15,
    y3: 15,
  })
  .toBuffer();
```


## median
> median([size]) ⇒ <code>Sharp</code>

Apply median filter.
When used without parameters the default window is 3x3.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [size] | <code>number</code> | <code>3</code> | square mask size: size x size |

**Example**  
```js
const output = await sharp(input).median().toBuffer();
```
**Example**  
```js
const output = await sharp(input).median(5).toBuffer();
```


## blur
> blur([sigma]) ⇒ <code>Sharp</code>

Blur the image.

When used without parameters, performs a fast 3x3 box blur (equivalent to a box linear filter).

When a `sigma` is provided, performs a slower, more accurate Gaussian blur.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| [sigma] | <code>number</code> | a value between 0.3 and 1000 representing the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`. |

**Example**  
```js
const boxBlurred = await sharp(input)
  .blur()
  .toBuffer();
```
**Example**  
```js
const gaussianBlurred = await sharp(input)
  .blur(5)
  .toBuffer();
```


## flatten
> flatten([options]) ⇒ <code>Sharp</code>

Merge alpha transparency channel, if any, with a background, then remove the alpha channel.

See also [removeAlpha](/api-channel#removealpha).



| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.background] | <code>string</code> \| <code>Object</code> | <code>&quot;{r: 0, g: 0, b: 0}&quot;</code> | background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to black. |

**Example**  
```js
await sharp(rgbaInput)
  .flatten({ background: '#F0A703' })
  .toBuffer();
```


## unflatten
> unflatten()

Ensure the image has an alpha channel
with all white pixel values made fully transparent.

Existing alpha channel values for non-white pixels remain unchanged.

This feature is experimental and the API may change.


**Since**: 0.32.1  
**Example**  
```js
await sharp(rgbInput)
  .unflatten()
  .toBuffer();
```
**Example**  
```js
await sharp(rgbInput)
  .threshold(128, { grayscale: false }) // converter bright pixels to white
  .unflatten()
  .toBuffer();
```


## gamma
> gamma([gamma], [gammaOut]) ⇒ <code>Sharp</code>

Apply a gamma correction by reducing the encoding (darken) pre-resize at a factor of `1/gamma`
then increasing the encoding (brighten) post-resize at a factor of `gamma`.
This can improve the perceived brightness of a resized image in non-linear colour spaces.
JPEG and WebP input images will not take advantage of the shrink-on-load performance optimisation
when applying a gamma correction.

Supply a second argument to use a different output gamma value, otherwise the first value is used in both cases.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [gamma] | <code>number</code> | <code>2.2</code> | value between 1.0 and 3.0. |
| [gammaOut] | <code>number</code> |  | value between 1.0 and 3.0. (optional, defaults to same as `gamma`) |



## negate
> negate([options]) ⇒ <code>Sharp</code>

Produce the "negative" of the image.



| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.alpha] | <code>Boolean</code> | <code>true</code> | Whether or not to negate any alpha channel |

**Example**  
```js
const output = await sharp(input)
  .negate()
  .toBuffer();
```
**Example**  
```js
const output = await sharp(input)
  .negate({ alpha: false })
  .toBuffer();
```


## normalise
> normalise([options]) ⇒ <code>Sharp</code>

Enhance output image contrast by stretching its luminance to cover a full dynamic range.

Uses a histogram-based approach, taking a default range of 1% to 99% to reduce sensitivity to noise at the extremes.

Luminance values below the `lower` percentile will be underexposed by clipping to zero.
Luminance values above the `upper` percentile will be overexposed by clipping to the max pixel value.



| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.lower] | <code>number</code> | <code>1</code> | Percentile below which luminance values will be underexposed. |
| [options.upper] | <code>number</code> | <code>99</code> | Percentile above which luminance values will be overexposed. |

**Example**  
```js
const output = await sharp(input)
  .normalise()
  .toBuffer();
```
**Example**  
```js
const output = await sharp(input)
  .normalise({ lower: 0, upper: 100 })
  .toBuffer();
```


## normalize
> normalize([options]) ⇒ <code>Sharp</code>

Alternative spelling of normalise.



| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.lower] | <code>number</code> | <code>1</code> | Percentile below which luminance values will be underexposed. |
| [options.upper] | <code>number</code> | <code>99</code> | Percentile above which luminance values will be overexposed. |

**Example**  
```js
const output = await sharp(input)
  .normalize()
  .toBuffer();
```


## clahe
> clahe(options) ⇒ <code>Sharp</code>

Perform contrast limiting adaptive histogram equalization
[CLAHE](https://en.wikipedia.org/wiki/Adaptive_histogram_equalization#Contrast_Limited_AHE).

This will, in general, enhance the clarity of the image by bringing out darker details.


**Throws**:

- <code>Error</code> Invalid parameters

**Since**: 0.28.3  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  |  |
| options.width | <code>number</code> |  | Integral width of the search window, in pixels. |
| options.height | <code>number</code> |  | Integral height of the search window, in pixels. |
| [options.maxSlope] | <code>number</code> | <code>3</code> | Integral level of brightening, between 0 and 100, where 0 disables contrast limiting. |

**Example**  
```js
const output = await sharp(input)
  .clahe({
    width: 3,
    height: 3,
  })
  .toBuffer();
```


## convolve
> convolve(kernel) ⇒ <code>Sharp</code>

Convolve the image with the specified kernel.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| kernel | <code>Object</code> |  |  |
| kernel.width | <code>number</code> |  | width of the kernel in pixels. |
| kernel.height | <code>number</code> |  | height of the kernel in pixels. |
| kernel.kernel | <code>Array.&lt;number&gt;</code> |  | Array of length `width*height` containing the kernel values. |
| [kernel.scale] | <code>number</code> | <code>sum</code> | the scale of the kernel in pixels. |
| [kernel.offset] | <code>number</code> | <code>0</code> | the offset of the kernel in pixels. |

**Example**  
```js
sharp(input)
  .convolve({
    width: 3,
    height: 3,
    kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  })
  .raw()
  .toBuffer(function(err, data, info) {
    // data contains the raw pixel data representing the convolution
    // of the input image with the horizontal Sobel operator
  });
```


## threshold
> threshold([threshold], [options]) ⇒ <code>Sharp</code>

Any pixel value greater than or equal to the threshold value will be set to 255, otherwise it will be set to 0.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [threshold] | <code>number</code> | <code>128</code> | a value in the range 0-255 representing the level at which the threshold will be applied. |
| [options] | <code>Object</code> |  |  |
| [options.greyscale] | <code>Boolean</code> | <code>true</code> | convert to single channel greyscale. |
| [options.grayscale] | <code>Boolean</code> | <code>true</code> | alternative spelling for greyscale. |



## boolean
> boolean(operand, operator, [options]) ⇒ <code>Sharp</code>

Perform a bitwise boolean operation with operand image.

This operation creates an output image where each pixel is the result of
the selected bitwise boolean `operation` between the corresponding pixels of the input images.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| operand | <code>Buffer</code> \| <code>string</code> | Buffer containing image data or string containing the path to an image file. |
| operator | <code>string</code> | one of `and`, `or` or `eor` to perform that bitwise operation, like the C logic operators `&`, `|` and `^` respectively. |
| [options] | <code>Object</code> |  |
| [options.raw] | <code>Object</code> | describes operand when using raw pixel data. |
| [options.raw.width] | <code>number</code> |  |
| [options.raw.height] | <code>number</code> |  |
| [options.raw.channels] | <code>number</code> |  |



## linear
> linear([a], [b]) ⇒ <code>Sharp</code>

Apply the linear formula `a` * input + `b` to the image to adjust image levels.

When a single number is provided, it will be used for all image channels.
When an array of numbers is provided, the array length must match the number of channels.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [a] | <code>number</code> \| <code>Array.&lt;number&gt;</code> | <code>[]</code> | multiplier |
| [b] | <code>number</code> \| <code>Array.&lt;number&gt;</code> | <code>[]</code> | offset |

**Example**  
```js
await sharp(input)
  .linear(0.5, 2)
  .toBuffer();
```
**Example**  
```js
await sharp(rgbInput)
  .linear(
    [0.25, 0.5, 0.75],
    [150, 100, 50]
  )
  .toBuffer();
```


## recomb
> recomb(inputMatrix) ⇒ <code>Sharp</code>

Recombine the image with the specified matrix.


**Throws**:

- <code>Error</code> Invalid parameters

**Since**: 0.21.1  

| Param | Type | Description |
| --- | --- | --- |
| inputMatrix | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 3x3 Recombination matrix |

**Example**  
```js
sharp(input)
  .recomb([
   [0.3588, 0.7044, 0.1368],
   [0.2990, 0.5870, 0.1140],
   [0.2392, 0.4696, 0.0912],
  ])
  .raw()
  .toBuffer(function(err, data, info) {
    // data contains the raw pixel data after applying the matrix
    // With this example input, a sepia filter has been applied
  });
```


## modulate
> modulate([options]) ⇒ <code>Sharp</code>

Transforms the image using brightness, saturation, hue rotation, and lightness.
Brightness and lightness both operate on luminance, with the difference being that
brightness is multiplicative whereas lightness is additive.


**Since**: 0.22.1  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> |  |
| [options.brightness] | <code>number</code> | Brightness multiplier |
| [options.saturation] | <code>number</code> | Saturation multiplier |
| [options.hue] | <code>number</code> | Degrees for hue rotation |
| [options.lightness] | <code>number</code> | Lightness addend |

**Example**  
```js
// increase brightness by a factor of 2
const output = await sharp(input)
  .modulate({
    brightness: 2
  })
  .toBuffer();
```
**Example**  
```js
// hue-rotate by 180 degrees
const output = await sharp(input)
  .modulate({
    hue: 180
  })
  .toBuffer();
```
**Example**  
```js
// increase lightness by +50
const output = await sharp(input)
  .modulate({
    lightness: 50
  })
  .toBuffer();
```
**Example**  
```js
// decrease brightness and saturation while also hue-rotating by 90 degrees
const output = await sharp(input)
  .modulate({
    brightness: 0.5,
    saturation: 0.5,
    hue: 90,
  })
  .toBuffer();
```