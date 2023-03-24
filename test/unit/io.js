// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

const outputJpg = fixtures.path('output.jpg');

describe('Input/output', function () {
  beforeEach(function () {
    sharp.cache(false);
  });
  afterEach(function () {
    sharp.cache(true);
  });

  it('Read from File and write to Stream', function (done) {
    const writable = fs.createWriteStream(outputJpg);
    writable.on('close', function () {
      sharp(outputJpg).toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.rm(outputJpg, done);
      });
    });
    sharp(fixtures.inputJpg).resize(320, 240).pipe(writable);
  });

  it('Read from Buffer and write to Stream', function (done) {
    const inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    writable.on('close', function () {
      sharp(outputJpg).toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.rm(outputJpg, done);
      });
    });
    sharp(inputJpgBuffer).resize(320, 240).pipe(writable);
  });

  it('Read from Stream and write to File', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp().resize(320, 240).toFile(outputJpg, function (err, info) {
      if (err) throw err;
      assert.strictEqual(true, info.size > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      fs.rm(outputJpg, done);
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
      .toBuffer({ resolveWithObject: false })
      .then(function (data) {
        assert.strictEqual(true, data instanceof Buffer);
        assert.strictEqual(true, data.length > 0);
      });
  });

  it('Read from Stream and write to Buffer via Promise resolved with Object', function () {
    const pipeline = sharp().resize(1, 1);
    fs.createReadStream(fixtures.inputJpg).pipe(pipeline);
    return pipeline
      .toBuffer({ resolveWithObject: true })
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
      .toBuffer({ resolveWithObject: false })
      .then(function (data) {
        assert.strictEqual(true, data instanceof Buffer);
        assert.strictEqual(true, data.length > 0);
      });
  });

  it('Read from File and write to Buffer via Promise resolved with Object', function () {
    return sharp(fixtures.inputJpg)
      .resize(1, 1)
      .toBuffer({ resolveWithObject: true })
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
    const writable = fs.createWriteStream(outputJpg);
    writable.on('close', function () {
      sharp(outputJpg).toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.rm(outputJpg, done);
      });
    });
    const pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline).pipe(writable);
  });

  it('Read from ArrayBuffer and write to Buffer', async () => {
    const uint8array = Uint8Array.from([255, 255, 255, 0, 0, 0]);
    const arrayBuffer = new ArrayBuffer(uint8array.byteLength);
    new Uint8Array(arrayBuffer).set(uint8array);
    const { data, info } = await sharp(arrayBuffer, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).toBuffer({ resolveWithObject: true });

    assert.deepStrictEqual(uint8array, new Uint8Array(data));
    assert.strictEqual(info.width, 2);
    assert.strictEqual(info.height, 1);
  });

  it('Read from Uint8Array and write to Buffer', async () => {
    const uint8array = Uint8Array.from([255, 255, 255, 0, 0, 0]);
    const { data, info } = await sharp(uint8array, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).toBuffer({ resolveWithObject: true });

    assert.deepStrictEqual(uint8array, new Uint8Array(data));
    assert.strictEqual(info.width, 2);
    assert.strictEqual(info.height, 1);
  });

  it('Read from Uint8ClampedArray and output to Buffer', async () => {
    // since a Uint8ClampedArray is the same as Uint8Array but clamps the values
    // between 0-255 it seemed good to add this also
    const uint8array = Uint8ClampedArray.from([255, 255, 255, 0, 0, 0]);
    const { data, info } = await sharp(uint8array, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).toBuffer({ resolveWithObject: true });

    assert.deepStrictEqual(uint8array, new Uint8ClampedArray(data));
    assert.strictEqual(info.width, 2);
    assert.strictEqual(info.height, 1);
  });

  it('Read from Uint8ClampedArray with byteOffset and output to Buffer', async () => {
    // since a Uint8ClampedArray is the same as Uint8Array but clamps the values
    // between 0-255 it seemed good to add this also
    const uint8array = Uint8ClampedArray.from([0, 0, 0, 255, 255, 255, 0, 0, 0, 255, 255, 255]);
    const uint8ArrayWithByteOffset = new Uint8ClampedArray(uint8array.buffer, 3, 6);
    const { data, info } = await sharp(uint8ArrayWithByteOffset, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).toBuffer({ resolveWithObject: true });

    assert.deepStrictEqual(Uint8ClampedArray.from([255, 255, 255, 0, 0, 0]), new Uint8ClampedArray(data));
    assert.strictEqual(info.width, 2);
    assert.strictEqual(info.height, 1);
  });

  it('Stream should emit info event', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    const pipeline = sharp().resize(320, 240);
    let infoEventEmitted = false;
    pipeline.on('info', function (info) {
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      assert.strictEqual(3, info.channels);
      infoEventEmitted = true;
    });
    writable.on('close', function () {
      assert.strictEqual(true, infoEventEmitted);
      fs.rm(outputJpg, done);
    });
    readable.pipe(pipeline).pipe(writable);
  });

  it('Stream should emit close event', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    const pipeline = sharp().resize(320, 240);
    let closeEventEmitted = false;
    pipeline.on('close', function () {
      closeEventEmitted = true;
    });
    writable.on('close', function () {
      assert.strictEqual(true, closeEventEmitted);
      fs.rm(outputJpg, done);
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
      fs.rm(outputJpg, done);
    });
    const readableButNotAnImage = fs.createReadStream(__filename);
    const writable = fs.createWriteStream(outputJpg);
    readableButNotAnImage.pipe(pipeline).pipe(writable);
  });

  it('Handle File to Stream error', function (done) {
    const readableButNotAnImage = sharp(__filename).resize(320, 240);
    let anErrorWasEmitted = false;
    readableButNotAnImage.on('error', function (err) {
      anErrorWasEmitted = !!err;
    }).on('end', function () {
      assert(anErrorWasEmitted);
      fs.rm(outputJpg, done);
    });
    const writable = fs.createWriteStream(outputJpg);
    readableButNotAnImage.pipe(writable);
  });

  it('Readable side of Stream can start flowing after Writable side has finished', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    writable.on('close', function () {
      sharp(outputJpg).toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.rm(outputJpg, done);
      });
    });
    const pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline);
    pipeline.on('finish', function () {
      pipeline.pipe(writable);
    });
  });

  it('Invalid sequential read option throws', () => {
    assert.throws(() => {
      sharp({ sequentialRead: 'fail' });
    }, /Expected boolean for sequentialRead but received fail of type string/);
  });

  it('Sequential read, force JPEG', () =>
    sharp(fixtures.inputJpg, { sequentialRead: true })
      .resize(320, 240)
      .toFormat(sharp.format.jpeg)
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(data.length > 0, true);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual(info.format, 'jpeg');
        assert.strictEqual(info.width, 320);
        assert.strictEqual(info.height, 240);
      })
  );

  it('Not sequential read, force JPEG', () =>
    sharp(fixtures.inputJpg, { sequentialRead: false })
      .resize(320, 240)
      .toFormat('jpeg')
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(data.length > 0, true);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual(info.format, 'jpeg');
        assert.strictEqual(info.width, 320);
        assert.strictEqual(info.height, 240);
      })
  );

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

  it('Support output to tif format', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 240)
      .toFormat('tif')
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

  it('Allow use of toBuffer and toFile with same instance', async () => {
    const instance = sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: 'red'
      }
    });
    await instance.toFile(fixtures.path('output.jpg'));
    const data = await instance.toBuffer();
    assert.strictEqual(Buffer.isBuffer(data), true);
  });

  it('Fail when output File is input File', function (done) {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg, function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File via Promise', function (done) {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg).then(function (data) {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File (relative output, absolute input)', function (done) {
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    sharp(fixtures.inputJpg).toFile(relativePath, function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File via Promise (relative output, absolute input)', function (done) {
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    sharp(fixtures.inputJpg).toFile(relativePath).then(function (data) {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File (relative input, absolute output)', function (done) {
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    sharp(relativePath).toFile(fixtures.inputJpg, function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File via Promise (relative input, absolute output)', function (done) {
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    sharp(relativePath).toFile(fixtures.inputJpg).then(function (data) {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is empty', function (done) {
    sharp(fixtures.inputJpg).toFile('', function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Missing output file path', err.message);
      done();
    });
  });

  it('Fail when output File is empty via Promise', function (done) {
    sharp(fixtures.inputJpg).toFile('').then(function (data) {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Missing output file path', err.message);
      done();
    });
  });

  it('Fail when input is invalid Buffer', function (done) {
    sharp(Buffer.from([0x1, 0x2, 0x3, 0x4])).toBuffer().then(function () {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Input buffer contains unsupported image format', err.message);
      done();
    });
  });

  it('Fail when input file path is missing', function (done) {
    sharp('does-not-exist').toBuffer().then(function () {
      assert(false);
      done();
    }).catch(function (err) {
      assert(err instanceof Error);
      assert.strictEqual('Input file is missing: does-not-exist', err.message);
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

  it('Stream input with corrupt header fails gracefully', function (done) {
    const transformer = sharp();
    transformer
      .toBuffer()
      .then(function () {
        done(new Error('Unexpectedly resolved Promise'));
      })
      .catch(function (err) {
        assert.strictEqual(true, !!err);
        done();
      });
    fs
      .createReadStream(fixtures.inputJpgWithCorruptHeader)
      .pipe(transformer);
  });

  describe('Output filename with unknown extension', function () {
    const outputZoinks = fixtures.path('output.zoinks');

    it('Match JPEG input', function (done) {
      sharp(fixtures.inputJpg)
        .resize(320, 80)
        .toFile(outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });

    it('Match PNG input', function (done) {
      sharp(fixtures.inputPng)
        .resize(320, 80)
        .toFile(outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('png', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });

    it('Match WebP input', function (done) {
      sharp(fixtures.inputWebP)
        .resize(320, 80)
        .toFile(outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });

    it('Match TIFF input', function (done) {
      sharp(fixtures.inputTiff)
        .resize(320, 80)
        .toFile(outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('tiff', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });

    it('Force JPEG format for PNG input', function (done) {
      sharp(fixtures.inputPng)
        .resize(320, 80)
        .jpeg()
        .toFile(outputZoinks, function (err, info) {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
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

  it('Can force output format with output chaining', function () {
    return sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ force: true })
      .jpeg({ force: false })
      .toBuffer({ resolveWithObject: true })
      .then(function (out) {
        assert.strictEqual('png', out.info.format);
      });
  });

  it('toFormat=JPEG takes precedence over WebP extension', function (done) {
    const outputWebP = fixtures.path('output.webp');
    sharp(fixtures.inputPng)
      .resize(8)
      .jpeg()
      .toFile(outputWebP, function (err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fs.rm(outputWebP, done);
      });
  });

  it('toFormat=WebP takes precedence over JPEG extension', function (done) {
    sharp(fixtures.inputPng)
      .resize(8)
      .webp()
      .toFile(outputJpg, function (err, info) {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
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
    const outputV = fixtures.path('output.v');
    sharp(fixtures.inputJpg)
      .extract({ left: 910, top: 1105, width: 70, height: 60 })
      .toFile(outputV, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        assert.strictEqual('v', info.format);
        assert.strictEqual(70, info.width);
        assert.strictEqual(60, info.height);
        fs.rm(outputV, done);
      });
  });

  it('can ignore ICC profile', async () => {
    const [r1, g1, b1] = await sharp(fixtures.inputJpgWithPortraitExif5, { ignoreIcc: true })
      .extract({ width: 1, height: 1, top: 16, left: 16 })
      .raw()
      .toBuffer();

    const [r2, g2, b2] = await sharp(fixtures.inputJpgWithPortraitExif5, { ignoreIcc: false })
      .extract({ width: 1, height: 1, top: 16, left: 16 })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r1, g1, b1, r2, g2, b2 }, {
      r1: 60,
      r2: 77,
      g1: 54,
      g2: 69,
      b1: 20,
      b2: 25
    });
  });

  describe('Switch off safety limits for certain formats', () => {
    it('Valid', () => {
      assert.doesNotThrow(() => {
        sharp({ unlimited: true });
      });
    });
    it('Invalid', () => {
      assert.throws(() => {
        sharp({ unlimited: -1 });
      }, /Expected boolean for unlimited but received -1 of type number/);
    });
  });

  describe('Limit pixel count of input image', () => {
    it('Invalid fails - negative', () => {
      assert.throws(() => {
        sharp({ limitInputPixels: -1 });
      });
    });

    it('Invalid fails - float', () => {
      assert.throws(() => {
        sharp({ limitInputPixels: 12.3 });
      });
    });

    it('Invalid fails - integer overflow', () => {
      assert.throws(() => {
        sharp({ limitInputPixels: Number.MAX_SAFE_INTEGER + 1 });
      });
    });

    it('Invalid fails - string', () => {
      assert.throws(() => {
        sharp({ limitInputPixels: 'fail' });
      });
    });

    it('Same size as input works', () =>
      sharp(fixtures.inputJpg)
        .metadata()
        .then(({ width, height }) =>
          sharp(fixtures.inputJpg, { limitInputPixels: width * height })
            .resize(2)
            .toBuffer()
        )
    );

    it('Disabling limit works', () =>
      sharp(fixtures.inputJpgLarge, { limitInputPixels: false })
        .resize(2)
        .toBuffer()
    );

    it('Enabling default limit works and fails with a large image', () =>
      sharp(fixtures.inputJpgLarge, { limitInputPixels: true })
        .toBuffer()
        .then(() => {
          assert.fail('Expected to fail');
        })
        .catch(err => {
          assert.strictEqual(err.message, 'Input image exceeds pixel limit');
        })
    );

    it('Enabling default limit works and fails for an image with resolution higher than uint32 limit', () =>
      sharp(fixtures.inputPngUint32Limit, { limitInputPixels: true })
        .toBuffer()
        .then(() => {
          assert.fail('Expected to fail');
        })
        .catch(err => {
          assert.strictEqual(err.message, 'Input image exceeds pixel limit');
        })
    );

    it('Smaller than input fails', () =>
      sharp(fixtures.inputJpg)
        .metadata()
        .then(({ width, height }) =>
          sharp(fixtures.inputJpg, { limitInputPixels: width * height - 1 })
            .toBuffer()
            .then(() => {
              assert.fail('Expected to fail');
            })
            .catch(err => {
              assert.strictEqual(err.message, 'Input image exceeds pixel limit');
            })
        )
    );
  });

  describe('Input options', function () {
    it('Option-less', function () {
      sharp();
    });
    it('Ignore unknown attribute', function () {
      sharp({ unknown: true });
    });
    it('undefined with options fails', function () {
      assert.throws(function () {
        sharp(undefined, {});
      }, /Unsupported input 'undefined' of type undefined when also providing options of type object/);
    });
    it('null with options fails', function () {
      assert.throws(function () {
        sharp(null, {});
      }, /Unsupported input 'null' of type object when also providing options of type object/);
    });
    it('Non-Object options fails', function () {
      assert.throws(function () {
        sharp('test', 'zoinks');
      }, /Invalid input options zoinks/);
    });
    it('Invalid density: string', function () {
      assert.throws(function () {
        sharp({ density: 'zoinks' });
      }, /Expected number between 1 and 100000 for density but received zoinks of type string/);
    });
    it('Invalid ignoreIcc: string', function () {
      assert.throws(function () {
        sharp({ ignoreIcc: 'zoinks' });
      }, /Expected boolean for ignoreIcc but received zoinks of type string/);
    });
    it('Setting animated property updates pages property', function () {
      assert.strictEqual(sharp({ animated: false }).options.input.pages, 1);
      assert.strictEqual(sharp({ animated: true }).options.input.pages, -1);
    });
    it('Invalid animated property throws', function () {
      assert.throws(function () {
        sharp({ animated: -1 });
      }, /Expected boolean for animated but received -1 of type number/);
    });
    it('Invalid page property throws', function () {
      assert.throws(function () {
        sharp({ page: -1 });
      }, /Expected integer between 0 and 100000 for page but received -1 of type number/);
    });
    it('Invalid pages property throws', function () {
      assert.throws(function () {
        sharp({ pages: '1' });
      }, /Expected integer between -1 and 100000 for pages but received 1 of type string/);
    });
    it('Valid level property', function () {
      sharp({ level: 1 });
    });
    it('Invalid level property (string) throws', function () {
      assert.throws(function () {
        sharp({ level: '1' });
      }, /Expected integer between 0 and 256 for level but received 1 of type string/);
    });
    it('Invalid level property (negative) throws', function () {
      assert.throws(function () {
        sharp({ level: -1 });
      }, /Expected integer between 0 and 256 for level but received -1 of type number/);
    });
    it('Valid subifd property', function () {
      sharp({ subifd: 1 });
    });
    it('Invalid subifd property (string) throws', function () {
      assert.throws(function () {
        sharp({ subifd: '1' });
      }, /Expected integer between -1 and 100000 for subifd but received 1 of type string/);
    });
    it('Invalid subifd property (float) throws', function () {
      assert.throws(function () {
        sharp({ subifd: 1.2 });
      }, /Expected integer between -1 and 100000 for subifd but received 1.2 of type number/);
    });
  });

  it('Fails when writing to missing directory', async () => {
    const create = {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    };
    await assert.rejects(
      () => sharp({ create }).toFile('does-not-exist/out.jpg'),
      /unable to open for write/
    );
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
    const badPipeline = sharp({ raw: { width: 840, height: 500, channels: 3 } })
      .toFormat('jpeg')
      .toBuffer(function (err, data, info) {
        assert.strictEqual(err.message.indexOf('memory area too small') > 0, true);
        const readable = fs.createReadStream(fixtures.inputJPGBig);
        const inPipeline = sharp()
          .resize(840, 472)
          .raw();
        const goodPipeline = sharp({ raw: { width: 840, height: 472, channels: 3 } })
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
