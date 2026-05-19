/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Gamma correction', () => {
  test('value of 0.0 (disabled)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(129, info.width);
    t.assert.strictEqual(111, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gamma-0.0.jpg'), data, { threshold: 9 }));
  });

  test('value of 2.2 (default)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(129, info.width);
    t.assert.strictEqual(111, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gamma-2.2.jpg'), data));
  });

  test('value of 3.0', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma(3)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(129, info.width);
    t.assert.strictEqual(111, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gamma-3.0.jpg'), data, { threshold: 6 }));
  });

  test('input value of 2.2, output value of 3.0', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma(2.2, 3.0)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(129, info.width);
    t.assert.strictEqual(111, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gamma-in-2.2-out-3.0.jpg'), data, { threshold: 6 }));
  });

  test('alpha transparency', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngOverlayLayer1)
      .resize(320)
      .gamma()
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gamma-alpha.jpg'), data));
  });

  test('invalid first parameter value', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpgWithGammaHoliness).gamma(4);
    });
  });

  test('invalid second parameter value', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpgWithGammaHoliness).gamma(2.2, 4);
    });
  });
});
