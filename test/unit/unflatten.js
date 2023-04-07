// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Unflatten', function () {
  it('unflatten white background', function (done) {
    sharp(fixtures.inputPng).unflatten()
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-white-transparent.png'), data, { threshold: 0 }, done);
      });
  });
  it('unflatten transparent image', function (done) {
    sharp(fixtures.inputPngTrimSpecificColourIncludeAlpha).unflatten()
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-flag-white-transparent.png'), data, { threshold: 0 }, done);
      });
  });
  it('unflatten using threshold', function (done) {
    sharp(fixtures.inputPngPalette).unflatten().threshold(128, { grayscale: false })
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-swiss.png'), data, { threshold: 1 }, done);
      });
  });
});
