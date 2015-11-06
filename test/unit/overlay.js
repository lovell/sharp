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
      .toBuffer(function (error, data) {
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
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Composite two low-alpha transparent PNGs into one', function(done) {
    var paths = getPaths('alpha-layer-12-low-alpha');

    sharp(fixtures.inputPngOverlayLayer1LowAlpha)
      .overlayWith(fixtures.inputPngOverlayLayer2LowAlpha)
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected, 2);
        done();
      });
  });

  it('Composite three low-alpha transparent PNGs into one', function(done) {
    var paths = getPaths('alpha-layer-012-low-alpha');

    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fixtures.inputPngOverlayLayer1LowAlpha)
      .toBuffer(function (error, data) {
        if (error) return done(error);

        sharp(data)
          .overlayWith(fixtures.inputPngOverlayLayer2LowAlpha)
          .toFile(paths.actual, function (error) {
            if (error) return done(error);
            fixtures.assertMaxColourDistance(paths.actual, paths.expected);
            done();
          });
      });
  });

  it('Composite rgb+alpha PNG onto JPEG', function(done) {
    var paths = getPaths('overlay-jpeg-with-rgb', 'jpg');

    sharp(fixtures.inputJpg)
      .resize(2048, 1536)
      .overlayWith(fixtures.inputPngOverlayLayer1)
      .toFile(paths.actual, function(error, info) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected, 102);
        done();
      });
  });

  it('Composite greyscale+alpha PNG onto JPEG', function(done) {
    var paths = getPaths('overlay-jpeg-with-greyscale', 'jpg');

    sharp(fixtures.inputJpg)
      .resize(400, 300)
      .overlayWith(fixtures.inputPngWithGreyAlpha)
      .toFile(paths.actual, function(error, info) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected, 102);
        done();
      });
  });

  if (sharp.format.webp.input.file) {
    it('Composite WebP onto JPEG', function(done) {
      var paths = getPaths('overlay-jpeg-with-webp', 'jpg');

      sharp(fixtures.inputJpg)
        .resize(300, 300)
        .overlayWith(fixtures.inputWebPWithTransparency)
        .toFile(paths.actual, function(error, info) {
          if (error) return done(error);
          fixtures.assertMaxColourDistance(paths.actual, paths.expected, 102);
          done();
        });
    });
  }

  it('Fail when compositing images with different dimensions', function(done) {
    sharp(fixtures.inputJpg)
      .overlayWith(fixtures.inputPngWithGreyAlpha)
      .toBuffer(function(error) {
        assert.strictEqual(true, error instanceof Error);
        done();
      });
  });

  it('Fail when compositing non-PNG image', function(done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .overlayWith(fixtures.inputJpg)
      .toBuffer(function(error) {
        assert.strictEqual(true, error instanceof Error);
        done();
      });
  });

  it('Fail with empty String parameter', function() {
    assert.throws(function() {
      sharp().overlayWith('');
    });
  });

  it('Fail with null parameter', function() {
    assert.throws(function() {
      sharp().overlayWith(null);
    });
  });

  it('Succeeds with a color parameter', function() {
    assert.doesNotThrow(function() {
      sharp().overlayWith({r: 0, g: 0, b: 0, a: 0});
    });
  });

  it('Does not change a opaque image when adding a clear mask', function (done) {
    var paths = getPaths('clear-overlay-on-opaque-image');

    sharp(fixtures.inputJpg)
      .resize(256)
      .overlayWith('rgba(0, 0, 0, 0)')
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Does not change a transparent image when adding a clear mask', function (done) {
    var paths = getPaths('clear-overlay-on-transparent-image');

    sharp(fixtures.inputPngWithTransparency)
      .resize(256)
      .overlayWith('rgba(0, 0, 0, 0)')
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Adds a transparent mask to a opaque image', function(done) {
    var paths = getPaths('transparent-overlay-on-opaque-image');

    sharp(fixtures.inputJpg)
      .resize(256)
      .overlayWith('rgba(224, 0, 0, 0.3)')
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Adds a transparent mask to a transparent image', function(done) {
    var paths = getPaths('transparent-overlay-on-transparent-image');

    sharp(fixtures.inputPngWithTransparency)
      .resize(256)
      .overlayWith('rgba(224, 0, 0, 0.3)')
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });
});
