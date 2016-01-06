'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Interpolation', function() {

  it('nearest neighbour', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .interpolateWith(sharp.interpolator.nearest)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('bilinear', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .interpolateWith(sharp.interpolator.bilinear)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('bicubic', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .interpolateWith(sharp.interpolator.bicubic)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('nohalo', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .interpolateWith(sharp.interpolator.nohalo)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('locally bounded bicubic (LBB)', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .interpolateWith(sharp.interpolator.locallyBoundedBicubic)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('vertex split quadratic basis spline (VSQBS)', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .interpolateWith(sharp.interpolator.vertexSplitQuadraticBasisSpline)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('unknown interpolator throws', function(done) {
    var isValid = false;
    try {
      sharp().interpolateWith('nonexistant');
      isValid = true;
    } catch (e) {}
    assert(!isValid);
    done();
  });

});
