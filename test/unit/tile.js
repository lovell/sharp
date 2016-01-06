'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var async = require('async');
var rimraf = require('rimraf');

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

  describe('Invalid tile values', function() {
    it('size - NaN', function(done) {
      var isValid = true;
      try {
        sharp().tile('zoinks');
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('size - float', function(done) {
      var isValid = true;
      try {
        sharp().tile(1.1);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('size - negative', function(done) {
      var isValid = true;
      try {
        sharp().tile(-1);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('size - zero', function(done) {
      var isValid = true;
      try {
        sharp().tile(0);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('size - too large', function(done) {
      var isValid = true;
      try {
        sharp().tile(8193);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('overlap - NaN', function(done) {
      var isValid = true;
      try {
        sharp().tile(null, 'zoinks');
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('overlap - float', function(done) {
      var isValid = true;
      try {
        sharp().tile(null, 1.1);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('overlap - negative', function(done) {
      var isValid = true;
      try {
        sharp().tile(null, -1);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('overlap - too large', function(done) {
      var isValid = true;
      try {
        sharp().tile(null, 8193);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('overlap - larger than default size', function(done) {
      var isValid = true;
      try {
        sharp().tile(null, 257);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

    it('overlap - larger than provided size', function(done) {
      var isValid = true;
      try {
        sharp().tile(512, 513);
      } catch (err) {
        isValid = false;
      }
      assert.strictEqual(false, isValid);
      done();
    });

  });

  if (sharp.format.dz.output.file) {
    describe('Deep Zoom output', function() {

      it('Tile size - 256px default', function(done) {
        var directory = fixtures.path('output.256_files');
        rimraf(directory, function() {
          sharp(fixtures.inputJpg).toFile(fixtures.path('output.256.dzi'), function(err, info) {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assertDeepZoomTiles(directory, 256, 13, done);
          });
        });
      });

      it('Tile size/overlap - 512/16px', function(done) {
        var directory = fixtures.path('output.512_files');
        rimraf(directory, function() {
          sharp(fixtures.inputJpg).tile(512, 16).toFile(fixtures.path('output.512.dzi'), function(err, info) {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assertDeepZoomTiles(directory, 512 + 2 * 16, 13, done);
          });
        });
      });

    });
  }

});
