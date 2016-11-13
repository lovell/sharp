'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const eachLimit = require('async/eachLimit');
const rimraf = require('rimraf');
const unzip = require('unzip');

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

  it('Prevent larger overlap than default size', function () {
    assert.throws(function () {
      sharp().tile({overlap: 257});
    });
  });

  it('Prevent larger overlap than provided size', function () {
    assert.throws(function () {
      sharp().tile({size: 512, overlap: 513});
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
          assertDeepZoomTiles(directory, 512 + 2 * 16, 13, done);
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
        .jpeg({ quality: 1 })
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
        .png({ compressionLevel: 1 })
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
        .webp({ quality: 1 })
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
            fs.createReadStream(container)
              .pipe(unzip.Extract({path: path.dirname(extractTo)}))
              .on('error', function (err) { throw err; })
              .on('close', function () {
                assertDeepZoomTiles(directory, 256, 13, done);
              });
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
            fs.createReadStream(container)
              .pipe(unzip.Extract({path: path.dirname(extractTo)}))
              .on('error', function (err) { throw err; })
              .on('close', function () {
                assertDeepZoomTiles(directory, 256, 13, done);
              });
          });
        });
    });
  });
});
