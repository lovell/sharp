'use strict';

const sharp = require('../../');
const fixtures = require('../fixtures');

// const assert = require('assert');

describe('Unflatten', function () {
  it('unflatten white background', function (done) {
    sharp(fixtures.inputPng).unflatten()
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-white-transparent.png'), data, { threshold: 0 }, done);
      });
  });
  it('unflatten transparent image', function (done) {
    sharp(fixtures.inputPng).ensureAlpha()
      .toBuffer(function (err, data) {
        if (err) throw err;
        sharp(data).unflatten().toBuffer(function (err, data) {
          if (err) throw err;
          fixtures.assertSimilar(fixtures.expected('unflatten-white-transparent.png'), data, { threshold: 0 }, done);
        });
      });
  });
  it('unflatten using threshold', function (done) {
    sharp(fixtures.inputPngPalette).unflatten().threshold(128, { grayscale: false })
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('unflatten-swiss.png'), data, { threshold: 0 }, done);
      });
  });
  it('no unflatten', function (done) {
    sharp(fixtures.inputPng).unflatten(false)
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.inputPng, data, { threshold: 0 }, done);
      });
  });
});
