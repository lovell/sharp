'use strict';

var fs = require('fs');

var async = require('async');
var assert = require('assert');
var Benchmark = require('benchmark');
var semver = require('semver');

// Contenders
var gm = require('gm');
var imagemagick = require('imagemagick');
var jimp = require('jimp');
var sharp = require('../../');
var imagemagickNative;
try {
  imagemagickNative = require('imagemagick-native');
} catch (err) {
  console.log('Excluding imagemagick-native');
}
var lwip;
try {
  lwip = require('lwip');
} catch (err) {
  console.log('Excluding lwip');
}

var fixtures = require('../fixtures');

var width = 720;
var height = 480;

var magickFilterBilinear = 'Triangle';
var magickFilterBicubic = 'Lanczos';

// Disable libvips cache to ensure tests are as fair as they can be
sharp.cache(false);
// Enable use of SIMD
sharp.simd(true);

async.series({
  'jpeg-linear': function(callback) {
    var inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    var jpegSuite = new Benchmark.Suite('jpeg-linear');
    // jimp
    jpegSuite.add('jimp-buffer-buffer', {
      defer: true,
      fn: function(deferred) {
        new jimp(inputJpgBuffer, function(err) {
          if (err) {
            throw err;
          } else {
            this
              .resize(width, height)
              .quality(80)
              .getBuffer(jimp.MIME_JPEG, function (err) {
                if (err) {
                  throw err;
                } else {
                  deferred.resolve();
                }
              });
          }
        });
      }
    }).add('jimp-file-file', {
      defer: true,
      fn: function(deferred) {
        new jimp(fixtures.inputJpg, function(err) {
          if (err) {
            throw err;
          } else {
            this
              .resize(width, height)
              .quality(80)
              .write(fixtures.outputJpg, function (err) {
                if (err) {
                  throw err;
                } else {
                  deferred.resolve();
                }
              });
          }
        });
      }
    });
    // lwip
    if (typeof lwip !== 'undefined') {
      jpegSuite.add('lwip-file-file', {
        defer: true,
        fn: function(deferred) {
          lwip.open(fixtures.inputJpg, function (err, image) {
            if (err) {
              throw err;
            }
            image.resize(width, height, 'linear', function (err, image) {
              if (err) {
                throw err;
              }
              image.writeFile(fixtures.outputJpg, {quality: 80}, function (err) {
                if (err) {
                  throw err;
                }
                deferred.resolve();
              });
            });
          });
        }
      }).add('lwip-buffer-buffer', {
        defer: true,
        fn: function(deferred) {
          lwip.open(inputJpgBuffer, 'jpg', function (err, image) {
            if (err) {
              throw err;
            }
            image.resize(width, height, 'linear', function (err, image) {
              if (err) {
                throw err;
              }
              image.toBuffer('jpg', {quality: 80}, function (err, buffer) {
                if (err) {
                  throw err;
                }
                assert.notStrictEqual(null, buffer);
                deferred.resolve();
              });
            });
          });
        }
      });
    }
    // imagemagick
    jpegSuite.add('imagemagick-file-file', {
      defer: true,
      fn: function(deferred) {
        imagemagick.resize({
          srcPath: fixtures.inputJpg,
          dstPath: fixtures.outputJpg,
          quality: 0.8,
          width: width,
          height: height,
          format: 'jpg',
          filter: magickFilterBilinear
        }, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    });
    // imagemagick-native
    if (typeof imagemagickNative !== 'undefined') {
      jpegSuite.add('imagemagick-native-buffer-buffer', {
        defer: true,
        fn: function(deferred) {
          imagemagickNative.convert({
            srcData: inputJpgBuffer,
            quality: 80,
            width: width,
            height: height,
            format: 'JPEG',
            filter: magickFilterBilinear
          }, function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
        }
      });
    }
    // gm
    jpegSuite.add('gm-buffer-file', {
      defer: true,
      fn: function(deferred) {
        gm(inputJpgBuffer)
          .resize(width, height)
          .filter(magickFilterBilinear)
          .quality(80)
          .write(fixtures.outputJpg, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('gm-buffer-buffer', {
      defer: true,
      fn: function(deferred) {
        gm(inputJpgBuffer)
          .resize(width, height)
          .filter(magickFilterBilinear)
          .quality(80)
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('gm-file-file', {
      defer: true,
      fn: function(deferred) {
        gm(fixtures.inputJpg)
          .resize(width, height)
          .filter(magickFilterBilinear)
          .quality(80)
          .write(fixtures.outputJpg, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('gm-file-buffer', {
      defer: true,
      fn: function(deferred) {
        gm(fixtures.inputJpg)
          .resize(width, height)
          .filter(magickFilterBilinear)
          .quality(80)
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    });
    // sharp
    jpegSuite.add('sharp-buffer-file', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toFile(fixtures.outputJpg, function(err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-buffer-buffer', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-file', {
      defer: true,
      fn: function(deferred) {
        sharp(fixtures.inputJpg)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toFile(fixtures.outputJpg, function(err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-stream-stream', {
      defer: true,
      fn: function(deferred) {
        var readable = fs.createReadStream(fixtures.inputJpg);
        var writable = fs.createWriteStream(fixtures.outputJpg);
        writable.on('finish', function() {
          deferred.resolve();
        });
        var pipeline = sharp()
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear);
        readable.pipe(pipeline).pipe(writable);
      }
    }).add('sharp-file-buffer', {
      defer: true,
      fn: function(deferred) {
        sharp(fixtures.inputJpg)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-promise', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toBuffer()
          .then(function(buffer) {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          });
      }
    }).add('sharp-sharpen-mild', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .sharpen()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-sharpen-radius', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .sharpen(3, 1, 3)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-blur-mild', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .blur()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-blur-radius', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .blur(3)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-gamma', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .gamma()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-normalise', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .normalise()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-greyscale', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .greyscale()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-greyscale-gamma', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .gamma()
          .greyscale()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-progressive', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .progressive()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-without-chroma-subsampling', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .withoutChromaSubsampling()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-rotate', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .rotate(90)
          .interpolateWith(sharp.interpolator.bilinear)
          .resize(width, height)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-without-simd', {
      defer: true,
      fn: function(deferred) {
        sharp.simd(false);
        sharp(inputJpgBuffer)
          .rotate(90)
          .interpolateWith(sharp.interpolator.bilinear)
          .resize(width, height)
          .toBuffer(function(err, buffer) {
            sharp.simd(true);
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-sequentialRead', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .sequentialRead()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).on('cycle', function(event) {
      console.log('jpeg-linear ' + String(event.target));
    }).on('complete', function() {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  },

  'jpeg-cubic': function(callback) {
    var inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    var jpegSuite = new Benchmark.Suite('jpeg-cubic');
    // lwip
    if (typeof lwip !== 'undefined') {
      jpegSuite.add('lwip-file-file', {
        defer: true,
        fn: function(deferred) {
          lwip.open(fixtures.inputJpg, function (err, image) {
            if (err) {
              throw err;
            }
            image.resize(width, height, 'lanczos', function (err, image) {
              if (err) {
                throw err;
              }
              image.writeFile(fixtures.outputJpg, {quality: 80}, function (err) {
                if (err) {
                  throw err;
                }
                deferred.resolve();
              });
            });
          });
        }
      }).add('lwip-buffer-buffer', {
        defer: true,
        fn: function(deferred) {
          lwip.open(inputJpgBuffer, 'jpg', function (err, image) {
            if (err) {
              throw err;
            }
            image.resize(width, height, 'lanczos', function (err, image) {
              if (err) {
                throw err;
              }
              image.toBuffer('jpg', {quality: 80}, function (err, buffer) {
                if (err) {
                  throw err;
                }
                assert.notStrictEqual(null, buffer);
                deferred.resolve();
              });
            });
          });
        }
      });
    }
    // imagemagick
    jpegSuite.add('imagemagick-file-file', {
      defer: true,
      fn: function(deferred) {
        imagemagick.resize({
          srcPath: fixtures.inputJpg,
          dstPath: fixtures.outputJpg,
          quality: 0.8,
          width: width,
          height: height,
          format: 'jpg',
          filter: magickFilterBicubic
        }, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    });
    // imagemagick-native
    if (typeof imagemagickNative !== 'undefined') {
      jpegSuite.add('imagemagick-native-buffer-buffer', {
        defer: true,
        fn: function(deferred) {
          imagemagickNative.convert({
            srcData: inputJpgBuffer,
            quality: 80,
            width: width,
            height: height,
            format: 'JPEG',
            filter: magickFilterBicubic
          }, function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
        }
      });
    }
    // gm
    jpegSuite.add('gm-buffer-file', {
      defer: true,
      fn: function(deferred) {
        gm(inputJpgBuffer)
          .resize(width, height)
          .filter(magickFilterBicubic)
          .quality(80)
          .write(fixtures.outputJpg, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('gm-buffer-buffer', {
      defer: true,
      fn: function(deferred) {
        gm(inputJpgBuffer)
          .resize(width, height)
          .filter(magickFilterBicubic)
          .quality(80)
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('gm-file-file', {
      defer: true,
      fn: function(deferred) {
        gm(fixtures.inputJpg)
          .resize(width, height)
          .filter(magickFilterBicubic)
          .quality(80)
          .write(fixtures.outputJpg, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('gm-file-buffer', {
      defer: true,
      fn: function(deferred) {
        gm(fixtures.inputJpg)
          .resize(width, height)
          .filter(magickFilterBicubic)
          .quality(80)
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    });
    // sharp
    jpegSuite.add('sharp-buffer-file', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bicubic)
          .toFile(fixtures.outputJpg, function(err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-buffer-buffer', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bicubic)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-file', {
      defer: true,
      fn: function(deferred) {
        sharp(fixtures.inputJpg)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bicubic)
          .toFile(fixtures.outputJpg, function(err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-stream-stream', {
      defer: true,
      fn: function(deferred) {
        var readable = fs.createReadStream(fixtures.inputJpg);
        var writable = fs.createWriteStream(fixtures.outputJpg);
        writable.on('finish', function() {
          deferred.resolve();
        });
        var pipeline = sharp()
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bicubic);
        readable.pipe(pipeline).pipe(writable);
      }
    }).add('sharp-file-buffer', {
      defer: true,
      fn: function(deferred) {
        sharp(fixtures.inputJpg)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bicubic)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-promise', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bicubic)
          .toBuffer()
          .then(function(buffer) {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          });
      }
    }).on('cycle', function(event) {
      console.log('jpeg-cubic ' + String(event.target));
    }).on('complete', function() {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  },

  // Comparitive speed of pixel interpolators
  interpolators: function(callback) {
    var inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    (new Benchmark.Suite('interpolators')).add('sharp-nearest-neighbour', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.nearest)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-bilinear', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-vertexSplitQuadraticBasisSpline', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.vertexSplitQuadraticBasisSpline)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-bicubic', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bicubic)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-locallyBoundedBicubic', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.locallyBoundedBicubic)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-nohalo', {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.nohalo)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).on('cycle', function(event) {
      console.log('interpolators ' + String(event.target));
    }).on('complete', function() {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  },

  png: function(callback) {
    var inputPngBuffer = fs.readFileSync(fixtures.inputPng);
    var pngSuite = new Benchmark.Suite('png');
    // jimp
    pngSuite.add('jimp-buffer-buffer', {
      defer: true,
      fn: function(deferred) {
        new jimp(inputPngBuffer, function(err) {
          if (err) {
            throw err;
          } else {
            this
              .resize(width, height)
              .getBuffer(jimp.MIME_PNG, function (err) {
                if (err) {
                  throw err;
                } else {
                  deferred.resolve();
                }
              });
          }
        });
      }
    }).add('jimp-file-file', {
      defer: true,
      fn: function(deferred) {
        new jimp(fixtures.inputPng, function(err) {
          if (err) {
            throw err;
          } else {
            this
              .resize(width, height)
              .write(fixtures.outputPng, function (err) {
                if (err) {
                  throw err;
                } else {
                  deferred.resolve();
                }
              });
          }
        });
      }
    });
    // lwip
    if (typeof lwip !== 'undefined') {
      pngSuite.add('lwip-buffer-buffer', {
        defer: true,
        fn: function(deferred) {
          lwip.open(inputPngBuffer, 'png', function (err, image) {
            if (err) {
              throw err;
            }
            image.resize(width, height, 'linear', function (err, image) {
              if (err) {
                throw err;
              }
              image.toBuffer('png', function (err, buffer) {
                if (err) {
                  throw err;
                }
                assert.notStrictEqual(null, buffer);
                deferred.resolve();
              });
            });
          });
        }
      });
    }
    // imagemagick
    pngSuite.add('imagemagick-file-file', {
      defer: true,
      fn: function(deferred) {
        imagemagick.resize({
          srcPath: fixtures.inputPng,
          dstPath: fixtures.outputPng,
          width: width,
          height: height,
          filter: magickFilterBilinear
        }, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    });
    // imagemagick-native
    if (typeof imagemagickNative !== 'undefined') {
      pngSuite.add('imagemagick-native-buffer-buffer', {
        defer: true,
        fn: function(deferred) {
          imagemagickNative.convert({
            srcData: inputPngBuffer,
            width: width,
            height: height,
            format: 'PNG',
            filter: magickFilterBilinear
          });
          deferred.resolve();
        }
      });
    }
    // gm
    pngSuite.add('gm-file-file', {
      defer: true,
      fn: function(deferred) {
        gm(fixtures.inputPng)
          .resize(width, height)
          .filter(magickFilterBilinear)
          .write(fixtures.outputPng, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('gm-file-buffer', {
      defer: true,
      fn: function(deferred) {
        gm(fixtures.inputPng)
          .resize(width, height)
          .filter(magickFilterBilinear)
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    });
    // sharp
    pngSuite.add('sharp-buffer-file', {
      defer: true,
      fn: function(deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toFile(fixtures.outputPng, function(err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-buffer-buffer', {
      defer: true,
      fn: function(deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-file', {
      defer: true,
      fn: function(deferred) {
        sharp(fixtures.inputPng)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toFile(fixtures.outputPng, function(err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-buffer', {
      defer: true,
      fn: function(deferred) {
        sharp(fixtures.inputPng)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-progressive', {
      defer: true,
      fn: function(deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .progressive()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-withoutAdaptiveFiltering', {
      defer: true,
      fn: function(deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .withoutAdaptiveFiltering()
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    });
    pngSuite.on('cycle', function(event) {
      console.log(' png ' + String(event.target));
    }).on('complete', function() {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  },

  webp: function(callback) {
    var inputWebPBuffer = fs.readFileSync(fixtures.inputWebP);
    (new Benchmark.Suite('webp')).add('sharp-buffer-file', {
      defer: true,
      fn: function(deferred) {
        sharp(inputWebPBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toFile(fixtures.outputWebP, function(err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-buffer-buffer', {
      defer: true,
      fn: function(deferred) {
        sharp(inputWebPBuffer)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-file', {
      defer: true,
      fn: function(deferred) {
        sharp(fixtures.inputWebP)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toFile(fixtures.outputWebP, function(err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-buffer', {
      defer: true,
      fn: function(deferred) {
        sharp(fixtures.inputWebp)
          .resize(width, height)
          .interpolateWith(sharp.interpolator.bilinear)
          .toBuffer(function(err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).on('cycle', function(event) {
      console.log('webp ' + String(event.target));
    }).on('complete', function() {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  }
}, function(err, results) {
  assert(!err, err);
  Object.keys(results).forEach(function(format) {
    if (results[format].toString().substr(0, 5) !== 'sharp') {
      console.log('sharp was slower than ' + results[format] + ' for ' + format);
    }
  });
  console.dir(sharp.cache());
});
