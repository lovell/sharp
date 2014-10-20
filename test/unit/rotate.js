'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

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
    sharp(fixtures.inputJpgWithExif).resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(426, info.height);
      done();
    });
  });

  it('Input image has Orientation EXIF tag value of 8 (270 degrees), auto-rotate', function(done) {
    sharp(fixtures.inputJpgWithExif).rotate().resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
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

  it('Rotate to an invalid angle, should fail', function(done) {
    var fail = false;
    try {
      sharp(fixtures.inputJpg).rotate(1);
      fail = true;
    } catch (e) {}
    assert(!fail);
    done();
  });

});
