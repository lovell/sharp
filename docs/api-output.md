## toFile
> toFile(fileOut, [callback]) ⇒ <code>Promise.&lt;Object&gt;</code>

Write output image data to a file.

If an explicit output format is not selected, it will be inferred from the extension,
with JPEG, PNG, WebP, AVIF, TIFF, GIF, DZI, and libvips' V format supported.
Note that raw pixel data is only supported for buffer output.

By default all metadata will be removed, which includes EXIF-based orientation.
See [withMetadata](#withmetadata) for control over this.

The caller is responsible for ensuring directory structures and permissions exist.

A `Promise` is returned when `callback` is not provided.


**Returns**: <code>Promise.&lt;Object&gt;</code> - - when no callback is provided  
**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| fileOut | <code>string</code> | the path to write the image data to. |
| [callback] | <code>function</code> | called on completion with two arguments `(err, info)`. `info` contains the output image `format`, `size` (bytes), `width`, `height`, `channels` and `premultiplied` (indicating if premultiplication was used). When using a crop strategy also contains `cropOffsetLeft` and `cropOffsetTop`. When using the attention crop strategy also contains `attentionX` and `attentionY`, the focal point of the cropped region. May also contain `textAutofitDpi` (dpi the font was rendered at) if image was created from text. |

**Example**  
```js
sharp(input)
  .toFile('output.png', (err, info) => { ... });
```
**Example**  
```js
sharp(input)
  .toFile('output.png')
  .then(info => { ... })
  .catch(err => { ... });
```


## toBuffer
> toBuffer([options], [callback]) ⇒ <code>Promise.&lt;Buffer&gt;</code>

Write output to a Buffer.
JPEG, PNG, WebP, AVIF, TIFF, GIF and raw pixel data output are supported.

Use [toFormat](#toformat) or one of the format-specific functions such as [jpeg](#jpeg), [png](#png) etc. to set the output format.

If no explicit format is set, the output format will match the input image, except SVG input which becomes PNG output.

By default all metadata will be removed, which includes EXIF-based orientation.
See [withMetadata](#withmetadata) for control over this.

`callback`, if present, gets three arguments `(err, data, info)` where:
- `err` is an error, if any.
- `data` is the output image data.
- `info` contains the output image `format`, `size` (bytes), `width`, `height`,
`channels` and `premultiplied` (indicating if premultiplication was used).
When using a crop strategy also contains `cropOffsetLeft` and `cropOffsetTop`.
May also contain `textAutofitDpi` (dpi the font was rendered at) if image was created from text.

A `Promise` is returned when `callback` is not provided.


**Returns**: <code>Promise.&lt;Buffer&gt;</code> - - when no callback is provided  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> |  |
| [options.resolveWithObject] | <code>boolean</code> | Resolve the Promise with an Object containing `data` and `info` properties instead of resolving only with `data`. |
| [callback] | <code>function</code> |  |

**Example**  
```js
sharp(input)
  .toBuffer((err, data, info) => { ... });
```
**Example**  
```js
sharp(input)
  .toBuffer()
  .then(data => { ... })
  .catch(err => { ... });
```
**Example**  
```js
sharp(input)
  .png()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => { ... })
  .catch(err => { ... });
```
**Example**  
```js
const { data, info } = await sharp('my-image.jpg')
  // output the raw pixels
  .raw()
  .toBuffer({ resolveWithObject: true });

// create a more type safe way to work with the raw pixel data
// this will not copy the data, instead it will change `data`s underlying ArrayBuffer
// so `data` and `pixelArray` point to the same memory location
const pixelArray = new Uint8ClampedArray(data.buffer);

// When you are done changing the pixelArray, sharp takes the `pixelArray` as an input
const { width, height, channels } = info;
await sharp(pixelArray, { raw: { width, height, channels } })
  .toFile('my-changed-image.jpg');
```


## withMetadata
> withMetadata([options]) ⇒ <code>Sharp</code>

Include all metadata (EXIF, XMP, IPTC) from the input image in the output image.
This will also convert to and add a web-friendly sRGB ICC profile if appropriate,
unless a custom output profile is provided.

The default behaviour, when `withMetadata` is not used, is to convert to the device-independent
sRGB colour space and strip all metadata, including the removal of any ICC profile.

EXIF metadata is unsupported for TIFF output.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.orientation] | <code>number</code> |  | value between 1 and 8, used to update the EXIF `Orientation` tag. |
| [options.icc] | <code>string</code> | <code>&quot;&#x27;srgb&#x27;&quot;</code> | Filesystem path to output ICC profile, relative to `process.cwd()`, defaults to built-in sRGB. |
| [options.exif] | <code>Object.&lt;Object&gt;</code> | <code>{}</code> | Object keyed by IFD0, IFD1 etc. of key/value string pairs to write as EXIF data. |
| [options.density] | <code>number</code> |  | Number of pixels per inch (DPI). |

**Example**  
```js
sharp('input.jpg')
  .withMetadata()
  .toFile('output-with-metadata.jpg')
  .then(info => { ... });
```
**Example**  
```js
// Set output EXIF metadata
const data = await sharp(input)
  .withMetadata({
    exif: {
      IFD0: {
        Copyright: 'The National Gallery'
      },
      IFD3: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '51/1 30/1 3230/100',
        GPSLongitudeRef: 'W',
        GPSLongitude: '0/1 7/1 4366/100'
      }
    }
  })
  .toBuffer();
```
**Example**  
```js
// Set output metadata to 96 DPI
const data = await sharp(input)
  .withMetadata({ density: 96 })
  .toBuffer();
```


## toFormat
> toFormat(format, options) ⇒ <code>Sharp</code>

Force output to a given format.


**Throws**:

- <code>Error</code> unsupported format or options


| Param | Type | Description |
| --- | --- | --- |
| format | <code>string</code> \| <code>Object</code> | as a string or an Object with an 'id' attribute |
| options | <code>Object</code> | output options |

**Example**  
```js
// Convert any input to PNG output
const data = await sharp(input)
  .toFormat('png')
  .toBuffer();
```


## jpeg
> jpeg([options]) ⇒ <code>Sharp</code>

Use these JPEG options for output image.


**Throws**:

- <code>Error</code> Invalid options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.quality] | <code>number</code> | <code>80</code> | quality, integer 1-100 |
| [options.progressive] | <code>boolean</code> | <code>false</code> | use progressive (interlace) scan |
| [options.chromaSubsampling] | <code>string</code> | <code>&quot;&#x27;4:2:0&#x27;&quot;</code> | set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling |
| [options.optimiseCoding] | <code>boolean</code> | <code>true</code> | optimise Huffman coding tables |
| [options.optimizeCoding] | <code>boolean</code> | <code>true</code> | alternative spelling of optimiseCoding |
| [options.mozjpeg] | <code>boolean</code> | <code>false</code> | use mozjpeg defaults, equivalent to `{ trellisQuantisation: true, overshootDeringing: true, optimiseScans: true, quantisationTable: 3 }` |
| [options.trellisQuantisation] | <code>boolean</code> | <code>false</code> | apply trellis quantisation |
| [options.overshootDeringing] | <code>boolean</code> | <code>false</code> | apply overshoot deringing |
| [options.optimiseScans] | <code>boolean</code> | <code>false</code> | optimise progressive scans, forces progressive |
| [options.optimizeScans] | <code>boolean</code> | <code>false</code> | alternative spelling of optimiseScans |
| [options.quantisationTable] | <code>number</code> | <code>0</code> | quantization table to use, integer 0-8 |
| [options.quantizationTable] | <code>number</code> | <code>0</code> | alternative spelling of quantisationTable |
| [options.force] | <code>boolean</code> | <code>true</code> | force JPEG output, otherwise attempt to use input format |

**Example**  
```js
// Convert any input to very high quality JPEG output
const data = await sharp(input)
  .jpeg({
    quality: 100,
    chromaSubsampling: '4:4:4'
  })
  .toBuffer();
```
**Example**  
```js
// Use mozjpeg to reduce output JPEG file size (slower)
const data = await sharp(input)
  .jpeg({ mozjpeg: true })
  .toBuffer();
```


## png
> png([options]) ⇒ <code>Sharp</code>

Use these PNG options for output image.

By default, PNG output is full colour at 8 or 16 bits per pixel.
Indexed PNG input at 1, 2 or 4 bits per pixel is converted to 8 bits per pixel.
Set `palette` to `true` for slower, indexed PNG output.


**Throws**:

- <code>Error</code> Invalid options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.progressive] | <code>boolean</code> | <code>false</code> | use progressive (interlace) scan |
| [options.compressionLevel] | <code>number</code> | <code>6</code> | zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest) |
| [options.adaptiveFiltering] | <code>boolean</code> | <code>false</code> | use adaptive row filtering |
| [options.palette] | <code>boolean</code> | <code>false</code> | quantise to a palette-based image with alpha transparency support |
| [options.quality] | <code>number</code> | <code>100</code> | use the lowest number of colours needed to achieve given quality, sets `palette` to `true` |
| [options.effort] | <code>number</code> | <code>7</code> | CPU effort, between 1 (fastest) and 10 (slowest), sets `palette` to `true` |
| [options.colours] | <code>number</code> | <code>256</code> | maximum number of palette entries, sets `palette` to `true` |
| [options.colors] | <code>number</code> | <code>256</code> | alternative spelling of `options.colours`, sets `palette` to `true` |
| [options.dither] | <code>number</code> | <code>1.0</code> | level of Floyd-Steinberg error diffusion, sets `palette` to `true` |
| [options.force] | <code>boolean</code> | <code>true</code> | force PNG output, otherwise attempt to use input format |

