'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Normalization', function () {

  it('uses the same prototype for both spellings', function () {
    assert.strictEqual(sharp.prototype.normalize, sharp.prototype.normalise);
  });

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
        return done();
      });
  });

  it('spreads grayscaled image values between 0 and 255', function(done) {
    sharp(fixtures.inputJpgWithLowContrast)
      .gamma()
      .greyscale()
      .normalize()
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
        return done();
      });
  });

  it('stretches greyscale images with alpha channel', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .normalize()
      .raw()
      .toBuffer(function (err, data, info) {
        // raw toBuffer does not return the alpha channel (yet?)
        var min = 255, max = 0, i;
        for (i = 0; i < data.length; i++) {
          min = Math.min(min, data[i]);
          max = Math.max(max, data[i]);
        }
        assert.strictEqual(0, min);
        assert.strictEqual(255, max);
        return done();
      });
  });

  it('keeps an existing alpha channel', function (done) {
    sharp(fixtures.inputPngWithTransparency)
      .normalize()
      .toBuffer(function (err, data, info) {
        sharp(data)
          .metadata()
          .then(function (metadata) {
            assert.strictEqual(4, metadata.channels);
            assert.strictEqual(true, metadata.hasAlpha);
            assert.strictEqual('srgb', metadata.space);
          })
          .finally(done);
      });
  });

  it('keeps the alpha channel of greyscale images intact', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .normalize()
      .toBuffer(function (err, data, info) {
        sharp(data)
          .metadata()
          .then(function (metadata) {
            assert.strictEqual(true, metadata.hasAlpha);
            // because of complications with greyscale
            // we return everything in srgb for now.
            //
            // assert.strictEqual(2, metadata.channels);
            // assert.strictEqual('b-w', metadata.space);
            assert.strictEqual(4, metadata.channels);
            assert.strictEqual('srgb', metadata.space);
          })
          .finally(done);
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
        // because of complications with greyscale
        // we return everything in srgb for now.
        //
        // assert.strictEqual(1, metadata.channels);
        // assert.strictEqual('b-w', metadata.space);
        assert.strictEqual(3, metadata.channels);
        assert.strictEqual('srgb', metadata.space);
      })
      .then(function () {
        return sharp(this.imageData)
          .raw()
          .toBuffer();
      })
      .then(function (rawData) {
        // var blackBuffer = new Buffer([0,0,0,0]);
        var blackBuffer = new Buffer([0,0,0, 0,0,0, 0,0,0, 0,0,0]);
        assert.strictEqual(blackBuffer.toString(), rawData.toString());
      })
      .finally(done);
  });
});
