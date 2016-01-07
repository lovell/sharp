# Interpolators

[Photo](https://www.flickr.com/photos/aotaro/21978966091) by
[aotaro](https://www.flickr.com/photos/aotaro/) is licensed under
[CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).

The following examples take the 4608x3072px original image
and resize to 480x320px using various interpolators.

To fetch the original 4608x3072px image and
generate the interpolator sample images:

```sh
curl -O https://farm6.staticflickr.com/5682/21978966091_b421afe866_o.jpg
node generate.js
```

## Nearest neighbour

![Nearest neighbour interpolation](nearest.jpg)

## Bilinear

![Bilinear interpolation](bilinear.jpg)

## Bicubic

![Bicubic interpolation](bicubic.jpg)

## Locally bounded bicubic

![Locally bounded bicubic interpolation](lbb.jpg)

## Vertex-split quadratic b-splines (VSQBS)

![Vertex-split quadratic b-splines interpolation](vsqbs.jpg)

## Nohalo

![Nohalo interpolation](nohalo.jpg)

## GraphicsMagick

![GraphicsMagick](gm.jpg)

```sh
gm convert 21978966091_b421afe866_o.jpg -resize 480x320^ -gravity center -extent 480x320 -quality 95 -strip -define jpeg:optimize-coding=true gm.jpg
```
