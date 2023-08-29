## tint
> tint(rgb) ⇒ <code>Sharp</code>

Tint the image using the provided chroma while preserving the image luminance.
An alpha channel may be present and will be unchanged by the operation.


**Throws**:

- <code>Error</code> Invalid parameter


| Param | Type | Description |
| --- | --- | --- |
| rgb | <code>string</code> \| <code>Object</code> | parsed by the [color](https://www.npmjs.org/package/color) module to extract chroma values. |

**Example**  
```js
const output = await sharp(input)
  .tint({ r: 255, g: 240, b: 16 })
  .toBuffer();
```


## greyscale
> greyscale([greyscale]) ⇒ <code>Sharp</code>

Convert to 8-bit greyscale; 256 shades of grey.
This is a linear operation. If the input image is in a non-linear colour space such as sRGB, use `gamma()` with `greyscale()` for the best results.
By default the output image will be web-friendly sRGB and contain three (identical) color channels.
This may be overridden by other sharp operations such as `toColourspace('b-w')`,
which will produce an output image containing one color channel.
An alpha channel may be present, and will be unchanged by the operation.



| Param | Type | Default |
| --- | --- | --- |
| [greyscale] | <code>Boolean</code> | <code>true</code> | 

**Example**  
```js
const output = await sharp(input).greyscale().toBuffer();
```


## grayscale
> grayscale([grayscale]) ⇒ <code>Sharp</code>

Alternative spelling of `greyscale`.



| Param | Type | Default |
| --- | --- | --- |
| [grayscale] | <code>Boolean</code> | <code>true</code> | 



## pipelineColourspace
> pipelineColourspace([colourspace]) ⇒ <code>Sharp</code>

Set the pipeline colourspace.

The input image will be converted to the provided colourspace at the start of the pipeline.
All operations will use this colourspace before converting to the output colourspace,
as defined by [toColourspace](#tocolourspace).

This feature is experimental and has not yet been fully-tested with all operations.


**Throws**:

- <code>Error</code> Invalid parameters

**Since**: 0.29.0  

| Param | Type | Description |
| --- | --- | --- |
| [colourspace] | <code>string</code> | pipeline colourspace e.g. `rgb16`, `scrgb`, `lab`, `grey16` [...](https://github.com/libvips/libvips/blob/41cff4e9d0838498487a00623462204eb10ee5b8/libvips/iofuncs/enumtypes.c#L774) |

**Example**  
```js
// Run pipeline in 16 bits per channel RGB while converting final result to 8 bits per channel sRGB.
await sharp(input)
 .pipelineColourspace('rgb16')
 .toColourspace('srgb')
 .toFile('16bpc-pipeline-to-8bpc-output.png')
```


## pipelineColorspace
> pipelineColorspace([colorspace]) ⇒ <code>Sharp</code>

Alternative spelling of `pipelineColourspace`.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| [colorspace] | <code>string</code> | pipeline colorspace. |



## toColourspace
> toColourspace([colourspace]) ⇒ <code>Sharp</code>

Set the output colourspace.
By default output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| [colourspace] | <code>string</code> | output colourspace e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://github.com/libvips/libvips/blob/3c0bfdf74ce1dc37a6429bed47fa76f16e2cd70a/libvips/iofuncs/enumtypes.c#L777-L794) |

**Example**  
```js
// Output 16 bits per pixel RGB
await sharp(input)
 .toColourspace('rgb16')
 .toFile('16-bpp.png')
```


## toColorspace
> toColorspace([colorspace]) ⇒ <code>Sharp</code>

Alternative spelling of `toColourspace`.


**Throws**:

- <code>Error</code> Invalid parameters


| Param | Type | Description |
| --- | --- | --- |
| [colorspace] | <code>string</code> | output colorspace. |