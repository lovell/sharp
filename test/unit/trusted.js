/*!
  SPDX-FileCopyrightText: 2013 Lovell Fuller and others
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const fs = require('node:fs/promises');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Trusted formats', () => {
  test('Provides list of default trusted formats', (t) => {
    t.plan(2);
    t.assert.equal(sharp.trustedFormats.length, 8);
    t.assert.deepEqual(sharp.trustedFormats, [
      'gif',
      'heif',
      'jpeg',
      'png',
      'svg',
      'tiff',
      'vips',
      'webp'
    ]);
  });

  test('Can block WebP file input', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      sharp(fixtures.inputWebP, { trustedFormats: ['jpeg'] }).toBuffer(),
      /Input format webp is not in list of trustedFormats/
    );
  });

  test('Can block WebP Stream input', async (t) => {
    t.plan(1);
    const fd = await fs.open(fixtures.inputWebP);
    const readable = fd.createReadStream();
    const transform = sharp({ trustedFormats: ['png'] });
    readable.pipe(transform);
    await t.assert.rejects(
      () => transform.toBuffer(),
      /Input format webp is not in list of trustedFormats/
    );
  });

  test('Can block WebP Buffer input', async (t) => {
    t.plan(1);
    const buffer = await fs.readFile(fixtures.inputWebP);
    await t.assert.rejects(
      () => sharp(buffer, { trustedFormats: ['heif'] }).toBuffer(),
      /Input format webp is not in list of trustedFormats/
    );
  });

  test('Handles empty trustedFormats', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      sharp(fixtures.inputWebP, { trustedFormats: [] }).toBuffer(),
      /Input format webp is not in list of trustedFormats/
    );
  });

  test('Handles invalid trustedFormats', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp({ trustedFormats: 'fail' }),
      /Expected array containing one or more of: jpeg, png, webp, tiff/
    );
  });

  test('Handles invalid format within trustedFormats', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp({ trustedFormats: ['fail'] }),
      /Expected array containing one or more of: jpeg, png, webp, tiff/
    );
  });
});
