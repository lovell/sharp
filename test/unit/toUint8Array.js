'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('toUint8Array', () => {
  beforeEach(function () {
    sharp.cache(false);
  });
  afterEach(function () {
    sharp.cache(true);
  });

  it('should output data as Uint8Array', (done) => {
    const image = sharp(fixtures.inputJpg320x240);
    image.toUint8Array().then((data) => {
      assert.strictEqual(data instanceof Uint8Array, true);
      assert.strictEqual(data.length, 26641);
      done();
    });
  });

  it('should output data as Uint8Array with resolveWithObject: true', (done) => {
    const image = sharp(fixtures.inputJpg320x240);
    image.toUint8Array({ resolveWithObject: true }).then((res) => {
      assert.strictEqual(res.data instanceof Uint8Array, true);
      assert.strictEqual(res.data.length, 26641);
      assert.strictEqual(res.info.width, 320);
      done();
    });
  });

  it('should handle toUint8Array callback', (done) => {
    const image = sharp(fixtures.inputJpg320x240);
    image.toUint8Array((err, data, info) => {
      if (err) throw err;
      assert.strictEqual(data instanceof Uint8Array, true);
      assert.strictEqual(data.length, 26641);
      assert.strictEqual(info.size, 26641);
      done();
    });
  });

  it('should take a Uint8Array as an input', (done) => {
    const image = sharp(fixtures.inputJpg320x240);
    image.toUint8Array().then((data) => {
      sharp(data).metadata().then(info => {
        assert.strictEqual(info.width, 320);
        assert.strictEqual(info.height, 240);
        done();
      });
    });
  });

  it('should take a Uint8ClampedArray as an input', (done) => {
    // since a Uint8ClampedArray is the same as Uint8Array but clamps the values
    // between 0-255 it seemed good to add this also
    const uint8array = Uint8ClampedArray.from([255, 255, 255, 0, 0, 0]);
    sharp(uint8array, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).metadata().then(info => {
      assert.strictEqual(info.width, 2);
      assert.strictEqual(info.height, 1);
      done();
    });
  });

  it('should create a simple image from rgb values', (done) => {
    const uint8array = Uint8Array.from([255, 255, 255, 0, 0, 0]);
    sharp(uint8array, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).metadata().then(info => {
      assert.strictEqual(info.width, 2);
      assert.strictEqual(info.height, 1);
      done();
    });
  });

  it('data should be same going in and out', (done) => {
    const input = Uint8Array.from([1, 1, 1, 2, 2, 2]);
    const image = sharp(input, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    });
    image.toUint8Array().then((output) => {
      assert.deepStrictEqual(input, output);
      done();
    });
  });
});
