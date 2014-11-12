'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Sharpen', function() {

  it('specific radius 10', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(10)
      .toFile(fixtures.path('output.sharpen-10.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('specific radius 3 and levels 0.5, 2.5', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(3, 0.5, 2.5)
      .toFile(fixtures.path('output.sharpen-3-0.5-2.5.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('specific radius 5 and levels 2, 4', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(5, 2, 4)
      .toFile(fixtures.path('output.sharpen-5-2-4.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('mild sharpen', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen()
      .toFile(fixtures.path('output.sharpen-mild.jpg'), function(err, info) {
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
      sharp(fixtures.inputJpg).sharpen(1.5);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('invalid flat', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).sharpen(1, -1);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('invalid jagged', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).sharpen(1, 1, -1);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('sharpened image is larger than non-sharpened', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(false)
      .toBuffer(function(err, notSharpened, info) {
        if (err) throw err;
        assert.strictEqual(true, notSharpened.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .sharpen(true)
          .toBuffer(function(err, sharpened, info) {
            if (err) throw err;
            assert.strictEqual(true, sharpened.length > 0);
            assert.strictEqual(true, sharpened.length > notSharpened.length);
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            done();
          });
      });
  });

});
