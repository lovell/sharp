/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('toFormat', () => {
  test('accepts upper case characters as format parameter (string)', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(8, 8)
      .toFormat('PNG')
      .toBuffer();

    const { format } = await sharp(data).metadata();
    t.assert.strictEqual(format, 'png');
  });

  test('accepts upper case characters as format parameter (object)', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(8, 8)
      .toFormat({ id: 'PNG' })
      .toBuffer();

    const { format } = await sharp(data).metadata();
    t.assert.strictEqual(format, 'png');
  });
});
