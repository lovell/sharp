## resize
> resize([width], [height], [options]) ⇒ <code>Sharp</code>

Resize image to `width`, `height` or `width x height`.

When both a `width` and `height` are provided, the possible methods by which the image should **fit** these are:
- `cover`: (default) Preserving aspect ratio, attempt to ensure the image covers both provided dimensions by cropping/clipping to fit.
- `contain`: Preserving aspect ratio, contain within both provided dimensions using "letterboxing" where necessary.
- `fill`: Ignore the aspect ratio of the input and stretch to both provided dimensions.
- `inside`: Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified.
- `outside`: Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified.

Some of these values are based on the [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) CSS property.

<img alt="Examples of various values for the fit property when resizing" width="100%" style="aspect-ratio: 998/243" src="https://cdn.jsdelivr.net/gh/lovell/sharp@main/docs/image/api-resize-fit.svg">

When using a **fit** of `cover` or `contain`, the default **position** is `centre`. Other options are:
- `sharp.position`: `top`, `right top`, `right`, `right bottom`, `bottom`, `left bottom`, `left`, `left top`.
- `sharp.gravity`: `north`, `northeast`, `east`, `southeast`, `south`, `southwest`, `west`, `northwest`, `center` or `centre`.
- `sharp.strategy`: `cover` only, dynamically crop using either the `entropy` or `attention` strategy.

Some of these values are based on the [object-position](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) CSS property.

