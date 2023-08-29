## composite
> composite(images) ⇒ <code>Sharp</code>

Composite image(s) over the processed (resized, extracted etc.) image.

The images to composite must be the same size or smaller than the processed image.
If both `top` and `left` options are provided, they take precedence over `gravity`.

Any resize, rotate or extract operations in the same processing pipeline
will always be applied to the input image before composition.

The `blend` option can be one of `clear`, `source`, `over`, `in`, `out`, `atop`,
`dest`, `dest-over`, `dest-in`, `dest-out`, `dest-atop`,
`xor`, `add`, `saturate`, `multiply`, `screen`, `overlay`, `darken`, `lighten`,
`colour-dodge`, `color-dodge`, `colour-burn`,`color-burn`,
`hard-light`, `soft-light`, `difference`, `exclusion`.

More information about blend modes can be found at
https://www.libvips.org/API/current/libvips-conversion.html#VipsBlendMode
and https://www.cairographics.org/operators/


**Throws**:

- <code>Error</code> Invalid parameters

**Since**: 0.22.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| images | <code>Array.&lt;Object&gt;</code> |  | Ordered list of images to composite |
| [images[].input] | <code>Buffer</code> \| <code>String</code> |  | Buffer containing image data, String containing the path to an image file, or Create object (see below) |
| [images[].input.create] | <code>Object</code> |  | describes a blank overlay to be created. |
| [images[].input.create.width] | <code>Number</code> |  |  |
| [images[].input.create.height] | <code>Number</code> |  |  |
| [images[].input.create.channels] | <code>Number</code> |  | 3-4 |
| [images[].input.create.background] | <code>String</code> \| <code>Object</code> |  | parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha. |
| [images[].input.text] | <code>Object</code> |  | describes a new text image to be created. |
| [images[].input.text.text] | <code>string</code> |  | text to render as a UTF-8 string. It can contain Pango markup, for example `<i>Le</i>Monde`. |
| [images[].input.text.font] | <code>string</code> |  | font name to render with. |
| [images[].input.text.fontfile] | <code>string</code> |  | absolute filesystem path to a font file that can be used by `font`. |
| [images[].input.text.width] | <code>number</code> | <code>0</code> | integral number of pixels to word-wrap at. Lines of text wider than this will be broken at word boundaries. |
| [images[].input.text.height] | <code>number</code> | <code>0</code> | integral number of pixels high. When defined, `dpi` will be ignored and the text will automatically fit the pixel resolution defined by `width` and `height`. Will be ignored if `width` is not specified or set to 0. |
| [images[].input.text.align] | <code>string</code> | <code>&quot;&#x27;left&#x27;&quot;</code> | text alignment (`'left'`, `'centre'`, `'center'`, `'right'`). |
| [images[].input.text.justify] | <code>boolean</code> | <code>false</code> | set this to true to apply justification to the text. |
| [images[].input.text.dpi] | <code>number</code> | <code>72</code> | the resolution (size) at which to render the text. Does not take effect if `height` is specified. |
| [images[].input.text.rgba] | <code>boolean</code> | <code>false</code> | set this to true to enable RGBA output. This is useful for colour emoji rendering, or support for Pango markup features like `<span foreground="red">Red!</span>`. |
| [images[].input.text.spacing] | <code>number</code> | <code>0</code> | text line height in points. Will use the font line height if none is specified. |
| [images[].blend] | <code>String</code> | <code>&#x27;over&#x27;</code> | how to blend this image with the image below. |
| [images[].gravity] | <code>String</code> | <code>&#x27;centre&#x27;</code> | gravity at which to place the overlay. |
| [images[].top] | <code>Number</code> |  | the pixel offset from the top edge. |
| [images[].left] | <code>Number</code> |  | the pixel offset from the left edge. |
| [images[].tile] | <code>Boolean</code> | <code>false</code> | set to true to repeat the overlay image across the entire image with the given `gravity`. |
| [images[].premultiplied] | <code>Boolean</code> | <code>false</code> | set to true to avoid premultiplying the image below. Equivalent to the `--premultiplied` vips option. |
| [images[].density] | <code>Number</code> | <code>72</code> | number representing the DPI for vector overlay image. |
| [images[].raw] | <code>Object</code> |  | describes overlay when using raw pixel data. |
| [images[].raw.width] | <code>Number</code> |  |  |
| [images[].raw.height] | <code>Number</code> |  |  |
| [images[].raw.channels] | <code>Number</code> |  |  |
| [images[].animated] | <code>boolean</code> | <code>false</code> | Set to `true` to read all frames/pages of an animated image. |
| [images[].failOn] | <code>string</code> | <code>&quot;&#x27;warning&#x27;&quot;</code> | @see [constructor parameters](/api-constructor#parameters) |
| [images[].limitInputPixels] | <code>number</code> \| <code>boolean</code> | <code>268402689</code> | @see [constructor parameters](/api-constructor#parameters) |

**Example**  
```js
await sharp(background)
  .composite([
    { input: layer1, gravity: 'northwest' },
    { input: layer2, gravity: 'southeast' },
  ])
  .toFile('combined.png');
```
**Example**  
```js
const output = await sharp('input.gif', { animated: true })
  .composite([
    { input: 'overlay.png', tile: true, blend: 'saturate' }
  ])
  .toBuffer();
```
**Example**  
```js
sharp('input.png')
  .rotate(180)
  .resize(300)
  .flatten( { background: '#ff6600' } )
  .composite([{ input: 'overlay.png', gravity: 'southeast' }])
  .sharpen()
  .withMetadata()
  .webp( { quality: 90 } )
  .toBuffer()
  .then(function(outputBuffer) {
    // outputBuffer contains upside down, 300px wide, alpha channel flattened
    // onto orange background, composited with overlay.png with SE gravity,
    // sharpened, with metadata, 90% quality WebP image data. Phew!
  });
```