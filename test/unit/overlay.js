'use strict';

var fs = require('fs');
var assert = require('assert');
var fixtures = require('../fixtures');
var sharp = require('../../index');

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
  it('Overlay transparent PNG file on solid background', function(done) {
    var paths = getPaths('alpha-layer-01');

    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fixtures.inputPngOverlayLayer1)
      .toFile(paths.actual, function (error) {
        if (error) return done(error);
        fixtures.assertMaxColourDistance(paths.actual, paths.expected);
        done();
      });
  });

  it('Overlay transparent PNG Buffer on solid background', function(done) {
    var paths = getPaths('alpha-layer-01');

    sharp(fixtures.inputPngOverlayLayer0)
      .overlayWith(fs.readFileSync(fixtures.inputPngOverlayLayer1))
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

  it('Fail when overlay does not contain alpha channel', function(done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .overlayWith(fixtures.inputJpg)
      .toBuffer(function(error) {
        assert.strictEqual(true, error instanceof Error);
        done();
      });
  });

  it('Fail when overlay is larger', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .overlayWith(fixtures.inputPngOverlayLayer1)
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

  it('Fail with non-String parameter', function() {
    assert.throws(function() {
      sharp().overlayWith(1);
    });
  });

  it('Fail with unsupported gravity', function() {
    assert.throws(function() {
      sharp()
        .overlayWith(fixtures.inputPngOverlayLayer1, {
          gravity: 9
        });
    });
  });

  it('Empty options', function() {
    assert.doesNotThrow(function() {
      sharp().overlayWith(fixtures.inputPngOverlayLayer1, {});
    });
  });

  describe('Overlay with numeric gravity', function() {
    Object.keys(sharp.gravity).forEach(function(gravity) {
      it(gravity, function(done) {
        var expected = fixtures.expected('overlay-gravity-' + gravity + '.jpg');
        sharp(fixtures.inputJpg)
          .resize(80)
          .overlayWith(fixtures.inputPngWithTransparency16bit, {
            gravity: gravity
          })
          .toBuffer(function(err, data, info) {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(80, info.width);
            assert.strictEqual(65, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(expected, data, done);
          });
      });
    });
  });

  describe('Overlay with string-based gravity', function() {
    Object.keys(sharp.gravity).forEach(function(gravity) {
      it(gravity, function(done) {
        var expected = fixtures.expected('overlay-gravity-' + gravity + '.jpg');
        sharp(fixtures.inputJpg)
          .resize(80)
          .overlayWith(fixtures.inputPngWithTransparency16bit, {
            gravity: sharp.gravity[gravity]
          })
          .toBuffer(function(err, data, info) {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(80, info.width);
            assert.strictEqual(65, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(expected, data, done);
          });
      });
    });
  });

});
