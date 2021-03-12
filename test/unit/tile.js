'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const eachLimit = require('async/eachLimit');
const rimraf = require('rimraf');
const DecompressZip = require('decompress-zip');

const sharp = require('../../');
const fixtures = require('../fixtures');

// Verifies all tiles in a given dz output directory are <= size
const assertDeepZoomTiles = function (directory, expectedSize, expectedLevels, done) {
  // Get levels
  const levels = fs.readdirSync(directory);
  assert.strictEqual(expectedLevels, levels.length);
  // Get tiles
  const tiles = [];
  levels.forEach(function (level) {
    // Verify level directory name
    assert.strictEqual(true, /^[0-9]+$/.test(level));
    fs.readdirSync(path.join(directory, level)).forEach(function (tile) {
      // Verify tile file name
      assert.strictEqual(true, /^[0-9]+_[0-9]+\.jpeg$/.test(tile));
      tiles.push(path.join(directory, level, tile));
    });
  });
  // Verify each tile is <= expectedSize
  eachLimit(tiles, 8, function (tile, done) {
    sharp(tile).metadata(function (err, metadata) {
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

const assertZoomifyTiles = function (directory, expectedTileSize, expectedLevels, done) {
  fs.stat(path.join(directory, 'ImageProperties.xml'), function (err, stat) {
    if (err) throw err;
    assert.ok(stat.isFile());
    assert.ok(stat.size > 0);

    let maxTileLevel = -1;
    fs.readdirSync(path.join(directory, 'TileGroup0')).forEach(function (tile) {
      // Verify tile file name
      assert.ok(/^[0-9]+-[0-9]+-[0-9]+\.jpg$/.test(tile));
      const level = parseInt(tile.split('-')[0]);
      maxTileLevel = Math.max(maxTileLevel, level);
    });

    assert.strictEqual(maxTileLevel + 1, expectedLevels); // add one to account for zero level tile

    done();
  });
};

const assertGoogleTiles = function (directory, expectedTileSize, expectedLevels, done) {
  const levels = fs.readdirSync(directory);
  assert.strictEqual(expectedLevels, levels.length - 1); // subtract one to account for default blank tile

  fs.stat(path.join(directory, 'blank.png'), function (err, stat) {
    if (err) throw err;
    assert.ok(stat.isFile());
    assert.ok(stat.size > 0);

    // Basic check to confirm lowest and highest level tiles exist
    fs.stat(path.join(directory, '0', '0', '0.jpg'), function (err, stat) {
      if (err) throw err;
      assert.strictEqual(true, stat.isFile());
      assert.strictEqual(true, stat.size > 0);

      fs.stat(path.join(directory, (expectedLevels - 1).toString(), '0', '0.jpg'), function (err, stat) {
        if (err) throw err;
        assert.strictEqual(true, stat.isFile());
        assert.strictEqual(true, stat.size > 0);
        done();
      });
    });
  });
};

// Verifies tiles at specified level in a given output directory are > size+overlap
const assertTileOverlap = function (directory, tileSize, done) {
  // Get sorted levels
  const levels = fs.readdirSync(directory).sort((a, b) => a - b);
  // Select the highest tile level
  const highestLevel = levels[levels.length - 1];
  // Get sorted tiles from greatest level
  const tiles = fs.readdirSync(path.join(directory, highestLevel)).sort();
  // Select a tile from the approximate center of the image
  const squareTile = path.join(directory, highestLevel, tiles[Math.floor(tiles.length / 2)]);

  sharp(squareTile).metadata(function (err, metadata) {
    if (err) {
      throw err;
    } else {
      // Tile with an overlap should be larger than original size
      assert.strictEqual(true, metadata.width > tileSize);
      assert.strictEqual(true, metadata.height > tileSize);
      done();
    }
  });
};

describe('Tile', function () {
  it('Valid size values pass', function () {
    [1, 8192].forEach(function (size) {
      assert.doesNotThrow(function () {
        sharp().tile({
          size: size
        });
      });
    });
  });

  it('Invalid size values fail', function () {
    ['zoinks', 1.1, -1, 0, 8193].forEach(function (size) {
      assert.throws(function () {
        sharp().tile({
          size: size
        });
      });
    });
  });

  it('Valid overlap values pass', function () {
    [0, 8192].forEach(function (overlap) {
      assert.doesNotThrow(function () {
        sharp().tile({
          size: 8192,
          overlap: overlap
        });
      });
    });
  });

  it('Invalid overlap values fail', function () {
    ['zoinks', 1.1, -1, 8193].forEach(function (overlap) {
      assert.throws(function () {
        sharp().tile({
          overlap: overlap
        });
      });
    });
  });

  it('Valid container values pass', function () {
    ['fs', 'zip'].forEach(function (container) {
      assert.doesNotThrow(function () {
        sharp().tile({
          container: container
        });
      });
    });
  });

  it('Invalid container values fail', function () {
    ['zoinks', 1].forEach(function (container) {
      assert.throws(function () {
        sharp().tile({
          container: container
        });
      });
    });
  });

  it('Valid layout values pass', function () {
    ['dz', 'google', 'zoomify'].forEach(function (layout) {
      assert.doesNotThrow(function () {
        sharp().tile({
          layout: layout
        });
      });
    });
  });

  it('Invalid layout values fail', function () {
    ['zoinks', 1].forEach(function (layout) {
      assert.throws(function () {
        sharp().tile({
          layout: layout
        });
      });
    });
  });

  it('Valid formats pass', function () {
    ['jpeg', 'png', 'webp'].forEach(function (format) {
      assert.doesNotThrow(function () {
        sharp().toFormat(format).tile();
      });
    });
  });

  it('Invalid formats fail', function () {
    ['tiff', 'raw'].forEach(function (format) {
      assert.throws(function () {
        sharp().toFormat(format).tile();
      });
    });
  });

  it('Valid depths pass', function () {
    ['onepixel', 'onetile', 'one'].forEach(function (depth) {
      assert.doesNotThrow(function (depth) {
        sharp().tile({
          depth: depth
        });
      });
    });
  });

  it('Invalid depths fail', function () {
    ['depth', 1].forEach(function (depth) {
      assert.throws(function () {
        sharp().tile({
          depth: depth
        });
      });
    });
  });

  it('Prevent larger overlap than default size', function () {
    assert.throws(function () {
      sharp().tile({
        overlap: 257
      });
    });
  });

  it('Prevent larger overlap than provided size', function () {
    assert.throws(function () {
      sharp().tile({
        size: 512,
        overlap: 513
      });
    });
  });

  it('Valid rotation angle values pass', function () {
    [90, 270, -90].forEach(function (angle) {
      assert.doesNotThrow(function () {
        sharp().tile({
          angle: angle
        });
      });
    });
  });

  it('Invalid rotation angle values fail', function () {
    ['zoinks', 1.1, -1, 27].forEach(function (angle) {
      assert.throws(function () {
        sharp().tile({
          angle: angle
        });
      });
    });
  });

  it('Valid skipBlanks threshold values pass', function () {
    [-1, 0, 255, 65535].forEach(function (skipBlanksThreshold) {
      assert.doesNotThrow(function () {
        sharp().tile({
          skipBlanks: skipBlanksThreshold
        });
      });
    });
  });

  it('InvalidskipBlanks threshold values fail', function () {
    ['zoinks', -2, 65536].forEach(function (skipBlanksThreshold) {
      assert.throws(function () {
        sharp().tile({
          skipBlanks: skipBlanksThreshold
        });
      });
    });
  });

  it('Invalid center parameter value fail', function () {
    assert.throws(function () {
      sharp().tile({
        centre: 'true'
      });
    });
  });

  it('Valid id parameter value passes', function () {
    assert.doesNotThrow(function () {
      sharp().tile({
        id: 'test'
      });
    });
  });

  it('Invalid id parameter value fails', function () {
    assert.throws(function () {
      sharp().tile({
        id: true
      });
    });
  });

  it('Deep Zoom layout', function (done) {
    const directory = fixtures.path('output.dzi_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .toFile(fixtures.path('output.dzi'), function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('undefined', typeof info.size);
          assertDeepZoomTiles(directory, 256, 13, done);
        });
    });
  });

  it('Deep Zoom layout with custom size+overlap', function (done) {
    const directory = fixtures.path('output.512.dzi_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          size: 512,
          overlap: 16
        })
        .toFile(fixtures.path('output.512.dzi'), function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('undefined', typeof info.size);
          assertDeepZoomTiles(directory, 512 + (2 * 16), 13, function () {
            assertTileOverlap(directory, 512, done);
          });
        });
    });
  });

  it('Deep Zoom layout with custom size+angle', function (done) {
    const directory = fixtures.path('output.512_90.dzi_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          size: 512,
          angle: 90
        })
        .toFile(fixtures.path('output.512_90.dzi'), function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('undefined', typeof info.size);
          assertDeepZoomTiles(directory, 512, 13, done);
          // Verifies tiles in 10th level are rotated
          const tile = path.join(directory, '10', '0_1.jpeg');
          // verify that the width and height correspond to the rotated image
          // expected are w=512 and h=170 for the 0_1.jpeg.
          // if a 0 angle is supplied to the .tile function
          // the expected values are w=170 and h=512 for the 1_0.jpeg
          sharp(tile).metadata(function (err, metadata) {
            if (err) {
              throw err;
            } else {
              assert.strictEqual(true, metadata.width === 512);
              assert.strictEqual(true, metadata.height === 170);
            }
          });
        });
    });
  });

  it('Deep Zoom layout with depth of one', function (done) {
    const directory = fixtures.path('output.512_depth_one.dzi_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          size: 512,
          depth: 'one'
        })
        .toFile(fixtures.path('output.512_depth_one.dzi'), function (err, info) {
          if (err) throw err;
          // Verify only one depth generated
          assertDeepZoomTiles(directory, 512, 1, done);
        });
    });
  });

  it('Deep Zoom layout with depth of onepixel', function (done) {
    const directory = fixtures.path('output.512_depth_onepixel.dzi_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          size: 512,
          depth: 'onepixel'
        })
        .toFile(fixtures.path('output.512_depth_onepixel.dzi'), function (err, info) {
          if (err) throw err;
          // Verify only one depth generated
          assertDeepZoomTiles(directory, 512, 13, done);
        });
    });
  });

  it('Deep Zoom layout with depth of onetile', function (done) {
    const directory = fixtures.path('output.256_depth_onetile.dzi_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          size: 256,
          depth: 'onetile'
        })
        .toFile(fixtures.path('output.256_depth_onetile.dzi'), function (err, info) {
          if (err) throw err;
          // Verify only one depth generated
          assertDeepZoomTiles(directory, 256, 5, done);
        });
    });
  });

  it('Deep Zoom layout with skipBlanks', function (done) {
    const directory = fixtures.path('output.256_skip_blanks.dzi_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpgOverlayLayer2)
        .tile({
          size: 256,
          skipBlanks: 0
        })
        .toFile(fixtures.path('output.256_skip_blanks.dzi'), function (err, info) {
          if (err) throw err;
          // assert them 0_0.jpeg doesn't exist because it's a white tile
          const whiteTilePath = path.join(directory, '11', '0_0.jpeg');
          assert.strictEqual(fs.existsSync(whiteTilePath), false, 'Tile should not exist');
          // Verify only one depth generated
          assertDeepZoomTiles(directory, 256, 12, done);
        });
    });
  });

  it('Zoomify layout', function (done) {
    const directory = fixtures.path('output.zoomify.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          layout: 'zoomify'
        })
        .toFile(fixtures.path('output.zoomify.dzi'), function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          fs.stat(path.join(directory, 'ImageProperties.xml'), function (err, stat) {
            if (err) throw err;
            assert.strictEqual(true, stat.isFile());
            assert.strictEqual(true, stat.size > 0);
            done();
          });
        });
    });
  });

  it('Zoomify layout with depth one', function (done) {
    const directory = fixtures.path('output.zoomify.depth_one.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          size: 256,
          layout: 'zoomify',
          depth: 'one'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          assertZoomifyTiles(directory, 256, 1, done);
        });
    });
  });

  it('Zoomify layout with depth onetile', function (done) {
    const directory = fixtures.path('output.zoomify.depth_onetile.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          size: 256,
          layout: 'zoomify',
          depth: 'onetile'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          assertZoomifyTiles(directory, 256, 5, done);
        });
    });
  });

  it('Zoomify layout with depth onepixel', function (done) {
    const directory = fixtures.path('output.zoomify.depth_onepixel.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          size: 256,
          layout: 'zoomify',
          depth: 'onepixel'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          assertZoomifyTiles(directory, 256, 13, done);
        });
    });
  });

  it('Zoomify layout with skip blanks', function (done) {
    const directory = fixtures.path('output.zoomify.skipBlanks.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpgOverlayLayer2)
        .tile({
          size: 256,
          layout: 'zoomify',
          skipBlanks: 0
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          // assert them 0_0.jpeg doesn't exist because it's a white tile
          const whiteTilePath = path.join(directory, 'TileGroup0', '2-0-0.jpg');
          assert.strictEqual(fs.existsSync(whiteTilePath), false, 'Tile should not exist');
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2048, info.width);
          assert.strictEqual(1536, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          assertZoomifyTiles(directory, 256, 4, done);
        });
    });
  });

  it('Google layout', function (done) {
    const directory = fixtures.path('output.google.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          layout: 'google'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          fs.stat(path.join(directory, '0', '0', '0.jpg'), function (err, stat) {
            if (err) throw err;
            assert.strictEqual(true, stat.isFile());
            assert.strictEqual(true, stat.size > 0);
            done();
          });
        });
    });
  });

  it('Google layout with jpeg format', function (done) {
    const directory = fixtures.path('output.jpg.google.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .jpeg({
          quality: 1
        })
        .tile({
          layout: 'google'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          const sample = path.join(directory, '0', '0', '0.jpg');
          sharp(sample).metadata(function (err, metadata) {
            if (err) throw err;
            assert.strictEqual('jpeg', metadata.format);
            assert.strictEqual('srgb', metadata.space);
            assert.strictEqual(3, metadata.channels);
            assert.strictEqual(false, metadata.hasProfile);
            assert.strictEqual(false, metadata.hasAlpha);
            assert.strictEqual(256, metadata.width);
            assert.strictEqual(256, metadata.height);
            fs.stat(sample, function (err, stat) {
              if (err) throw err;
              assert.strictEqual(true, stat.size < 2000);
              done();
            });
          });
        });
    });
  });

  it('Google layout with png format', function (done) {
    const directory = fixtures.path('output.png.google.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .png({
          compressionLevel: 0
        })
        .tile({
          layout: 'google'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          const sample = path.join(directory, '0', '0', '0.png');
          sharp(sample).metadata(function (err, metadata) {
            if (err) throw err;
            assert.strictEqual('png', metadata.format);
            assert.strictEqual('srgb', metadata.space);
            assert.strictEqual(3, metadata.channels);
            assert.strictEqual(false, metadata.hasProfile);
            assert.strictEqual(false, metadata.hasAlpha);
            assert.strictEqual(256, metadata.width);
            assert.strictEqual(256, metadata.height);
            fs.stat(sample, function (err, stat) {
              if (err) throw err;
              assert.strictEqual(true, stat.size > 44000);
              done();
            });
          });
        });
    });
  });

  it('Google layout with webp format', function (done) {
    const directory = fixtures.path('output.webp.google.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .webp({
          quality: 1,
          reductionEffort: 0
        })
        .tile({
          layout: 'google'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          const sample = path.join(directory, '0', '0', '0.webp');
          sharp(sample).metadata(function (err, metadata) {
            if (err) throw err;
            assert.strictEqual('webp', metadata.format);
            assert.strictEqual('srgb', metadata.space);
            assert.strictEqual(3, metadata.channels);
            assert.strictEqual(false, metadata.hasProfile);
            assert.strictEqual(false, metadata.hasAlpha);
            assert.strictEqual(256, metadata.width);
            assert.strictEqual(256, metadata.height);
            fs.stat(sample, function (err, stat) {
              if (err) throw err;
              assert.strictEqual(true, stat.size < 2000);
              done();
            });
          });
        });
    });
  });

  it('Google layout with depth one', function (done) {
    const directory = fixtures.path('output.google_depth_one.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          layout: 'google',
          depth: 'one',
          size: 256
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);

          assertGoogleTiles(directory, 256, 1, done);
        });
    });
  });

  it('Google layout with depth onepixel', function (done) {
    const directory = fixtures.path('output.google_depth_onepixel.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          layout: 'google',
          depth: 'onepixel',
          size: 256
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);

          assertGoogleTiles(directory, 256, 13, done);
        });
    });
  });

  it('Google layout with depth onetile', function (done) {
    const directory = fixtures.path('output.google_depth_onetile.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          layout: 'google',
          depth: 'onetile',
          size: 256
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);

          assertGoogleTiles(directory, 256, 5, done);
        });
    });
  });

  it('Google layout with default skip Blanks', function (done) {
    const directory = fixtures.path('output.google_depth_skipBlanks.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputPng)
        .tile({
          layout: 'google',
          size: 256
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;

          const whiteTilePath = path.join(directory, '4', '8', '0.jpg');
          assert.strictEqual(fs.existsSync(whiteTilePath), false, 'Tile should not exist');

          assert.strictEqual('dz', info.format);
          assert.strictEqual(2809, info.width);
          assert.strictEqual(2074, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);

          assertGoogleTiles(directory, 256, 5, done);
        });
    });
  });

  it('Google layout with center image in tile', function (done) {
    const directory = fixtures.path('output.google_center.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          center: true,
          layout: 'google'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          fixtures.assertSimilar(fixtures.expected('tile_centered.jpg'), fs.readFileSync(path.join(directory, '0', '0', '0.jpg')), done);
        });
    });
  });

  it('Google layout with center image in tile centre', function (done) {
    const directory = fixtures.path('output.google_center.dzi');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          centre: true,
          layout: 'google'
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          fixtures.assertSimilar(fixtures.expected('tile_centered.jpg'), fs.readFileSync(path.join(directory, '0', '0', '0.jpg')), done);
        });
    });
  });

  it('IIIF layout', function (done) {
    const name = 'output.iiif.info';
    const directory = fixtures.path(name);
    rimraf(directory, function () {
      const id = 'https://sharp.test.com/iiif';
      sharp(fixtures.inputJpg)
        .tile({
          layout: 'iiif',
          id
        })
        .toFile(directory, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          const infoJson = require(path.join(directory, 'info.json'));
          assert.strictEqual(`${id}/${name}`, infoJson['@id']);
          fs.stat(path.join(directory, '0,0,256,256', '256,', '0', 'default.jpg'), function (err, stat) {
            if (err) throw err;
            assert.strictEqual(true, stat.isFile());
            assert.strictEqual(true, stat.size > 0);
            done();
          });
        });
    });
  });

  it('Write to ZIP container using file extension', function (done) {
    const container = fixtures.path('output.dz.container.zip');
    const extractTo = fixtures.path('output.dz.container');
    const directory = path.join(extractTo, 'output.dz.container_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .toFile(container, function (err, info) {
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          fs.stat(container, function (err, stat) {
            if (err) throw err;
            assert.strictEqual(true, stat.isFile());
            assert.strictEqual(true, stat.size > 0);
            new DecompressZip(container)
              .on('extract', function () {
                assertDeepZoomTiles(directory, 256, 13, done);
              })
              .on('error', function (err) {
                throw err;
              })
              .extract({ path: path.dirname(extractTo) });
          });
        });
    });
  });

  it('Write to ZIP container using container tile option', function (done) {
    const container = fixtures.path('output.dz.containeropt.zip');
    const extractTo = fixtures.path('output.dz.containeropt');
    const directory = path.join(extractTo, 'output.dz.containeropt_files');
    rimraf(directory, function () {
      sharp(fixtures.inputJpg)
        .tile({
          container: 'zip'
        })
        .toFile(container, function (err, info) {
          // Vips overrides .dzi extension to .zip used by container var below
          if (err) throw err;
          assert.strictEqual('dz', info.format);
          assert.strictEqual(2725, info.width);
          assert.strictEqual(2225, info.height);
          assert.strictEqual(3, info.channels);
          assert.strictEqual('number', typeof info.size);
          fs.stat(container, function (err, stat) {
            if (err) throw err;
            assert.strictEqual(true, stat.isFile());
            assert.strictEqual(true, stat.size > 0);
            new DecompressZip(container)
              .on('extract', function () {
                assertDeepZoomTiles(directory, 256, 13, done);
              })
              .on('error', function (err) {
                throw err;
              })
              .extract({ path: path.dirname(extractTo) });
          });
        });
    });
  });
});
