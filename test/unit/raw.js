'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Raw pixel data', function () {
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
  });
});
