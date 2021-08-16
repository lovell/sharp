'use strict';

const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

const async = require('async');
const assert = require('assert');
const Benchmark = require('benchmark');

// Contenders
const sharp = require('../../');
const gm = require('gm');
const imagemagick = require('imagemagick');
const mapnik = require('mapnik');
const jimp = require('jimp');
const squoosh = require('@squoosh/lib');

const fixtures = require('../fixtures');

const outputJpg = fixtures.path('output.jpg');
const outputPng = fixtures.path('output.png');
const outputWebP = fixtures.path('output.webp');

const width = 720;
const height = 588;

// Disable libvips cache to ensure tests are as fair as they can be
sharp.cache(false);

// Spawn one thread per CPU
sharp.concurrency(os.cpus().length);

async.series({
  jpeg: function (callback) {
    const inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    const jpegSuite = new Benchmark.Suite('jpeg');
    // jimp
    jpegSuite.add('jimp-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        jimp.read(inputJpgBuffer, function (err, image) {
          if (err) {
            throw err;
          } else {
            image
              .resize(width, height, jimp.RESIZE_BICUBIC)
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
      fn: function (deferred) {
        jimp.read(fixtures.inputJpg, function (err, image) {
          if (err) {
            throw err;
          } else {
            image
              .resize(width, height, jimp.RESIZE_BICUBIC)
              .quality(80)
              .write(outputJpg, function (err) {
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
    // squoosh-cli
    jpegSuite.add('squoosh-cli-file-file', {
      defer: true,
      fn: function (deferred) {
        exec(`./node_modules/.bin/squoosh-cli \
          --output-dir ${os.tmpdir()} \
          --resize '{"enabled":true,"width":${width},"height":${height},"method":"lanczos3","premultiply":false,"linearRGB":false}' \
          --mozjpeg '{"quality":80,"progressive":false,"optimize_coding":true,"quant_table":0,"trellis_multipass":false,"chroma_subsample":2,"separate_chroma_quality":false}' \
          "${fixtures.inputJpg}"`, function (err) {
          if (err) {
            throw err;
          }
          deferred.resolve();
        });
      }
    });
    // squoosh-lib (GPLv3)
    jpegSuite.add('squoosh-lib-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        const pool = new squoosh.ImagePool();
        const image = pool.ingestImage(inputJpgBuffer);
        image.decoded
          .then(function () {
            return image.preprocess({
              resize: {
                enabled: true,
                width,
                height,
                method: 'lanczos3',
                premultiply: false,
                linearRGB: false
              }
            });
          })
          .then(function () {
            return image.encode({
              mozjpeg: {
                quality: 80,
                progressive: false,
                optimize_coding: true,
                quant_table: 0,
                trellis_multipass: false,
                chroma_subsample: 2,
                separate_chroma_quality: false
              }
            });
          })
          .then(function () {
            return pool.close();
          })
          .then(function () {
            return image.encodedWith.mozjpeg;
          })
          .then(function () {
            deferred.resolve();
          });
      }
    });
    // mapnik
    jpegSuite.add('mapnik-file-file', {
      defer: true,
      fn: function (deferred) {
        mapnik.Image.open(fixtures.inputJpg, function (err, img) {
          if (err) throw err;
          img
            .resize(width, height, {
              scaling_method: mapnik.imageScaling.lanczos
            })
            .save(outputJpg, 'jpeg:quality=80', function (err) {
              if (err) throw err;
              deferred.resolve();
            });
        });
      }
    }).add('mapnik-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        mapnik.Image.fromBytes(inputJpgBuffer, { max_size: 3000 }, function (err, img) {
          if (err) throw err;
          img
            .resize(width, height, {
              scaling_method: mapnik.imageScaling.lanczos
            })
            .encode('jpeg:quality=80', function (err) {
              if (err) throw err;
              deferred.resolve();
            });
        });
      }
    });
    // imagemagick
    jpegSuite.add('imagemagick-file-file', {
      defer: true,
      fn: function (deferred) {
        imagemagick.resize({
          srcPath: fixtures.inputJpg,
          dstPath: outputJpg,
          quality: 0.8,
          width: width,
          height: height,
          format: 'jpg',
          filter: 'Lanczos'
        }, function (err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    });
    // gm
    jpegSuite.add('gm-buffer-file', {
      defer: true,
      fn: function (deferred) {
        gm(inputJpgBuffer)
          .filter('Lanczos')
          .resize(width, height)
          .quality(80)
          .write(outputJpg, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('gm-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        gm(inputJpgBuffer)
          .filter('Lanczos')
          .resize(width, height)
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
      fn: function (deferred) {
        gm(fixtures.inputJpg)
          .filter('Lanczos')
          .resize(width, height)
          .quality(80)
          .write(outputJpg, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('gm-file-buffer', {
      defer: true,
      fn: function (deferred) {
        gm(fixtures.inputJpg)
          .filter('Lanczos')
          .resize(width, height)
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .toFile(outputJpg, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(fixtures.inputJpg)
          .resize(width, height)
          .toFile(outputJpg, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-stream-stream', {
      defer: true,
      fn: function (deferred) {
        const readable = fs.createReadStream(fixtures.inputJpg);
        const writable = fs.createWriteStream(outputJpg);
        writable.on('finish', function () {
          deferred.resolve();
        });
        const pipeline = sharp()
          .resize(width, height);
        readable.pipe(pipeline).pipe(writable);
      }
    }).add('sharp-file-buffer', {
      defer: true,
      fn: function (deferred) {
        sharp(fixtures.inputJpg)
          .resize(width, height)
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .toBuffer()
          .then(function (buffer) {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          })
          .catch(function (err) {
            throw err;
          });
      }
    }).on('cycle', function (event) {
      console.log('jpeg ' + String(event.target));
    }).on('complete', function () {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  },
  // Effect of applying operations
  operations: function (callback) {
    const inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    const operationsSuite = new Benchmark.Suite('operations');
    operationsSuite.add('sharp-sharpen-mild', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .sharpen()
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .sharpen(3, 1, 3)
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .blur()
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .blur(3)
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .gamma()
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .normalise()
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .greyscale()
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .gamma()
          .greyscale()
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .jpeg({ progressive: true })
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height)
          .jpeg({ chromaSubsampling: '4:4:4' })
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .rotate(90)
          .resize(width, height)
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp.simd(false);
        sharp(inputJpgBuffer)
          .resize(width, height)
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(inputJpgBuffer, { sequentialRead: true })
          .resize(width, height)
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-crop-entropy', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height, {
            fit: 'cover',
            position: sharp.strategy.entropy
          })
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-crop-attention', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height, {
            fit: 'cover',
            position: sharp.strategy.attention
          })
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).on('cycle', function (event) {
      console.log('operations ' + String(event.target));
    }).on('complete', function () {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  },
  // Comparative speed of kernels
  kernels: function (callback) {
    const inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    (new Benchmark.Suite('kernels')).add('sharp-cubic', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height, { kernel: 'cubic' })
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-lanczos2', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height, { kernel: 'lanczos2' })
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-lanczos3', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height, { kernel: 'lanczos3' })
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).on('cycle', function (event) {
      console.log('kernels ' + String(event.target));
    }).on('complete', function () {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  },
  // PNG
  png: function (callback) {
    const inputPngBuffer = fs.readFileSync(fixtures.inputPngAlphaPremultiplicationLarge);
    const pngSuite = new Benchmark.Suite('png');
    const minSamples = 64;
    // jimp
    pngSuite.add('jimp-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        jimp.read(inputPngBuffer, function (err, image) {
          if (err) {
            throw err;
          } else {
            image
              .resize(width, height)
              .deflateLevel(6)
              .filterType(0)
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
      fn: function (deferred) {
        jimp.read(fixtures.inputPngAlphaPremultiplicationLarge, function (err, image) {
          if (err) {
            throw err;
          } else {
            image
              .resize(width, height)
              .deflateLevel(6)
              .filterType(0)
              .write(outputPng, function (err) {
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
    // mapnik
    pngSuite.add('mapnik-file-file', {
      defer: true,
      fn: function (deferred) {
        mapnik.Image.open(fixtures.inputPngAlphaPremultiplicationLarge, function (err, img) {
          if (err) throw err;
          img.premultiply(function (err, img) {
            if (err) throw err;
            img.resize(width, height, {
              scaling_method: mapnik.imageScaling.lanczos
            }, function (err, img) {
              if (err) throw err;
              img.demultiply(function (err, img) {
                if (err) throw err;
                img.save(outputPng, 'png', function (err) {
                  if (err) throw err;
                  deferred.resolve();
                });
              });
            });
          });
        });
      }
    }).add('mapnik-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        mapnik.Image.fromBytes(inputPngBuffer, { max_size: 3000 }, function (err, img) {
          if (err) throw err;
          img.premultiply(function (err, img) {
            if (err) throw err;
            img.resize(width, height, {
              scaling_method: mapnik.imageScaling.lanczos
            }, function (err, img) {
              if (err) throw err;
              img.demultiply(function (err, img) {
                if (err) throw err;
                img.encode('png', function (err) {
                  if (err) throw err;
                  deferred.resolve();
                });
              });
            });
          });
        });
      }
    });
    // imagemagick
    pngSuite.add('imagemagick-file-file', {
      defer: true,
      fn: function (deferred) {
        imagemagick.resize({
          srcPath: fixtures.inputPngAlphaPremultiplicationLarge,
          dstPath: outputPng,
          width: width,
          height: height,
          filter: 'Lanczos',
          customArgs: [
            '-define', 'PNG:compression-level=6',
            '-define', 'PNG:compression-filter=0'
          ]
        }, function (err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    });
    // gm
    pngSuite.add('gm-file-file', {
      defer: true,
      fn: function (deferred) {
        gm(fixtures.inputPngAlphaPremultiplicationLarge)
          .filter('Lanczos')
          .resize(width, height)
          .define('PNG:compression-level=6')
          .define('PNG:compression-filter=0')
          .write(outputPng, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('gm-file-buffer', {
      defer: true,
      fn: function (deferred) {
        gm(fixtures.inputPngAlphaPremultiplicationLarge)
          .filter('Lanczos')
          .resize(width, height)
          .define('PNG:compression-level=6')
          .define('PNG:compression-filter=0')
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
      minSamples,
      fn: function (deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .png({ compressionLevel: 6 })
          .toFile(outputPng, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-buffer-buffer', {
      defer: true,
      minSamples,
      fn: function (deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .png({ compressionLevel: 6 })
          .toBuffer(function (err, buffer) {
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
      minSamples,
      fn: function (deferred) {
        sharp(fixtures.inputPngAlphaPremultiplicationLarge)
          .resize(width, height)
          .png({ compressionLevel: 6 })
          .toFile(outputPng, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-buffer', {
      defer: true,
      minSamples,
      fn: function (deferred) {
        sharp(fixtures.inputPngAlphaPremultiplicationLarge)
          .resize(width, height)
          .png({ compressionLevel: 6 })
          .toBuffer(function (err, buffer) {
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
      minSamples,
      fn: function (deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .png({ compressionLevel: 6, progressive: true })
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-adaptiveFiltering', {
      defer: true,
      minSamples,
      fn: function (deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .png({ adaptiveFiltering: true, compressionLevel: 6 })
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).add('sharp-compressionLevel=9', {
      defer: true,
      minSamples,
      fn: function (deferred) {
        sharp(inputPngBuffer)
          .resize(width, height)
          .png({ compressionLevel: 9 })
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
    pngSuite.on('cycle', function (event) {
      console.log(' png ' + String(event.target));
    }).on('complete', function () {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  },
  // WebP
  webp: function (callback) {
    const inputWebPBuffer = fs.readFileSync(fixtures.inputWebP);
    (new Benchmark.Suite('webp')).add('sharp-buffer-file', {
      defer: true,
      fn: function (deferred) {
        sharp(inputWebPBuffer)
          .resize(width, height)
          .toFile(outputWebP, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        sharp(inputWebPBuffer)
          .resize(width, height)
          .toBuffer(function (err, buffer) {
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
      fn: function (deferred) {
        sharp(fixtures.inputWebP)
          .resize(width, height)
          .toFile(outputWebP, function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-buffer', {
      defer: true,
      fn: function (deferred) {
        sharp(fixtures.inputWebP)
          .resize(width, height)
          .toBuffer(function (err, buffer) {
            if (err) {
              throw err;
            } else {
              assert.notStrictEqual(null, buffer);
              deferred.resolve();
            }
          });
      }
    }).on('cycle', function (event) {
      console.log('webp ' + String(event.target));
    }).on('complete', function () {
      callback(null, this.filter('fastest').map('name'));
    }).run();
  }
}, function (err, results) {
  assert(!err, err);
  Object.keys(results).forEach(function (format) {
    if (results[format].toString().substr(0, 5) !== 'sharp') {
      console.log('sharp was slower than ' + results[format] + ' for ' + format);
    }
  });
  console.dir(sharp.cache());
});
