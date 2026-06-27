/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Unflatten', () => {
  test('unflatten white background', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputPng).unflatten().toBuffer();
    await t.assert.doesNotReject(
      () => fixtures.assertSimilar(fixtures.expected('unflatten-white-transparent.png'), data, { threshold: 0 })
    );
  });
  test('unflatten transparent image', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputPngTrimSpecificColourIncludeAlpha).unflatten().toBuffer();
    await t.assert.doesNotReject(
      () => fixtures.assertSimilar(fixtures.expected('unflatten-flag-white-transparent.png'), data, { threshold: 0 })
    );
  });
  test('unflatten using threshold', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputPngPalette).unflatten().threshold(128, { grayscale: false }).toBuffer();
    await t.assert.doesNotReject(
      () => fixtures.assertSimilar(fixtures.expected('unflatten-swiss.png'), data, { threshold: 1 })
    );
  });
});
