'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Partial image extraction', function() {

  it('JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .extract(2, 2, 20, 20)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(20, info.width);
        assert.strictEqual(20, info.height);
        fixtures.assertSimilar(fixtures.expected('extract.jpg'), data, done);
      });
  });

  it('PNG', function(done) {
    sharp(fixtures.inputPng)
      .extract(300, 200, 400, 200)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(400, info.width);
        assert.strictEqual(200, info.height);
        fixtures.assertSimilar(fixtures.expected('extract.png'), data, done);
      });
  });

  if (sharp.format.webp.output.file) {
    it('WebP', function(done) {
      sharp(fixtures.inputWebP)
        .extract(50, 100, 125, 200)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(125, info.width);
          assert.strictEqual(200, info.height);
          fixtures.assertSimilar(fixtures.expected('extract.webp'), data, done);
        });
    });
  }

  it('TIFF', function(done) {
    sharp(fixtures.inputTiff)
      .extract(63, 34, 341, 529)
      .jpeg()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(341, info.width);
        assert.strictEqual(529, info.height);
        fixtures.assertSimilar(fixtures.expected('extract.tiff'), data, done);
      });
  });

  it('Before resize', function(done) {
    sharp(fixtures.inputJpg)
      .extract(10, 10, 10, 500, 500)
      .resize(100, 100)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-resize.jpg'), data, done);
      });
  });

  it('After resize and crop', function(done) {
    sharp(fixtures.inputJpg)
      .resize(500, 500)
      .crop(sharp.gravity.north)
      .extract(10, 10, 100, 100)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('resize-crop-extract.jpg'), data, done);
      });
  });

  it('Before and after resize and crop', function(done) {
    sharp(fixtures.inputJpg)
      .extract(0, 0, 700, 700)
      .resize(500, 500)
      .crop(sharp.gravity.north)
      .extract(10, 10, 100, 100)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-resize-crop-extract.jpg'), data, done);
      });
  });

  it('Extract then rotate', function(done) {
    sharp(fixtures.inputJpg)
      .extract(10, 10, 100, 100)
      .rotate(90)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-rotate.jpg'), data, done);
      });
  });

  it('Rotate then extract', function(done) {
    sharp(fixtures.inputJpg)
      .rotate(90)
      .extract(10, 10, 100, 100)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('rotate-extract.jpg'), data, done);
      });
  });

  describe('Invalid parameters', function() {

    it('Undefined', function() {
      assert.throws(function() {
        sharp(fixtures.inputJpg).extract();
      });
    });

    it('String top', function() {
      assert.throws(function() {
        sharp(fixtures.inputJpg).extract('spoons', 10, 10, 10);
      });
    });

    it('Non-integral left', function() {
      assert.throws(function() {
        sharp(fixtures.inputJpg).extract(10, 10.2, 10, 10);
      });
    });

    it('Negative width - negative', function() {
      assert.throws(function() {
        sharp(fixtures.inputJpg).extract(10, 10, -10, 10);
      });
    });

    it('Null height', function() {
      assert.throws(function() {
        sharp(fixtures.inputJpg).extract(10, 10, 10, null);
      });
    });

  });
});
