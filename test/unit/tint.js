// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

// Allow for small rounding differences between platforms
const maxDistance = 6;

describe('Tint', function () {
  it('tints rgb image red', function (done) {
    const output = fixtures.path('output.tint-red.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#FF0000')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-red.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image green', function (done) {
    const output = fixtures.path('output.tint-green.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#00FF00')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-green.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image blue', function (done) {
    const output = fixtures.path('output.tint-blue.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#0000FF')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-blue.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image with sepia tone', function (done) {
    const output = fixtures.path('output.tint-sepia-hex.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#704214')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-sepia.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image with sepia tone with rgb colour', function (done) {
    const output = fixtures.path('output.tint-sepia-rgb.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint([112, 66, 20])
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-sepia.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image with alpha channel', function (done) {
    const output = fixtures.path('output.tint-alpha.png');
    sharp(fixtures.inputPngRGBWithAlpha)
      .resize(320, 240)
      .tint('#704214')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-alpha.png'), maxDistance);
        done();
      });
  });

  it('tints cmyk image red', function (done) {
    const output = fixtures.path('output.tint-cmyk.jpg');
    sharp(fixtures.inputJpgWithCmykProfile)
      .resize(320, 240)
      .tint('#FF0000')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-cmyk.jpg'), maxDistance);
        done();
      });
  });
});
