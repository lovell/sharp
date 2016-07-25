'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Interpolators and kernels', function() {

  describe('Reducers', function() {
    [
      sharp.kernel.cubic,
      sharp.kernel.lanczos2,
      sharp.kernel.lanczos3
    ].forEach(function(kernel) {
      it(kernel, function(done) {
        sharp(fixtures.inputJpg)
          .resize(320, null, { kernel: kernel })
          .toBuffer(function(err, data, info) {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(320, info.width);
            fixtures.assertSimilar(fixtures.inputJpg, data, done);
          });
      });
    });
  });

  describe('Enlargers', function() {
    [
      sharp.interpolator.nearest,
      sharp.interpolator.bilinear,
      sharp.interpolator.bicubic,
      sharp.interpolator.nohalo,
      sharp.interpolator.locallyBoundedBicubic,
      sharp.interpolator.vertexSplitQuadraticBasisSpline
    ].forEach(function(interpolator) {
      it(interpolator, function(done) {
        sharp(fixtures.inputJpg)
          .resize(320, null, { interpolator: interpolator })
          .toBuffer(function(err, data, info) {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(320, info.width);
            fixtures.assertSimilar(fixtures.inputJpg, data, done);
          });
      });
    });
  });

  it('unknown kernel throws', function() {
    assert.throws(function() {
      sharp().resize(null, null, { kernel: 'unknown' });
    });
  });

  it('unknown interpolator throws', function() {
    assert.throws(function() {
      sharp().resize(null, null, { interpolator: 'unknown' });
    });
  });

});
