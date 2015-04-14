'use strict';

var fs = require('fs');
var assert = require('assert');

var semver = require('semver');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Input/output', function() {

  it('Read from File and write to Stream', function(done) {
    var writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function() {
      sharp(fixtures.outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(fixtures.outputJpg);
        done();
      });
    });
    sharp(fixtures.inputJpg).resize(320, 240).pipe(writable);
  });

  it('Read from Buffer and write to Stream', function(done) {
    var inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    var writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function() {
      sharp(fixtures.outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(fixtures.outputJpg);
        done();
      });
    });
    sharp(inputJpgBuffer).resize(320, 240).pipe(writable);
  });

  it('Read from Stream and write to File', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp().resize(320, 240).toFile(fixtures.outputJpg, function(err, info) {
      if (err) throw err;
      assert.strictEqual(true, info.size > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    readable.pipe(pipeline);
  });

  it('Read from Stream and write to Buffer', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp().resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual(data.length, info.size);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
    readable.pipe(pipeline);
  });

  it('Read from Stream and write to Buffer via Promise', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp().resize(1, 1);
    pipeline.toBuffer().then(function(data) {
      assert.strictEqual(true, data.length > 0);
      done();
    }).catch(function(err) {
      throw err;
    });
    readable.pipe(pipeline);
  });

  it('Read from Stream and write to Stream', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function() {
      sharp(fixtures.outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(fixtures.outputJpg);
        done();
      });
    });
    var pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline).pipe(writable);
  });

  it('Handle Stream to Stream error ', function(done) {
    var pipeline = sharp().resize(320, 240);
    var anErrorWasEmitted = false;
    pipeline.on('error', function(err) {
      anErrorWasEmitted = !!err;
    }).on('end', function() {
      assert(anErrorWasEmitted);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    var readableButNotAnImage = fs.createReadStream(__filename);
    var writable = fs.createWriteStream(fixtures.outputJpg);
    readableButNotAnImage.pipe(pipeline).pipe(writable);
  });

  it('Handle File to Stream error', function(done) {
    var readableButNotAnImage = sharp(__filename).resize(320, 240);
    var anErrorWasEmitted = false;
    readableButNotAnImage.on('error', function(err) {
      anErrorWasEmitted = !!err;
    }).on('end', function() {
      assert(anErrorWasEmitted);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    var writable = fs.createWriteStream(fixtures.outputJpg);
    readableButNotAnImage.pipe(writable);
  });

  it('Sequential read, force JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .sequentialRead()
      .resize(320, 240)
      .toFormat(sharp.format.jpeg)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Not sequential read, force JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .sequentialRead(false)
      .resize(320, 240)
      .toFormat('jpeg')
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Fail when output File is input File', function(done) {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg, function(err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is input File via Promise', function(done) {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg).then(function(data) {
      assert(false);
      done();
    }).catch(function(err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is empty', function(done) {
    sharp(fixtures.inputJpg).toFile('', function(err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is empty via Promise', function(done) {
    sharp(fixtures.inputJpg).toFile('').then(function(data) {
      assert(false);
      done();
    }).catch(function(err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when input is empty Buffer', function(done) {
    sharp(new Buffer(0)).toBuffer().then(function () {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      done();
    });
  });

  it('Fail when input is invalid Buffer', function(done) {
    sharp(new Buffer([0x1, 0x2, 0x3, 0x4])).toBuffer().then(function () {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      done();
    });
  });

  it('Promises/A+', function(done) {
    sharp(fixtures.inputJpg).resize(320, 240).toBuffer().then(function(data) {
      sharp(data).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
    }).catch(function(err) {
      throw err;
    });
  });

  it('JPEG quality', function(done) {
    sharp(fixtures.inputJpg).resize(320, 240).quality(70).toBuffer(function(err, buffer70) {
      if (err) throw err;
      sharp(fixtures.inputJpg).resize(320, 240).toBuffer(function(err, buffer80) {
        if (err) throw err;
        sharp(fixtures.inputJpg).resize(320, 240).quality(90).toBuffer(function(err, buffer90) {
          if (err) throw err;
          assert(buffer70.length < buffer80.length);
          assert(buffer80.length < buffer90.length);
          done();
        });
      });
    });
  });

  it('Invalid quality', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).quality(-1);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('Progressive JPEG image', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .progressive(false)
      .toBuffer(function(err, nonProgressiveData, nonProgressiveInfo) {
        if (err) throw err;
        assert.strictEqual(true, nonProgressiveData.length > 0);
        assert.strictEqual(nonProgressiveData.length, nonProgressiveInfo.size);
        assert.strictEqual('jpeg', nonProgressiveInfo.format);
        assert.strictEqual(320, nonProgressiveInfo.width);
        assert.strictEqual(240, nonProgressiveInfo.height);
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .progressive()
          .toBuffer(function(err, progressiveData, progressiveInfo) {
            if (err) throw err;
            assert.strictEqual(true, progressiveData.length > 0);
            assert.strictEqual(progressiveData.length, progressiveInfo.size);
            assert.strictEqual(false, progressiveData.length === nonProgressiveData.length);
            assert.strictEqual('jpeg', progressiveInfo.format);
            assert.strictEqual(320, progressiveInfo.width);
            assert.strictEqual(240, progressiveInfo.height);
            done();
          });
      });
  });

  it('Progressive PNG image', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png()
      .progressive(false)
      .toBuffer(function(err, nonProgressiveData, nonProgressiveInfo) {
        if (err) throw err;
        assert.strictEqual(true, nonProgressiveData.length > 0);
        assert.strictEqual(nonProgressiveData.length, nonProgressiveInfo.size);
        assert.strictEqual('png', nonProgressiveInfo.format);
        assert.strictEqual(320, nonProgressiveInfo.width);
        assert.strictEqual(240, nonProgressiveInfo.height);
        sharp(nonProgressiveData)
          .progressive()
          .toBuffer(function(err, progressiveData, progressiveInfo) {
            if (err) throw err;
            assert.strictEqual(true, progressiveData.length > 0);
            assert.strictEqual(progressiveData.length, progressiveInfo.size);
            assert.strictEqual(true, progressiveData.length > nonProgressiveData.length);
            assert.strictEqual('png', progressiveInfo.format);
            assert.strictEqual(320, progressiveInfo.width);
            assert.strictEqual(240, progressiveInfo.height);
            done();
          });
      });
  });

  if (sharp.format.webp.output.buffer) {
    it('WebP output', function(done) {
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .toFormat(sharp.format.webp)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          done();
        });
    });
  }

  it('Invalid output format', function(done) {
    var isValid = false;
    try {
      sharp().toFormat('zoinks');
      isValid = true;
    } catch (e) {}
    assert(!isValid);
    done();
  });

  it('File input with corrupt header fails gracefully', function(done) {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .toBuffer(function(err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  it('Buffer input with corrupt header fails gracefully', function(done) {
    sharp(fs.readFileSync(fixtures.inputJpgWithCorruptHeader))
      .toBuffer(function(err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  describe('Output filename without extension uses input format', function() {

    it('JPEG', function(done) {
      sharp(fixtures.inputJpg).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fs.unlinkSync(fixtures.outputZoinks);
        done();
      });
    });

    it('PNG', function(done) {
      sharp(fixtures.inputPng).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fs.unlinkSync(fixtures.outputZoinks);
        done();
      });
    });

    it('Transparent PNG', function(done) {
      sharp(fixtures.inputPngWithTransparency).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        done();
      });
    });

    if (sharp.format.webp.input.file) {
      it('WebP', function(done) {
        sharp(fixtures.inputWebP).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.unlinkSync(fixtures.outputZoinks);
          done();
        });
      });
    }

    it('TIFF', function(done) {
      sharp(fixtures.inputTiff).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        assert.strictEqual('tiff', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fs.unlinkSync(fixtures.outputZoinks);
        done();
      });
    });

    it('Fail with GIF', function(done) {
      sharp(fixtures.inputGif).resize(320, 80).toFile(fixtures.outputZoinks, function(err) {
        assert(!!err);
        done();
      });
    });

  });

  describe('PNG output', function() {

    it('compression level is valid', function(done) {
      var isValid = false;
      try {
        sharp().compressionLevel(0);
        isValid = true;
      } catch (e) {}
      assert(isValid);
      done();
    });

    it('compression level is invalid', function(done) {
      var isValid = false;
      try {
        sharp().compressionLevel(-1);
        isValid = true;
      } catch (e) {}
      assert(!isValid);
      done();
    });

    if (semver.gte(sharp.libvipsVersion(), '7.42.0')) {
      it('withoutAdaptiveFiltering generates smaller file [libvips ' + sharp.libvipsVersion() + '>=7.42.0]', function(done) {
        // First generate with adaptive filtering
        sharp(fixtures.inputPng)
          .resize(320, 240)
          .withoutAdaptiveFiltering(false)
          .toBuffer(function(err, adaptiveData, adaptiveInfo) {
            if (err) throw err;
            assert.strictEqual(true, adaptiveData.length > 0);
            assert.strictEqual(adaptiveData.length, adaptiveInfo.size);
            assert.strictEqual('png', adaptiveInfo.format);
            assert.strictEqual(320, adaptiveInfo.width);
            assert.strictEqual(240, adaptiveInfo.height);
            // Then generate without
            sharp(fixtures.inputPng)
              .resize(320, 240)
              .withoutAdaptiveFiltering()
              .toBuffer(function(err, withoutAdaptiveData, withoutAdaptiveInfo) {
                if (err) throw err;
                assert.strictEqual(true, withoutAdaptiveData.length > 0);
                assert.strictEqual(withoutAdaptiveData.length, withoutAdaptiveInfo.size);
                assert.strictEqual('png', withoutAdaptiveInfo.format);
                assert.strictEqual(320, withoutAdaptiveInfo.width);
                assert.strictEqual(240, withoutAdaptiveInfo.height);
                assert.strictEqual(true, withoutAdaptiveData.length < adaptiveData.length);
                done();
              });
          });
      });
    }

  });

  it('Without chroma subsampling generates larger file', function(done) {
    // First generate with chroma subsampling (default)
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .withoutChromaSubsampling(false)
      .toBuffer(function(err, withChromaSubsamplingData, withChromaSubsamplingInfo) {
        if (err) throw err;
        assert.strictEqual(true, withChromaSubsamplingData.length > 0);
        assert.strictEqual(withChromaSubsamplingData.length, withChromaSubsamplingInfo.size);
        assert.strictEqual('jpeg', withChromaSubsamplingInfo.format);
        assert.strictEqual(320, withChromaSubsamplingInfo.width);
        assert.strictEqual(240, withChromaSubsamplingInfo.height);
        // Then generate without
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .withoutChromaSubsampling()
          .toBuffer(function(err, withoutChromaSubsamplingData, withoutChromaSubsamplingInfo) {
            if (err) throw err;
            assert.strictEqual(true, withoutChromaSubsamplingData.length > 0);
            assert.strictEqual(withoutChromaSubsamplingData.length, withoutChromaSubsamplingInfo.size);
            assert.strictEqual('jpeg', withoutChromaSubsamplingInfo.format);
            assert.strictEqual(320, withoutChromaSubsamplingInfo.width);
            assert.strictEqual(240, withoutChromaSubsamplingInfo.height);
            assert.strictEqual(true, withChromaSubsamplingData.length < withoutChromaSubsamplingData.length);
            done();
          });
      });
  });

  if (semver.gte(sharp.libvipsVersion(), '8.0.0')) {
    it('Trellis quantisation [libvips ' + sharp.libvipsVersion() + '>=8.0.0]', function(done) {
      // First generate without
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .trellisQuantisation(false)
        .toBuffer(function(err, withoutData, withoutInfo) {
          if (err) throw err;
          assert.strictEqual(true, withoutData.length > 0);
          assert.strictEqual(withoutData.length, withoutInfo.size);
          assert.strictEqual('jpeg', withoutInfo.format);
          assert.strictEqual(320, withoutInfo.width);
          assert.strictEqual(240, withoutInfo.height);
          // Then generate with
          sharp(fixtures.inputJpg)
            .resize(320, 240)
            .trellisQuantization()
            .toBuffer(function(err, withData, withInfo) {
              if (err) throw err;
              assert.strictEqual(true, withData.length > 0);
              assert.strictEqual(withData.length, withInfo.size);
              assert.strictEqual('jpeg', withInfo.format);
              assert.strictEqual(320, withInfo.width);
              assert.strictEqual(240, withInfo.height);
              // Verify image is same (as mozjpeg may not be present) size or less
              assert.strictEqual(true, withData.length <= withoutData.length);
              done();
            });
        });
    });
    it('Overshoot deringing [libvips ' + sharp.libvipsVersion() + '>=8.0.0]', function(done) {
      // First generate without
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .overshootDeringing(false)
        .toBuffer(function(err, withoutData, withoutInfo) {
          if (err) throw err;
          assert.strictEqual(true, withoutData.length > 0);
          assert.strictEqual(withoutData.length, withoutInfo.size);
          assert.strictEqual('jpeg', withoutInfo.format);
          assert.strictEqual(320, withoutInfo.width);
          assert.strictEqual(240, withoutInfo.height);
          // Then generate with
          sharp(fixtures.inputJpg)
            .resize(320, 240)
            .overshootDeringing()
            .toBuffer(function(err, withData, withInfo) {
              if (err) throw err;
              assert.strictEqual(true, withData.length > 0);
              assert.strictEqual(withData.length, withInfo.size);
              assert.strictEqual('jpeg', withInfo.format);
              assert.strictEqual(320, withInfo.width);
              assert.strictEqual(240, withInfo.height);
              done();
            });
        });
    });
    it('Optimise scans [libvips ' + sharp.libvipsVersion() + '>=8.0.0]', function(done) {
      // First generate without
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .optimiseScans(false)
        .toBuffer(function(err, withoutData, withoutInfo) {
          if (err) throw err;
          assert.strictEqual(true, withoutData.length > 0);
          assert.strictEqual(withoutData.length, withoutInfo.size);
          assert.strictEqual('jpeg', withoutInfo.format);
          assert.strictEqual(320, withoutInfo.width);
          assert.strictEqual(240, withoutInfo.height);
          // Then generate with
          sharp(fixtures.inputJpg)
            .resize(320, 240)
            .optimizeScans()
            .toBuffer(function(err, withData, withInfo) {
              if (err) throw err;
              assert.strictEqual(true, withData.length > 0);
              assert.strictEqual(withData.length, withInfo.size);
              assert.strictEqual('jpeg', withInfo.format);
              assert.strictEqual(320, withInfo.width);
              assert.strictEqual(240, withInfo.height);
              // Verify image is of a different size (progressive output even without mozjpeg)
              assert.strictEqual(true, withData.length != withoutData.length);
              done();
            });
        });
    });
  }

  if (sharp.format.magick.input.file) {
    it('Convert SVG, if supported, to PNG', function(done) {
      sharp(fixtures.inputSvg)
        .resize(100, 100)
        .toFormat('png')
        .toFile(fixtures.path('output.svg.png'), function(err, info) {
          if (err) {
            assert.strictEqual('Input file is of an unsupported image format', err.message);
          } else {
            assert.strictEqual(true, info.size > 0);
            assert.strictEqual('png', info.format);
            assert.strictEqual(100, info.width);
            assert.strictEqual(100, info.height);
          }
          done();
        });
    });
  }

  if (sharp.format.magick.input.file) {
    it('Convert PSD to PNG', function(done) {
      sharp(fixtures.inputPsd)
        .resize(320, 240)
        .toFormat(sharp.format.png)
        .toFile(fixtures.path('output.psd.png'), function(err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('png', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          done();
        });
    });
  }

  if (sharp.format.tiff.input.buffer) {
    it('Load TIFF from Buffer', function(done) {
      var inputTiffBuffer = fs.readFileSync(fixtures.inputTiff);
      sharp(inputTiffBuffer)
        .resize(320, 240)
        .jpeg()
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual(data.length, info.size);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          done();
        });
    });
  }

  if (sharp.format.magick.input.buffer) {
    it('Load GIF from Buffer', function(done) {
      var inputGifBuffer = fs.readFileSync(fixtures.inputGif);
      sharp(inputGifBuffer)
        .resize(320, 240)
        .jpeg()
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual(data.length, info.size);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          done();
        });
    });
  }

  if (sharp.format.openslide.input.file) {
    it('Load Aperio SVS file via Openslide', function(done) {
      sharp(fixtures.inputSvs)
        .resize(320, 240)
        .jpeg()
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          done();
        });
    });
  }

  if (sharp.format.raw.output.buffer) {
    describe('Ouput raw, uncompressed image data', function() {
      it('1 channel greyscale image', function(done) {
        sharp(fixtures.inputJpg)
          .greyscale()
          .resize(32, 24)
          .raw()
          .toBuffer(function(err, data, info) {
            assert.strictEqual(32 * 24 * 1, info.size);
            assert.strictEqual(data.length, info.size);
            assert.strictEqual('raw', info.format);
            assert.strictEqual(32, info.width);
            assert.strictEqual(24, info.height);
            done();
          });
      });
      it('3 channel colour image without transparency', function(done) {
        sharp(fixtures.inputJpg)
          .resize(32, 24)
          .toFormat('raw')
          .toBuffer(function(err, data, info) {
            assert.strictEqual(32 * 24 * 3, info.size);
            assert.strictEqual(data.length, info.size);
            assert.strictEqual('raw', info.format);
            assert.strictEqual(32, info.width);
            assert.strictEqual(24, info.height);
            done();
          });
      });
      it('4 channel colour image with transparency', function(done) {
        sharp(fixtures.inputPngWithTransparency)
          .resize(32, 24)
          .toFormat(sharp.format.raw)
          .toBuffer(function(err, data, info) {
            assert.strictEqual(32 * 24 * 4, info.size);
            assert.strictEqual(data.length, info.size);
            assert.strictEqual('raw', info.format);
            assert.strictEqual(32, info.width);
            assert.strictEqual(24, info.height);
            done();
          });
      });
    });
  }

  describe('Limit pixel count of input image', function() {

    it('Invalid fails - negative', function(done) {
      var isValid = false;
      try {
        sharp().limitInputPixels(-1);
        isValid = true;
      } catch (e) {}
      assert(!isValid);
      done();
    });

    it('Invalid fails - float', function(done) {
      var isValid = false;
      try {
        sharp().limitInputPixels(12.3);
        isValid = true;
      } catch (e) {}
      assert(!isValid);
      done();
    });

    it('Invalid fails - string', function(done) {
      var isValid = false;
      try {
        sharp().limitInputPixels('fail');
        isValid = true;
      } catch (e) {}
      assert(!isValid);
      done();
    });

    it('Same size as input works', function(done) {
      sharp(fixtures.inputJpg).metadata(function(err, metadata) {
        if (err) throw err;
        sharp(fixtures.inputJpg)
          .limitInputPixels(metadata.width * metadata.height)
          .toBuffer(function(err) {
            assert.strictEqual(true, !err);
            done();
          });
      });
    });

    it('Smaller than input fails', function(done) {
      sharp(fixtures.inputJpg).metadata(function(err, metadata) {
        if (err) throw err;
        sharp(fixtures.inputJpg)
          .limitInputPixels(metadata.width * metadata.height - 1)
          .toBuffer(function(err) {
            assert.strictEqual(true, !!err);
            done();
          });
      });
    });

  });

  it('Queue length change events', function(done) {
    var eventCounter = 0;
    var queueListener = function(queueLength) {
      assert.strictEqual('number', typeof queueLength);
      assert.strictEqual(1 - eventCounter, queueLength);
      eventCounter++;
    };
    sharp.queue.on('change', queueListener);
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toBuffer(function(err) {
        sharp.queue.removeListener('change', queueListener);
        if (err) throw err;
        assert.strictEqual(2, eventCounter);
        done();
      });
  });

});
