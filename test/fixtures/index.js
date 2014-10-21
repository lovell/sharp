'use strict';

var path = require('path');

var getPath = function(filename) {
  return path.join(__dirname, filename);
};

module.exports = {

  inputJpg: getPath('2569067123_aca715a2ee_o.jpg'), // http://www.flickr.com/photos/grizdave/2569067123/
  inputJpgWithExif: getPath('Landscape_8.jpg'), // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_8.jpg
  inputJpgWithExifMirroring: getPath('Landscape_5.jpg'), // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_5.jpg
  inputJpgWithGammaHoliness: getPath('gamma_dalai_lama_gray.jpg'), // http://www.4p8.com/eric.brasseur/gamma.html
  inputJpgWithCmykProfile: getPath('Channel_digital_image_CMYK_color.jpg'), // http://en.wikipedia.org/wiki/File:Channel_digital_image_CMYK_color.jpg

  inputPng: getPath('50020484-00001.png'), // http://c.searspartsdirect.com/lis_png/PLDM/50020484-00001.png
  inputPngWithTransparency: getPath('blackbug.png'), // public domain

  inputWebP: getPath('4.webp'), // http://www.gstatic.com/webp/gallery/4.webp
  inputTiff: getPath('G31D.TIF'), // http://www.fileformat.info/format/tiff/sample/e6c9a6e5253348f4aef6d17b534360ab/index.htm
  inputGif: getPath('Crash_test.gif'), // http://upload.wikimedia.org/wikipedia/commons/e/e3/Crash_test.gif

  outputJpg: getPath('output.jpg'),
  outputPng: getPath('output.png'),
  outputWebP: getPath('output.webp'),
  outputZoinks: getPath('output.zoinks'), // an 'unknown' file extension

  path: getPath // allows tests to write files to fixtures directory (for testing with human eyes)

};