The experimental strategy-based approach resizes so one dimension is at its target length
then repeatedly ranks edge regions, discarding the edge with the lowest score based on the selected strategy.
- `entropy`: focus on the region with the highest [Shannon entropy](https://en.wikipedia.org/wiki/Entropy_%28information_theory%29).
- `attention`: focus on the region with the highest luminance frequency, colour saturation and presence of skin tones.

Possible interpolation kernels are:
- `nearest`: Use [nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation).
- `cubic`: Use a [Catmull-Rom spline](https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline).
- `mitchell`: Use a [Mitchell-Netravali spline](https://www.cs.utexas.edu/~fussell/courses/cs384g-fall2013/lectures/mitchell/Mitchell.pdf).
- `lanczos2`: Use a [Lanczos kernel](https://en.wikipedia.org/wiki/Lanczos_resampling#Lanczos_kernel) with `a=2`.
- `lanczos3`: Use a Lanczos kernel with `a=3` (the default).

Only one resize can occur per pipeline.
Previous calls to `resize` in the same pipeline will be ignored.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [width] | <code>number</code> |  | How many pixels wide the resultant image should be. Use `null` or `undefined` to auto-scale the width to match the height. |
| [height] | <code>number</code> |  | How many pixels high the resultant image should be. Use `null` or `undefined` to auto-scale the height to match the width. |
| [options] | <code>Object</code> |  |  |
| [options.width] | <code>number</code> |  | An alternative means of specifying `width`. If both are present this takes priority. |
| [options.height] | <code>number</code> |  | An alternative means of specifying `height`. If both are present this takes priority. |
| [options.fit] | <code>String</code> | <code>&#x27;cover&#x27;</code> | How the image should be resized/cropped to fit the target dimension(s), one of `cover`, `contain`, `fill`, `inside` or `outside`. |
| [options.position] | <code>String</code> | <code>&#x27;centre&#x27;</code> | A position, gravity or strategy to use when `fit` is `cover` or `contain`. |
| [options.background] | <code>String</code> \| <code>Object</code> | <code>{r: 0, g: 0, b: 0, alpha: 1}</code> | background colour when `fit` is `contain`, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to black without transparency. |
| [options.kernel] | <code>String</code> | <code>&#x27;lanczos3&#x27;</code> | The kernel to use for image reduction. Use the `fastShrinkOnLoad` option to control kernel vs shrink-on-load. |
| [options.withoutEnlargement] | <code>Boolean</code> | <code>false</code> | Do not scale up if the width *or* height are already less than the target dimensions, equivalent to GraphicsMagick's `>` geometry option. This may result in output dimensions smaller than the target dimensions. |
| [options.withoutReduction] | <code>Boolean</code> | <code>false</code> | Do not scale down if the width *or* height are already greater than the target dimensions, equivalent to GraphicsMagick's `<` geometry option. This may still result in a crop to reach the target dimensions. |
| [options.fastShrinkOnLoad] | <code>Boolean</code> | <code>true</code> | Take greater advantage of the JPEG and WebP shrink-on-load feature, which can lead to a slight moiré pattern or round-down of an auto-scaled dimension. |

**Example**  
```js
sharp(input)
  .resize({ width: 100 })
  .toBuffer()
  .then(data => {
    // 100 pixels wide, auto-scaled height
  });
```
**Example**  
```js
sharp(input)
  .resize({ height: 100 })
  .toBuffer()
  .then(data => {
    // 100 pixels high, auto-scaled width
  });
```
**Example**  
```js
sharp(input)
  .resize(200, 300, {
    kernel: sharp.kernel.nearest,
    fit: 'contain',
    position: 'right top',
    background: { r: 255, g: 255, b: 255, alpha: 0.5 }
  })
  .toFile('output.png')
  .then(() => {
    // output.png is a 200 pixels wide and 300 pixels high image
    // containing a nearest-neighbour scaled version
    // contained within the north-east corner of a semi-transparent white canvas
  });
```
**Example**  
```js
const transformer = sharp()
  .resize({
    width: 200,
    height: 200,
    fit: sharp.fit.cover,
    position: sharp.strategy.entropy
  });
// Read image data from readableStream
// Write 200px square auto-cropped image data to writableStream
readableStream
  .pipe(transformer)
  .pipe(writableStream);
```
**Example**  
```js
sharp(input)
  .resize(200, 200, {
    fit: sharp.fit.inside,
    withoutEnlargement: true
  })
  .toFormat('jpeg')
  .toBuffer()
  .then(function(outputBuffer) {
    // outputBuffer contains JPEG image data
    // no wider and no higher than 200 pixels
    // and no larger than the input image
  });
```
**Example**  
```js
sharp(input)
  .resize(200, 200, {
    fit: sharp.fit.outside,
    withoutReduction: true
  })
  .toFormat('jpeg')
  .toBuffer()
  .then(function(outputBuffer) {
    // outputBuffer contains JPEG image data
    // of at least 200 pixels wide and 200 pixels high while maintaining aspect ratio
    // and no smaller than the input image
  });
```
**Example**  
```js
const scaleByHalf = await sharp(input)
  .metadata()
  .then(({ width }) => sharp(input)
    .resize(Math.round(width * 0.5))
    .toBuffer()
  );
```


## extend
> extend(extend) ⇒ <code>Sharp</code>

Extend / pad / extrude one or more edges of the image with either
the provided background colour or pixels derived from the image.
This operation will always occur after resizing and extraction, if any.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| extend | <code>number</code> \| <code>Object</code> |  | single pixel count to add to all edges or an Object with per-edge counts |
| [extend.top] | <code>number</code> | <code>0</code> |  |
| [extend.left] | <code>number</code> | <code>0</code> |  |
| [extend.bottom] | <code>number</code> | <code>0</code> |  |
| [extend.right] | <code>number</code> | <code>0</code> |  |
| [extend.extendWith] | <code>String</code> | <code>&#x27;background&#x27;</code> | populate new pixels using this method, one of: background, copy, repeat, mirror. |
| [extend.background] | <code>String</code> \| <code>Object</code> | <code>{r: 0, g: 0, b: 0, alpha: 1}</code> | background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to black without transparency. |

**Example**  
```js
// Resize to 140 pixels wide, then add 10 transparent pixels
// to the top, left and right edges and 20 to the bottom edge
sharp(input)
  .resize(140)
  .extend({
    top: 10,
    bottom: 20,
    left: 10,
    right: 10,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  ...
```
**Example**  
```js
// Add a row of 10 red pixels to the bottom
sharp(input)
  .extend({
    bottom: 10,
    background: 'red'
  })
  ...
```
**Example**  
```js
// Extrude image by 8 pixels to the right, mirroring existing right hand edge
sharp(input)
  .extend({
    right: 8,
    background: 'mirror'
  })
  ...
```


## extract
> extract(options) ⇒ <code>Sharp</code>

Extract/crop a region of the image.

- Use `extract` before `resize` for pre-resize extraction.
- Use `extract` after `resize` for post-resize extraction.
- Use `extract` before and after for both.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | describes the region to extract using integral pixel values |
| options.left | <code>number</code> | zero-indexed offset from left edge |
| options.top | <code>number</code> | zero-indexed offset from top edge |
| options.width | <code>number</code> | width of region to extract |
| options.height | <code>number</code> | height of region to extract |

**Example**  
```js
sharp(input)
  .extract({ left: left, top: top, width: width, height: height })
  .toFile(output, function(err) {
    // Extract a region of the input image, saving in the same format.
  });
```
**Example**  
```js
sharp(input)
  .extract({ left: leftOffsetPre, top: topOffsetPre, width: widthPre, height: heightPre })
  .resize(width, height)
  .extract({ left: leftOffsetPost, top: topOffsetPost, width: widthPost, height: heightPost })
  .toFile(output, function(err) {
    // Extract a region, resize, then extract from the resized image
  });
```


## trim
> trim(trim) ⇒ <code>Sharp</code>

Trim pixels from all edges that contain values similar to the given background colour, which defaults to that of the top-left pixel.

Images with an alpha channel will use the combined bounding box of alpha and non-alpha channels.

If the result of this operation would trim an image to nothing then no change is made.

The `info` response Object, obtained from callback of `.toFile()` or `.toBuffer()`,
will contain `trimOffsetLeft` and `trimOffsetTop` properties.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| trim | <code>string</code> \| <code>number</code> \| <code>Object</code> |  | the specific background colour to trim, the threshold for doing so or an Object with both. |
| [trim.background] | <code>string</code> \| <code>Object</code> | <code>&quot;&#x27;top-left pixel&#x27;&quot;</code> | background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to that of the top-left pixel. |
| [trim.threshold] | <code>number</code> | <code>10</code> | the allowed difference from the above colour, a positive number. |

**Example**  
```js
// Trim pixels with a colour similar to that of the top-left pixel.
sharp(input)
  .trim()
  .toFile(output, function(err, info) {
    ...
  });
```
**Example**  
```js
// Trim pixels with the exact same colour as that of the top-left pixel.
sharp(input)
  .trim(0)
  .toFile(output, function(err, info) {
    ...
  });
```
**Example**  
```js
// Trim only pixels with a similar colour to red.
sharp(input)
  .trim("#FF0000")
  .toFile(output, function(err, info) {
    ...
  });
```
**Example**  
```js
// Trim all "yellow-ish" pixels, being more lenient with the higher threshold.
sharp(input)
  .trim({
    background: "yellow",
    threshold: 42,
  })
  .toFile(output, function(err, info) {
    ...
  });
```