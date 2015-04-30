'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Rotation', function() {

  it('Rotate by 90 degrees, respecting output input size', function(done) {
    sharp(fixtures.inputJpg).rotate(90).resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  });

  it('Input image has Orientation EXIF tag but do not rotate output', function(done) {
    sharp(fixtures.inputJpgWithExif)
      .resize(320)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(426, info.height);
        done();
      });
  });

  it('Input image has Orientation EXIF tag value of 8 (270 degrees), auto-rotate', function(done) {
    sharp(fixtures.inputJpgWithExif)
      .rotate()
      .resize(320)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('exif-8.jpg'), data, done);
      });
  });

  it('Input image has Orientation EXIF tag value of 5 (270 degrees + flip), auto-rotate', function(done) {
    sharp(fixtures.inputJpgWithExifMirroring)
      .rotate()
      .resize(320)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('exif-5.jpg'), data, done);
      });
  });

  it('Attempt to auto-rotate using image that has no EXIF', function(done) {
    sharp(fixtures.inputJpg).rotate().resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  });

  it('Attempt to auto-rotate image format without EXIF support', function(done) {
    sharp(fixtures.inputGif)
      .rotate()
      .resize(320)
      .jpeg()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(213, info.height);
        done();
      });
  });

  it('Rotate to an invalid angle, should fail', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).rotate(1);
    });
  });

  it('Flip - vertical', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .flip()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        fixtures.assertSimilar(fixtures.expected('flip.jpg'), data, done);
      });
  });

  it('Flop - horizontal', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .flop()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        fixtures.assertSimilar(fixtures.expected('flop.jpg'), data, done);
      });
  });

  it('Flip and flop', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .flop()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        fixtures.assertSimilar(fixtures.expected('flip-and-flop.jpg'), data, done);
      });
  });

  it('Neither flip nor flop', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .flip(false)
      .flop(false)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        fixtures.assertSimilar(fixtures.inputJpg, data, done);
      });
  });

});
