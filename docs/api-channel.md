## removeAlpha
> removeAlpha() ⇒ <code>Sharp</code>

Remove alpha channel, if any. This is a no-op if the image does not have an alpha channel.

See also [flatten](/api-operation#flatten).


**Example**  
```js
sharp('rgba.png')
  .removeAlpha()
  .toFile('rgb.png', function(err, info) {
    // rgb.png is a 3 channel image without an alpha channel
  });
```


## ensureAlpha
> ensureAlpha([alpha]) ⇒ <code>Sharp</code>

Ensure the output image has an alpha transparency channel.
If missing, the added alpha channel will have the specified
transparency level, defaulting to fully-opaque (1).
This is a no-op if the image already has an alpha channel.


**Throws**:

- <code>Error</code> Invalid alpha transparency level

**Since**: 0.21.2  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [alpha] | <code>number</code> | <code>1</code> | alpha transparency level (0=fully-transparent, 1=fully-opaque) |

**Example**  
```js
// rgba.png will be a 4 channel image with a fully-opaque alpha channel
await sharp('rgb.jpg')
  .ensureAlpha()
  .toFile('rgba.png')
```
**Example**  
```js
// rgba is a 4 channel image with a fully-transparent alpha channel
const rgba = await sharp(rgb)
  .ensureAlpha(0)
  .toBuffer();
```


## extractChannel
> extractChannel(channel) ⇒ <code>Sharp</code>

Extract a single channel from a multi-channel image.


**Throws**:

- <code>Error</code> Invalid channel


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>number</code> \| <code>string</code> | zero-indexed channel/band number to extract, or `red`, `green`, `blue` or `alpha`. |

**Example**  
```js
// green.jpg is a greyscale image containing the green channel of the input
await sharp(input)
  .extractChannel('green')
  .toFile('green.jpg');
```
**Example**  
```js
// red1 is the red value of the first pixel, red2 the second pixel etc.
const [red1, red2, ...] = await sharp(input)
  .extractChannel(0)
  .raw()
  .toBuffer();
```


## joinChannel
> joinChannel(images, options) ⇒ <code>Sharp</code>

Join one or more channels to the image.
The meaning of the added channels depends on the output colourspace, set with `toColourspace()`.
By default the output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
Channel ordering follows vips convention:
- sRGB: 0: Red, 1: Green, 2: Blue, 3: Alpha.
- CMYK: 0: Magenta, 1: Cyan, 2: Yellow, 3: Black, 4: Alpha.

Buffers may be any of the image formats supported by sharp.
For raw pixel input, the `options` object should contain a `raw` attribute, which follows the format of the attribute of the same name in the `sharp()` constructor.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| images | <code>Array.&lt;(string\|Buffer)&gt;</code> \| <code>string</code> \| <code>Buffer</code> | one or more images (file paths, Buffers). |
| options | <code>Object</code> | image options, see `sharp()` constructor. |



## bandbool
> bandbool(boolOp) ⇒ <code>Sharp</code>

Perform a bitwise boolean operation on all input image channels (bands) to produce a single channel output image.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| boolOp | <code>string</code> | one of `and`, `or` or `eor` to perform that bitwise operation, like the C logic operators `&`, `|` and `^` respectively. |

**Example**  
```js
sharp('3-channel-rgb-input.png')
  .bandbool(sharp.bool.and)
  .toFile('1-channel-output.png', function (err, info) {
    // The output will be a single channel image where each pixel `P = R & G & B`.
    // If `I(1,1) = [247, 170, 14] = [0b11110111, 0b10101010, 0b00001111]`
    // then `O(1,1) = 0b11110111 & 0b10101010 & 0b00001111 = 0b00000010 = 2`.
  });
```