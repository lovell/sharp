'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Trim borders', function() {

  it('Threshold default', function(done) {
    var expected = fixtures.expected('alpha-layer-1-fill-trim-resize.png');
    sharp(fixtures.inputPngOverlayLayer1)
      .resize(450, 322)
      .trim()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(450, info.width);
        assert.strictEqual(322, info.height);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('16-bit PNG with alpha channel', function(done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 32)
      .trim(20)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(32, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('trim-16bit-rgba.png'), data, done);
      });
  });

  describe('Invalid thresholds', function() {
    [-1, 100, 'fail', {}].forEach(function(threshold) {
      it(JSON.stringify(threshold), function() {
        assert.throws(function() {
          sharp().trim(threshold);
        });
      });
    });
  });
});
