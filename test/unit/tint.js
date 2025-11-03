/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

// Allow for small rounding differences between platforms
const maxDistance = 6;

describe('Tint', () => {
  it('tints rgb image red', (_t, done) => {
    const output = fixtures.path('output.tint-red.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#FF0000')
      .toFile(output, (err, info) => {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-red.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image green', (_t, done) => {
    const output = fixtures.path('output.tint-green.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#00FF00')
      .toFile(output, (err, info) => {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-green.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image blue', (_t, done) => {
    const output = fixtures.path('output.tint-blue.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#0000FF')
      .toFile(output, (err, info) => {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-blue.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image with sepia tone', (_t, done) => {
    const output = fixtures.path('output.tint-sepia-hex.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#704214')
      .toFile(output, (err, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-sepia.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image with sepia tone with rgb colour', (_t, done) => {
    const output = fixtures.path('output.tint-sepia-rgb.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint([112, 66, 20])
      .toFile(output, (err, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-sepia.jpg'), maxDistance);
        done();
      });
  });

  it('tints rgb image with alpha channel', (_t, done) => {
    const output = fixtures.path('output.tint-alpha.png');
    sharp(fixtures.inputPngRGBWithAlpha)
      .resize(320, 240)
      .tint('#704214')
      .toFile(output, (err, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-alpha.png'), maxDistance);
        done();
      });
  });

  it('tints cmyk image red', (_t, done) => {
    const output = fixtures.path('output.tint-cmyk.jpg');
    sharp(fixtures.inputJpgWithCmykProfile)
      .resize(320, 240)
      .tint('#FF0000')
      .toFile(output, (err, info) => {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-cmyk.jpg'), maxDistance);
        done();
      });
  });
});
