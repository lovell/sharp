/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const assert = require('node:assert');

const extractZip = require('extract-zip');

const sharp = require('../../');
const fixtures = require('../fixtures');

// Verifies all tiles in a given dz output directory are <= size
const assertDeepZoomTiles = (directory, expectedSize, expectedLevels, done) => {
  // Get levels
  const dirents = fs.readdirSync(directory, { withFileTypes: true });
  const levels = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
  assert.strictEqual(expectedLevels, levels.length);
  // Get tiles
  const tiles = [];
  levels.forEach((level) => {
    // Verify level directory name
    assert.strictEqual(true, /^[0-9]+$/.test(level));
    fs.readdirSync(path.join(directory, level)).forEach((tile) => {
      // Verify tile file name
      assert.strictEqual(true, /^[0-9]+_[0-9]+\.jpeg$/.test(tile));
      tiles.push(path.join(directory, level, tile));
    });
  });
  // Verify each tile is <= expectedSize
  Promise.all(tiles.map((tile) => sharp(tile)
      .metadata()
      .then((metadata) => {
        assert.strictEqual('jpeg', metadata.format);
        assert.strictEqual('srgb', metadata.space);
        assert.strictEqual(3, metadata.channels);
        assert.strictEqual(false, metadata.hasProfile);
        assert.strictEqual(false, metadata.hasAlpha);
        assert.strictEqual(true, metadata.width <= expectedSize);
        assert.strictEqual(true, metadata.height <= expectedSize);
      })))
    .then(() => done())
    .catch(done);
};

const assertZoomifyTiles = (directory, expectedLevels, done) => {
  fs.stat(path.join(directory, 'ImageProperties.xml'), (err, stat) => {
    if (err) throw err;
    assert.ok(stat.isFile());
    assert.ok(stat.size > 0);

    let maxTileLevel = -1;
    fs.readdirSync(path.join(directory, 'TileGroup0')).forEach((tile) => {
      // Verify tile file name
      assert.ok(/^[0-9]+-[0-9]+-[0-9]+\.jpg$/.test(tile));
      const level = Number(tile.split('-')[0]);
      maxTileLevel = Math.max(maxTileLevel, level);
    });

    assert.strictEqual(maxTileLevel + 1, expectedLevels); // add one to account for zero level tile

    done();
  });
};

const assertGoogleTiles = (directory, expectedLevels, done) => {
  // Get levels
  const dirents = fs.readdirSync(directory, { withFileTypes: true });
  const levels = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
  assert.strictEqual(expectedLevels, levels.length);

  fs.stat(path.join(directory, 'blank.png'), (err, stat) => {
    if (err) throw err;
    assert.ok(stat.isFile());
    assert.ok(stat.size > 0);

    // Basic check to confirm lowest and highest level tiles exist
    fs.stat(path.join(directory, '0', '0', '0.jpg'), (err, stat) => {
      if (err) throw err;
      assert.strictEqual(true, stat.isFile());
      assert.strictEqual(true, stat.size > 0);

      fs.stat(path.join(directory, (expectedLevels - 1).toString(), '0', '0.jpg'), (err, stat) => {
        if (err) throw err;
        assert.strictEqual(true, stat.isFile());
        assert.strictEqual(true, stat.size > 0);
        done();
      });
    });
  });
};

