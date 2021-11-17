'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Median filter', () => {
  it('1x1 window', async () => {
    const [r, g, b] = await sharp(fixtures.inputSvgSmallViewBox)
      .median(1)
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 0, g: 0, b: 0 }, { r, g, b });
  });

  it('3x3 window', async () => {
    const [r, g, b] = await sharp(fixtures.inputSvgSmallViewBox)
      .median(3)
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 255, g: 0, b: 127 }, { r, g, b });
  });

  it('7x7 window', async () => {
    const [r, g, b] = await sharp(fixtures.inputSvgSmallViewBox)
      .median(7)
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 255, g: 19, b: 146 }, { r, g, b });
  });

  it('default window (3x3)', async () => {
    const [r, g, b] = await sharp(fixtures.inputSvgSmallViewBox)
      .median()
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 255, g: 0, b: 127 }, { r, g, b });
  });

  it('invalid radius', () => {
    assert.throws(() => {
      sharp().median(0.1);
    });
  });
});
