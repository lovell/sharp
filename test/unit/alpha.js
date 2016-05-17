'use strict';

var assert = require('assert');
var fixtures = require('../fixtures');
var sharp = require('../../index');

describe('Alpha transparency', function() {

  it('Flatten to black', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .resize(400, 300)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(400, info.width);
        assert.strictEqual(300, info.height);
        fixtures.assertSimilar(fixtures.expected('flatten-black.jpg'), data, done);
      });
  });

  it('Flatten to RGB orange', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .background({r: 255, g: 102, b: 0})
      .resize(400, 300)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(400, info.width);
        assert.strictEqual(300, info.height);
        fixtures.assertSimilar(fixtures.expected('flatten-orange.jpg'), data, done);
      });
  });

  it('Flatten to CSS/hex orange', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .background('#ff6600')
      .resize(400, 300)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(400, info.width);
        assert.strictEqual(300, info.height);
        fixtures.assertSimilar(fixtures.expected('flatten-orange.jpg'), data, done);
      });
  });

  it('Flatten 16-bit PNG with transparency to orange', function(done) {
    var output = fixtures.path('output.flatten-rgb16-orange.jpg');
    sharp(fixtures.inputPngWithTransparency16bit)
      .flatten()
      .background({r: 255, g: 102, b: 0})
      .toFile(output, function(err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        assert.strictEqual(32, info.width);
        assert.strictEqual(32, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('flatten-rgb16-orange.jpg'), 25);
        done();
      });
  });

  it('Do not flatten', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten(false)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(4, info.channels);
        done();
      });
  });

  it('Ignored for JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .background('#ff0000')
      .flatten()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        done();
      });
  });

  it('Enlargement with non-nearest neighbor interpolation shouldn’t cause dark edges', function(done) {
    var BASE_NAME = 'alpha-premultiply-enlargement-2048x1536-paper.png';
    var actual = fixtures.path('output.' + BASE_NAME);
    var expected = fixtures.expected(BASE_NAME);
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .resize(2048, 1536)
      .toFile(actual, function(err) {
        if (err) {
          done(err);
        } else {
          fixtures.assertMaxColourDistance(actual, expected, 102);
          done();
        }
      });
  });

  it('Reduction with non-nearest neighbor interpolation shouldn’t cause dark edges', function(done) {
    var BASE_NAME = 'alpha-premultiply-reduction-1024x768-paper.png';
    var actual = fixtures.path('output.' + BASE_NAME);
    var expected = fixtures.expected(BASE_NAME);
    sharp(fixtures.inputPngAlphaPremultiplicationLarge)
      .resize(1024, 768)
      .toFile(actual, function(err) {
        if (err) {
          done(err);
        } else {
          fixtures.assertMaxColourDistance(actual, expected, 102);
          done();
        }
      });
  });

});
