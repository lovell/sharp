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

  it('should output data as Uint8Array', async () => {
    const data = await sharp(fixtures.inputJpg320x240).toUint8Array()
    assert.strictEqual(data.constructor.name, 'Uint8Array');
    assert.strictEqual(data.length, 26641);
  });

  it('should output data as Uint8Array with resolveWithObject: true', async () => {
    const { data, info } = await sharp(fixtures.inputJpg320x240).toUint8Array({ resolveWithObject: true });
    assert.strictEqual(data.constructor.name, 'Uint8Array');
    assert.strictEqual(data.length, 26641);
    assert.strictEqual(info.width, 320);
  });

  it('should handle toUint8Array callback', (done) => {
    sharp(fixtures.inputJpg320x240).toUint8Array((err, data, info) => {
      if (err) throw err;
      assert.strictEqual(data.constructor.name, 'Uint8Array');
      assert.strictEqual(data.length, 26641);
      assert.strictEqual(info.size, 26641);
      done();
    });
  });

  it('should take a Uint8Array as an input and output same data', async () => {
    const uint8array = Uint8Array.from([255, 255, 255, 0, 0, 0]);
    const { data, info } = await sharp(uint8array, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).toUint8Array({ resolveWithObject: true });

    assert.deepStrictEqual(uint8array, data);
    assert.strictEqual(info.width, 2);
    assert.strictEqual(info.height, 1);
  });

  it('should take a Uint8ClampedArray as an input and output same data', async () => {
    // since a Uint8ClampedArray is the same as Uint8Array but clamps the values
    // between 0-255 it seemed good to add this also
    const uint8array = Uint8ClampedArray.from([255, 255, 255, 0, 0, 0]);
    const { data, info } = await sharp(uint8array, {
      raw: {
        width: 2,
        height: 1,
        channels: 3
      }
    }).toUint8Array({ resolveWithObject: true });
    
    assert.deepStrictEqual(uint8array, new Uint8ClampedArray(data));
    assert.strictEqual(info.width, 2);
    assert.strictEqual(info.height, 1);
  });
});
