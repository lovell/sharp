'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Sharpen', function() {

  it('sharpen image is larger than non-sharpen', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(false)
      .toBuffer(function(err, notSharpened, info) {
        if (err) throw err;
        assert.strictEqual(true, notSharpened.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(notSharpened)
          .sharpen()
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
