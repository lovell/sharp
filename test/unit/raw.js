/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Raw pixel data', function () {
  describe('Raw pixel input', function () {
    it('Empty data', function () {
      assert.throws(function () {
        sharp(Buffer.from(''));
      }, /empty/);
      assert.throws(function () {
        sharp(new ArrayBuffer(0));
      }, /empty/);
      assert.throws(function () {
        sharp(new Uint8Array(0));
      }, /empty/);
      assert.throws(function () {
        sharp(new Uint8ClampedArray(0));
      }, /empty/);
    });

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

    it('Invalid premultiplied', () => {
      assert.throws(
        () => sharp({ raw: { width: 1, height: 1, channels: 4, premultiplied: 'zoinks' } }),
        /Expected boolean for raw\.premultiplied but received zoinks of type string/
      );
    });

    it('Invalid pageHeight', () => {
      const width = 8;
      const height = 8;
      const channels = 4;
      assert.throws(
        () => sharp({ raw: { width, height, channels, pageHeight: 'zoinks' } }),
        /Expected positive integer for raw\.pageHeight but received zoinks of type string/
      );
      assert.throws(
        () => sharp({ raw: { width, height, channels, pageHeight: -1 } }),
        /Expected positive integer for raw\.pageHeight but received -1 of type number/
      );
      assert.throws(
        () => sharp({ raw: { width, height, channels, pageHeight: 9 } }),
        /Expected positive integer for raw\.pageHeight but received 9 of type number/
      );
      assert.throws(
        () => sharp({ raw: { width, height, channels, pageHeight: 3 } }),
        /Expected raw\.height 8 to be a multiple of raw\.pageHeight 3/
      );
    });

    it('RGB', function (_t, done) {
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
            }
          })
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

    it('RGBA', function (_t, done) {
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
            }
          })
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

    it('RGBA premultiplied', function (_t, done) {
      // Convert to raw pixel data
      sharp(fixtures.inputPngSolidAlpha)
        .resize(256)
        .raw()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(256, info.width);
          assert.strictEqual(192, info.height);
          assert.strictEqual(4, info.channels);

          const originalData = Buffer.from(data);

          // Premultiply image data
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            const norm = alpha / 255;

            if (alpha < 255) {
              data[i] = Math.round(data[i] * norm);
              data[i + 1] = Math.round(data[i + 1] * norm);
              data[i + 2] = Math.round(data[i + 2] * norm);
            }
          }

          // Convert back to PNG
          sharp(data, {
            raw: {
              width: info.width,
              height: info.height,
              channels: info.channels,
              premultiplied: true
            }
          })
            .raw()
            .toBuffer(function (err, data, info) {
              if (err) throw err;
              assert.strictEqual(256, info.width);
              assert.strictEqual(192, info.height);
              assert.strictEqual(4, info.channels);
              assert.equal(data.compare(originalData), 0, 'output buffer matches unpremultiplied input buffer');
              done();
            });
        });
    });

    it('JPEG to raw Stream and back again', function (_t, done) {
      const width = 32;
      const height = 24;
      const writable = sharp({
        raw: {
          width,
          height,
          channels: 3
        }
      });
      writable
        .jpeg()
        .toBuffer(function (err, _data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(32, info.width);
          assert.strictEqual(24, info.height);
          done();
        });
      sharp(fixtures.inputJpg)
        .resize(width, height)
        .raw()
        .pipe(writable);
    });
  });

  describe('Output raw, uncompressed image data', function () {
    it('1 channel greyscale image', function (_t, done) {
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
          assert.strictEqual(1, info.channels);
          done();
        });
    });

    it('3 channel colour image without transparency', function (_t, done) {
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

    it('4 channel colour image with transparency', function (_t, done) {
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

    it('Extract A from RGBA', () =>
      sharp(fixtures.inputPngWithTransparency)
        .resize(32, 24)
        .extractChannel(3)
        .toColourspace('b-w')
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ info }) => {
          assert.strictEqual('raw', info.format);
          assert.strictEqual(1, info.channels);
          assert.strictEqual(32 * 24, info.size);
        })
    );
  });

  describe('Raw pixel depths', function () {
    it('Invalid depth', function () {
      assert.throws(function () {
        sharp(Buffer.alloc(3), { raw: { width: 1, height: 1, channels: 3 } })
          .raw({ depth: 'zoinks' });
      });
    });

    for (const { type, depth, bits } of [
      { type: Uint8Array, depth: undefined, bits: 8 },
      { type: Uint8Array, depth: 'uchar', bits: 8 },
      { type: Uint8ClampedArray, depth: 'uchar', bits: 8 },
      { type: Int8Array, depth: 'char', bits: 8 },
      { type: Uint16Array, depth: 'ushort', bits: 16 },
      { type: Int16Array, depth: 'short', bits: 16 },
      { type: Uint32Array, depth: 'uint', bits: 32 },
      { type: Int32Array, depth: 'int', bits: 32 },
      { type: Float32Array, depth: 'float', bits: 32 },
      { type: Float64Array, depth: 'double', bits: 64 }
    ]) {
      it(type.name, () =>
        sharp(new type(3), { raw: { width: 1, height: 1, channels: 3 } })
          .raw({ depth })
          .toBuffer({ resolveWithObject: true })
          .then(({ data, info }) => {
            assert.strictEqual(1, info.width);
            assert.strictEqual(1, info.height);
            assert.strictEqual(3, info.channels);
            if (depth !== undefined) {
              assert.strictEqual(depth, info.depth);
            }
            assert.strictEqual(data.length / 3, bits / 8);
          })
      );
    }
  });

  it('Animated', async () => {
    const gif = await sharp(
      Buffer.alloc(8),
      { raw: { width: 1, height: 2, channels: 4, pageHeight: 1 }, animated: true }
    )
      .gif({ keepDuplicateFrames: true })
      .toBuffer();

    const { width, height, pages, delay } = await sharp(gif).metadata();
    assert.strictEqual(width, 1);
    assert.strictEqual(height, 1);
    assert.strictEqual(pages, 2);
    assert.strictEqual(delay.length, 2);
  });

  describe('16-bit roundtrip', () => {
    it('grey', async () => {
      const grey = 42000;
      const png = await sharp(
        Uint16Array.from([grey]),
        { raw: { width: 1, height: 1, channels: 1 } }
      )
        .toColourspace('grey16')
        .png({ compressionLevel: 0 })
        .toBuffer();
      const raw = await sharp(png)
        .toColourspace('grey16')
        .raw({ depth: 'ushort' })
        .toBuffer();

      assert.strictEqual(raw.readUint16LE(0), grey);
    });

    it('RGB', async () => {
      const rgb = [10946, 28657, 46368];
      const png = await sharp(
        Uint16Array.from(rgb),
        { raw: { width: 1, height: 1, channels: 3 } }
      )
        .toColourspace('rgb16')
        .png({ compressionLevel: 0 })
        .toBuffer();
      const raw = await sharp(png)
        .toColourspace('rgb16')
        .raw({ depth: 'ushort' })
        .toBuffer();

      assert.strictEqual(raw.readUint16LE(0), rgb[0]);
      assert.strictEqual(raw.readUint16LE(2), rgb[1]);
      assert.strictEqual(raw.readUint16LE(4), rgb[2]);
    });
  });
});
