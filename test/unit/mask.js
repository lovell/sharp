'use strict';

var assert = require('assert');
var fixtures = require('../fixtures');
var sharp = require('../../index');

sharp.cache(0);

// Helpers
var getPaths = function(baseName, extension) {
  if (typeof extension === 'undefined') {
    extension = 'png';
  }
  return {
    actual: fixtures.path('output.' + baseName + '.' + extension),
    expected: fixtures.expected(baseName + '.' + extension),
  };
};

// Test
describe('Mask', function() {
  it('Does not change a opaque image when adding a clear mask', function (done) {
    var paths = getPaths('clear-mask-on-opaque-image');

    sharp(fixtures.inputJpg).
      resize(256).
      maskWith('rgba(0, 0, 0, 0)').
      toFile(paths.actual, function (error) {
      if (error) return done(error);
      fixtures.assertMaxColourDistance(paths.actual, paths.expected);
      done();
    });
  });

  it('Does not change a transparent image when adding a clear mask', function (done) {
    var paths = getPaths('clear-mask-on-transparent-image');

    sharp(fixtures.inputPngWithTransparency).
      resize(256).
      maskWith('rgba(0, 0, 0, 0)').
      toFile(paths.actual, function (error) {
      if (error) return done(error);
      fixtures.assertMaxColourDistance(paths.actual, paths.expected);
      done();
    });
  });

  it('Adds a transparent mask to a opaque image', function(done) {
    var paths = getPaths('transparent-mask-on-opaque-image');

    sharp(fixtures.inputJpg)
      .resize(256)
      .maskWith('rgba(224, 0, 0, 0.3)')
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Adds a transparent mask to a transparent image', function(done) {
    var paths = getPaths('transparent-mask-on-transparent-image');

    sharp(fixtures.inputPngWithTransparency)
      .resize(256)
      .maskWith('rgba(224, 0, 0, 0.3)')
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Fail with non color parameter', function() {
    assert.throws(function() {
      sharp().maskWith('');
    });
  });
});
