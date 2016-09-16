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

  it('Composite JPEG onto PNG', function(done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .overlayWith(fixtures.inputJpgWithLandscapeExif1)
      .toBuffer(function(error) {
        if (error) return done(error);
        done();
      });
  });

  it('Composite opaque JPEG onto JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .overlayWith(fixtures.inputJpgWithLandscapeExif1)
      .toBuffer(function(error) {
        if (error) return done(error);
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

  describe('Overlay with tile enabled and gravity', function() {
    Object.keys(sharp.gravity).forEach(function(gravity) {
      it(gravity, function(done) {
        var expected = fixtures.expected('overlay-tile-gravity-' + gravity + '.jpg');
        sharp(fixtures.inputJpg)
          .resize(80)
          .overlayWith(fixtures.inputPngWithTransparency16bit, {
            tile: true,
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

  describe("Overlay with top-left offsets", function() {
    it('Overlay with 10px top & 10px left offsets', function(done) {
      var expected = fixtures.expected('overlay-valid-offsets-10-10.jpg');
      sharp(fixtures.inputJpg)
        .resize(400)
        .overlayWith(fixtures.inputPngWithTransparency16bit, {
          top: 10,
          left: 10
        })
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          fixtures.assertSimilar(expected, data, done);
        });
      
    });

    it('Overlay with 100px top & 300px left offsets', function(done) {
      var expected = fixtures.expected('overlay-valid-offsets-100-300.jpg');
      sharp(fixtures.inputJpg)
        .resize(400)
        .overlayWith(fixtures.inputPngWithTransparency16bit, {
          top: 100,
          left: 300
        })
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          fixtures.assertSimilar(expected, data, done);
        });
      
    });

    it('Overlay with only top offset', function() {
      assert.throws(function() {
        sharp(fixtures.inputJpg)
          .resize(400)
          .overlayWith(fixtures.inputPngWithTransparency16bit, {
            top: 1000
          });
      });
    });

    it('Overlay with only left offset', function() {
      assert.throws(function() {
        sharp(fixtures.inputJpg)
          .resize(400)
          .overlayWith(fixtures.inputPngWithTransparency16bit, {
            left: 1000
          });
        });
    });

    it('Overlay with negative offsets', function() {
      assert.throws(function() {
        sharp(fixtures.inputJpg)
          .resize(400)
          .overlayWith(fixtures.inputPngWithTransparency16bit, {
            top: -1000,
            left: -1000
          });
        });     
    });

    it('Overlay with 0 offset', function(done) {
      var expected = fixtures.expected('overlay-offset-0.jpg');
      sharp(fixtures.inputJpg)
        .resize(400)
        .overlayWith(fixtures.inputPngWithTransparency16bit, {
          top: 0,
          left: 0
        })
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          fixtures.assertSimilar(expected, data, done);
        });
      
    });

    it('Overlay with offset and gravity', function(done) {
      var expected = fixtures.expected('overlay-offset-with-gravity.jpg');
      sharp(fixtures.inputJpg)
        .resize(400)
        .overlayWith(fixtures.inputPngWithTransparency16bit, {
          left: 10,
          top: 10,
          gravity : 4
          
        })
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          fixtures.assertSimilar(expected, data, done);
        });
      
    });

    it('Overlay with offset and gravity and tile', function(done) {
      var expected = fixtures.expected('overlay-offset-with-gravity-tile.jpg');
      sharp(fixtures.inputJpg)
        .resize(400)
        .overlayWith(fixtures.inputPngWithTransparency16bit, {
          left: 10,
          top: 10,
          gravity : 4,
          tile: true
        })
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          fixtures.assertSimilar(expected, data, done);
        });
      
    });

    it('Overlay with offset and tile', function(done) {
      var expected = fixtures.expected('overlay-offset-with-tile.jpg');
      sharp(fixtures.inputJpg)
        .resize(400)
        .overlayWith(fixtures.inputPngWithTransparency16bit, {
          left: 10,
          top: 10,
          tile: true
        })
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          fixtures.assertSimilar(expected, data, done);
        });
    });

    it('Overlay with invalid cutout option', function() {
      assert.throws(function() {
        sharp().overlayWith('ignore', { cutout: 1 });
      });
    });

    it('Overlay with invalid tile option', function() {
      assert.throws(function() {
        sharp().overlayWith('ignore', { tile: 1 });
      });
    });

    it('Overlay with very large offset', function(done) {
      var expected = fixtures.expected('overlay-very-large-offset.jpg');
      sharp(fixtures.inputJpg)
        .resize(400)
        .overlayWith(fixtures.inputPngWithTransparency16bit, {
          left: 10000,
          top: 10000
        })
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          fixtures.assertSimilar(expected, data, done);
        });
    });

    it('Overlay 100x100 with 50x50 so bottom edges meet', function(done) {
      sharp(fixtures.inputJpg)
        .resize(50, 50)
        .toBuffer(function(err, overlay) {
          if (err) throw err;
          sharp(fixtures.inputJpgWithLandscapeExif1)
            .resize(100, 100)
            .overlayWith(overlay, {
              top: 50,
              left: 40
            })
            .toBuffer(function(err, data, info) {
              if (err) throw err;
              assert.strictEqual('jpeg', info.format);
              assert.strictEqual(100, info.width);
              assert.strictEqual(100, info.height);
              fixtures.assertSimilar(fixtures.expected('overlay-bottom-edges-meet.jpg'), data, done);
            });
        });
    });
  });

  it('With tile enabled and image rotated 90 degrees', function(done) {
    var expected = fixtures.expected('overlay-tile-rotated90.jpg');
    sharp(fixtures.inputJpg)
      .rotate(90)
      .resize(80)
      .overlayWith(fixtures.inputPngWithTransparency16bit, {
        tile: true
      })
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(98, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('With tile enabled and image rotated 90 degrees and gravity northwest', function(done) {
    var expected = fixtures.expected('overlay-tile-rotated90-gravity-northwest.jpg');
    sharp(fixtures.inputJpg)
      .rotate(90)
      .resize(80)
      .overlayWith(fixtures.inputPngWithTransparency16bit, {
        tile: true,
        gravity: 'northwest'
      })
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(98, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  describe('Overlay with cutout enabled and gravity', function() {
    Object.keys(sharp.gravity).forEach(function(gravity) {
      it(gravity, function(done) {
        var expected = fixtures.expected('overlay-cutout-gravity-' + gravity + '.jpg');
        sharp(fixtures.inputJpg)
          .resize(80)
          .overlayWith(fixtures.inputPngWithTransparency16bit, {
            cutout: true,
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

  it('With cutout enabled and image rotated 90 degrees', function(done) {
    var expected = fixtures.expected('overlay-cutout-rotated90.jpg');
    sharp(fixtures.inputJpg)
      .rotate(90)
      .resize(80)
      .overlayWith(fixtures.inputPngWithTransparency16bit, {
        cutout: true
      })
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(98, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('With cutout enabled and image rotated 90 degrees and gravity northwest', function(done) {
    var expected = fixtures.expected('overlay-cutout-rotated90-gravity-northwest.jpg');
    sharp(fixtures.inputJpg)
      .rotate(90)
      .resize(80)
      .overlayWith(fixtures.inputPngWithTransparency16bit, {
        cutout: true,
        gravity: 'northwest'
      })
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(98, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('Composite RGBA raw buffer onto JPEG', function(done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .raw()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        sharp(fixtures.inputJpg)
          .resize(2048, 1536)
          .overlayWith(data, { raw: info })
          .toBuffer(function(err, data) {
            if (err) throw err;
            fixtures.assertSimilar(fixtures.expected('overlay-jpeg-with-rgb.jpg'), data, done);
          });
      });
  });

  it('Throws an error when called with an invalid file', function(done) {
    sharp(fixtures.inputJpg)
      .overlayWith('notfound.png')
      .toBuffer(function(err) {
        assert(err instanceof Error);
        done();
      });
  });

});
