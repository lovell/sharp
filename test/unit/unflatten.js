/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Unflatten', () => {
  it('unflatten white background', (_t, done) => {
    sharp(fixtures.inputPng).unflatten()
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-white-transparent.png'), data, { threshold: 0 }, done);
      });
  });
  it('unflatten transparent image', (_t, done) => {
    sharp(fixtures.inputPngTrimSpecificColourIncludeAlpha).unflatten()
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-flag-white-transparent.png'), data, { threshold: 0 }, done);
      });
  });
  it('unflatten using threshold', (_t, done) => {
    sharp(fixtures.inputPngPalette).unflatten().threshold(128, { grayscale: false })
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-swiss.png'), data, { threshold: 1 }, done);
      });
  });
});
