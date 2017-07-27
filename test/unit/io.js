'use strict';

const fs = require('fs');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Input/output', function () {
  beforeEach(function () {
    sharp.cache(false);
  });
  afterEach(function () {
    sharp.cache(true);
  });

  it('Read from File and write to Stream', function (done) {
    const writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function () {
      sharp(fixtures.outputJpg).toBuffer(function (err, data, info) {
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

  it('Read from Buffer and write to Stream', function (done) {
    const inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    const writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function () {
      sharp(fixtures.outputJpg).toBuffer(function (err, data, info) {
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

  it('Read from Stream and write to File', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp().resize(320, 240).toFile(fixtures.outputJpg, function (err, info) {
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

  it('Read from Stream and write to Buffer', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp().resize(320, 240).toBuffer(function (err, data, info) {
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

  it('Read from Stream and write to Buffer via Promise resolved with Buffer', function () {
    const pipeline = sharp().resize(1, 1);
    fs.createReadStream(fixtures.inputJpg).pipe(pipeline);
    return pipeline
      .toBuffer({resolveWithObject: false})
      .then(function (data) {
        assert.strictEqual(true, data instanceof Buffer);
        assert.strictEqual(true, data.length > 0);
      });
  });

  it('Read from Stream and write to Buffer via Promise resolved with Object', function () {
    const pipeline = sharp().resize(1, 1);
    fs.createReadStream(fixtures.inputJpg).pipe(pipeline);
    return pipeline
      .toBuffer({resolveWithObject: true})
      .then(function (object) {
        assert.strictEqual('object', typeof object);
        assert.strictEqual('object', typeof object.info);
        assert.strictEqual('jpeg', object.info.format);
        assert.strictEqual(1, object.info.width);
        assert.strictEqual(1, object.info.height);
        assert.strictEqual(3, object.info.channels);
        assert.strictEqual(true, object.data instanceof Buffer);
        assert.strictEqual(true, object.data.length > 0);
      });
  });

  it('Read from File and write to Buffer via Promise resolved with Buffer', function () {
    return sharp(fixtures.inputJpg)
      .resize(1, 1)
      .toBuffer({resolveWithObject: false})
      .then(function (data) {
        assert.strictEqual(true, data instanceof Buffer);
        assert.strictEqual(true, data.length > 0);
      });
  });

  it('Read from File and write to Buffer via Promise resolved with Object', function () {
    return sharp(fixtures.inputJpg)
      .resize(1, 1)
      .toBuffer({resolveWithObject: true})
      .then(function (object) {
        assert.strictEqual('object', typeof object);
        assert.strictEqual('object', typeof object.info);
        assert.strictEqual('jpeg', object.info.format);
        assert.strictEqual(1, object.info.width);
        assert.strictEqual(1, object.info.height);
        assert.strictEqual(3, object.info.channels);
        assert.strictEqual(true, object.data instanceof Buffer);
        assert.strictEqual(true, object.data.length > 0);
      });
  });

  it('Read from Stream and write to Stream', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function () {
      sharp(fixtures.outputJpg).toBuffer(function (err, data, info) {
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
    const pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline).pipe(writable);
  });

  it('Stream should emit info event', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(fixtures.outputJpg);
    const pipeline = sharp().resize(320, 240);
    let infoEventEmitted = false;
    pipeline.on('info', function (info) {
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      assert.strictEqual(3, info.channels);
      infoEventEmitted = true;
    });
    writable.on('finish', function () {
      assert.strictEqual(true, infoEventEmitted);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    readable.pipe(pipeline).pipe(writable);
  });

  it('Handle Stream to Stream error ', function (done) {
    const pipeline = sharp().resize(320, 240);
    let anErrorWasEmitted = false;
    pipeline.on('error', function (err) {
      anErrorWasEmitted = !!err;
    }).on('end', function () {
      assert(anErrorWasEmitted);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    const readableButNotAnImage = fs.createReadStream(__filename);
    const writable = fs.createWriteStream(fixtures.outputJpg);
    readableButNotAnImage.pipe(pipeline).pipe(writable);
  });

  it('Handle File to Stream error', function (done) {
    const readableButNotAnImage = sharp(__filename).resize(320, 240);
    let anErrorWasEmitted = false;
    readableButNotAnImage.on('error', function (err) {
      anErrorWasEmitted = !!err;
    }).on('end', function () {
      assert(anErrorWasEmitted);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    const writable = fs.createWriteStream(fixtures.outputJpg);
    readableButNotAnImage.pipe(writable);
  });

  it('Readable side of Stream can start flowing after Writable side has finished', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function () {
      sharp(fixtures.outputJpg).toBuffer(function (err, data, info) {
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
    const pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline);
    pipeline.on('finish', function () {
      pipeline.pipe(writable);
    });
  });

  it('Sequential read, force JPEG', function (done) {
    sharp(fixtures.inputJpg)
      .sequentialRead()
      .resize(320, 240)
      .toFormat(sharp.format.jpeg)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Not sequential read, force JPEG', function (done) {
    sharp(fixtures.inputJpg)
      .sequentialRead(false)
      .resize(320, 240)
      .toFormat('jpeg')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Support output to jpg format', function (done) {
    sharp(fixtures.inputPng)
      .resize(320, 240)
      .toFormat('jpg')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Fail when output File is input File', function (done) {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg, function (err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is input File via Promise', function (done) {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg).then(function (data) {
      assert(false);
      done();
    }).catch(function (err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is empty', function (done) {
    sharp(fixtures.inputJpg).toFile('', function (err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is empty via Promise', function (done) {
    sharp(fixtures.inputJpg).toFile('').then(function (data) {
      assert(false);
      done();
    }).catch(function (err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when input is empty Buffer', function (done) {
    sharp(Buffer.alloc(0)).toBuffer().then(function () {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      done();
    });
  });

  it('Fail when input is invalid Buffer', function (done) {
    sharp(Buffer.from([0x1, 0x2, 0x3, 0x4])).toBuffer().then(function () {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      done();
    });
  });

  describe('Fail for unsupported input', function () {
    it('Undefined', function () {
      assert.throws(function () {
        sharp(undefined);
      });
    });
    it('Null', function () {
      assert.throws(function () {
        sharp(null);
      });
    });
    it('Numeric', function () {
      assert.throws(function () {
        sharp(1);
      });
    });
    it('Boolean', function () {
      assert.throws(function () {
        sharp(true);
      });
    });
    it('Error Object', function () {
      assert.throws(function () {
        sharp(new Error());
      });
    });
  });

  it('Promises/A+', function () {
    return sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toBuffer();
  });

  it('JPEG quality', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ quality: 70 })
      .toBuffer(function (err, buffer70) {
        if (err) throw err;
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .toBuffer(function (err, buffer80) {
            if (err) throw err;
            sharp(fixtures.inputJpg)
              .resize(320, 240)
              .jpeg({ quality: 90 })
              .toBuffer(function (err, buffer90) {
                if (err) throw err;
                assert(buffer70.length < buffer80.length);
                assert(buffer80.length < buffer90.length);
                done();
              });
          });
      });
  });

  describe('Invalid JPEG quality', function () {
    [-1, 88.2, 'test'].forEach(function (quality) {
      it(quality.toString(), function () {
        assert.throws(function () {
          sharp().jpeg({ quality: quality });
        });
      });
    });
  });

  it('Progressive JPEG image', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ progressive: false })
      .toBuffer(function (err, nonProgressiveData, nonProgressiveInfo) {
        if (err) throw err;
        assert.strictEqual(true, nonProgressiveData.length > 0);
        assert.strictEqual(nonProgressiveData.length, nonProgressiveInfo.size);
        assert.strictEqual('jpeg', nonProgressiveInfo.format);
        assert.strictEqual(320, nonProgressiveInfo.width);
        assert.strictEqual(240, nonProgressiveInfo.height);
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ progressive: true })
          .toBuffer(function (err, progressiveData, progressiveInfo) {
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

  it('Progressive PNG image', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ progressive: false })
      .toBuffer(function (err, nonProgressiveData, nonProgressiveInfo) {
        if (err) throw err;
        assert.strictEqual(true, nonProgressiveData.length > 0);
        assert.strictEqual(nonProgressiveData.length, nonProgressiveInfo.size);
        assert.strictEqual('png', nonProgressiveInfo.format);
        assert.strictEqual(320, nonProgressiveInfo.width);
        assert.strictEqual(240, nonProgressiveInfo.height);
        sharp(nonProgressiveData)
          .png({ progressive: true })
          .toBuffer(function (err, progressiveData, progressiveInfo) {
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
    it('WebP output', function (done) {
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .toFormat(sharp.format.webp)
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          done();
        });
    });

    it('should work for webp alpha quality', function (done) {
      sharp(fixtures.inputPngAlphaPremultiplicationSmall)
        .webp({alphaQuality: 80})
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          fixtures.assertSimilar(fixtures.expected('webp-alpha-80.webp'), data, done);
        });
    });

    it('should work for webp lossless', function (done) {
      sharp(fixtures.inputPngAlphaPremultiplicationSmall)
        .webp({lossless: true})
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          fixtures.assertSimilar(fixtures.expected('webp-lossless.webp'), data, done);
        });
    });

    it('should work for webp near-lossless', function (done) {
      sharp(fixtures.inputPngAlphaPremultiplicationSmall)
        .webp({nearLossless: true, quality: 50})
        .toBuffer(function (err50, data50, info50) {
          if (err50) throw err50;
          assert.strictEqual(true, data50.length > 0);
          assert.strictEqual('webp', info50.format);
          fixtures.assertSimilar(fixtures.expected('webp-near-lossless-50.webp'), data50, done);
        });
    });

    it('should use near-lossless when both lossless and nearLossless are specified', function (done) {
      sharp(fixtures.inputPngAlphaPremultiplicationSmall)
        .webp({nearLossless: true, quality: 50, lossless: true})
        .toBuffer(function (err50, data50, info50) {
          if (err50) throw err50;
          assert.strictEqual(true, data50.length > 0);
          assert.strictEqual('webp', info50.format);
          fixtures.assertSimilar(fixtures.expected('webp-near-lossless-50.webp'), data50, done);
        });
    });
  }

  it('Invalid output format', function (done) {
    let isValid = false;
    try {
      sharp().toFormat('zoinks');
      isValid = true;
    } catch (e) {}
    assert(!isValid);
    done();
  });

  it('File input with corrupt header fails gracefully', function (done) {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .toBuffer(function (err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  it('Buffer input with corrupt header fails gracefully', function (done) {
    sharp(fs.readFileSync(fixtures.inputJpgWithCorruptHeader))
      .toBuffer(function (err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  describe('Output filename with unknown extension', function () {
    it('Match JPEG input', function (done) {
      sharp(fixtures.inputJpg)
        .resize(320, 80)
        .toFile(fixtures.outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.unlinkSync(fixtures.outputZoinks);
          done();
        });
    });

    it('Match PNG input', function (done) {
      sharp(fixtures.inputPng)
        .resize(320, 80)
        .toFile(fixtures.outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('png', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.unlinkSync(fixtures.outputZoinks);
          done();
        });
    });

    it('Match WebP input', function (done) {
      sharp(fixtures.inputWebP)
        .resize(320, 80)
        .toFile(fixtures.outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.unlinkSync(fixtures.outputZoinks);
          done();
        });
    });

    it('Match TIFF input', function (done) {
      sharp(fixtures.inputTiff)
        .resize(320, 80)
        .toFile(fixtures.outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('tiff', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.unlinkSync(fixtures.outputZoinks);
          done();
        });
    });

    it('Autoconvert GIF input to PNG output', function (done) {
      sharp(fixtures.inputGif)
        .resize(320, 80)
        .toFile(fixtures.outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('png', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.unlinkSync(fixtures.outputZoinks);
          done();
        });
    });

    it('Force JPEG format for PNG input', function (done) {
      sharp(fixtures.inputPng)
        .resize(320, 80)
        .jpeg()
        .toFile(fixtures.outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.unlinkSync(fixtures.outputZoinks);
          done();
        });
    });
  });

  describe('PNG output', function () {
    it('compression level is valid', function () {
      assert.doesNotThrow(function () {
        sharp().png({ compressionLevel: 0 });
      });
    });

    it('compression level is invalid', function () {
      assert.throws(function () {
        sharp().png({ compressionLevel: -1 });
      });
    });

    it('without adaptiveFiltering generates smaller file', function (done) {
      // First generate with adaptive filtering
      sharp(fixtures.inputPng)
        .resize(320, 240)
        .png({ adaptiveFiltering: true })
        .toBuffer(function (err, adaptiveData, adaptiveInfo) {
          if (err) throw err;
          assert.strictEqual(true, adaptiveData.length > 0);
          assert.strictEqual(adaptiveData.length, adaptiveInfo.size);
          assert.strictEqual('png', adaptiveInfo.format);
          assert.strictEqual(320, adaptiveInfo.width);
          assert.strictEqual(240, adaptiveInfo.height);
          // Then generate without
          sharp(fixtures.inputPng)
            .resize(320, 240)
            .png({ adaptiveFiltering: false })
            .toBuffer(function (err, withoutAdaptiveData, withoutAdaptiveInfo) {
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

    it('Invalid PNG adaptiveFiltering value throws error', function () {
      assert.throws(function () {
        sharp().png({ adaptiveFiltering: 1 });
      });
    });
  });

  it('Without chroma subsampling generates larger file', function (done) {
    // First generate with chroma subsampling (default)
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ chromaSubsampling: '4:2:0' })
      .toBuffer(function (err, withChromaSubsamplingData, withChromaSubsamplingInfo) {
        if (err) throw err;
        assert.strictEqual(true, withChromaSubsamplingData.length > 0);
        assert.strictEqual(withChromaSubsamplingData.length, withChromaSubsamplingInfo.size);
        assert.strictEqual('jpeg', withChromaSubsamplingInfo.format);
        assert.strictEqual(320, withChromaSubsamplingInfo.width);
        assert.strictEqual(240, withChromaSubsamplingInfo.height);
        // Then generate without
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ chromaSubsampling: '4:4:4' })
          .toBuffer(function (err, withoutChromaSubsamplingData, withoutChromaSubsamplingInfo) {
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

  it('Invalid JPEG chromaSubsampling value throws error', function () {
    assert.throws(function () {
      sharp().jpeg({ chromaSubsampling: '4:2:2' });
    });
  });

  it('Trellis quantisation', function (done) {
    // First generate without
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ trellisQuantisation: false })
      .toBuffer(function (err, withoutData, withoutInfo) {
        if (err) throw err;
        assert.strictEqual(true, withoutData.length > 0);
        assert.strictEqual(withoutData.length, withoutInfo.size);
        assert.strictEqual('jpeg', withoutInfo.format);
        assert.strictEqual(320, withoutInfo.width);
        assert.strictEqual(240, withoutInfo.height);
        // Then generate with
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ trellisQuantization: true })
          .toBuffer(function (err, withData, withInfo) {
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

  it('Overshoot deringing', function (done) {
    // First generate without
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ overshootDeringing: false })
      .toBuffer(function (err, withoutData, withoutInfo) {
        if (err) throw err;
        assert.strictEqual(true, withoutData.length > 0);
        assert.strictEqual(withoutData.length, withoutInfo.size);
        assert.strictEqual('jpeg', withoutInfo.format);
        assert.strictEqual(320, withoutInfo.width);
        assert.strictEqual(240, withoutInfo.height);
        // Then generate with
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ overshootDeringing: true })
          .toBuffer(function (err, withData, withInfo) {
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

  it('Optimise scans generates different output length', function (done) {
    // First generate without
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseScans: false })
      .toBuffer(function (err, withoutData, withoutInfo) {
        if (err) throw err;
        assert.strictEqual(true, withoutData.length > 0);
        assert.strictEqual(withoutData.length, withoutInfo.size);
        assert.strictEqual('jpeg', withoutInfo.format);
        assert.strictEqual(320, withoutInfo.width);
        assert.strictEqual(240, withoutInfo.height);
        // Then generate with
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ optimizeScans: true })
          .toBuffer(function (err, withData, withInfo) {
            if (err) throw err;
            assert.strictEqual(true, withData.length > 0);
            assert.strictEqual(withData.length, withInfo.size);
            assert.strictEqual('jpeg', withInfo.format);
            assert.strictEqual(320, withInfo.width);
            assert.strictEqual(240, withInfo.height);
            // Verify image is of a different size (progressive output even without mozjpeg)
            assert.notEqual(withData.length, withoutData.length);
            done();
          });
      });
  });

  it('Convert SVG to PNG at default 72DPI', function (done) {
    sharp(fixtures.inputSvg)
      .resize(1024)
      .extract({left: 290, top: 760, width: 40, height: 40})
      .toFormat('png')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(40, info.width);
        assert.strictEqual(40, info.height);
        fixtures.assertSimilar(fixtures.expected('svg72.png'), data, function (err) {
          if (err) throw err;
          sharp(data).metadata(function (err, info) {
            if (err) throw err;
            assert.strictEqual(72, info.density);
            done();
          });
        });
      });
  });

  it.skip('Convert SVG to PNG at 1200DPI', function (done) {
    sharp(fixtures.inputSvg, { density: 1200 })
      .resize(1024)
      .extract({left: 290, top: 760, width: 40, height: 40})
      .toFormat('png')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(40, info.width);
        assert.strictEqual(40, info.height);
        fixtures.assertSimilar(fixtures.expected('svg1200.png'), data, function (err) {
          if (err) throw err;
          sharp(data).metadata(function (err, info) {
            if (err) throw err;
            assert.strictEqual(1200, info.density);
            done();
          });
        });
      });
  });

  it('Convert SVG with embedded images to PNG, respecting dimensions, autoconvert to PNG', function (done) {
    sharp(fixtures.inputSvgWithEmbeddedImages)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(480, info.width);
        assert.strictEqual(360, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('svg-embedded.png'), data, done);
      });
  });

  it('Load TIFF from Buffer', function (done) {
    const inputTiffBuffer = fs.readFileSync(fixtures.inputTiff);
    sharp(inputTiffBuffer)
      .resize(320, 240)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Save TIFF to Buffer', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('tiff', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Invalid WebP quality throws error', function () {
    assert.throws(function () {
      sharp().webp({ quality: 101 });
    });
  });

  it('Invalid WebP alpha quality throws error', function () {
    assert.throws(function () {
      sharp().webp({ alphaQuality: 101 });
    });
  });

  it('Invalid TIFF quality throws error', function () {
    assert.throws(function () {
      sharp().tiff({ quality: 101 });
    });
  });

  it('Missing TIFF quality does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff();
    });
  });

  it('Not squashing TIFF to a bit depth of 1 should not change the file size', function (done) {
    const startSize = fs.statSync(fixtures.inputTiff8BitDepth).size;
    sharp(fixtures.inputTiff8BitDepth)
      .toColourspace('b-w') // can only squash 1 band uchar images
      .tiff({
        squash: false,
        compression: 'none'
      })
      .toFile(fixtures.outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size === startSize);
        fs.unlink(fixtures.outputTiff, done);
      });
  });

  it('Squashing TIFF to a bit depth of 1 should significantly reduce file size', function (done) {
    const startSize = fs.statSync(fixtures.inputTiff8BitDepth).size;
    sharp(fixtures.inputTiff8BitDepth)
      .toColourspace('b-w') // can only squash 1 band uchar images
      .tiff({
        squash: true,
        compression: 'none'
      })
      .toFile(fixtures.outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < (startSize / 2));
        fs.unlink(fixtures.outputTiff, done);
      });
  });

  it('Invalid TIFF squash value throws error', function () {
    assert.throws(function () {
      sharp().tiff({ squash: 'true' });
    });
  });

  it('TIFF setting xres and yres on file', function (done) {
    const res = 1000.0; // inputTiff has a dpi of 300 (res*2.54)
    sharp(fixtures.inputTiff)
      .tiff({
        xres: (res),
        yres: (res)
      })
      .toFile(fixtures.outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        sharp(fixtures.outputTiff).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(metadata.density, res * 2.54); // convert to dpi
          fs.unlink(fixtures.outputTiff, done);
        });
      });
  });

  it('TIFF setting xres and yres on buffer', function (done) {
    const res = 1000.0; // inputTiff has a dpi of 300 (res*2.54)
    sharp(fixtures.inputTiff)
      .tiff({
        xres: (res),
        yres: (res)
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(metadata.density, res * 2.54); // convert to dpi
          done();
        });
      });
  });

  it('TIFF invalid xres value should throw an error', function () {
    assert.throws(function () {
      sharp().tiff({ xres: '1000.0' });
    });
  });

  it('TIFF invalid yres value should throw an error', function () {
    assert.throws(function () {
      sharp().tiff({ yres: '1000.0' });
    });
  });

  it('TIFF lzw compression with horizontal predictor shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'lzw',
        predictor: 'horizontal'
      })
      .toFile(fixtures.outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        fs.unlink(fixtures.outputTiff, done);
      });
  });

  it('TIFF deflate compression with horizontal predictor shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'horizontal'
      })
      .toFile(fixtures.outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        fs.unlink(fixtures.outputTiff, done);
      });
  });

  it('TIFF deflate compression with float predictor shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'float'
      })
      .toFile(fixtures.outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        fs.unlink(fixtures.outputTiff, done);
      });
  });

  it('TIFF deflate compression without predictor shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'none'
      })
      .toFile(fixtures.outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        fs.unlink(fixtures.outputTiff, done);
      });
  });

  it('TIFF jpeg compression shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'jpeg'
      })
      .toFile(fixtures.outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        fs.unlink(fixtures.outputTiff, done);
      });
  });

  it('TIFF none compression does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ compression: 'none' });
    });
  });

  it('TIFF lzw compression does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ compression: 'lzw' });
    });
  });

  it('TIFF deflate compression does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ compression: 'deflate' });
    });
  });

  it('TIFF invalid compression option throws', function () {
    assert.throws(function () {
      sharp().tiff({ compression: 0 });
    });
  });

  it('TIFF invalid compression option throws', function () {
    assert.throws(function () {
      sharp().tiff({ compression: 'a' });
    });
  });

  it('TIFF invalid predictor option throws', function () {
    assert.throws(function () {
      sharp().tiff({ predictor: 'a' });
    });
  });

  it('TIFF horizontal predictor does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ predictor: 'horizontal' });
    });
  });

  it('TIFF float predictor does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ predictor: 'float' });
    });
  });

  it('TIFF none predictor does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ predictor: 'none' });
    });
  });

  it('Input and output formats match when not forcing', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ compressionLevel: 1, force: false })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Load GIF from Buffer', function (done) {
    const inputGifBuffer = fs.readFileSync(fixtures.inputGif);
    sharp(inputGifBuffer)
      .resize(320, 240)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Load GIF grey+alpha from file, auto convert to PNG', function (done) {
    sharp(fixtures.inputGifGreyPlusAlpha)
      .resize(8, 4)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('png', info.format);
        assert.strictEqual(8, info.width);
        assert.strictEqual(4, info.height);
        assert.strictEqual(4, info.channels);
        done();
      });
  });

  it('Load Vips V file', function (done) {
    sharp(fixtures.inputV)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(70, info.width);
        assert.strictEqual(60, info.height);
        fixtures.assertSimilar(fixtures.expected('vfile.jpg'), data, done);
      });
  });

  it('Save Vips V file', function (done) {
    sharp(fixtures.inputJpg)
      .extract({left: 910, top: 1105, width: 70, height: 60})
      .toFile(fixtures.outputV, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        assert.strictEqual('v', info.format);
        assert.strictEqual(70, info.width);
        assert.strictEqual(60, info.height);
        fs.unlinkSync(fixtures.outputV);
        done();
      });
  });

  describe('Ouput raw, uncompressed image data', function () {
    it('1 channel greyscale image', function (done) {
      sharp(fixtures.inputJpg)
        .greyscale()
        .resize(32, 24)
        .raw()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(32 * 24 * 1, info.size);
          assert.strictEqual(data.length, info.size);
          assert.strictEqual('raw', info.format);
          assert.strictEqual(32, info.width);
          assert.strictEqual(24, info.height);
          done();
        });
    });
    it('3 channel colour image without transparency', function (done) {
      sharp(fixtures.inputJpg)
        .resize(32, 24)
        .toFormat('raw')
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(32 * 24 * 3, info.size);
          assert.strictEqual(data.length, info.size);
          assert.strictEqual('raw', info.format);
          assert.strictEqual(32, info.width);
          assert.strictEqual(24, info.height);
          done();
        });
    });
    it('4 channel colour image with transparency', function (done) {
      sharp(fixtures.inputPngWithTransparency)
        .resize(32, 24)
        .toFormat(sharp.format.raw)
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(32 * 24 * 4, info.size);
          assert.strictEqual(data.length, info.size);
          assert.strictEqual('raw', info.format);
          assert.strictEqual(32, info.width);
          assert.strictEqual(24, info.height);
          done();
        });
    });
  });

  describe('Limit pixel count of input image', function () {
    it('Invalid fails - negative', function (done) {
      let isValid = false;
      try {
        sharp().limitInputPixels(-1);
        isValid = true;
      } catch (e) {}
      assert(!isValid);
      done();
    });

    it('Invalid fails - float', function (done) {
      let isValid = false;
      try {
        sharp().limitInputPixels(12.3);
        isValid = true;
      } catch (e) {}
      assert(!isValid);
      done();
    });

    it('Invalid fails - string', function (done) {
      let isValid = false;
      try {
        sharp().limitInputPixels('fail');
        isValid = true;
      } catch (e) {}
      assert(!isValid);
      done();
    });

    it('Same size as input works', function (done) {
      sharp(fixtures.inputJpg).metadata(function (err, metadata) {
        if (err) throw err;
        sharp(fixtures.inputJpg)
          .limitInputPixels(metadata.width * metadata.height)
          .toBuffer(function (err) {
            assert.strictEqual(true, !err);
            done();
          });
      });
    });

    it('Disabling limit works', function (done) {
      sharp(fixtures.inputJpgLarge)
        .limitInputPixels(false)
        .resize(2)
        .toBuffer(function (err) {
          assert.strictEqual(true, !err);
          done();
        });
    });

    it('Enabling default limit works and fails with a large image', function (done) {
      sharp(fixtures.inputJpgLarge)
        .limitInputPixels(true)
        .toBuffer(function (err) {
          assert.strictEqual(true, !!err);
          done();
        });
    });

    it('Smaller than input fails', function (done) {
      sharp(fixtures.inputJpg).metadata(function (err, metadata) {
        if (err) throw err;
        sharp(fixtures.inputJpg)
          .limitInputPixels((metadata.width * metadata.height) - 1)
          .toBuffer(function (err) {
            assert.strictEqual(true, !!err);
            done();
          });
      });
    });
  });

  describe('Input options', function () {
    it('Non-Object options fails', function () {
      assert.throws(function () {
        sharp(null, 'zoinks');
      });
    });
    it('Invalid density: string', function () {
      assert.throws(function () {
        sharp(null, { density: 'zoinks' });
      });
    });
    it('Invalid density: float', function () {
      assert.throws(function () {
        sharp(null, { density: 0.5 });
      });
    });
    it('Ignore unknown attribute', function () {
      sharp(null, { unknown: true });
    });
  });

  describe('Raw pixel input', function () {
    it('Missing options', function () {
      assert.throws(function () {
        sharp({ raw: {} });
      });
    });
    it('Incomplete options', function () {
      assert.throws(function () {
        sharp({ raw: { width: 1, height: 1 } });
      });
    });
    it('Invalid channels', function () {
      assert.throws(function () {
        sharp({ raw: { width: 1, height: 1, channels: 5 } });
      });
    });
    it('Invalid height', function () {
      assert.throws(function () {
        sharp({ raw: { width: 1, height: 0, channels: 4 } });
      });
    });
    it('Invalid width', function () {
      assert.throws(function () {
        sharp({ raw: { width: 'zoinks', height: 1, channels: 4 } });
      });
    });
    it('RGB', function (done) {
      // Convert to raw pixel data
      sharp(fixtures.inputJpg)
        .resize(256)
        .raw()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(256, info.width);
          assert.strictEqual(209, info.height);
          assert.strictEqual(3, info.channels);
          // Convert back to JPEG
          sharp(data, {
            raw: {
              width: info.width,
              height: info.height,
              channels: info.channels
            }})
            .jpeg()
            .toBuffer(function (err, data, info) {
              if (err) throw err;
              assert.strictEqual(256, info.width);
              assert.strictEqual(209, info.height);
              assert.strictEqual(3, info.channels);
              fixtures.assertSimilar(fixtures.inputJpg, data, done);
            });
        });
    });
    it('RGBA', function (done) {
      // Convert to raw pixel data
      sharp(fixtures.inputPngOverlayLayer1)
        .resize(256)
        .raw()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(256, info.width);
          assert.strictEqual(192, info.height);
          assert.strictEqual(4, info.channels);
          // Convert back to PNG
          sharp(data, {
            raw: {
              width: info.width,
              height: info.height,
              channels: info.channels
            }})
            .png()
            .toBuffer(function (err, data, info) {
              if (err) throw err;
              assert.strictEqual(256, info.width);
              assert.strictEqual(192, info.height);
              assert.strictEqual(4, info.channels);
              fixtures.assertSimilar(fixtures.inputPngOverlayLayer1, data, { threshold: 7 }, done);
            });
        });
    });
  });

  describe('create new image', function () {
    it('RGB', function (done) {
      const create = {
        width: 10,
        height: 20,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      };
      sharp({ create: create })
        .jpeg()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(create.width, info.width);
          assert.strictEqual(create.height, info.height);
          assert.strictEqual(create.channels, info.channels);
          assert.strictEqual('jpeg', info.format);
          fixtures.assertSimilar(fixtures.expected('create-rgb.jpg'), data, done);
        });
    });
    it('RGBA', function (done) {
      const create = {
        width: 20,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 128 }
      };
      sharp({ create: create })
        .png()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(create.width, info.width);
          assert.strictEqual(create.height, info.height);
          assert.strictEqual(create.channels, info.channels);
          assert.strictEqual('png', info.format);
          fixtures.assertSimilar(fixtures.expected('create-rgba.png'), data, done);
        });
    });
    it('Invalid channels', function () {
      const create = {
        width: 10,
        height: 20,
        channels: 2,
        background: { r: 0, g: 0, b: 0 }
      };
      assert.throws(function () {
        sharp({ create: create });
      });
    });
    it('Missing background', function () {
      const create = {
        width: 10,
        height: 20,
        channels: 3
      };
      assert.throws(function () {
        sharp({ create: create });
      });
    });
  });

  it('Queue length change events', function (done) {
    let eventCounter = 0;
    const queueListener = function (queueLength) {
      assert.strictEqual(true, queueLength === 0 || queueLength === 1);
      eventCounter++;
    };
    sharp.queue.on('change', queueListener);
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toBuffer(function (err) {
        process.nextTick(function () {
          sharp.queue.removeListener('change', queueListener);
          if (err) throw err;
          assert.strictEqual(2, eventCounter);
          done();
        });
      });
  });

  it('Info event data', function (done) {
    const readable = fs.createReadStream(fixtures.inputJPGBig);
    const inPipeline = sharp()
      .resize(840, 472)
      .raw()
      .on('info', function (info) {
        assert.strictEqual(840, info.width);
        assert.strictEqual(472, info.height);
        assert.strictEqual(3, info.channels);
      });
    const badPipeline = sharp(null, {raw: {width: 840, height: 500, channels: 3}})
      .toFormat('jpeg')
      .toBuffer(function (err, data, info) {
        assert.strictEqual(err.message.indexOf('memory area too small') > 0, true);
        const readable = fs.createReadStream(fixtures.inputJPGBig);
        const inPipeline = sharp()
          .resize(840, 472)
          .raw();
        const goodPipeline = sharp(null, {raw: {width: 840, height: 472, channels: 3}})
          .toFormat('jpeg')
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            done();
          });
        readable.pipe(inPipeline).pipe(goodPipeline);
      });
    readable.pipe(inPipeline).pipe(badPipeline);
  });
});
