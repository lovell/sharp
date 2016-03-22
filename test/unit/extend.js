'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Extend', function () {

  it('extend all sides equally with RGB', function(done) {
    sharp(fixtures.inputJpg)
      .resize(120)
      .background({r: 255, g: 0, b: 0})
      .extend(10)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(140, info.width);
        assert.strictEqual(118, info.height);
        fixtures.assertSimilar(fixtures.expected('extend-equal.jpg'), data, done);
      });
  });

  it('extend sides unequally with RGBA', function(done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(120)
      .background({r: 0, g: 0, b: 0, a: 0})
      .extend({top: 50, bottom: 0, left: 10, right: 35})
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(165, info.width);
        assert.strictEqual(170, info.height);
        fixtures.assertSimilar(fixtures.expected('extend-unequal.png'), data, done);
      });
  });

  it('missing parameter fails', function() {
    assert.throws(function() {
      sharp().extend();
    });
  });
  it('negative fails', function() {
    assert.throws(function() {
      sharp().extend(-1);
    });
  });
  it('partial object fails', function() {
    assert.throws(function() {
      sharp().extend({top: 1});
    });
  });

});
