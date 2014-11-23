'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Blur', function() {

  it('specific radius 1', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(1)
      .toFile(fixtures.path('output.blur-1.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('specific radius 10', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(10)
      .toFile(fixtures.path('output.blur-10.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('specific radius 0.3', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(0.3)
      .toFile(fixtures.path('output.blur-0.3.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('mild blur', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur()
      .toFile(fixtures.path('output.blur-mild.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('invalid radius', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).blur(0.1);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('blurred image is smaller than non-blurred', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(false)
      .toBuffer(function(err, notBlurred, info) {
        if (err) throw err;
        assert.strictEqual(true, notBlurred.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .blur(true)
          .toBuffer(function(err, blurred, info) {
            if (err) throw err;
            assert.strictEqual(true, blurred.length > 0);
            assert.strictEqual(true, blurred.length < notBlurred.length);
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            done();
          });
      });
  });

});