**Example**  
```js
// Convert any input to full colour PNG output
const data = await sharp(input)
  .png()
  .toBuffer();
```
**Example**  
```js
// Convert any input to indexed PNG output (slower)
const data = await sharp(input)
  .png({ palette: true })
  .toBuffer();
```


## webp
> webp([options]) ⇒ <code>Sharp</code>

Use these WebP options for output image.


**Throws**:

- <code>Error</code> Invalid options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.quality] | <code>number</code> | <code>80</code> | quality, integer 1-100 |
| [options.alphaQuality] | <code>number</code> | <code>100</code> | quality of alpha layer, integer 0-100 |
| [options.lossless] | <code>boolean</code> | <code>false</code> | use lossless compression mode |
| [options.nearLossless] | <code>boolean</code> | <code>false</code> | use near_lossless compression mode |
| [options.smartSubsample] | <code>boolean</code> | <code>false</code> | use high quality chroma subsampling |
| [options.preset] | <code>string</code> | <code>&quot;&#x27;default&#x27;&quot;</code> | named preset for preprocessing/filtering, one of: default, photo, picture, drawing, icon, text |
| [options.effort] | <code>number</code> | <code>4</code> | CPU effort, between 0 (fastest) and 6 (slowest) |
| [options.loop] | <code>number</code> | <code>0</code> | number of animation iterations, use 0 for infinite animation |
| [options.delay] | <code>number</code> \| <code>Array.&lt;number&gt;</code> |  | delay(s) between animation frames (in milliseconds) |
| [options.minSize] | <code>boolean</code> | <code>false</code> | prevent use of animation key frames to minimise file size (slow) |
| [options.mixed] | <code>boolean</code> | <code>false</code> | allow mixture of lossy and lossless animation frames (slow) |
| [options.force] | <code>boolean</code> | <code>true</code> | force WebP output, otherwise attempt to use input format |

