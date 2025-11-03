/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs');
const path = require('node:path');
const { afterEach, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

const outputJpg = fixtures.path('output.jpg');

describe('Input/output', () => {
  beforeEach(() => {
    sharp.cache(false);
  });
  afterEach(() => {
    sharp.cache(true);
  });

  it('Read from File and write to Stream', (_t, done) => {
    const writable = fs.createWriteStream(outputJpg);
    writable.on('close', () => {
      sharp(outputJpg).toBuffer((err, data, info) => {
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

  it('Read from Buffer and write to Stream', (_t, done) => {
    const inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    writable.on('close', () => {
      sharp(outputJpg).toBuffer((err, data, info) => {
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

  it('Read from Stream and write to File', (_t, done) => {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp().resize(320, 240).toFile(outputJpg, (err, info) => {
      if (err) throw err;
      assert.strictEqual(true, info.size > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      fs.rm(outputJpg, done);
    });
    readable.pipe(pipeline);
  });

  it('Read from Stream and write to Buffer', (_t, done) => {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp().resize(320, 240).toBuffer((err, data, info) => {
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

  it('Read from Stream and write to Buffer via Promise resolved with Buffer', () => {
    const pipeline = sharp().resize(1, 1);
    fs.createReadStream(fixtures.inputJpg).pipe(pipeline);
    return pipeline
      .toBuffer({ resolveWithObject: false })
      .then((data) => {
        assert.strictEqual(true, data instanceof Buffer);
        assert.strictEqual(true, data.length > 0);
      });
  });

  it('Read from Stream and write to Buffer via Promise resolved with Object', () => {
    const pipeline = sharp().resize(1, 1);
    fs.createReadStream(fixtures.inputJpg).pipe(pipeline);
    return pipeline
      .toBuffer({ resolveWithObject: true })
      .then((object) => {
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

  it('Read from File and write to Buffer via Promise resolved with Buffer', () => sharp(fixtures.inputJpg)
      .resize(1, 1)
      .toBuffer({ resolveWithObject: false })
      .then((data) => {
        assert.strictEqual(true, data instanceof Buffer);
        assert.strictEqual(true, data.length > 0);
      }));

  it('Read from File and write to Buffer via Promise resolved with Object', () => sharp(fixtures.inputJpg)
      .resize(1, 1)
      .toBuffer({ resolveWithObject: true })
      .then((object) => {
        assert.strictEqual('object', typeof object);
        assert.strictEqual('object', typeof object.info);
        assert.strictEqual('jpeg', object.info.format);
        assert.strictEqual(1, object.info.width);
        assert.strictEqual(1, object.info.height);
        assert.strictEqual(3, object.info.channels);
        assert.strictEqual(true, object.data instanceof Buffer);
        assert.strictEqual(true, object.data.length > 0);
      }));

  it('Read from Stream and write to Stream', (_t, done) => {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    writable.on('close', () => {
      sharp(outputJpg).toBuffer((err, data, info) => {
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

  it('Stream should emit info event', (_t, done) => {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    const pipeline = sharp().resize(320, 240);
    let infoEventEmitted = false;
    pipeline.on('info', (info) => {
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      assert.strictEqual(3, info.channels);
      infoEventEmitted = true;
    });
    writable.on('close', () => {
      assert.strictEqual(true, infoEventEmitted);
      fs.rm(outputJpg, done);
    });
    readable.pipe(pipeline).pipe(writable);
  });

  it('Stream should emit close event', (_t, done) => {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    const pipeline = sharp().resize(320, 240);
    let closeEventEmitted = false;
    pipeline.on('close', () => {
      closeEventEmitted = true;
    });
    writable.on('close', () => {
      assert.strictEqual(true, closeEventEmitted);
      fs.rm(outputJpg, done);
    });
    readable.pipe(pipeline).pipe(writable);
  });

  it('Handle Stream to Stream error ', (_t, done) => {
    const pipeline = sharp().resize(320, 240);
    let anErrorWasEmitted = false;
    pipeline.on('error', (err) => {
      anErrorWasEmitted = !!err;
    }).on('end', () => {
      assert(anErrorWasEmitted);
      fs.rm(outputJpg, done);
    });
    const readableButNotAnImage = fs.createReadStream(__filename);
    const writable = fs.createWriteStream(outputJpg);
    readableButNotAnImage.pipe(pipeline).pipe(writable);
  });

  it('Handle File to Stream error', (_t, done) => {
    const readableButNotAnImage = sharp(__filename).resize(320, 240);
    let anErrorWasEmitted = false;
    readableButNotAnImage.on('error', (err) => {
      anErrorWasEmitted = !!err;
    }).on('end', () => {
      assert(anErrorWasEmitted);
      fs.rm(outputJpg, done);
    });
    const writable = fs.createWriteStream(outputJpg);
    readableButNotAnImage.pipe(writable);
  });

  it('Readable side of Stream can start flowing after Writable side has finished', (_t, done) => {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(outputJpg);
    writable.on('close', () => {
      sharp(outputJpg).toBuffer((err, data, info) => {
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
    pipeline.on('finish', () => {
      pipeline.pipe(writable);
    });
  });

  it('Non-Stream input generates error when provided Stream-like data', (_t, done) => {
    sharp('input')._write('fail', null, (err) => {
      assert.strictEqual(err.message, 'Unexpected data on Writable Stream');
      done();
    });
  });

  it('Non-Buffer chunk on Stream input generates error', (_t, done) => {
    sharp()._write('fail', null, (err) => {
      assert.strictEqual(err.message, 'Non-Buffer data on Writable Stream');
      done();
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

  it('Support output to jpg format', (_t, done) => {
    sharp(fixtures.inputPng)
      .resize(320, 240)
      .toFormat('jpg')
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Support output to tif format', (_t, done) => {
    sharp(fixtures.inputTiff)
      .resize(320, 240)
      .toFormat('tif')
      .toBuffer((err, data, info) => {
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

  it('Fail when output File is input File', (_t, done) => {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg, (err) => {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File via Promise', (_t, done) => {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg).then(() => {
      done(new Error('Unexpectedly resolved Promise'));
    }).catch((err) => {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File (relative output, absolute input)', (_t, done) => {
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    sharp(fixtures.inputJpg).toFile(relativePath, (err) => {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File via Promise (relative output, absolute input)', (_t, done) => {
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    sharp(fixtures.inputJpg).toFile(relativePath).then(() => {
      done(new Error('Unexpectedly resolved Promise'));
    }).catch((err) => {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File (relative input, absolute output)', (_t, done) => {
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    sharp(relativePath).toFile(fixtures.inputJpg, (err) => {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is input File via Promise (relative input, absolute output)', (_t, done) => {
    const relativePath = path.relative(process.cwd(), fixtures.inputJpg);
    sharp(relativePath).toFile(fixtures.inputJpg).then(() => {
      done(new Error('Unexpectedly resolved Promise'));
    }).catch((err) => {
      assert(err instanceof Error);
      assert.strictEqual('Cannot use same file for input and output', err.message);
      done();
    });
  });

  it('Fail when output File is empty', (_t, done) => {
    sharp(fixtures.inputJpg).toFile('', (err) => {
      assert(err instanceof Error);
      assert.strictEqual('Missing output file path', err.message);
      done();
    });
  });

  it('Fail when output File is empty via Promise', (_t, done) => {
    sharp(fixtures.inputJpg).toFile('').then(() => {
      done(new Error('Unexpectedly resolved Promise'));
    }).catch((err) => {
      assert(err instanceof Error);
      assert.strictEqual('Missing output file path', err.message);
      done();
    });
  });

  it('Fail when input is invalid Buffer', async () =>
    assert.rejects(
      () => sharp(Buffer.from([0x1, 0x2, 0x3, 0x4])).toBuffer(),
      (err) => {
        assert.strictEqual(err.message, 'Input buffer contains unsupported image format');
        assert(err.stack.includes('at Sharp.toBuffer'));
        assert(err.stack.includes(__filename));
        return true;
      }
    )
  );

  it('Fail when input file path is missing', async () =>
    assert.rejects(
      () => sharp('does-not-exist').toFile('fail'),
      (err) => {
        assert.strictEqual(err.message, 'Input file is missing: does-not-exist');
        assert(err.stack.includes('at Sharp.toFile'));
        assert(err.stack.includes(__filename));
        return true;
      }
    )
  );

  describe('Fail for unsupported input', () => {
    it('Undefined', () => {
      assert.throws(() => {
        sharp(undefined);
      });
    });
    it('Null', () => {
      assert.throws(() => {
        sharp(null);
      });
    });
    it('Numeric', () => {
      assert.throws(() => {
        sharp(1);
      });
    });
    it('Boolean', () => {
      assert.throws(() => {
        sharp(true);
      });
    });
    it('Error Object', () => {
      assert.throws(() => {
        sharp(new Error());
      });
    });
  });

  it('Promises/A+', () => sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toBuffer());

  it('Invalid output format', (_t, done) => {
    let isValid = false;
    try {
      sharp().toFormat('zoinks');
      isValid = true;
    } catch (_err) {}
    assert(!isValid);
    done();
  });

  it('File input with corrupt header fails gracefully', (_t, done) => {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .toBuffer((err) => {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  it('Buffer input with corrupt header fails gracefully', (_t, done) => {
    sharp(fs.readFileSync(fixtures.inputJpgWithCorruptHeader))
      .toBuffer((err) => {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  it('Stream input with corrupt header fails gracefully', (_t, done) => {
    const transformer = sharp();
    transformer
      .toBuffer()
      .then(() => {
        done(new Error('Unexpectedly resolved Promise'));
      })
      .catch((err) => {
        assert.strictEqual(true, !!err);
        done();
      });
    fs
      .createReadStream(fixtures.inputJpgWithCorruptHeader)
      .pipe(transformer);
  });

  describe('Output filename with unknown extension', () => {
    const outputZoinks = fixtures.path('output.zoinks');

    it('Match JPEG input', (_t, done) => {
      sharp(fixtures.inputJpg)
        .resize(320, 80)
        .toFile(outputZoinks, (err, info) => {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });

    it('Match PNG input', (_t, done) => {
      sharp(fixtures.inputPng)
        .resize(320, 80)
        .toFile(outputZoinks, (err, info) => {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('png', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });

    it('Match WebP input', (_t, done) => {
      sharp(fixtures.inputWebP)
        .resize(320, 80)
        .toFile(outputZoinks, (err, info) => {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });

    it('Match TIFF input', (_t, done) => {
      sharp(fixtures.inputTiff)
        .resize(320, 80)
        .toFile(outputZoinks, (err, info) => {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('tiff', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });

    it('Force JPEG format for PNG input', (_t, done) => {
      sharp(fixtures.inputPng)
        .resize(320, 80)
        .jpeg()
        .toFile(outputZoinks, (err, info) => {
          if (err) throw err;
          assert.strictEqual(true, info.size > 0);
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          fs.rm(outputZoinks, done);
        });
    });
  });

  it('Input and output formats match when not forcing', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ compressionLevel: 1, force: false })
      .toBuffer((err, _data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Can force output format with output chaining', () => sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ force: true })
      .jpeg({ force: false })
      .toBuffer({ resolveWithObject: true })
      .then((out) => {
        assert.strictEqual('png', out.info.format);
      }));

  it('toFormat=JPEG takes precedence over WebP extension', (_t, done) => {
    const outputWebP = fixtures.path('output.webp');
    sharp(fixtures.inputPng)
      .resize(8)
      .jpeg()
      .toFile(outputWebP, (err, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fs.rm(outputWebP, done);
      });
  });

  it('toFormat=WebP takes precedence over JPEG extension', (_t, done) => {
    sharp(fixtures.inputPng)
      .resize(8)
      .webp()
      .toFile(outputJpg, (err, info) => {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
        done();
      });
  });

  it('Load Vips V file', (_t, done) => {
    sharp(fixtures.inputV)
      .jpeg()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(70, info.width);
        assert.strictEqual(60, info.height);
        fixtures.assertSimilar(fixtures.expected('vfile.jpg'), data, done);
      });
  });

  it('Save Vips V file', (_t, done) => {
    const outputV = fixtures.path('output.v');
    sharp(fixtures.inputJpg)
      .extract({ left: 910, top: 1105, width: 70, height: 60 })
      .toFile(outputV, (err, info) => {
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

  describe('Input options', () => {
    it('Option-less', () => {
      sharp();
    });
    it('Ignore unknown attribute', () => {
      sharp({ unknown: true });
    });
    it('undefined with options fails', () => {
      assert.throws(() => {
        sharp(undefined, {});
      }, /Unsupported input 'undefined' of type undefined when also providing options of type object/);
    });
    it('null with options fails', () => {
      assert.throws(() => {
        sharp(null, {});
      }, /Unsupported input 'null' of type object when also providing options of type object/);
    });
    it('Non-Object options fails', () => {
      assert.throws(() => {
        sharp('test', 'zoinks');
      }, /Invalid input options zoinks/);
    });
    it('Invalid density: string', () => {
      assert.throws(() => {
        sharp({ density: 'zoinks' });
      }, /Expected number between 1 and 100000 for density but received zoinks of type string/);
    });
    it('Invalid ignoreIcc: string', () => {
      assert.throws(() => {
        sharp({ ignoreIcc: 'zoinks' });
      }, /Expected boolean for ignoreIcc but received zoinks of type string/);
    });
    it('Setting animated property updates pages property', () => {
      assert.strictEqual(sharp({ animated: false }).options.input.pages, 1);
      assert.strictEqual(sharp({ animated: true }).options.input.pages, -1);
    });
    it('Invalid animated property throws', () => {
      assert.throws(() => {
        sharp({ animated: -1 });
      }, /Expected boolean for animated but received -1 of type number/);
    });
    it('Invalid page property throws', () => {
      assert.throws(() => {
        sharp({ page: -1 });
      }, /Expected integer between 0 and 100000 for page but received -1 of type number/);
    });
    it('Invalid pages property throws', () => {
      assert.throws(() => {
        sharp({ pages: '1' });
      }, /Expected integer between -1 and 100000 for pages but received 1 of type string/);
    });
    it('Valid openSlide.level property', () => {
      sharp({ openSlide: { level: 1 } });
      sharp({ level: 1 });
    });
    it('Invalid openSlide.level property (string) throws', () => {
      assert.throws(
        () => sharp({ openSlide: { level: '1' } }),
        /Expected integer between 0 and 256 for openSlide.level but received 1 of type string/
      );
      assert.throws(
        () => sharp({ level: '1' }),
        /Expected integer between 0 and 256 for level but received 1 of type string/
      );
    });
    it('Invalid openSlide.level property (negative) throws', () => {
      assert.throws(
        () => sharp({ openSlide: { level: -1 } }),
        /Expected integer between 0 and 256 for openSlide\.level but received -1 of type number/
      );
      assert.throws(
        () => sharp({ level: -1 }),
        /Expected integer between 0 and 256 for level but received -1 of type number/
      );
    });
    it('Valid tiff.subifd property', () => {
      sharp({ tiff: { subifd: 1 } });
      sharp({ subifd: 1 });
    });
    it('Invalid tiff.subifd property (string) throws', () => {
      assert.throws(
        () => sharp({ tiff: { subifd: '1' } }),
        /Expected integer between -1 and 100000 for tiff\.subifd but received 1 of type string/
      );
      assert.throws(
        () => sharp({ subifd: '1' }),
        /Expected integer between -1 and 100000 for subifd but received 1 of type string/
      );
    });
    it('Invalid tiff.subifd property (float) throws', () => {
      assert.throws(
        () => sharp({ tiff: { subifd: 1.2 } }),
        /Expected integer between -1 and 100000 for tiff\.subifd but received 1.2 of type number/
      );
      assert.throws(
        () => sharp({ subifd: 1.2 }),
        /Expected integer between -1 and 100000 for subifd but received 1.2 of type number/
      );
    });
    it('Valid pdf.background property (string)', () => {
      sharp({ pdf: { background: '#00ff00' } });
      sharp({ pdfBackground: '#00ff00' });
    });
    it('Valid pdf.background property (object)', () => {
      sharp({ pdf: { background: { r: 0, g: 255, b: 0 } } });
      sharp({ pdfBackground: { r: 0, g: 255, b: 0 } });
    });
    it('Invalid pdf.background property (string) throws', () => {
      assert.throws(
        () => sharp({ pdf: { background: '00ff00' } }),
        /Unable to parse color from string/
      );
      assert.throws(
        () => sharp({ pdfBackground: '00ff00' }),
        /Unable to parse color from string/
      );
    });
    it('Invalid pdf.background property (number) throws', () => {
      assert.throws(
        () => sharp({ pdf: { background: 255 } }),
        /Expected object or string for background/
      );
      assert.throws(
        () => sharp({ pdf: { background: 255 } }),
        /Expected object or string for background/
      );
    });
    it('Invalid pdf.background property (object)', () => {
      assert.throws(
        () => sharp({ pdf: { background: { red: 0, green: 255, blue: 0 } } }),
        /Unable to parse color from object/
      );
      assert.throws(
        () => sharp({ pdfBackground: { red: 0, green: 255, blue: 0 } }),
        /Unable to parse color from object/
      );
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

  describe('create new image', () => {
    it('RGB', (_t, done) => {
      const create = {
        width: 10,
        height: 20,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      };
      sharp({ create })
        .jpeg()
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual(create.width, info.width);
          assert.strictEqual(create.height, info.height);
          assert.strictEqual(create.channels, info.channels);
          assert.strictEqual('jpeg', info.format);
          fixtures.assertSimilar(fixtures.expected('create-rgb.jpg'), data, done);
        });
    });
    it('RGBA', (_t, done) => {
      const create = {
        width: 20,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 128 }
      };
      sharp({ create })
        .png()
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual(create.width, info.width);
          assert.strictEqual(create.height, info.height);
          assert.strictEqual(create.channels, info.channels);
          assert.strictEqual('png', info.format);
          fixtures.assertSimilar(fixtures.expected('create-rgba.png'), data, done);
        });
    });
    it('Invalid channels', () => {
      const create = {
        width: 10,
        height: 20,
        channels: 2,
        background: { r: 0, g: 0, b: 0 }
      };
      assert.throws(() => {
        sharp({ create });
      });
    });
    it('Missing background', () => {
      const create = {
        width: 10,
        height: 20,
        channels: 3
      };
      assert.throws(() => {
        sharp({ create });
      });
    });
  });

  it('Queue length change events', (_t, done) => {
    let eventCounter = 0;
    const queueListener = (queueLength) => {
      assert.strictEqual(true, queueLength === 0 || queueLength === 1);
      eventCounter++;
    };
    sharp.queue.on('change', queueListener);
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toBuffer((err) => {
        process.nextTick(() => {
          sharp.queue.removeListener('change', queueListener);
          if (err) throw err;
          assert.strictEqual(2, eventCounter);
          done();
        });
      });
  });

  it('Info event data', (_t, done) => {
    const readable = fs.createReadStream(fixtures.inputJPGBig);
    const inPipeline = sharp()
      .resize(840, 472)
      .raw()
      .on('info', (info) => {
        assert.strictEqual(840, info.width);
        assert.strictEqual(472, info.height);
        assert.strictEqual(3, info.channels);
      });
    const badPipeline = sharp({ raw: { width: 840, height: 500, channels: 3 } })
      .toFormat('jpeg')
      .toBuffer((err) => {
        assert.strictEqual(err.message.indexOf('memory area too small') > 0, true);
        const readable = fs.createReadStream(fixtures.inputJPGBig);
        const inPipeline = sharp()
          .resize(840, 472)
          .raw();
        const goodPipeline = sharp({ raw: { width: 840, height: 472, channels: 3 } })
          .toFormat('jpeg')
          .toBuffer(done);
        readable.pipe(inPipeline).pipe(goodPipeline);
      });
    readable.pipe(inPipeline).pipe(badPipeline);
  });

  it('supports wide-character filenames', async () => {
    const filename = fixtures.path('output.图片.jpg');
    const create = {
      width: 8,
      height: 8,
      channels: 3,
      background: 'green'
    };
    await sharp({ create }).toFile(filename);

    const { width, height, channels, format } = await sharp(filename).metadata();
    assert.strictEqual(width, 8);
    assert.strictEqual(height, 8);
    assert.strictEqual(channels, 3);
    assert.strictEqual(format, 'jpeg');
  });
});
