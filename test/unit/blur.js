/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Blur', () => {
  test('specific radius 1', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(1)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('blur-1.jpg'), data));
  });

  test('specific radius 10', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(10)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('blur-10.jpg'), data));
  });

  test('specific options.sigma 10', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur({ sigma: 10 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('blur-10.jpg'), data));
  });

  test('specific radius 0.3', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(0.3)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('blur-0.3.jpg'), data));
  });

  test('mild blur', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('blur-mild.jpg'), data));
  });

  test('invalid radius', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).blur(0.1);
    });
  });

  test('blurred image is smaller than non-blurred', async (t) => {
    t.plan(9);
    const notBlurred = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(false)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, notBlurred.data.length > 0);
    t.assert.strictEqual('jpeg', notBlurred.info.format);
    t.assert.strictEqual(320, notBlurred.info.width);
    t.assert.strictEqual(240, notBlurred.info.height);
    const blurred = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(true)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, blurred.data.length > 0);
    t.assert.strictEqual(true, blurred.data.length < notBlurred.data.length);
    t.assert.strictEqual('jpeg', blurred.info.format);
    t.assert.strictEqual(320, blurred.info.width);
    t.assert.strictEqual(240, blurred.info.height);
  });

  test('invalid precision', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).blur({ sigma: 1, precision: 'invalid' });
    }, /Expected one of: integer, float, approximate for precision but received invalid of type string/);
  });

  test('invalid minAmplitude', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).blur({ sigma: 1, minAmplitude: 0 });
    }, /Expected number between 0.001 and 1 for minAmplitude but received 0 of type number/);

    t.assert.throws(() => {
      sharp(fixtures.inputJpg).blur({ sigma: 1, minAmplitude: 1.01 });
    }, /Expected number between 0.001 and 1 for minAmplitude but received 1.01 of type number/);
  });

  test('specific radius 10 and precision approximate', async (t) => {
    t.plan(2);
    const approximate = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur({ sigma: 10, precision: 'approximate' })
      .toBuffer();
    const integer = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(10)
      .toBuffer();

    t.assert.notDeepEqual(approximate, integer);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('blur-10.jpg'), approximate));
  });

  test('specific radius 10 and minAmplitude 0.01', async (t) => {
    t.plan(2);
    const minAmplitudeLow = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur({ sigma: 10, minAmplitude: 0.01 })
      .toBuffer();
    const minAmplitudeDefault = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(10)
      .toBuffer();

    t.assert.notDeepEqual(minAmplitudeLow, minAmplitudeDefault);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('blur-10.jpg'), minAmplitudeLow));
  });

  test('options.sigma is required if options object is passed', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).blur({ precision: 'invalid' });
    }, /Expected number between 0.3 and 1000 for options.sigma but received undefined of type undefined/);
  });
});