**Example**  
```js
// Convert any input to lossless WebP output
const data = await sharp(input)
  .webp({ lossless: true })
  .toBuffer();
```
**Example**  
```js
// Optimise the file size of an animated WebP
const outputWebp = await sharp(inputWebp, { animated: true })
  .webp({ effort: 6 })
  .toBuffer();
```


## gif
> gif([options]) ⇒ <code>Sharp</code>

Use these GIF options for the output image.

The first entry in the palette is reserved for transparency.

The palette of the input image will be re-used if possible.


**Throws**:

- <code>Error</code> Invalid options

**Since**: 0.30.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.reuse] | <code>boolean</code> | <code>true</code> | re-use existing palette, otherwise generate new (slow) |
| [options.progressive] | <code>boolean</code> | <code>false</code> | use progressive (interlace) scan |
| [options.colours] | <code>number</code> | <code>256</code> | maximum number of palette entries, including transparency, between 2 and 256 |
| [options.colors] | <code>number</code> | <code>256</code> | alternative spelling of `options.colours` |
| [options.effort] | <code>number</code> | <code>7</code> | CPU effort, between 1 (fastest) and 10 (slowest) |
| [options.dither] | <code>number</code> | <code>1.0</code> | level of Floyd-Steinberg error diffusion, between 0 (least) and 1 (most) |
| [options.interFrameMaxError] | <code>number</code> | <code>0</code> | maximum inter-frame error for transparency, between 0 (lossless) and 32 |
| [options.interPaletteMaxError] | <code>number</code> | <code>3</code> | maximum inter-palette error for palette reuse, between 0 and 256 |
| [options.loop] | <code>number</code> | <code>0</code> | number of animation iterations, use 0 for infinite animation |
| [options.delay] | <code>number</code> \| <code>Array.&lt;number&gt;</code> |  | delay(s) between animation frames (in milliseconds) |
| [options.force] | <code>boolean</code> | <code>true</code> | force GIF output, otherwise attempt to use input format |

