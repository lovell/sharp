'use strict';

const sharp = require('../../');
const fixtures = require('../fixtures');

// const assert = require('assert');

describe('Unflatten', function () {
  it('unflatten white background', function (done) {
    sharp(fixtures.inputPng).unflatten({ thresholds: [255] })
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-white-transparent.png'), data, { threshold: 0 }, done);
      });
  });
  it('unflatten using threshold', function (done) {
    sharp(fixtures.inputPngPalette).unflatten({ thresholds: [128] })
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-swiss.png'), data, { threshold: 0 }, done);
      });
  });
});
