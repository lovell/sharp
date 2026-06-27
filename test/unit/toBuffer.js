/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('toBuffer', () => {
  test('reusing same sharp object does not reset previously passed parameters to toBuffer', async (t) => {
    t.plan(4);
    const image = sharp(fixtures.inputJpg);
    const obj = await image.toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(typeof obj, 'object');
    t.assert.strictEqual(typeof obj.info, 'object');
    t.assert.strictEqual(Buffer.isBuffer(obj.data), true);
    const data = await image.toBuffer();
    t.assert.strictEqual(Buffer.isBuffer(data), true);
  });

  test('correctly process animated webp with height > 16383', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputWebPAnimatedBigHeight, { animated: true })
      .toBuffer();
    t.assert.strictEqual(Buffer.isBuffer(data), true);
  });
});