**Example**  
```js
// Convert PNG to GIF
await sharp(pngBuffer)
  .gif()
  .toBuffer();
```
**Example**  
```js
// Convert animated WebP to animated GIF
await sharp('animated.webp', { animated: true })
  .toFile('animated.gif');
```
**Example**  
```js
// Create a 128x128, cropped, non-dithered, animated thumbnail of an animated GIF
const out = await sharp('in.gif', { animated: true })
  .resize({ width: 128, height: 128 })
  .gif({ dither: 0 })
  .toBuffer();
```
**Example**  
```js
// Lossy file size reduction of animated GIF
await sharp('in.gif', { animated: true })
  .gif({ interFrameMaxError: 8 })
  .toFile('optim.gif');
```


## jp2
> jp2([options]) ⇒ <code>Sharp</code>

Use these JP2 options for output image.

Requires libvips compiled with support for OpenJPEG.
The prebuilt binaries do not include this - see
[installing a custom libvips](https://sharp.pixelplumbing.com/install#custom-libvips).


**Throws**:

- <code>Error</code> Invalid options

**Since**: 0.29.1  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.quality] | <code>number</code> | <code>80</code> | quality, integer 1-100 |
| [options.lossless] | <code>boolean</code> | <code>false</code> | use lossless compression mode |
| [options.tileWidth] | <code>number</code> | <code>512</code> | horizontal tile size |
| [options.tileHeight] | <code>number</code> | <code>512</code> | vertical tile size |
| [options.chromaSubsampling] | <code>string</code> | <code>&quot;&#x27;4:4:4&#x27;&quot;</code> | set to '4:2:0' to use chroma subsampling |

**Example**  
```js
// Convert any input to lossless JP2 output
const data = await sharp(input)
  .jp2({ lossless: true })
  .toBuffer();
```
**Example**  
```js
// Convert any input to very high quality JP2 output
const data = await sharp(input)
  .jp2({
    quality: 100,
    chromaSubsampling: '4:4:4'
  })
  .toBuffer();
```


## tiff
> tiff([options]) ⇒ <code>Sharp</code>

Use these TIFF options for output image.

The `density` can be set in pixels/inch via [withMetadata](#withmetadata)
instead of providing `xres` and `yres` in pixels/mm.


**Throws**:

- <code>Error</code> Invalid options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.quality] | <code>number</code> | <code>80</code> | quality, integer 1-100 |
| [options.force] | <code>boolean</code> | <code>true</code> | force TIFF output, otherwise attempt to use input format |
| [options.compression] | <code>string</code> | <code>&quot;&#x27;jpeg&#x27;&quot;</code> | compression options: none, jpeg, deflate, packbits, ccittfax4, lzw, webp, zstd, jp2k |
| [options.predictor] | <code>string</code> | <code>&quot;&#x27;horizontal&#x27;&quot;</code> | compression predictor options: none, horizontal, float |
| [options.pyramid] | <code>boolean</code> | <code>false</code> | write an image pyramid |
| [options.tile] | <code>boolean</code> | <code>false</code> | write a tiled tiff |
| [options.tileWidth] | <code>number</code> | <code>256</code> | horizontal tile size |
| [options.tileHeight] | <code>number</code> | <code>256</code> | vertical tile size |
| [options.xres] | <code>number</code> | <code>1.0</code> | horizontal resolution in pixels/mm |
| [options.yres] | <code>number</code> | <code>1.0</code> | vertical resolution in pixels/mm |
| [options.resolutionUnit] | <code>string</code> | <code>&quot;&#x27;inch&#x27;&quot;</code> | resolution unit options: inch, cm |
| [options.bitdepth] | <code>number</code> | <code>8</code> | reduce bitdepth to 1, 2 or 4 bit |

