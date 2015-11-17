'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Threshold', function() {
  it('threshold 1', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(1)
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-1.jpg'), data, done);
      });
  });

  it('threshold 40', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(40)
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-40.jpg'), data, done);
      });
  });

  it('threshold 128', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128)
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data, done);
      });
  });

  it('threshold default', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold()
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data, done);
      });
  });

  it('invalid threshold -1', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).threshold(-1);
    });
  });

  it('invalid threshold 256', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).threshold(256);
    });
  });
});
