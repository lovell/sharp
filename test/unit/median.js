/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');

const row = [0, 3, 15, 63, 127, 255];
const input = Buffer.from(Array.from(row, () => row).flat());
const raw = {
  width: 6,
  height: 6,
  channels: 1
};

describe('Median filter', function () {
  it('default window (3x3)', async () => {
    const data = await sharp(input, { raw })
      .median()
      .toColourspace('b-w')
      .raw()
      .toBuffer();

    assert.deepStrictEqual(data.subarray(0, 6), Buffer.from(row));
  });

  it('3x3 window', async () => {
    const data = await sharp(input, { raw })
      .median(3)
      .toColourspace('b-w')
      .raw()
      .toBuffer();

    assert.deepStrictEqual(data.subarray(0, 6), Buffer.from(row));
  });

  it('5x5 window', async () => {
    const data = await sharp(input, { raw })
      .median(5)
      .toColourspace('b-w')
      .raw()
      .toBuffer();

    assert.deepStrictEqual(data.subarray(0, 6), Buffer.from(row));
  });

  it('invalid radius', () => {
    assert.throws(() => {
      sharp().median(0.1);
    });
  });
});
