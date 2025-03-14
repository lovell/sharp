// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const fs = require('fs');
const { execSync } = require('child_process');

const async = require('async');
const Benchmark = require('benchmark');

const safeRequire = (name) => {
  try {
    return require(name);
  } catch (err) {}
  return null;
};

// Contenders
const sharp = require('../../');
const gm = require('gm');
const imagemagick = require('imagemagick');
const mapnik = safeRequire('mapnik');
const { Jimp, JimpMime } = require('jimp');

process.env.TF_CPP_MIN_LOG_LEVEL = 1;
const tfjs = safeRequire('@tensorflow/tfjs-node');

const fixtures = require('../fixtures');

const outputJpg = fixtures.path('output.jpg');
const outputPng = fixtures.path('output.png');
const outputWebP = fixtures.path('output.webp');

const width = 720;
const height = 588;
const heightPng = 540;

// Disable libvips cache to ensure tests are as fair as they can be
sharp.cache(false);

// Spawn one thread per physical CPU core
const physicalCores = Number(execSync('lscpu -p | egrep -v "^#" | sort -u -t, -k 2,4 | wc -l', { encoding: 'utf-8' }).trim());
console.log(`Detected ${physicalCores} physical cores`);
sharp.concurrency(physicalCores);

async.series({
  jpeg: function (callback) {
    const inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    const jpegSuite = new Benchmark.Suite('jpeg');
    // jimp
    jpegSuite.add('jimp-buffer-buffer', {
      defer: true,
      fn: async function (deferred) {
        const image = await Jimp.read(inputJpgBuffer)
        await image
          .resize({ w: width, h: height, mode: Jimp.RESIZE_BICUBIC })
          .getBuffer(JimpMime.jpeg, { quality: 80 });
        deferred.resolve();
      }
    }).add('jimp-file-file', {
      defer: true,
      fn: async function (deferred) {
        const image = await Jimp.read(fixtures.inputJpg);
        await image
          .resize({ w: width, h: height, mode: Jimp.RESIZE_BICUBIC })
          .getBuffer(JimpMime.jpeg, { quality: 80 });
        deferred.resolve();
      }
    });
    // mapnik
    mapnik && jpegSuite.add('mapnik-file-file', {
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
          width,
          height,
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    });
    // tfjs
    tfjs && jpegSuite.add('tfjs-node-buffer-buffer', {
      defer: true,
      fn: function (deferred) {
        const decoded = tfjs.node.decodeJpeg(inputJpgBuffer);
        const resized = tfjs.image.resizeBilinear(decoded, [height, width]);
        tfjs
          .node
          .encodeJpeg(resized, 'rgb', 80)
          .then(function () {
            deferred.resolve();
            tfjs.disposeVariables();
          })
          .catch(function (err) {
            throw err;
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .then(function () {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            sharp.simd(true);
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-random-access-read', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer, { sequentialRead: false })
          .resize(width, height)
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-lanczos2', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height, { kernel: 'lanczos2' })
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-lanczos3', {
      defer: true,
      fn: function (deferred) {
        sharp(inputJpgBuffer)
          .resize(width, height, { kernel: 'lanczos3' })
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
      fn: async function (deferred) {
        const image = await Jimp.read(inputPngBuffer);
        await image
          .resize({ w: width, h: heightPng, mode: Jimp.RESIZE_BICUBIC })
          .getBuffer(JimpMime.png, { deflateLevel: 6, filterType: 0 });
        deferred.resolve();
      }
    }).add('jimp-file-file', {
      defer: true,
      fn: async function (deferred) {
        const image = await Jimp.read(fixtures.inputPngAlphaPremultiplicationLarge)
        await image
          .resize({ w: width, h: heightPng, mode: Jimp.RESIZE_BICUBIC })
          .write(outputPng, { deflateLevel: 6, filterType: 0 });
        deferred.resolve();
      }
    });
    // mapnik
    mapnik && pngSuite.add('mapnik-file-file', {
      defer: true,
      fn: function (deferred) {
        mapnik.Image.open(fixtures.inputPngAlphaPremultiplicationLarge, function (err, img) {
          if (err) throw err;
          img.premultiply(function (err, img) {
            if (err) throw err;
            img.resize(width, heightPng, {
              scaling_method: mapnik.imageScaling.lanczos
            }, function (err, img) {
              if (err) throw err;
              img.demultiply(function (err, img) {
                if (err) throw err;
                img.save(outputPng, 'png32:f=no:z=6', function (err) {
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
            img.resize(width, heightPng, {
              scaling_method: mapnik.imageScaling.lanczos
            }, function (err, img) {
              if (err) throw err;
              img.demultiply(function (err, img) {
                if (err) throw err;
                img.encode('png32:f=no:z=6', function (err) {
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
          width,
          height: heightPng,
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
          .resize(width, heightPng)
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
          .resize(width, heightPng)
          .define('PNG:compression-level=6')
          .define('PNG:compression-filter=0')
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .resize(width, heightPng)
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
          .resize(width, heightPng)
          .png({ compressionLevel: 6 })
          .toBuffer(function (err, data) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-file-file', {
      defer: true,
      minSamples,
      fn: function (deferred) {
        sharp(fixtures.inputPngAlphaPremultiplicationLarge)
          .resize(width, heightPng)
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
          .resize(width, heightPng)
          .png({ compressionLevel: 6 })
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-progressive', {
      defer: true,
      minSamples,
      fn: function (deferred) {
        sharp(inputPngBuffer)
          .resize(width, heightPng)
          .png({ compressionLevel: 6, progressive: true })
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-adaptiveFiltering', {
      defer: true,
      minSamples,
      fn: function (deferred) {
        sharp(inputPngBuffer)
          .resize(width, heightPng)
          .png({ adaptiveFiltering: true, compressionLevel: 6 })
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
              deferred.resolve();
            }
          });
      }
    }).add('sharp-compressionLevel=9', {
      defer: true,
      minSamples,
      fn: function (deferred) {
        sharp(inputPngBuffer)
          .resize(width, heightPng)
          .png({ compressionLevel: 9 })
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
          .toBuffer(function (err) {
            if (err) {
              throw err;
            } else {
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
  if (err) {
    throw err;
  }
  Object.keys(results).forEach(function (format) {
    if (results[format].toString().substr(0, 5) !== 'sharp') {
      console.log('sharp was slower than ' + results[format] + ' for ' + format);
    }
  });
  console.dir(sharp.cache());
});
