/*!
  SPDX-FileCopyrightText: 2013 Lovell Fuller and others
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');

const identity = [...Array(256).keys()];
const invert = identity.slice().reverse();

suite('Maplut', () => {
  test('inverts via single-band LUT (forces greyscale)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(
      Buffer.from([0, 0, 0, 255, 255, 255]),
      { raw: { width: 2, height: 1, channels: 3 } }
    )
      .maplut(invert)
      .raw()
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(2, info.width);
    t.assert.strictEqual(1, info.height);
    t.assert.strictEqual(1, info.channels);
    // black → 255, white → 0 after invert LUT on greyscale
    t.assert.deepStrictEqual([...data], [255, 0]);
  });

  test('applies per-channel LUTs and preserves alpha', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(
      Buffer.from([10, 20, 30, 200]),
      { raw: { width: 1, height: 1, channels: 4 } }
    )
      .maplut([invert, identity, identity])
      .raw()
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(1, info.width);
    t.assert.strictEqual(1, info.height);
    t.assert.strictEqual(4, info.channels);
    t.assert.strictEqual(245, data[0]); // inverted red of 10
    t.assert.deepStrictEqual([data[1], data[2], data[3]], [20, 30, 200]);
  });

  test('rejects invalid LUT shapes', (t) => {
    t.plan(4);
    t.assert.throws(() => sharp().maplut());
    t.assert.throws(() => sharp().maplut([1, 2, 3]));
    t.assert.throws(() => sharp().maplut([identity, identity]));
    t.assert.throws(() => sharp().maplut([identity, identity, [1, 2]]));
  });

  test('clamps out-of-range LUT values', async (t) => {
    t.plan(2);
    const lut = identity.map((v) => (v === 0 ? -50 : v === 255 ? 999 : v));
    const { data, info } = await sharp(
      Buffer.from([0, 255]),
      { raw: { width: 2, height: 1, channels: 1 } }
    )
      .maplut(lut)
      .raw()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(1, info.channels);
    t.assert.deepStrictEqual([...data], [0, 255]);
  });
});
