'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Gamma correction', function() {

  it('value of 0.0 (disabled)', function(done) {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .toFile(fixtures.path('output.gamma-0.0.jpg'), done);
  });

  it('value of 2.2 (default)', function(done) {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma()
      .toFile(fixtures.path('output.gamma-2.2.jpg'), done);
  });

  it('value of 3.0', function(done) {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma(3)
      .toFile(fixtures.path('output.gamma-3.0.jpg'), done);
  });

  it('invalid value', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpgWithGammaHoliness).gamma(4);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

});