// Verifies tiles at specified level in a given output directory are > size+overlap
const assertTileOverlap = (directory, tileSize, done) => {
  // Get sorted levels
  const dirents = fs.readdirSync(directory, { withFileTypes: true });
  const levels = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name).sort((a, b) => a - b);
  // Select the highest tile level
  const highestLevel = levels[levels.length - 1];
  // Get sorted tiles from greatest level
  const tiles = fs.readdirSync(path.join(directory, highestLevel)).sort();
  // Select a tile from the approximate center of the image
  const squareTile = path.join(directory, highestLevel, tiles[Math.floor(tiles.length / 2)]);

  sharp(squareTile).metadata((err, metadata) => {
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

describe('Tile', () => {
  it('Valid size values pass', () => {
    [1, 8192].forEach((size) => {
      assert.doesNotThrow(() => {
        sharp().tile({
          size
        });
      });
    });
  });

  it('Invalid size values fail', () => {
    ['zoinks', 1.1, -1, 0, 8193].forEach((size) => {
      assert.throws(() => {
        sharp().tile({
          size
        });
      });
    });
  });

  it('Valid overlap values pass', () => {
    [0, 8192].forEach((overlap) => {
      assert.doesNotThrow(() => {
        sharp().tile({
          size: 8192,
          overlap
        });
      });
    });
  });

  it('Invalid overlap values fail', () => {
    ['zoinks', 1.1, -1, 8193].forEach((overlap) => {
      assert.throws(() => {
        sharp().tile({
          overlap
        });
      });
    });
  });

  it('Valid container values pass', () => {
    ['fs', 'zip'].forEach((container) => {
      assert.doesNotThrow(() => {
        sharp().tile({
          container
        });
      });
    });
  });

  it('Invalid container values fail', () => {
    ['zoinks', 1].forEach((container) => {
      assert.throws(() => {
        sharp().tile({
          container
        });
      });
    });
  });

  it('Valid layout values pass', () => {
    ['dz', 'google', 'zoomify'].forEach((layout) => {
      assert.doesNotThrow(() => {
        sharp().tile({
          layout
        });
      });
    });
  });

  it('Invalid layout values fail', () => {
    ['zoinks', 1].forEach((layout) => {
      assert.throws(() => {
        sharp().tile({
          layout
        });
      });
    });
  });

  it('Valid formats pass', () => {
    ['jpeg', 'png', 'webp'].forEach((format) => {
      assert.doesNotThrow(() => {
        sharp().toFormat(format).tile();
      });
    });
  });

  it('Invalid formats fail', () => {
    ['tiff', 'raw'].forEach((format) => {
      assert.throws(() => {
        sharp().toFormat(format).tile();
      });
    });
  });

  it('Valid depths pass', () => {
    ['onepixel', 'onetile', 'one'].forEach((depth) => {
      assert.doesNotThrow(() => sharp().tile({ depth }));
    });
  });

  it('Invalid depths fail', () => {
    ['depth', 1].forEach((depth) => {
      assert.throws(
        () => sharp().tile({ depth }),
        /Expected one of: onepixel, onetile, one for depth but received/
      );
    });
  });

  it('Prevent larger overlap than default size', () => {
    assert.throws(() => {
      sharp().tile({
        overlap: 257
      });
    });
  });

  it('Prevent larger overlap than provided size', () => {
    assert.throws(() => {
      sharp().tile({
        size: 512,
        overlap: 513
      });
    });
  });

  it('Valid rotation angle values pass', () => {
    [90, 270, -90].forEach((angle) => {
      assert.doesNotThrow(() => {
        sharp().tile({
          angle
        });
      });
    });
  });

  it('Invalid rotation angle values fail', () => {
    ['zoinks', 1.1, -1, 27].forEach((angle) => {
      assert.throws(() => {
        sharp().tile({
          angle
        });
      });
    });
  });

  it('Valid skipBlanks threshold values pass', () => {
    [-1, 0, 255, 65535].forEach((skipBlanksThreshold) => {
      assert.doesNotThrow(() => {
        sharp().tile({
          skipBlanks: skipBlanksThreshold
        });
      });
    });
  });

  it('InvalidskipBlanks threshold values fail', () => {
    ['zoinks', -2, 65536].forEach((skipBlanksThreshold) => {
      assert.throws(() => {
        sharp().tile({
          skipBlanks: skipBlanksThreshold
        });
      });
    });
  });

  it('Valid center parameter value passes', () => {
    assert.doesNotThrow(
      () => sharp().tile({ center: true })
    );
  });

  it('Invalid centre parameter value fails', () => {
    assert.throws(
      () => sharp().tile({ centre: 'true' }),
      /Expected boolean for tileCentre but received true of type string/
    );
  });

  it('Valid id parameter value passes', () => {
    assert.doesNotThrow(() => {
      sharp().tile({
        id: 'test'
      });
    });
  });

  it('Invalid id parameter value fails', () => {
    assert.throws(() => {
      sharp().tile({
        id: true
      });
    });
  });

  it('Valid basename parameter value passes', () => {
    assert.doesNotThrow(
      () => sharp().tile({ basename: 'pass' })
    );
  });

  it('Invalid basename parameter value fails', () => {
    assert.throws(
      () => sharp().tile({ basename: true }),
      /Expected string for basename but received/
    );
  });

  if (sharp.format.dz.output.file) {
    it('Deep Zoom layout', (_t, done) => {
      const directory = fixtures.path('output.dzi_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .toFile(fixtures.path('output.dzi'), (err, info) => {
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

    it('Deep Zoom layout with custom size+overlap', (_t, done) => {
      const directory = fixtures.path('output.512.dzi_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            size: 512,
            overlap: 16
          })
          .toFile(fixtures.path('output.512.dzi'), (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual('undefined', typeof info.size);
            assertDeepZoomTiles(directory, 512 + (2 * 16), 13, () => {
              assertTileOverlap(directory, 512, done);
            });
          });
      });
    });

    it('Deep Zoom layout with custom size+angle', (_t, done) => {
      const directory = fixtures.path('output.512_90.dzi_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            size: 512,
            angle: 90
          })
          .toFile(fixtures.path('output.512_90.dzi'), (err, info) => {
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
            sharp(tile).metadata((err, metadata) => {
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

    it('Deep Zoom layout with depth of one', (_t, done) => {
      const directory = fixtures.path('output.512_depth_one.dzi_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            size: 512,
            depth: 'one'
          })
          .toFile(fixtures.path('output.512_depth_one.dzi'), (err) => {
            if (err) throw err;
            // Verify only one depth generated
            assertDeepZoomTiles(directory, 512, 1, done);
          });
      });
    });

    it('Deep Zoom layout with depth of onepixel', (_t, done) => {
      const directory = fixtures.path('output.512_depth_onepixel.dzi_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            size: 512,
            depth: 'onepixel'
          })
          .toFile(fixtures.path('output.512_depth_onepixel.dzi'), (err) => {
            if (err) throw err;
            // Verify only one depth generated
            assertDeepZoomTiles(directory, 512, 13, done);
          });
      });
    });

    it('Deep Zoom layout with depth of onetile', (_t, done) => {
      const directory = fixtures.path('output.256_depth_onetile.dzi_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            size: 256,
            depth: 'onetile'
          })
          .toFile(fixtures.path('output.256_depth_onetile.dzi'), (err) => {
            if (err) throw err;
            // Verify only one depth generated
            assertDeepZoomTiles(directory, 256, 5, done);
          });
      });
    });

    it('Deep Zoom layout with skipBlanks', (_t, done) => {
      const directory = fixtures.path('output.256_skip_blanks.dzi_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpgOverlayLayer2)
          .tile({
            size: 256,
            skipBlanks: 0
          })
          .toFile(fixtures.path('output.256_skip_blanks.dzi'), (err) => {
            if (err) throw err;
            // assert them 0_0.jpeg doesn't exist because it's a white tile
            const whiteTilePath = path.join(directory, '11', '0_0.jpeg');
            assert.strictEqual(fs.existsSync(whiteTilePath), false, 'Tile should not exist');
            // Verify only one depth generated
            assertDeepZoomTiles(directory, 256, 12, done);
          });
      });
    });

    it('Zoomify layout', (_t, done) => {
      const directory = fixtures.path('output.zoomify.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            layout: 'zoomify'
          })
          .toFile(fixtures.path('output.zoomify.dzi'), (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            fs.stat(path.join(directory, 'ImageProperties.xml'), (err, stat) => {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              done();
            });
          });
      });
    });

    it('Zoomify layout with depth one', (_t, done) => {
      const directory = fixtures.path('output.zoomify.depth_one.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            size: 256,
            layout: 'zoomify',
            depth: 'one'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            assertZoomifyTiles(directory, 1, done);
          });
      });
    });

    it('Zoomify layout with depth onetile', (_t, done) => {
      const directory = fixtures.path('output.zoomify.depth_onetile.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            size: 256,
            layout: 'zoomify',
            depth: 'onetile'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            assertZoomifyTiles(directory, 5, done);
          });
      });
    });

    it('Zoomify layout with depth onepixel', (_t, done) => {
      const directory = fixtures.path('output.zoomify.depth_onepixel.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            size: 256,
            layout: 'zoomify',
            depth: 'onepixel'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            assertZoomifyTiles(directory, 13, done);
          });
      });
    });

    it('Zoomify layout with skip blanks', (_t, done) => {
      const directory = fixtures.path('output.zoomify.skipBlanks.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpgOverlayLayer2)
          .tile({
            size: 256,
            layout: 'zoomify',
            skipBlanks: 0
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            // assert them 0_0.jpeg doesn't exist because it's a white tile
            const whiteTilePath = path.join(directory, 'TileGroup0', '2-0-0.jpg');
            assert.strictEqual(fs.existsSync(whiteTilePath), false, 'Tile should not exist');
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2048, info.width);
            assert.strictEqual(1536, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            assertZoomifyTiles(directory, 4, done);
          });
      });
    });

    it('Google layout', (_t, done) => {
      const directory = fixtures.path('output.google.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            layout: 'google'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            fs.stat(path.join(directory, '0', '0', '0.jpg'), (err, stat) => {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              done();
            });
          });
      });
    });

    it('Google layout with jpeg format', (_t, done) => {
      const directory = fixtures.path('output.jpg.google.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .jpeg({
            quality: 1
          })
          .tile({
            layout: 'google'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            const sample = path.join(directory, '0', '0', '0.jpg');
            sharp(sample).metadata((err, metadata) => {
              if (err) throw err;
              assert.strictEqual('jpeg', metadata.format);
              assert.strictEqual('srgb', metadata.space);
              assert.strictEqual(3, metadata.channels);
              assert.strictEqual(false, metadata.hasProfile);
              assert.strictEqual(false, metadata.hasAlpha);
              assert.strictEqual(256, metadata.width);
              assert.strictEqual(256, metadata.height);
              fs.stat(sample, (err, stat) => {
                if (err) throw err;
                assert.strictEqual(true, stat.size < 2000);
                done();
              });
            });
          });
      });
    });

    it('Google layout with png format', (_t, done) => {
      const directory = fixtures.path('output.png.google.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .png({
            compressionLevel: 0
          })
          .tile({
            layout: 'google'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            const sample = path.join(directory, '0', '0', '0.png');
            sharp(sample).metadata((err, metadata) => {
              if (err) throw err;
              assert.strictEqual('png', metadata.format);
              assert.strictEqual('srgb', metadata.space);
              assert.strictEqual(3, metadata.channels);
              assert.strictEqual(false, metadata.hasProfile);
              assert.strictEqual(false, metadata.hasAlpha);
              assert.strictEqual(256, metadata.width);
              assert.strictEqual(256, metadata.height);
              fs.stat(sample, (err, stat) => {
                if (err) throw err;
                assert.strictEqual(true, stat.size > 44000);
                done();
              });
            });
          });
      });
    });

    it('Google layout with webp format', (_t, done) => {
      const directory = fixtures.path('output.webp.google.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .webp({
            quality: 1,
            effort: 0
          })
          .tile({
            layout: 'google'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            const sample = path.join(directory, '0', '0', '0.webp');
            sharp(sample).metadata((err, metadata) => {
              if (err) throw err;
              assert.strictEqual('webp', metadata.format);
              assert.strictEqual('srgb', metadata.space);
              assert.strictEqual(3, metadata.channels);
              assert.strictEqual(false, metadata.hasProfile);
              assert.strictEqual(false, metadata.hasAlpha);
              assert.strictEqual(256, metadata.width);
              assert.strictEqual(256, metadata.height);
              fs.stat(sample, (err, stat) => {
                if (err) throw err;
                assert.strictEqual(true, stat.size < 2000);
                done();
              });
            });
          });
      });
    });

    it('Google layout with depth one', (_t, done) => {
      const directory = fixtures.path('output.google_depth_one.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            layout: 'google',
            depth: 'one',
            size: 256
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            assertGoogleTiles(directory, 1, done);
          });
      });
    });

    it('Google layout with depth onetile', (_t, done) => {
      const directory = fixtures.path('output.google_depth_onetile.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            layout: 'google',
            depth: 'onetile',
            size: 256
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            assertGoogleTiles(directory, 5, done);
          });
      });
    });

    it('Google layout with default skip Blanks', (_t, done) => {
      const directory = fixtures.path('output.google_depth_skipBlanks.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputPng)
          .tile({
            layout: 'google',
            size: 256
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;

            const whiteTilePath = path.join(directory, '4', '8', '0.jpg');
            assert.strictEqual(fs.existsSync(whiteTilePath), false, 'Tile should not exist');

            assert.strictEqual('dz', info.format);
            assert.strictEqual(2809, info.width);
            assert.strictEqual(2074, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            assertGoogleTiles(directory, 5, done);
          });
      });
    });

    it('Google layout with center image in tile', (_t, done) => {
      const directory = fixtures.path('output.google_center.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            center: true,
            layout: 'google'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            fixtures.assertSimilar(fixtures.expected('tile_centered.jpg'), fs.readFileSync(path.join(directory, '0', '0', '0.jpg')), done);
          });
      });
    });

    it('Google layout with center image in tile centre', (_t, done) => {
      const directory = fixtures.path('output.google_center.dzi');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            centre: true,
            layout: 'google'
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            fixtures.assertSimilar(fixtures.expected('tile_centered.jpg'), fs.readFileSync(path.join(directory, '0', '0', '0.jpg')), done);
          });
      });
    });

    it('IIIFv2 layout', (_t, done) => {
      const name = 'output.iiif.info';
      const directory = fixtures.path(name);
      fs.rm(directory, { recursive: true }, () => {
        const id = 'https://sharp.test.com/iiif';
        sharp(fixtures.inputJpg)
          .tile({
            layout: 'iiif',
            id
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            const infoJson = require(path.join(directory, 'info.json'));
            assert.strictEqual('http://iiif.io/api/image/2/context.json', infoJson['@context']);
            assert.strictEqual(`${id}/${name}`, infoJson['@id']);
            fs.stat(path.join(directory, '0,0,256,256', '256,', '0', 'default.jpg'), (err, stat) => {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              done();
            });
          });
      });
    });

    it('IIIFv3 layout', (_t, done) => {
      const name = 'output.iiif3.info';
      const directory = fixtures.path(name);
      fs.rm(directory, { recursive: true }, () => {
        const id = 'https://sharp.test.com/iiif3';
        sharp(fixtures.inputJpg)
          .tile({
            layout: 'iiif3',
            id
          })
          .toFile(directory, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual(undefined, info.size);
            const infoJson = require(path.join(directory, 'info.json'));
            assert.strictEqual('http://iiif.io/api/image/3/context.json', infoJson['@context']);
            assert.strictEqual('ImageService3', infoJson.type);
            assert.strictEqual(`${id}/${name}`, infoJson.id);
            fs.stat(path.join(directory, '0,0,256,256', '256,256', '0', 'default.jpg'), (err, stat) => {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              done();
            });
          });
      });
    });

    it('Write to ZIP container using file extension', (_t, done) => {
      const container = fixtures.path('output.dz.container.zip');
      const extractTo = fixtures.path('output.dz.container');
      const directory = path.join(extractTo, 'output.dz.container_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .toFile(container, (err, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual('number', typeof info.size);
            fs.stat(container, (err, stat) => {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              extractZip(container, { dir: extractTo })
                .then(() => {
                  assertDeepZoomTiles(directory, 256, 13, done);
                })
                .catch(_t, done);
            });
          });
      });
    });

    it('Write to ZIP container using container tile option', (_t, done) => {
      const container = fixtures.path('output.dz.containeropt.zip');
      const extractTo = fixtures.path('output.dz.containeropt');
      const directory = path.join(extractTo, 'output.dz.containeropt_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({
            container: 'zip'
          })
          .toFile(container, (err, info) => {
            // Vips overrides .dzi extension to .zip used by container var below
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual('number', typeof info.size);
            fs.stat(container, (err, stat) => {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              extractZip(container, { dir: extractTo })
                .then(() => {
                  assertDeepZoomTiles(directory, 256, 13, done);
                })
                .catch(_t, done);
            });
          });
      });
    });

    it('Write ZIP container to Buffer', (_t, done) => {
      const container = fixtures.path('output.dz.tiles.zip');
      const extractTo = fixtures.path('output.dz.tiles');
      const directory = path.join(extractTo, 'output.dz.tiles_files');
      fs.rm(directory, { recursive: true }, () => {
        sharp(fixtures.inputJpg)
          .tile({ basename: 'output.dz.tiles' })
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual('dz', info.format);
            assert.strictEqual(2725, info.width);
            assert.strictEqual(2225, info.height);
            assert.strictEqual(3, info.channels);
            assert.strictEqual('number', typeof info.size);
            fs.writeFileSync(container, data);
            fs.stat(container, (err, stat) => {
              if (err) throw err;
              assert.strictEqual(true, stat.isFile());
              assert.strictEqual(true, stat.size > 0);
              extractZip(container, { dir: extractTo })
                .then(() => {
                  assertDeepZoomTiles(directory, 256, 13, done);
                })
                .catch(_t, done);
            });
          });
      });
    });
  }
});
