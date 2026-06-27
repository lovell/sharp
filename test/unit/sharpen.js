/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Sharpen', () => {
  test('specific radius 10 (sigma 6)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(6)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('sharpen-10.jpg'), data));
  });

  test('specific radius 3 (sigma 1.5) and levels 0.5, 2.5', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(1.5, 0.5, 2.5)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('sharpen-3-0.5-2.5.jpg'), data));
  });

  test('specific radius 5 (sigma 3.5) and levels 2, 4', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(3.5, 2, 4)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('sharpen-5-2-4.jpg'), data));
  });

  test('sigma=3.5, m1=2, m2=4', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen({ sigma: 3.5, m1: 2, m2: 4 })
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('sharpen-5-2-4.jpg'), data));
  });

  test('sigma=3.5, m1=2, m2=4, x1=2, y2=5, y3=25', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen({ sigma: 3.5, m1: 2, m2: 4, x1: 2, y2: 5, y3: 25 })
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('sharpen-5-2-4.jpg'), data));
  });

  if (!process.env.SHARP_TEST_WITHOUT_CACHE) {
    test('specific radius/levels with alpha channel', async (t) => {
      t.plan(5);
      const { data, info } = await sharp(fixtures.inputPngWithTransparency)
        .resize(320, 240)
        .sharpen(5, 4, 8)
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('png', info.format);
      t.assert.strictEqual(4, info.channels);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(240, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('sharpen-rgba.png'), data));
    });
  }

  test('mild sharpen', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('sharpen-mild.jpg'), data));
  });

  test('invalid options.sigma', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().sharpen({ sigma: -1 }),
      /Expected number between 0\.000001 and 10 for options\.sigma but received -1 of type number/
    );
  });

  test('invalid options.m1', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().sharpen({ sigma: 1, m1: -1 }),
      /Expected number between 0 and 1000000 for options\.m1 but received -1 of type number/
  ); });

  test('invalid options.m2', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().sharpen({ sigma: 1, m2: -1 }),
      /Expected number between 0 and 1000000 for options\.m2 but received -1 of type number/
  ); });

  test('invalid options.x1', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().sharpen({ sigma: 1, x1: -1 }),
      /Expected number between 0 and 1000000 for options\.x1 but received -1 of type number/
  ); });

  test('invalid options.y2', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().sharpen({ sigma: 1, y2: -1 }),
      /Expected number between 0 and 1000000 for options\.y2 but received -1 of type number/
  ); });

  test('invalid options.y3', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().sharpen({ sigma: 1, y3: -1 }),
      /Expected number between 0 and 1000000 for options\.y3 but received -1 of type number/
  ); });

  test('sharpened image is larger than non-sharpened', async (t) => {
    t.plan(9);
    const { data: notSharpened, info: notSharpenedInfo } = await sharp(fixtures.inputJpg)
      .resize(32, 24)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, notSharpened.length > 0);
    t.assert.strictEqual('jpeg', notSharpenedInfo.format);
    t.assert.strictEqual(32, notSharpenedInfo.width);
    t.assert.strictEqual(24, notSharpenedInfo.height);

    const { data: sharpened, info: sharpenedInfo } = await sharp(fixtures.inputJpg)
      .resize(32, 24)
      .sharpen()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, sharpened.length > 0);
    t.assert.strictEqual(true, sharpened.length > notSharpened.length);
    t.assert.strictEqual('jpeg', sharpenedInfo.format);
    t.assert.strictEqual(32, sharpenedInfo.width);
    t.assert.strictEqual(24, sharpenedInfo.height);
  });
});
