'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Normalization', function () {

  it('uses the same prototype for both spellings', function () {
    assert.strictEqual(sharp.prototype.normalize, sharp.prototype.normalise);
  });

  // Normalize is currently unavailable on Windows
  if (process.platform !== 'win32') {

    it('spreads rgb image values between 0 and 255', function(done) {
      sharp(fixtures.inputJpgWithLowContrast)
        .normalize()
        .raw()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          var min = 255, max = 0, i;
          for (i = 0; i < data.length; i += 3) {
            min = Math.min(min, data[i], data[i + 1], data[i + 2]);
            max = Math.max(max, data[i], data[i + 1], data[i + 2]);
          }
          assert.strictEqual(0, min);
          assert.strictEqual(255, max);
          done();
        });
    });

    it('spreads grayscaled image values between 0 and 255', function(done) {
      sharp(fixtures.inputJpgWithLowContrast)
        .gamma()
        .greyscale()
        .normalize(true)
        .raw()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          var min = 255, max = 0, i;
          for (i = 0; i < data.length; i++) {
            min = Math.min(min, data[i]);
            max = Math.max(max, data[i]);
          }
          assert.strictEqual(0, min);
          assert.strictEqual(255, max);
          done();
        });
    });

    it('stretches greyscale images with alpha channel', function (done) {
      sharp(fixtures.inputPngWithGreyAlpha)
        .normalize()
        .raw()
        .toBuffer(function (err, data, info) {
          var min = 255, max = 0, i;
          for (i = 0; i < data.length; i++) {
            min = Math.min(min, data[i]);
            max = Math.max(max, data[i]);
          }
          assert.strictEqual(0, min);
          assert.strictEqual(255, max);
          done();
        });
    });

    it('keeps an existing alpha channel', function (done) {
      sharp(fixtures.inputPngWithTransparency)
        .normalize()
        .toBuffer(function (err, data) {
          if (err) return done(err);
          sharp(data).metadata(function(err, metadata) {
            if (err) return done(err);
            assert.strictEqual(4, metadata.channels);
            assert.strictEqual(true, metadata.hasAlpha);
            assert.strictEqual('srgb', metadata.space);
            done();
          });
        });
    });

    it('keeps the alpha channel of greyscale images intact', function (done) {
      sharp(fixtures.inputPngWithGreyAlpha)
        .normalize()
        .toBuffer(function (err, data) {
          if (err) return done(err);
          sharp(data).metadata(function(err, metadata) {
            if (err) return done(err);
            assert.strictEqual(true, metadata.hasAlpha);
            assert.strictEqual(4, metadata.channels);
            assert.strictEqual('srgb', metadata.space);
            done();
          });
        });
    });

    it('returns a black image for images with only one color', function (done) {
      sharp(fixtures.inputPngWithOneColor)
        .normalize()
        .toBuffer()
        .bind({})
        .then(function (imageData) {
          this.imageData = imageData;
          return sharp(imageData)
            .metadata();
        })
        .then(function (metadata) {
          assert.strictEqual(false, metadata.hasAlpha);
          assert.strictEqual(3, metadata.channels);
          assert.strictEqual('srgb', metadata.space);
        })
        .then(function () {
          return sharp(this.imageData)
            .raw()
            .toBuffer();
        })
        .then(function (rawData) {
          var blackBuffer = new Buffer([0,0,0, 0,0,0, 0,0,0, 0,0,0]);
          assert.strictEqual(blackBuffer.toString(), rawData.toString());
        })
        .finally(done);
    });

  }
});
