/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');

const row = [0, 3, 15, 63, 127, 255];
const input = Buffer.from(Array.from(row, () => row).flat());
const raw = {
  width: 6,
  height: 6,
  channels: 1
};

suite('Median filter', () => {
  test('default window (3x3)', async (t) => {
    t.plan(1);
    const data = await sharp(input, { raw })
      .median()
      .toColourspace('b-w')
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual(data.subarray(0, 6), Buffer.from(row));
  });

  test('3x3 window', async (t) => {
    t.plan(1);
    const data = await sharp(input, { raw })
      .median(3)
      .toColourspace('b-w')
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual(data.subarray(0, 6), Buffer.from(row));
  });

  test('5x5 window', async (t) => {
    t.plan(1);
    const data = await sharp(input, { raw })
      .median(5)
      .toColourspace('b-w')
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual(data.subarray(0, 6), Buffer.from(row));
  });

  test('invalid radius', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().median(0.1);
    });
  });
});
