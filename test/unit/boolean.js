/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs/promises');
const { suite, test } = require('node:test');

const fixtures = require('../fixtures');
const sharp = require('../../');

suite('Boolean operation between two images', async () => {
  const inputJpgBooleanTestBuffer = await fs.readFile(fixtures.inputJpgBooleanTest);

  [
    sharp.bool.and,
    sharp.bool.or,
    sharp.bool.eor
  ]
    .forEach((op) => {
      test(`${op} operation, file`, async (t) => {
        t.plan(3);
        const { data, info } = await sharp(fixtures.inputJpg)
          .resize(320, 240)
          .boolean(fixtures.inputJpgBooleanTest, op)
          .toBuffer({ resolveWithObject: true });
        t.assert.strictEqual(320, info.width);
        t.assert.strictEqual(240, info.height);
        await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`boolean_${op}_result.jpg`), data));
      });

      test(`${op} operation, buffer`, async (t) => {
        t.plan(3);
        const { data, info } = await sharp(fixtures.inputJpg)
          .resize(320, 240)
          .boolean(inputJpgBooleanTestBuffer, op)
          .toBuffer({ resolveWithObject: true });
        t.assert.strictEqual(320, info.width);
        t.assert.strictEqual(240, info.height);
        await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`boolean_${op}_result.jpg`), data));
      });

      test(`${op} operation, raw`, async (t) => {
        t.plan(3);
        const { data, info } = await sharp(fixtures.inputJpgBooleanTest)
          .raw()
          .toBuffer({ resolveWithObject: true });
        const result = await sharp(fixtures.inputJpg)
          .resize(320, 240)
          .boolean(data, op, { raw: info })
          .toBuffer({ resolveWithObject: true });
        t.assert.strictEqual(320, result.info.width);
        t.assert.strictEqual(240, result.info.height);
        await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`boolean_${op}_result.jpg`), result.data));
      });
    });

  test('Invalid operation', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().boolean(fixtures.inputJpgBooleanTest, 'fail');
    });
  });

  test('Invalid operation, non-string', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().boolean(fixtures.inputJpgBooleanTest, null);
    });
  });

  test('Missing input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().boolean();
    });
  });
});
