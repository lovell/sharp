/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../dist/index.cjs');
const fixtures = require('../fixtures');

suite('Clahe', () => {
  test('width 5 width 5 maxSlope 0', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputJpgClahe)
      .clahe({ width: 5, height: 5, maxSlope: 0 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('clahe-5-5-0.jpg'), data, { threshold: 10 }));
  });

  test('width 5 width 5 maxSlope 5', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputJpgClahe)
      .clahe({ width: 5, height: 5, maxSlope: 5 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('clahe-5-5-5.jpg'), data));
  });

  test('width 11 width 25 maxSlope 14', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputJpgClahe)
      .clahe({ width: 11, height: 25, maxSlope: 14 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('clahe-11-25-14.jpg'), data));
  });

  test('width 50 width 50 maxSlope 0', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputJpgClahe)
      .clahe({ width: 50, height: 50, maxSlope: 0 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('clahe-50-50-0.jpg'), data));
  });

  test('width 50 width 50 maxSlope 14', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputJpgClahe)
      .clahe({ width: 50, height: 50, maxSlope: 14 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('clahe-50-50-14.jpg'), data));
  });

  test('width 100 width 50 maxSlope 3', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputJpgClahe)
      .clahe({ width: 100, height: 50, maxSlope: 3 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('clahe-100-50-3.jpg'), data));
  });

  test('width 100 width 100 maxSlope 0', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputJpgClahe)
      .clahe({ width: 100, height: 100, maxSlope: 0 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('clahe-100-100-0.jpg'), data));
  });

  test('invalid maxSlope', (t) => {
    t.plan(4);
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100, maxSlope: -5 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100, maxSlope: 110 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100, maxSlope: 5.5 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100, maxSlope: 'a string' });
    });
  });

  test('invalid width', (t) => {
    t.plan(5);
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100.5, height: 100 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: -5, height: 100 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 2 ** 32, height: 100 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: true, height: 100 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 'string test', height: 100 });
    });
  });

  test('invalid height', (t) => {
    t.plan(5);
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100.5 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: -5 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 2 ** 32 });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: true });
    });
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 'string test' });
    });
  });

  test('invalid options object', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpgClahe).clahe(100, 100, 5);
    });
  });

  test('uses default maxSlope of 3', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputJpgClahe)
      .clahe({ width: 100, height: 50 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('clahe-100-50-3.jpg'), data));
  });
});
