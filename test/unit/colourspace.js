'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Colour space conversion', function () {
  it('To greyscale', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .greyscale()
      .toFile(fixtures.path('output.greyscale-gamma-0.0.jpg'), done);
  });

  it('To greyscale with gamma correction', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .gamma()
      .grayscale()
      .toFile(fixtures.path('output.greyscale-gamma-2.2.jpg'), done);
  });

  it('Not to greyscale', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .greyscale(false)
      .toFile(fixtures.path('output.greyscale-not.jpg'), done);
  });

  it('Greyscale with single channel output', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .greyscale()
      .toColourspace('b-w')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(1, info.channels);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('output.greyscale-single.jpg'), data, done);
      });
  });

  if (sharp.format.tiff.input.file && sharp.format.webp.output.buffer) {
    it('From 1-bit TIFF to sRGB WebP [slow]', function (done) {
      sharp(fixtures.inputTiff)
        .webp()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          done();
        });
    });
  }

  it('From CMYK to sRGB', function (done) {
    sharp(fixtures.inputJpgWithCmykProfile)
      .resize(320)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        done();
      });
  });

  it('From CMYK to sRGB with white background, not yellow', function (done) {
    sharp(fixtures.inputJpgWithCmykProfile)
      .resize(320, 240, {
        fit: sharp.fit.contain,
        background: 'white'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('colourspace.cmyk.jpg'), data, done);
      });
  });

  it('From profile-less CMYK to sRGB', function (done) {
    sharp(fixtures.inputJpgWithCmykNoProfile)
      .resize(320)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        fixtures.assertSimilar(fixtures.expected('colourspace.cmyk-without-profile.jpg'), data, done);
      });
  });

  it('Invalid input', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg)
        .toColourspace(null);
    });
  });
});