**Example**  
```js
// Convert SVG input to LZW-compressed, 1 bit per pixel TIFF output
sharp('input.svg')
  .tiff({
    compression: 'lzw',
    bitdepth: 1
  })
  .toFile('1-bpp-output.tiff')
  .then(info => { ... });
```


## avif
> avif([options]) ⇒ <code>Sharp</code>

Use these AVIF options for output image.

Whilst it is possible to create AVIF images smaller than 16x16 pixels,
most web browsers do not display these properly.

AVIF image sequences are not supported.


**Throws**:

- <code>Error</code> Invalid options

**Since**: 0.27.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.quality] | <code>number</code> | <code>50</code> | quality, integer 1-100 |
| [options.lossless] | <code>boolean</code> | <code>false</code> | use lossless compression |
| [options.effort] | <code>number</code> | <code>4</code> | CPU effort, between 0 (fastest) and 9 (slowest) |
| [options.chromaSubsampling] | <code>string</code> | <code>&quot;&#x27;4:4:4&#x27;&quot;</code> | set to '4:2:0' to use chroma subsampling |

**Example**  
```js
const data = await sharp(input)
  .avif({ effort: 2 })
  .toBuffer();
```
**Example**  
```js
const data = await sharp(input)
  .avif({ lossless: true })
  .toBuffer();
```


## heif
> heif([options]) ⇒ <code>Sharp</code>

Use these HEIF options for output image.

Support for patent-encumbered HEIC images using `hevc` compression requires the use of a
globally-installed libvips compiled with support for libheif, libde265 and x265.


**Throws**:

- <code>Error</code> Invalid options

**Since**: 0.23.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.quality] | <code>number</code> | <code>50</code> | quality, integer 1-100 |
| [options.compression] | <code>string</code> | <code>&quot;&#x27;av1&#x27;&quot;</code> | compression format: av1, hevc |
| [options.lossless] | <code>boolean</code> | <code>false</code> | use lossless compression |
| [options.effort] | <code>number</code> | <code>4</code> | CPU effort, between 0 (fastest) and 9 (slowest) |
| [options.chromaSubsampling] | <code>string</code> | <code>&quot;&#x27;4:4:4&#x27;&quot;</code> | set to '4:2:0' to use chroma subsampling |

**Example**  
```js
const data = await sharp(input)
  .heif({ compression: 'hevc' })
  .toBuffer();
```


## jxl
> jxl([options]) ⇒ <code>Sharp</code>

Use these JPEG-XL (JXL) options for output image.

This feature is experimental, please do not use in production systems.

Requires libvips compiled with support for libjxl.
The prebuilt binaries do not include this - see
[installing a custom libvips](https://sharp.pixelplumbing.com/install#custom-libvips).

Image metadata (EXIF, XMP) is unsupported.


**Throws**:

- <code>Error</code> Invalid options

**Since**: 0.31.3  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.distance] | <code>number</code> | <code>1.0</code> | maximum encoding error, between 0 (highest quality) and 15 (lowest quality) |
| [options.quality] | <code>number</code> |  | calculate `distance` based on JPEG-like quality, between 1 and 100, overrides distance if specified |
| [options.decodingTier] | <code>number</code> | <code>0</code> | target decode speed tier, between 0 (highest quality) and 4 (lowest quality) |
| [options.lossless] | <code>boolean</code> | <code>false</code> | use lossless compression |
| [options.effort] | <code>number</code> | <code>7</code> | CPU effort, between 3 (fastest) and 9 (slowest) |



## raw
> raw([options]) ⇒ <code>Sharp</code>

Force output to be raw, uncompressed pixel data.
Pixel ordering is left-to-right, top-to-bottom, without padding.
Channel ordering will be RGB or RGBA for non-greyscale colourspaces.


**Throws**:

