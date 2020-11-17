'use strict';

const path = require('path');
const sharp = require('../../');
const maxColourDistance = require('../../build/Release/sharp')._maxColourDistance;

// Helpers
const getPath = function (filename) {
  return path.join(__dirname, filename);
};

// Generates a 64-bit-as-binary-string image fingerprint
// Based on the dHash gradient method - see http://www.hackerfactor.com/blog/index.php?/archives/529-Kind-of-Like-That.html
const fingerprint = function (image, callback) {
  sharp(image)
    .flatten('gray')
    .greyscale()
    .normalise()
    .resize(9, 8, { fit: sharp.fit.fill })
    .raw()
    .toBuffer(function (err, data) {
      if (err) {
        callback(err);
      } else {
        let fingerprint = '';
        for (let col = 0; col < 8; col++) {
          for (let row = 0; row < 8; row++) {
            const left = data[(row * 8) + col];
            const right = data[(row * 8) + col + 1];
            fingerprint = fingerprint + (left < right ? '1' : '0');
          }
        }
        callback(null, fingerprint);
      }
    });
};

module.exports = {

  inputJpgWithLandscapeExif1: getPath('Landscape_1.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithLandscapeExif2: getPath('Landscape_2.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithLandscapeExif3: getPath('Landscape_3.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithLandscapeExif4: getPath('Landscape_4.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithLandscapeExif5: getPath('Landscape_5.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithLandscapeExif6: getPath('Landscape_6.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithLandscapeExif7: getPath('Landscape_7.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithLandscapeExif8: getPath('Landscape_8.jpg'), // https://github.com/recurser/exif-orientation-examples

  inputJpgWithPortraitExif1: getPath('Portrait_1.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithPortraitExif2: getPath('Portrait_2.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithPortraitExif3: getPath('Portrait_3.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithPortraitExif4: getPath('Portrait_4.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithPortraitExif5: getPath('Portrait_5.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithPortraitExif6: getPath('Portrait_6.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithPortraitExif7: getPath('Portrait_7.jpg'), // https://github.com/recurser/exif-orientation-examples
  inputJpgWithPortraitExif8: getPath('Portrait_8.jpg'), // https://github.com/recurser/exif-orientation-examples

  inputJpg: getPath('2569067123_aca715a2ee_o.jpg'), // http://www.flickr.com/photos/grizdave/2569067123/
  inputJpgWithExif: getPath('Landscape_8.jpg'), // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_8.jpg
  inputJpgWithIptcAndXmp: getPath('Landscape_9.jpg'), // https://unsplash.com/photos/RWAIyGmgHTQ
  inputJpgWithExifMirroring: getPath('Landscape_5.jpg'), // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_5.jpg
  inputJpgWithGammaHoliness: getPath('gamma_dalai_lama_gray.jpg'), // http://www.4p8.com/eric.brasseur/gamma.html
  inputJpgWithCmykProfile: getPath('Channel_digital_image_CMYK_color.jpg'), // http://en.wikipedia.org/wiki/File:Channel_digital_image_CMYK_color.jpg
  inputJpgWithCmykNoProfile: getPath('Channel_digital_image_CMYK_color_no_profile.jpg'),
  inputJpgWithCorruptHeader: getPath('corrupt-header.jpg'),
  inputJpgWithLowContrast: getPath('low-contrast.jpg'), // http://www.flickr.com/photos/grizdave/2569067123/
  inputJpgLarge: getPath('giant-image.jpg'),
  inputJpg320x240: getPath('320x240.jpg'), // http://www.andrewault.net/2010/01/26/create-a-test-pattern-video-with-perl/
  inputJpgOverlayLayer2: getPath('alpha-layer-2-ink.jpg'),
  inputJpgTruncated: getPath('truncated.jpg'), // head -c 10000 2569067123_aca715a2ee_o.jpg > truncated.jpg
  inputJpgCenteredImage: getPath('centered_image.jpeg'),
  inputJpgRandom: getPath('random.jpg'), // convert -size 200x200 xc:   +noise Random   random.jpg
  inputJpgThRandom: getPath('thRandom.jpg'), // convert random.jpg  -channel G -threshold 5% -separate +channel -negate thRandom.jpg
  inputJpgLossless: getPath('testimgl.jpg'), // Lossless JPEG from ftp://ftp.fu-berlin.de/unix/X11/graphics/ImageMagick/delegates/ljpeg-6b.tar.gz

  inputPng: getPath('50020484-00001.png'), // http://c.searspartsdirect.com/lis_png/PLDM/50020484-00001.png
  inputPngWithTransparency: getPath('blackbug.png'), // public domain
  inputPngCompleteTransparency: getPath('full-transparent.png'),
  inputPngWithGreyAlpha: getPath('grey-8bit-alpha.png'),
  inputPngWithOneColor: getPath('2x2_fdcce6.png'),
  inputPngWithTransparency16bit: getPath('tbgn2c16.png'), // http://www.schaik.com/pngsuite/tbgn2c16.png
  inputPng16BitGreyAlpha: getPath('16-bit-grey-alpha.png'), // CC-BY-NC-SA florc http://www.colourlovers.com/pattern/50713/pat
  inputPngOverlayLayer0: getPath('alpha-layer-0-background.png'),
  inputPngOverlayLayer1: getPath('alpha-layer-1-fill.png'),
  inputPngAlphaPremultiplicationSmall: getPath('alpha-premultiply-1024x768-paper.png'),
  inputPngAlphaPremultiplicationLarge: getPath('alpha-premultiply-2048x1536-paper.png'),
  inputPngBooleanNoAlpha: getPath('bandbool.png'),
  inputPngTestJoinChannel: getPath('testJoinChannel.png'),
  inputPngTruncated: getPath('truncated.png'), // gm convert 2569067123_aca715a2ee_o.jpg -resize 320x240 saw.png ; head -c 10000 saw.png > truncated.png
  inputPngEmbed: getPath('embedgravitybird.png'), // Released to sharp under a CC BY 4.0
  inputPngRGBWithAlpha: getPath('2569067123_aca715a2ee_o.png'), // http://www.flickr.com/photos/grizdave/2569067123/ (same as inputJpg)
  inputPngImageInAlpha: getPath('image-in-alpha.png'), // https://github.com/lovell/sharp/issues/1597

  inputWebP: getPath('4.webp'), // http://www.gstatic.com/webp/gallery/4.webp
  inputWebPWithTransparency: getPath('5_webp_a.webp'), // http://www.gstatic.com/webp/gallery3/5_webp_a.webp
  inputWebPAnimated: getPath('rotating-squares.webp'), // http://www.gstatic.com/webp/gallery3/5_webp_a.webp
  inputWebPAnimatedLoop3: getPath('animated-loop-3.webp'), // http://www.gstatic.com/webp/gallery3/5_webp_a.webp
  inputWebPAnimatedBigHeight: getPath('big-height.webp'),
  inputTiff: getPath('G31D.TIF'), // http://www.fileformat.info/format/tiff/sample/e6c9a6e5253348f4aef6d17b534360ab/index.htm
  inputTiffMultipage: getPath('G31D_MULTI.TIF'), // gm convert G31D.TIF -resize 50% G31D_2.TIF ; tiffcp G31D.TIF G31D_2.TIF G31D_MULTI.TIF
  inputTiffCielab: getPath('cielab-dagams.tiff'), // https://github.com/lovell/sharp/issues/646
  inputTiffUncompressed: getPath('uncompressed_tiff.tiff'), // https://code.google.com/archive/p/imagetestsuite/wikis/TIFFTestSuite.wiki file: 0c84d07e1b22b76f24cccc70d8788e4a.tif
  inputTiff8BitDepth: getPath('8bit_depth.tiff'),
  inputTifftagPhotoshop: getPath('tifftag-photoshop.tiff'), // https://github.com/lovell/sharp/issues/1600
  inputGif: getPath('Crash_test.gif'), // http://upload.wikimedia.org/wikipedia/commons/e/e3/Crash_test.gif
  inputGifGreyPlusAlpha: getPath('grey-plus-alpha.gif'), // http://i.imgur.com/gZ5jlmE.gif
  inputGifAnimated: getPath('rotating-squares.gif'), // CC0 https://loading.io/spinner/blocks/-rotating-squares-preloader-gif
  inputGifAnimatedLoop3: getPath('animated-loop-3.gif'), // CC-BY-SA-4.0 Petrus3743 https://commons.wikimedia.org/wiki/File:01-Goldener_Schnitt_Formel-Animation.gif
  inputSvg: getPath('check.svg'), // http://dev.w3.org/SVG/tools/svgweb/samples/svg-files/check.svg
  inputSvgSmallViewBox: getPath('circle.svg'),
  inputSvgWithEmbeddedImages: getPath('struct-image-04-t.svg'), // https://dev.w3.org/SVG/profiles/1.2T/test/svg/struct-image-04-t.svg
  inputAvif: getPath('cosmos_frame12924_yuv420_10bpc_bt2020_pq_q50.avif'), // CC by-nc-nd https://github.com/AOMediaCodec/av1-avif/tree/master/testFiles/Netflix

  inputJPGBig: getPath('flowers.jpeg'),

  inputPngStripesV: getPath('stripesV.png'),
  inputPngStripesH: getPath('stripesH.png'),

  inputJpgBooleanTest: getPath('booleanTest.jpg'),

  inputV: getPath('vfile.v'),

  outputJpg: getPath('output.jpg'),
  outputPng: getPath('output.png'),
  outputWebP: getPath('output.webp'),
  outputV: getPath('output.v'),
  outputTiff: getPath('output.tiff'),
  outputZoinks: getPath('output.zoinks'), // an 'unknown' file extension

  testPattern: getPath('test-pattern.png'),

  // Path for tests requiring human inspection
  path: getPath,

  // Path for expected output images
  expected: function (filename) {
    return getPath(path.join('expected', filename));
  },

  // Verify similarity of expected vs actual images via fingerprint
  // Specify distance threshold using `options={threshold: 42}`, default
  // `threshold` is 5;
  assertSimilar: function (expectedImage, actualImage, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (typeof options === 'undefined' && options === null) {
      options = {};
    }

    if (options.threshold === null || typeof options.threshold === 'undefined') {
      options.threshold = 5; // ~7% threshold
    }

    if (typeof options.threshold !== 'number') {
      throw new TypeError('`options.threshold` must be a number');
    }

    if (typeof callback !== 'function') {
      throw new TypeError('`callback` must be a function');
    }

    fingerprint(expectedImage, function (err, expectedFingerprint) {
      if (err) return callback(err);
      fingerprint(actualImage, function (err, actualFingerprint) {
        if (err) return callback(err);
        let distance = 0;
        for (let i = 0; i < 64; i++) {
          if (expectedFingerprint[i] !== actualFingerprint[i]) {
            distance++;
          }
        }

        if (distance > options.threshold) {
          return callback(new Error('Expected maximum similarity distance: ' + options.threshold + '. Actual: ' + distance + '.'));
        }

        callback();
      });
    });
  },

  assertMaxColourDistance: function (actualImagePath, expectedImagePath, acceptedDistance) {
    if (typeof actualImagePath !== 'string') {
      throw new TypeError('`actualImagePath` must be a string; got ' + actualImagePath);
    }
    if (typeof expectedImagePath !== 'string') {
      throw new TypeError('`expectedImagePath` must be a string; got ' + expectedImagePath);
    }
    if (typeof acceptedDistance !== 'number') {
      // Default threshold
      acceptedDistance = 1;
    }
    const distance = maxColourDistance(actualImagePath, expectedImagePath);
    if (distance > acceptedDistance) {
      throw new Error('Expected maximum absolute distance of ' + acceptedDistance + ', actual ' + distance);
    }
  }

};
