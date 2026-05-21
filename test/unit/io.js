/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { createReadStream, createWriteStream } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { afterEach, beforeEach, suite, test } = require('node:test');

const { isMarkedAsUntransferable } = require('node:worker_threads');

const sharp = require('../../');
const fixtures = require('../fixtures');
const { buildPlatformArch } = require('../../dist/libvips.cjs');

const outputJpg = fixtures.path('output.jpg');

suite('Input/output', () => {
  beforeEach(() => {
    sharp.cache(false);
  });
  afterEach(() => {
    sharp.cache(true);
  });

  test('Read from File and write to Stream', async (t) => {
    t.plan(5);
    const writable = createWriteStream(outputJpg);
    const closed = new Promise((resolve, reject) => {
      writable.once('close', resolve);
      writable.once('error', reject);
    });
    sharp(fixtures.inputJpg).resize(320, 240).pipe(writable);
    await closed;
    const { data, info } = await sharp(outputJpg).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await fs.rm(outputJpg);
  });

  test('Read from Buffer and write to Stream', async (t) => {
    t.plan(5);
    const inputJpgBuffer = await fs.readFile(fixtures.inputJpg);
    const writable = createWriteStream(outputJpg);
    const closed = new Promise((resolve, reject) => {
      writable.once('close', resolve);
      writable.once('error', reject);
    });
    sharp(inputJpgBuffer).resize(320, 240).pipe(writable);
    await closed;
    const { data, info } = await sharp(outputJpg).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await fs.rm(outputJpg);
  });

  test('Read from Stream and write to File via callback', (t, done) => {
    t.plan(4);
    const readable = createReadStream(fixtures.inputJpg);
    const pipeline = sharp().resize(320, 240).toFile(outputJpg, async (err, info) => {
      if (err) throw err;
      t.assert.strictEqual(true, info.size > 0);
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(240, info.height);
      await fs.rm(outputJpg);
      done();
    });
    readable.pipe(pipeline);
  });

  test('Read from Stream and write to Buffer via callback', (t, done) => {
    t.plan(5);
    const readable = createReadStream(fixtures.inputJpg);
    const pipeline = sharp().resize(320, 240).toBuffer((err, data, info) => {
      if (err) throw err;
      t.assert.strictEqual(true, data.length > 0);
      t.assert.strictEqual(data.length, info.size);
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(240, info.height);
      done();
    });
    readable.pipe(pipeline);
  });

  test('Read from Stream and write to Buffer via Promise resolved with Buffer', async (t) => {
    t.plan(2);
    const pipeline = sharp().resize(1, 1);
    createReadStream(fixtures.inputJpg).pipe(pipeline);
    const data = await pipeline.toBuffer({ resolveWithObject: false });
    t.assert.strictEqual(true, data instanceof Buffer);
    t.assert.strictEqual(true, data.length > 0);
  });

  test('Read from Stream and write to Buffer via Promise resolved with Object', async (t) => {
    t.plan(8);
    const pipeline = sharp().resize(1, 1);
    createReadStream(fixtures.inputJpg).pipe(pipeline);
    const object = await pipeline.toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('object', typeof object);
    t.assert.strictEqual('object', typeof object.info);
    t.assert.strictEqual('jpeg', object.info.format);
    t.assert.strictEqual(1, object.info.width);
    t.assert.strictEqual(1, object.info.height);
    t.assert.strictEqual(3, object.info.channels);
    t.assert.strictEqual(true, object.data instanceof Buffer);
    t.assert.strictEqual(true, object.data.length > 0);
  });

  test('Read from File and write to Buffer via Promise resolved with Buffer', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputJpg)
      .resize(1, 1)
      .toBuffer({ resolveWithObject: false });
    t.assert.strictEqual(true, data instanceof Buffer);
    t.assert.strictEqual(true, data.length > 0);
  });

  test('Read from File and write to Buffer via Promise resolved with Object', async (t) => {
    t.plan(8);
    const object = await sharp(fixtures.inputJpg)
      .resize(1, 1)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('object', typeof object);
    t.assert.strictEqual('object', typeof object.info);
    t.assert.strictEqual('jpeg', object.info.format);
    t.assert.strictEqual(1, object.info.width);
    t.assert.strictEqual(1, object.info.height);
    t.assert.strictEqual(3, object.info.channels);
    t.assert.strictEqual(true, object.data instanceof Buffer);
    t.assert.strictEqual(true, object.data.length > 0);
  });

  test('Read from Stream and write to Stream', async (t) => {
    t.plan(5);
    const readable = createReadStream(fixtures.inputJpg);
    const writable = createWriteStream(outputJpg);
    const closed = new Promise((resolve, reject) => {
      writable.once('close', resolve);
      writable.once('error', reject);
    });
    const pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline).pipe(writable);
    await closed;
    const { data, info } = await sharp(outputJpg).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await fs.rm(outputJpg);
  });

  test('Read from ArrayBuffer and write to Buffer', async (t) => {
    t.plan(3);
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

    t.assert.deepStrictEqual(uint8array, new Uint8Array(data));
    t.assert.strictEqual(info.width, 2);
    t.assert.strictEqual(info.height, 1);
  });

  test('Read from Uint8Array and write to Buffer', async (t) => {
    t.plan(3);
    const uint8array = Uint8Array.from([255, 255, 255, 0, 0, 0]);
    const { data, info } = await sharp(uint8array, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).toBuffer({ resolveWithObject: true });

    t.assert.deepStrictEqual(uint8array, new Uint8Array(data));
    t.assert.strictEqual(info.width, 2);
    t.assert.strictEqual(info.height, 1);
  });

  test('Read from Uint8ClampedArray and output to Buffer', async (t) => {
    t.plan(3);
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

    t.assert.deepStrictEqual(uint8array, new Uint8ClampedArray(data));
    t.assert.strictEqual(info.width, 2);
    t.assert.strictEqual(info.height, 1);
  });

  test('Read from Uint8ClampedArray with byteOffset and output to Buffer', async (t) => {
    t.plan(3);
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

    t.assert.deepStrictEqual(Uint8ClampedArray.from([255, 255, 255, 0, 0, 0]), new Uint8ClampedArray(data));
    t.assert.strictEqual(info.width, 2);
    t.assert.strictEqual(info.height, 1);
  });

  test('Stream should emit info event', async (t) => {
    t.plan(4);
    const readable = createReadStream(fixtures.inputJpg);
    const writable = createWriteStream(outputJpg);
    const pipeline = sharp().resize(320, 240);
    const infoEventEmitted = new Promise((resolve) => {
      pipeline.once('info', (info) => {
        t.assert.strictEqual('jpeg', info.format);
        t.assert.strictEqual(320, info.width);
        t.assert.strictEqual(240, info.height);
        t.assert.strictEqual(3, info.channels);
        resolve();
      });
    });
    const closed = new Promise((resolve, reject) => {
      writable.once('close', resolve);
      writable.once('error', reject);
    });
    readable.pipe(pipeline).pipe(writable);
    await Promise.all([infoEventEmitted, closed]);
    await fs.rm(outputJpg);
  });

  test('Stream should emit close event', async (t) => {
    t.plan(1);
    const readable = createReadStream(fixtures.inputJpg);
    const writable = createWriteStream(outputJpg);
    const pipeline = sharp().resize(320, 240);
    let closeEventEmitted = false;
    pipeline.once('close', () => {
      closeEventEmitted = true;
    });
    const closed = new Promise((resolve, reject) => {
      writable.once('close', resolve);
      writable.once('error', reject);
    });
    readable.pipe(pipeline).pipe(writable);
    await closed;
    t.assert.strictEqual(true, closeEventEmitted);
    await fs.rm(outputJpg);
  });

  test('Handle Stream to Stream error ', async (t) => {
    t.plan(1);
    const pipeline = sharp().resize(320, 240);
    const errorSeen = new Promise((resolve) => {
      pipeline.once('error', (err) => {
        resolve(!!err);
      });
    });
    const done = new Promise((resolve) => {
      pipeline.once('end', resolve);
    });
    const readableButNotAnImage = createReadStream(__filename);
    const writable = createWriteStream(outputJpg);
    readableButNotAnImage.pipe(pipeline).pipe(writable);
    const anErrorWasEmitted = await errorSeen;
    await done;
    t.assert.strictEqual(anErrorWasEmitted, true);
    await fs.rm(outputJpg);
  });

  test('Handle File to Stream error', async (t) => {
    t.plan(1);
    const readableButNotAnImage = sharp(__filename).resize(320, 240);
    const errorSeen = new Promise((resolve) => {
      readableButNotAnImage.once('error', (err) => {
        resolve(!!err);
      });
    });
    const done = new Promise((resolve) => {
      readableButNotAnImage.once('end', resolve);
    });
    const writable = createWriteStream(outputJpg);
    readableButNotAnImage.pipe(writable);
    const anErrorWasEmitted = await errorSeen;
    await done;
    t.assert.strictEqual(anErrorWasEmitted, true);
    await fs.rm(outputJpg);
  });

  test('Readable side of Stream can start flowing after Writable side has finished', async (t) => {
    t.plan(5);
    const readable = createReadStream(fixtures.inputJpg);
    const writable = createWriteStream(outputJpg);
    const closed = new Promise((resolve, reject) => {
      writable.once('close', resolve);
      writable.once('error', reject);
    });
    const pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline);
    pipeline.once('finish', () => {
      pipeline.pipe(writable);
    });
    await closed;
    const { data, info } = await sharp(outputJpg).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await fs.rm(outputJpg);
  });

  test('Non-Stream input generates error when provided Stream-like data', async (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp('input')._write('fail', null, t.assert.fail),
      /Unexpected data on Writable Stream/
    );
  });

  test('Non-Buffer chunk on Stream input generates error', async (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp()._write('fail', null, t.assert.fail),
      /Non-Buffer data on Writable Stream/
    );
  });

  test('Invalid sequential read option throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp({ sequentialRead: 'fail' }),
      /Expected boolean for sequentialRead but received fail of type string/
    );
  });

  test('Sequential read, force JPEG', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(fixtures.inputJpg, { sequentialRead: true })
      .resize(320, 240)
      .toFormat(sharp.format.jpeg)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(data.length > 0, true);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
  });

  test('Not sequential read, force JPEG', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(fixtures.inputJpg, { sequentialRead: false })
      .resize(320, 240)
      .toFormat('jpeg')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(data.length > 0, true);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
  });

  test('Support output to jpg format', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(fixtures.inputPng)
      .resize(320, 240)
      .toFormat('jpg')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
  });

  test('Support output to tif format', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(fixtures.inputTiff)
      .resize(320, 240)
      .toFormat('tif')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('tiff', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
  });

  test('Allow use of toBuffer and toFile with same instance', async (t) => {
    t.plan(1);
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
    t.assert.strictEqual(Buffer.isBuffer(data), true);
  });

  test('Fail when output File is input File', async (t) => {
    t.plan(1);
    t.assert.rejects(
      () => sharp(fixtures.inputJpg).toFile(fixtures.inputJpg),
      /Cannot use same file for input and output/
    );
  });

  test('Fail when output File is input File (relative output, absolute input)', async (t) => {
    t.plan(1);
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    t.assert.rejects(
      () => sharp(fixtures.inputJpg).toFile(relativePath),
      /Cannot use same file for input and output/
    );
  });

  test('Fail when output File is input File (relative input, absolute output)', async (t) => {
    t.plan(1);
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    t.assert.rejects(
      () => sharp(relativePath).toFile(fixtures.inputJpg),
      /Cannot use same file for input and output/
    );
  });

  test('Fail when output File is empty', async (t) => {
    t.plan(1);
    t.assert.rejects(
      () => sharp(fixtures.inputJpg).toFile(''),
      /Missing output file path/
    );
  });

  test('Fail when input is invalid Buffer', async (t) => {
    t.plan(3);
    try {
      await sharp(Buffer.from([0x1, 0x2, 0x3, 0x4])).toBuffer();
    } catch (err) {
      t.assert.strictEqual(err.message, 'Input buffer contains unsupported image format');
      t.assert.strictEqual(true, err.stack.includes('at Sharp.toBuffer'));
      t.assert.strictEqual(true, err.stack.includes(__filename));
    }
  });

  test('Fail when input file path is missing', async (t) => {
    t.plan(3);
    try {
      await sharp('does-not-exist').toFile('fail');
    } catch (err) {
      t.assert.strictEqual(err.message, 'Input file is missing: does-not-exist');
      t.assert.strictEqual(true, err.stack.includes('at Sharp.toFile'));
      t.assert.strictEqual(true, err.stack.includes(__filename));
    }
  });

  suite('Fail for unsupported input', () => {
    test('Undefined', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(undefined);
      });
    });
    test('Null', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(null);
      });
    });
    test('Numeric', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(1);
      });
    });
    test('Boolean', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(true);
      });
    });
    test('Error Object', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(new Error());
      });
    });
  });

  test('Invalid output format', (t) => {
    t.plan(1);
    let isValid = false;
    try {
      sharp().toFormat('zoinks');
      isValid = true;
    } catch (_err) {}
    t.assert.strictEqual(false, isValid);
  });

  test('File input with corrupt header fails gracefully', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputJpgWithCorruptHeader).toBuffer());
  });

  test('Buffer input with corrupt header fails gracefully', async (t) => {
    t.plan(1);
    const inputBuffer = await fs.readFile(fixtures.inputJpgWithCorruptHeader);
    await t.assert.rejects(() => sharp(inputBuffer).toBuffer());
  });

  test('Stream input with corrupt header fails gracefully', async (t) => {
    t.plan(1);
    const transformer = sharp();
    createReadStream(fixtures.inputJpgWithCorruptHeader).pipe(transformer);
    await t.assert.rejects(() => transformer.toBuffer());
  });

  suite('Output filename with unknown extension', () => {
    const outputZoinks = fixtures.path('output.zoinks');

    test('Match JPEG input', async (t) => {
      t.plan(4);
      const info = await sharp(fixtures.inputJpg)
        .resize(320, 80)
        .toFile(outputZoinks);
      t.assert.strictEqual(true, info.size > 0);
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      await fs.rm(outputZoinks);
    });

    test('Match PNG input', async (t) => {
      t.plan(4);
      const info = await sharp(fixtures.inputPng)
        .resize(320, 80)
        .toFile(outputZoinks);
      t.assert.strictEqual(true, info.size > 0);
      t.assert.strictEqual('png', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      await fs.rm(outputZoinks);
    });

    test('Match WebP input', async (t) => {
      t.plan(4);
      const info = await sharp(fixtures.inputWebP)
        .resize(320, 80)
        .toFile(outputZoinks);
      t.assert.strictEqual(true, info.size > 0);
      t.assert.strictEqual('webp', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      await fs.rm(outputZoinks);
    });

    test('Match TIFF input', async (t) => {
      t.plan(4);
      const info = await sharp(fixtures.inputTiff)
        .resize(320, 80)
        .toFile(outputZoinks);
      t.assert.strictEqual(true, info.size > 0);
      t.assert.strictEqual('tiff', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      await fs.rm(outputZoinks);
    });

    test('Force JPEG format for PNG input', async (t) => {
      t.plan(4);
      const info = await sharp(fixtures.inputPng)
        .resize(320, 80)
        .jpeg()
        .toFile(outputZoinks);
      t.assert.strictEqual(true, info.size > 0);
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      await fs.rm(outputZoinks);
    });
  });

  test('Input and output formats match when not forcing', async (t) => {
    t.plan(3);
    const { info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ compressionLevel: 1, force: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
  });

  test('Can force output format with output chaining', async (t) => {
    t.plan(1);
    const { info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ force: true })
      .jpeg({ force: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
  });

  test('toFormat=JPEG takes precedence over WebP extension', async (t) => {
    t.plan(1);
    const outputWebP = fixtures.path('output.webp');
    const info = await sharp(fixtures.inputPng)
      .resize(8)
      .jpeg()
      .toFile(outputWebP);
    t.assert.strictEqual('jpeg', info.format);
    await fs.rm(outputWebP);
  });

  test('toFormat=WebP takes precedence over JPEG extension', async (t) => {
    t.plan(1);
    const outputJpg = fixtures.path('output.jpg');
    const info = await sharp(fixtures.inputPng)
      .resize(8)
      .webp()
      .toFile(outputJpg);
    t.assert.strictEqual('webp', info.format);
    await fs.rm(outputJpg);
  });

  test('Load Vips V file', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputV)
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(70, info.width);
    t.assert.strictEqual(60, info.height);
    await fixtures.assertSimilar(fixtures.expected('vfile.jpg'), data);
  });

  test('Save Vips V file', async (t) => {
    t.plan(4);
    const outputV = fixtures.path('output.v');
    const info = await sharp(fixtures.inputJpg)
      .extract({ left: 910, top: 1105, width: 70, height: 60 })
      .toFile(outputV);
    t.assert.strictEqual(true, info.size > 0);
    t.assert.strictEqual('v', info.format);
    t.assert.strictEqual(70, info.width);
    t.assert.strictEqual(60, info.height);
    await fs.rm(outputV);
  });

  test('can ignore ICC profile', async (t) => {
    t.plan(1);
    const [r1, g1, b1] = await sharp(fixtures.inputJpgWithPortraitExif5, { ignoreIcc: true })
      .extract({ width: 1, height: 1, top: 16, left: 16 })
      .raw()
      .toBuffer();

    const [r2, g2, b2] = await sharp(fixtures.inputJpgWithPortraitExif5, { ignoreIcc: false })
      .extract({ width: 1, height: 1, top: 16, left: 16 })
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual({ r1, g1, b1, r2, g2, b2 }, {
      r1: 60,
      r2: 77,
      g1: 54,
      g2: 69,
      b1: 20,
      b2: 25
    });
  });

  suite('Switch off safety limits for certain formats', () => {
    test('Valid', (t) => {
      t.plan(1);
      t.assert.doesNotThrow(() => {
        sharp({ unlimited: true });
      });
    });
    test('Invalid', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ unlimited: -1 }),
        /Expected boolean for unlimited but received -1 of type number/
      );
    });
  });

  suite('Limit pixel count of input image', () => {
    test('Invalid fails - negative', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp({ limitInputPixels: -1 }));
    });

    test('Invalid fails - float', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp({ limitInputPixels: 12.3 }));
    });

    test('Invalid fails - integer overflow', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp({ limitInputPixels: Number.MAX_SAFE_INTEGER + 1 }));
    });

    test('Invalid fails - string', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp({ limitInputPixels: 'fail' }));
    });

    test('Same size as input works', async (t) => {
      t.plan(1);
      const { width, height } = await sharp(fixtures.inputJpg).metadata();
      const data = await sharp(fixtures.inputJpg, { limitInputPixels: width * height })
        .resize(2)
        .toBuffer();
      t.assert.strictEqual(true, data.length > 0);
    });

    test('Disabling limit works', async (t) => {
      t.plan(1);
      const data = await sharp(fixtures.inputJpgLarge, { limitInputPixels: false })
        .resize(2)
        .toBuffer();
      t.assert.strictEqual(true, data.length > 0);
    });

    test('Enabling default limit works and fails with a large image', async (t) => {
      t.plan(1);
      await t.assert.rejects(
        () => sharp(fixtures.inputJpgLarge, { limitInputPixels: true }).toBuffer(),
        /Input image exceeds pixel limit/
      );
    });

    test('Enabling default limit works and fails for an image with resolution higher than uint32 limit', async (t) => {
      t.plan(1);
      await t.assert.rejects(
        () => sharp(fixtures.inputPngUint32Limit, { limitInputPixels: true }).toBuffer(),
        /Input image exceeds pixel limit/
      );
    });

    test('Smaller than input fails', async (t) => {
      t.plan(1);
      const { width, height } = await sharp(fixtures.inputJpg).metadata();
      await t.assert.rejects(
        () => sharp(fixtures.inputJpg, { limitInputPixels: width * height - 1 }).toBuffer(),
        /Input image exceeds pixel limit/
      );
    });
  });

  suite('Limit channel count of input image', () => {
    const create = {
      width: 1,
      height: 1,
      channels: 4,
      background: 'black'
    };

    test('Invalid fails - negative', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ limitInputChannels: -1 }),
        /Expected positive integer for limitInputChannels but received -1 of type number/
      );
    });

    test('Invalid fails - float', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ limitInputChannels: 12.3 }),
        /Expected positive integer for limitInputChannels but received 12\.3 of type number/
      );
    });

    test('Invalid fails - integer overflow', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ limitInputChannels: Number.MAX_SAFE_INTEGER + 1 }),
        /Expected positive integer for limitInputChannels but received 9007199254740992 of type number/
      );
    });

    test('Invalid fails - string', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ limitInputChannels: 'fail' }),
        /Expected positive integer for limitInputChannels but received fail of type string/
      );
    });

    test('Same number of channels as input works', async (t) => {
      t.plan(1);
      const { channels } = await sharp(fixtures.inputJpg).metadata();
      const data = await sharp(fixtures.inputJpg, { limitInputChannels: channels })
        .resize(2)
        .toBuffer();
      t.assert.strictEqual(true, data.length > 0);
    });

    test('Disabling limit works', async (t) => {
      t.plan(1);
      const eightChannelTiff = await sharp({ create })
        .joinChannel({ create })
        .tiff({ compression: 'deflate' })
        .toBuffer();

      const data = await sharp(eightChannelTiff, { limitInputChannels: false })
        .resize(2)
        .toBuffer();
      t.assert.strictEqual(true, data.length > 0);
    });

    test('Enabling default limit works and fails with a large image', async (t) => {
      t.plan(1);
      const eightChannelTiff = await sharp({ create })
        .joinChannel({ create })
        .tiff({ compression: 'deflate' })
        .toBuffer();

      await t.assert.rejects(
        () => sharp(eightChannelTiff, { limitInputChannels: true }).toBuffer(),
        /Input image exceeds channel limit/
      );
    });

    test('Smaller than input fails', async (t) => {
      t.plan(1);
      const { channels } = await sharp(fixtures.inputJpg).metadata();
      await t.assert.rejects(
        () => sharp(fixtures.inputJpg, { limitInputChannels: channels - 1 }).toBuffer(),
        /Input image exceeds channel limit/
      );
    });
  });

  suite('Input options', () => {
    test('Option-less', (t) => {
      t.plan(1);
      sharp();
      t.assert.ok(true);
    });
    test('Ignore unknown attribute', (t) => {
      t.plan(1);
      sharp({ unknown: true });
      t.assert.ok(true);
    });
    test('undefined with options fails', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp(undefined, {}),
        /Unsupported input 'undefined' of type undefined when also providing options of type object/
      );
    });
    test('null with options fails', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp(null, {}),
        /Unsupported input 'null' of type object when also providing options of type object/
      );
    });
    test('Non-Object options fails', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp('test', 'zoinks'),
        /Invalid input options zoinks/
      );
    });
    test('Invalid density: string', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ density: 'zoinks' }),
        /Expected number between 1 and 100000 for density but received zoinks of type string/
      );
    });
    test('Invalid ignoreIcc: string', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ ignoreIcc: 'zoinks' }),
        /Expected boolean for ignoreIcc but received zoinks of type string/
      );
    });
    test('Setting animated property updates pages property', (t) => {
      t.plan(2);
      t.assert.strictEqual(sharp({ animated: false }).options.input.pages, 1);
      t.assert.strictEqual(sharp({ animated: true }).options.input.pages, -1);
    });
    test('Invalid animated property throws', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ animated: -1 }),
        /Expected boolean for animated but received -1 of type number/
      );
    });
    test('Invalid page property throws', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ page: -1 }),
        /Expected integer between 0 and 100000 for page but received -1 of type number/
      );
    });
    test('Invalid pages property throws', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp({ pages: '1' }),
        /Expected integer between -1 and 100000 for pages but received 1 of type string/
      );
    });
    test('Valid openSlide.level property', (t) => {
      t.plan(1);
      sharp({ openSlide: { level: 1 } });
      sharp({ level: 1 });
      t.assert.ok(true);
    });
    test('Invalid openSlide.level property (string) throws', (t) => {
      t.plan(2);
      t.assert.throws(
        () => sharp({ openSlide: { level: '1' } }),
        /Expected integer between 0 and 256 for openSlide.level but received 1 of type string/
      );
      t.assert.throws(
        () => sharp({ level: '1' }),
        /Expected integer between 0 and 256 for level but received 1 of type string/
      );
    });
    test('Invalid openSlide.level property (negative) throws', (t) => {
      t.plan(2);
      t.assert.throws(
        () => sharp({ openSlide: { level: -1 } }),
        /Expected integer between 0 and 256 for openSlide\.level but received -1 of type number/
      );
      t.assert.throws(
        () => sharp({ level: -1 }),
        /Expected integer between 0 and 256 for level but received -1 of type number/
      );
    });
    test('Valid tiff.subifd property', (t) => {
      t.plan(1);
      sharp({ tiff: { subifd: 1 } });
      sharp({ subifd: 1 });
      t.assert.ok(true);
    });
    test('Invalid tiff.subifd property (string) throws', (t) => {
      t.plan(2);
      t.assert.throws(
        () => sharp({ tiff: { subifd: '1' } }),
        /Expected integer between -1 and 100000 for tiff\.subifd but received 1 of type string/
      );
      t.assert.throws(
        () => sharp({ subifd: '1' }),
        /Expected integer between -1 and 100000 for subifd but received 1 of type string/
      );
    });
    test('Invalid tiff.subifd property (float) throws', (t) => {
      t.plan(2);
      t.assert.throws(
        () => sharp({ tiff: { subifd: 1.2 } }),
        /Expected integer between -1 and 100000 for tiff\.subifd but received 1.2 of type number/
      );
      t.assert.throws(
        () => sharp({ subifd: 1.2 }),
        /Expected integer between -1 and 100000 for subifd but received 1.2 of type number/
      );
    });
    test('Valid pdf.background property (string)', (t) => {
      t.plan(1);
      sharp({ pdf: { background: '#00ff00' } });
      sharp({ pdfBackground: '#00ff00' });
      t.assert.ok(true);
    });
    test('Valid pdf.background property (object)', (t) => {
      t.plan(1);
      sharp({ pdf: { background: { r: 0, g: 255, b: 0 } } });
      sharp({ pdfBackground: { r: 0, g: 255, b: 0 } });
      t.assert.ok(true);
    });
    test('Invalid pdf.background property (string) throws', (t) => {
      t.plan(2);
      t.assert.throws(
        () => sharp({ pdf: { background: '00ff00' } }),
        /Unable to parse color from string/
      );
      t.assert.throws(
        () => sharp({ pdfBackground: '00ff00' }),
        /Unable to parse color from string/
      );
    });
    test('Invalid pdf.background property (number) throws', (t) => {
      t.plan(2);
      t.assert.throws(
        () => sharp({ pdf: { background: 255 } }),
        /Expected object or string for background/
      );
      t.assert.throws(
        () => sharp({ pdf: { background: 255 } }),
        /Expected object or string for background/
      );
    });
    test('Invalid pdf.background property (object)', (t) => {
      t.plan(2);
      t.assert.throws(
        () => sharp({ pdf: { background: { red: 0, green: 255, blue: 0 } } }),
        /Unable to parse color from object/
      );
      t.assert.throws(
        () => sharp({ pdfBackground: { red: 0, green: 255, blue: 0 } }),
        /Unable to parse color from object/
      );
    });
  });

  test('Fails when writing to missing directory', async (t) => {
    t.plan(1);
    const create = {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    };
    await t.assert.rejects(
      () => sharp({ create }).toFile('does-not-exist/out.jpg'),
      /unable to open for write/
    );
  });

  suite('create new image', () => {
    test('RGB', async (t) => {
      t.plan(4);
      const create = {
        width: 10,
        height: 20,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      };
      const { data, info } = await sharp({ create })
        .jpeg()
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(create.width, info.width);
      t.assert.strictEqual(create.height, info.height);
      t.assert.strictEqual(create.channels, info.channels);
      t.assert.strictEqual('jpeg', info.format);
      await fixtures.assertSimilar(fixtures.expected('create-rgb.jpg'), data);
    });
    test('RGBA', async (t) => {
      t.plan(4);
      const create = {
        width: 20,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 128 }
      };
      const { data, info } = await sharp({ create })
        .png()
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(create.width, info.width);
      t.assert.strictEqual(create.height, info.height);
      t.assert.strictEqual(create.channels, info.channels);
      t.assert.strictEqual('png', info.format);
      await fixtures.assertSimilar(fixtures.expected('create-rgba.png'), data);
    });
    test('Invalid channels', (t) => {
      t.plan(1);
      const create = {
        width: 10,
        height: 20,
        channels: 2,
        background: { r: 0, g: 0, b: 0 }
      };
      t.assert.throws(() => {
        sharp({ create });
      });
    });
    test('Missing background', (t) => {
      t.plan(1);
      const create = {
        width: 10,
        height: 20,
        channels: 3
      };
      t.assert.throws(() => {
        sharp({ create });
      });
    });
  });

  test('Queue length change events', async (t) => {
    t.plan(3);
    let eventCounter = 0;
    const queueListener = (queueLength) => {
      t.assert.strictEqual(true, queueLength === 0 || queueLength === 1);
      eventCounter++;
    };
    sharp.queue.on('change', queueListener);
    await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toBuffer();
    await new Promise((resolve) => process.nextTick(resolve));
    sharp.queue.removeListener('change', queueListener);
    t.assert.strictEqual(2, eventCounter);
  });

  test('Info event data', async (t) => {
    t.plan(4);
    const readable = createReadStream(fixtures.inputJPGBig);
    const inPipeline = sharp()
      .resize(840, 472)
      .raw()
      .on('info', (info) => {
        t.assert.strictEqual(840, info.width);
        t.assert.strictEqual(472, info.height);
        t.assert.strictEqual(3, info.channels);
      });
    const badPipeline = sharp({ raw: { width: 840, height: 500, channels: 3 } }).toFormat('jpeg');
    readable.pipe(inPipeline).pipe(badPipeline);
    await t.assert.rejects(
      () => badPipeline.toBuffer(),
      /memory area too small/
    );
  });

  test('supports wide-character filenames', async (t) => {
    t.plan(4);
    const filename = fixtures.path('output.图片.jpg');
    const create = {
      width: 8,
      height: 8,
      channels: 3,
      background: 'green'
    };
    await sharp({ create }).toFile(filename);

    const { width, height, channels, format } = await sharp(filename).metadata();
    t.assert.strictEqual(width, 8);
    t.assert.strictEqual(height, 8);
    t.assert.strictEqual(channels, 3);
    t.assert.strictEqual(format, 'jpeg');
  });

  test('toBuffer resolves with an untransferable Buffer', async (t) => {
    const data = await sharp(fixtures.inputJpg)
      .resize({ width: 8, height: 8 })
      .toBuffer();

    t.plan(isMarkedAsUntransferable && buildPlatformArch() !== 'wasm32' ? 3 : 2);
    if (isMarkedAsUntransferable && buildPlatformArch() !== 'wasm32') {
      t.assert.strictEqual(isMarkedAsUntransferable(data.buffer), true);
    }
    t.assert.strictEqual(ArrayBuffer.isView(data), true);
    t.assert.strictEqual(ArrayBuffer.isView(data.buffer), false);
  });

  test('toUint8Array resolves with a transferable Uint8Array', async (t) => {
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 8, height: 8 })
      .toUint8Array();

    t.plan(isMarkedAsUntransferable ? 12 : 11);
    t.assert.strictEqual(data instanceof Uint8Array, true);
    if (isMarkedAsUntransferable) {
      t.assert.strictEqual(isMarkedAsUntransferable(data.buffer), false);
    }
    t.assert.strictEqual(ArrayBuffer.isView(data), true);
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 8);
    t.assert.strictEqual(info.height, 8);
    t.assert.strictEqual(data.byteLength, info.size);
    t.assert.strictEqual(data[0], 0xFF);
    t.assert.strictEqual(data[1], 0xD8);

    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.format, 'jpeg');
    t.assert.strictEqual(metadata.width, 8);
    t.assert.strictEqual(metadata.height, 8);
  });
});
