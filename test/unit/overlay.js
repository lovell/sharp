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
describe('Overlays', function() {
  it('Overlay transparent PNG on solid background', function(done) {
    var paths = getPaths('alpha-layer-01');

    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fixtures.inputPngOverlayLayer1)
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Overlay low-alpha transparent PNG on solid background', function(done) {
    var paths = getPaths('alpha-layer-01-low-alpha');

    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fixtures.inputPngOverlayLayer1LowAlpha)
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Composite three transparent PNGs into one', function(done) {
    var paths = getPaths('alpha-layer-012');

    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fixtures.inputPngOverlayLayer1)
      .toBuffer(function (error, data, info) {
        if (error) return done(error);
        sharp(data)
          .overlayWith(fixtures.inputPngOverlayLayer2)
          .toFile(paths.actual, function (error) {
            if (error) return done(error);
            fixtures.assertMaxColourDistance(paths.actual, paths.expected);
            done();
          });
      });
  });

  it('Composite two transparent PNGs into one', function(done) {
    var paths = getPaths('alpha-layer-12');

    sharp(fixtures.inputPngOverlayLayer1)
      .overlayWith(fixtures.inputPngOverlayLayer2)
      .toFile(paths.actual, function (error, data, info) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Composite two low-alpha transparent PNGs into one', function(done) {
    var paths = getPaths('alpha-layer-12-low-alpha');

    sharp(fixtures.inputPngOverlayLayer1LowAlpha)
      .overlayWith(fixtures.inputPngOverlayLayer2LowAlpha)
      .toFile(paths.actual, function (error, data, info) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected, 2);
        done();
      });
  });

  it('Composite three low-alpha transparent PNGs into one', function(done) {
    var paths = getPaths('alpha-layer-012-low-alpha');

    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fixtures.inputPngOverlayLayer1LowAlpha)
      .toBuffer(function (error, data, info) {
        if (error) return done(error);

        sharp(data)
          .overlayWith(fixtures.inputPngOverlayLayer2LowAlpha)
          .toFile(paths.actual, function (error, data, info) {
            if (error) return done(error);
            fixtures.assertMaxColourDistance(paths.actual, paths.expected);
            done();
          });
      });
  });

  it('Composite transparent PNG onto JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .overlayWith(fixtures.inputPngOverlayLayer1)
      .toBuffer(function (error) {
        assert.strictEqual(true, error instanceof Error);
        if (error.message !== 'Input image must have an alpha channel') {
          return done(new Error('Unexpected error: ' + error.message));
        }
        done();
      });
  });

});