- <code>Error</code> Invalid options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | output options |
| [options.depth] | <code>string</code> | <code>&quot;&#x27;uchar&#x27;&quot;</code> | bit depth, one of: char, uchar (default), short, ushort, int, uint, float, complex, double, dpcomplex |

**Example**  
```js
// Extract raw, unsigned 8-bit RGB pixel data from JPEG input
const { data, info } = await sharp('input.jpg')
  .raw()
  .toBuffer({ resolveWithObject: true });
```
**Example**  
```js
// Extract alpha channel as raw, unsigned 16-bit pixel data from PNG input
const data = await sharp('input.png')
  .ensureAlpha()
  .extractChannel(3)
  .toColourspace('b-w')
  .raw({ depth: 'ushort' })
  .toBuffer();
```


## tile
> tile([options]) ⇒ <code>Sharp</code>

Use tile-based deep zoom (image pyramid) output.

Set the format and options for tile images via the `toFormat`, `jpeg`, `png` or `webp` functions.
Use a `.zip` or `.szi` file extension with `toFile` to write to a compressed archive file format.

The container will be set to `zip` when the output is a Buffer or Stream, otherwise it will default to `fs`.

Requires libvips compiled with support for libgsf.
The prebuilt binaries do not include this - see
[installing a custom libvips](https://sharp.pixelplumbing.com/install#custom-libvips).


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.size] | <code>number</code> | <code>256</code> | tile size in pixels, a value between 1 and 8192. |
| [options.overlap] | <code>number</code> | <code>0</code> | tile overlap in pixels, a value between 0 and 8192. |
| [options.angle] | <code>number</code> | <code>0</code> | tile angle of rotation, must be a multiple of 90. |
| [options.background] | <code>string</code> \| <code>Object</code> | <code>&quot;{r: 255, g: 255, b: 255, alpha: 1}&quot;</code> | background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to white without transparency. |
| [options.depth] | <code>string</code> |  | how deep to make the pyramid, possible values are `onepixel`, `onetile` or `one`, default based on layout. |
| [options.skipBlanks] | <code>number</code> | <code>-1</code> | threshold to skip tile generation, a value 0 - 255 for 8-bit images or 0 - 65535 for 16-bit images |
| [options.container] | <code>string</code> | <code>&quot;&#x27;fs&#x27;&quot;</code> | tile container, with value `fs` (filesystem) or `zip` (compressed file). |
| [options.layout] | <code>string</code> | <code>&quot;&#x27;dz&#x27;&quot;</code> | filesystem layout, possible values are `dz`, `iiif`, `iiif3`, `zoomify` or `google`. |
| [options.centre] | <code>boolean</code> | <code>false</code> | centre image in tile. |
| [options.center] | <code>boolean</code> | <code>false</code> | alternative spelling of centre. |
| [options.id] | <code>string</code> | <code>&quot;&#x27;https://example.com/iiif&#x27;&quot;</code> | when `layout` is `iiif`/`iiif3`, sets the `@id`/`id` attribute of `info.json` |
| [options.basename] | <code>string</code> |  | the name of the directory within the zip file when container is `zip`. |

**Example**  
```js
sharp('input.tiff')
  .png()
  .tile({
    size: 512
  })
  .toFile('output.dz', function(err, info) {
    // output.dzi is the Deep Zoom XML definition
    // output_files contains 512x512 tiles grouped by zoom level
  });
```
**Example**  
```js
const zipFileWithTiles = await sharp(input)
  .tile({ basename: "tiles" })
  .toBuffer();
```
**Example**  
```js
const iiififier = sharp().tile({ layout: "iiif" });
readableStream
  .pipe(iiififier)
  .pipe(writeableStream);
```


## timeout
> timeout(options) ⇒ <code>Sharp</code>

Set a timeout for processing, in seconds.
Use a value of zero to continue processing indefinitely, the default behaviour.

The clock starts when libvips opens an input image for processing.
Time spent waiting for a libuv thread to become available is not included.


**Since**: 0.29.2  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.seconds | <code>number</code> | Number of seconds after which processing will be stopped |

**Example**  
```js
// Ensure processing takes no longer than 3 seconds
try {
  const data = await sharp(input)
    .blur(1000)
    .timeout({ seconds: 3 })
    .toBuffer();
} catch (err) {
  if (err.message.includes('timeout')) { ... }
}
```