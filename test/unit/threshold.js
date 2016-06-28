'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Threshold', function() {
  it('threshold 1 jpeg', function(done) {
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

  it('threshold 40 jpeg', function(done) {
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

   it('threshold true (=128)', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(true)
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data, done);
      });
   });
  
  it('threshold grayscale: true (=128)', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128,{'grayscale':true})
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data, done);
      });    
  });


  it('threshold default jpeg', function(done) {
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

  it('threshold default png transparency', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .resize(320, 240)
      .threshold()
      .toBuffer(function(err, data, info) {
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128-transparency.png'), data, done);
      });
  });

  it('threshold default png alpha', function(done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .resize(320, 240)
      .threshold()
      .toBuffer(function(err, data, info) {
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128-alpha.png'), data, done);
      });
  });

  if (sharp.format.webp.output.file) {
    it('threshold default webp transparency', function(done) {
      sharp(fixtures.inputWebPWithTransparency)
        .threshold()
        .toBuffer(function(err, data, info) {
          assert.strictEqual('webp', info.format);
          fixtures.assertSimilar(fixtures.expected('threshold-128-transparency.webp'), data, done);
        });
    });
  }

  it('color threshold', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128,{'grayscale':false})
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-color-128.jpg'), data, done);
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
