'use strict';

var fixtures = require('../fixtures');
var fs = require('fs');
var sharp = require('../../index');

sharp.cache(0);

// Main
describe('Overlays', function() {
  it('Overlay transparent PNG on solid background', function(done) {
    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fixtures.inputPngOverlayLayer1)
      .toBuffer(function (error, data, info) {
        if (error) return done(error);

        fixtures.assertSimilar(fixtures.expected('alpha-layer-01.png'), data, {threshold: 0}, done);
      });
  });

  it('Composite three transparent PNGs into one', function(done) {
    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fixtures.inputPngOverlayLayer1)
      .toBuffer(function (error, data, info) {
        if (error) return done(error);

        sharp(data)
          .overlayWith(fixtures.inputPngOverlayLayer2)
          .toBuffer(function (error, data, info) {
            if (error) return done(error);

            fixtures.assertSimilar(fixtures.expected('alpha-layer-012.png'), data, {threshold: 0}, done);
          });
      });
  });

  // This tests that alpha channel unpremultiplication is correct:
  it('Composite three low-alpha transparent PNGs into one', function(done) {
    sharp(fixtures.inputPngOverlayLayer1LowAlpha)
      .overlayWith(fixtures.inputPngOverlayLayer2LowAlpha)
      .toBuffer(function (error, data, info) {
        if (error) return done(error);

        fixtures.assertSimilar(fixtures.expected('alpha-layer-012-low-alpha.png'), data, {threshold: 0}, done);
      });
  });

  // This tests that alpha channel unpremultiplication is correct:
  it('Composite transparent PNG onto JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .overlayWith(fixtures.inputPngOverlayLayer1)
      .toBuffer(function (error, data, info) {
        if (error.message !== 'Input image must have an alpha channel') {
          return done(new Error('Unexpected error: ' + error.message));
        }

        done();
      });
  });

});
