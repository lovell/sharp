'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var async = require('async');
var rimraf = require('rimraf');
var unzip = require('unzip');

var sharp = require('../../index');
var fixtures = require('../fixtures');

// Verifies all tiles in a given dz output directory are <= size
var assertDeepZoomTiles = function(directory, expectedSize, expectedLevels, done) {
  // Get levels
  var levels = fs.readdirSync(directory);
  assert.strictEqual(expectedLevels, levels.length);
  // Get tiles
  var tiles = [];
  levels.forEach(function(level) {
    // Verify level directory name
    assert.strictEqual(true, /^[0-9]+$/.test(level));
    fs.readdirSync(path.join(directory, level)).forEach(function(tile) {
      // Verify tile file name
      assert.strictEqual(true, /^[0-9]+_[0-9]+\.jpeg$/.test(tile));
      tiles.push(path.join(directory, level, tile));
    });
  });
  // Verify each tile is <= expectedSize
  async.eachSeries(tiles, function(tile, done) {
    sharp(tile).metadata(function(err, metadata) {
      if (err) {
        done(err);
      } else {
        assert.strictEqual('jpeg', metadata.format);
        assert.strictEqual('srgb', metadata.space);
        assert.strictEqual(3, metadata.channels);
        assert.strictEqual(false, metadata.hasProfile);
        assert.strictEqual(false, metadata.hasAlpha);
        assert.strictEqual(true, metadata.width <= expectedSize);
        assert.strictEqual(true, metadata.height <= expectedSize);
        done();
      }
    });
  }, done);
};

describe('Tile', function() {

  it('Valid size values pass', function() {
    [1, 8192].forEach(function(size) {
      assert.doesNotThrow(function() {
        sharp().tile({
          size: size
        });
      });
    });
  });

  it('Invalid size values fail', function() {
    ['zoinks', 1.1, -1, 0, 8193].forEach(function(size) {
      assert.throws(function() {
        sharp().tile({
          size: size
        });
      });
    });
  });

  it('Valid overlap values pass', function() {
    [0, 8192].forEach(function(overlap) {
      assert.doesNotThrow(function() {
        sharp().tile({
          size: 8192,
          overlap: overlap
        });
      });
    });
  });

  it('Invalid overlap values fail', function() {
    ['zoinks', 1.1, -1, 8193].forEach(function(overlap) {
      assert.throws(function() {
        sharp().tile({
          overlap: overlap
        });
      });
    });
  });

  it('Valid container values pass', function() {
    ['fs', 'zip'].forEach(function(container) {
      assert.doesNotThrow(function() {
        sharp().tile({
          container: container
        });
      });
    });
  });

  it('Invalid container values fail', function() {
    ['zoinks', 1].forEach(function(container) {
      assert.throws(function() {
        sharp().tile({
          container: container
        });
      });
    });
  });

  it('Valid layout values pass', function() {
    ['dz', 'google', 'zoomify'].forEach(function(layout) {
      assert.doesNotThrow(function() {
        sharp().tile({
          layout: layout
        });
      });
    });
  });

  it('Invalid layout values fail', function() {
    ['zoinks', 1].forEach(function(layout) {
      assert.throws(function() {
        sharp().tile({
          layout: layout
        });
      });
    });
  });

  it('Prevent larger overlap than default size', function() {
    assert.throws(function() {
      sharp().tile({overlap: 257});
    });
  });

  it('Prevent larger overlap than provided size', function() {
    assert.throws(function() {
      sharp().tile({size: 512, overlap: 513});
    });
  });

  if (sharp.format.dz.output.file) {

    it('Deep Zoom layout', function(done) {
      var directory = fixtures.path('output.dzi_files');
      rimraf(directory, function() {
        sharp(fixtures.inputJpg)
          .toFile(fixtures.path('output.dzi'), function(err, info) {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assertDeepZoomTiles(directory, 256, 13, done);
          });
      });
    });

    it('Deep Zoom layout with custom size+overlap', function(done) {
      var directory = fixtures.path('output.512.dzi_files');
      rimraf(directory, function() {
        sharp(fixtures.inputJpg)
          .tile({
            size: 512,
            overlap: 16
          })
          .toFile(fixtures.path('output.512.dzi'), function(err, info) {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assertDeepZoomTiles(directory, 512 + 2 * 16, 13, done);
          });
      });
    });

    it('Zoomify layout', function(done) {
      var directory = fixtures.path('output.zoomify.dzi');
      rimraf(directory, function() {
        sharp(fixtures.inputJpg)
          .tile({
            layout: 'zoomify'
          })
          .toFile(fixtures.path('output.zoomify.dzi'), function(err, info) {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            fs.stat(path.join(directory, 'ImageProperties.xml'), function(err, stat) {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              done();
            });
          });
      });
    });

    it('Google layout', function(done) {
      var directory = fixtures.path('output.google.dzi');
      rimraf(directory, function() {
        sharp(fixtures.inputJpg)
          .tile({
            layout: 'google'
          })
          .toFile(directory, function(err, info) {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            fs.stat(path.join(directory, '0', '0', '0.jpg'), function(err, stat) {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              done();
            });
          });
      });
    });

    it('Write to ZIP container using file extension', function(done) {
      var container = fixtures.path('output.dz.container.zip');
      var extractTo = fixtures.path('output.dz.container');
      var directory = path.join(extractTo, 'output.dz.container_files');
      rimraf(directory, function() {
        sharp(fixtures.inputJpg)
          .toFile(container, function(err, info) {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            fs.stat(container, function(err, stat) {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              fs.createReadStream(container)
                .pipe(unzip.Extract({path: path.dirname(extractTo)}))
                .on('error', function(err) { throw err; })
                .on('close', function() {
                  assertDeepZoomTiles(directory, 256, 13, done);
                });
            });
          });
      });
    });

    it('Write to ZIP container using container tile option', function(done) {
      var container = fixtures.path('output.dz.containeropt.zip');
      var extractTo = fixtures.path('output.dz.containeropt');
      var directory = path.join(extractTo, 'output.dz.containeropt_files');
      rimraf(directory, function() {
        sharp(fixtures.inputJpg)
          .tile({
            container: 'zip'
          })
          .toFile(container, function(err, info) {
            // Vips overrides .dzi extension to .zip used by container var below
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            fs.stat(container, function(err, stat) {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              fs.createReadStream(container)
                .pipe(unzip.Extract({path: path.dirname(extractTo)}))
                .on('error', function(err) { throw err; })
                .on('close', function() {
                  assertDeepZoomTiles(directory, 256, 13, done);
                });
            });
          });
      });
    });

  }

});
