'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Raw pixel data', function () {
  describe('Raw pixel input', function () {
    it('Empty data', function () {
      assert.throws(function () {
        sharp(Buffer.from(''));
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

    it('RGBA premultiplied', function (done) {
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

    it('JPEG to raw Stream and back again', function (done) {
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
        .toBuffer(function (err, data, info) {
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
          assert.strictEqual(1, info.channels);
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

    for (const { constructor, depth, bits } of [
      { constructor: Uint8Array, depth: undefined, bits: 8 },
      { constructor: Uint8Array, depth: 'uchar', bits: 8 },
      { constructor: Uint8ClampedArray, depth: 'uchar', bits: 8 },
      { constructor: Int8Array, depth: 'char', bits: 8 },
      { constructor: Uint16Array, depth: 'ushort', bits: 16 },
      { constructor: Int16Array, depth: 'short', bits: 16 },
      { constructor: Uint32Array, depth: 'uint', bits: 32 },
      { constructor: Int32Array, depth: 'int', bits: 32 },
      { constructor: Float32Array, depth: 'float', bits: 32 },
      { constructor: Float64Array, depth: 'double', bits: 64 }
    ]) {
      it(constructor.name, () =>
        sharp(new constructor(3), { raw: { width: 1, height: 1, channels: 3 } })
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
});
