/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs/promises');
const path = require('node:path');
const { suite, test } = require('node:test');

const extractZip = require('extract-zip');

const sharp = require('../../');
const fixtures = require('../fixtures');

async function countDeepZoomAssertions(directory) {
  const dirents = await fs.readdir(directory, { withFileTypes: true });
  const levels = dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
  let tileCount = 0;
  for (const level of levels) {
    const tiles = await fs.readdir(path.join(directory, level));
    tileCount += tiles.length;
  }
  return 1 + levels.length + (tileCount * 8);
}

async function assertDeepZoomTiles(t, directory, expectedSize, expectedLevels) {
  const dirents = await fs.readdir(directory, { withFileTypes: true });
  const levels = dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
  t.assert.strictEqual(expectedLevels, levels.length);

  const tiles = [];
  for (const level of levels) {
    t.assert.ok(/^[0-9]+$/.test(level));
    const tileFiles = await fs.readdir(path.join(directory, level));
    for (const tile of tileFiles) {
      t.assert.ok(/^[0-9]+_[0-9]+\.jpeg$/.test(tile));
      tiles.push(path.join(directory, level, tile));
    }
  }

  await Promise.all(tiles.map(async (tile) => {
    const metadata = await sharp(tile).metadata();
    t.assert.strictEqual('jpeg', metadata.format);
    t.assert.strictEqual('srgb', metadata.space);
    t.assert.strictEqual(3, metadata.channels);
    t.assert.strictEqual(false, metadata.hasProfile);
    t.assert.strictEqual(false, metadata.hasAlpha);
    t.assert.ok(metadata.width <= expectedSize);
    t.assert.ok(metadata.height <= expectedSize);
  }));
}

async function countZoomifyAssertions(directory) {
  const tiles = await fs.readdir(path.join(directory, 'TileGroup0'));
  return 3 + tiles.length;
}

async function assertZoomifyTiles(t, directory, expectedLevels) {
  const stat = await fs.stat(path.join(directory, 'ImageProperties.xml'));
  t.assert.ok(stat.isFile());
  t.assert.ok(stat.size > 0);

  let maxTileLevel = -1;
  const tiles = await fs.readdir(path.join(directory, 'TileGroup0'));
  tiles.forEach((tile) => {
    t.assert.ok(/^[0-9]+-[0-9]+-[0-9]+\.jpg$/.test(tile));
    const level = Number(tile.split('-')[0]);
    maxTileLevel = Math.max(maxTileLevel, level);
  });

  t.assert.strictEqual(maxTileLevel + 1, expectedLevels);
}

async function assertGoogleTiles(t, directory, expectedLevels, extension = 'jpg') {
  const dirents = await fs.readdir(directory, { withFileTypes: true });
  const levels = dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
  t.assert.strictEqual(expectedLevels, levels.length);

  const blankStat = await fs.stat(path.join(directory, 'blank.png'));
  t.assert.ok(blankStat.isFile());
  t.assert.ok(blankStat.size > 0);

  const firstTileStat = await fs.stat(path.join(directory, '0', '0', `0.${extension}`));
  t.assert.ok(firstTileStat.isFile());
  t.assert.ok(firstTileStat.size > 0);

  const lastTileStat = await fs.stat(path.join(directory, (expectedLevels - 1).toString(), '0', `0.${extension}`));
  t.assert.ok(lastTileStat.isFile());
  t.assert.ok(lastTileStat.size > 0);
}

async function assertTileOverlap(t, directory, tileSize) {
  const dirents = await fs.readdir(directory, { withFileTypes: true });
  const levels = dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name).sort((a, b) => a - b);
  const highestLevel = levels[levels.length - 1];
  const tiles = await fs.readdir(path.join(directory, highestLevel));
  tiles.sort();
  const squareTile = path.join(directory, highestLevel, tiles[Math.floor(tiles.length / 2)]);

  const metadata = await sharp(squareTile).metadata();
  t.assert.ok(metadata.width > tileSize);
  t.assert.ok(metadata.height > tileSize);
}

suite('Tile', () => {
  test('Valid size values pass', (t) => {
    t.plan(2);
    [1, 8192].forEach((size) => {
      t.assert.doesNotThrow(() => {
        sharp().tile({
          size
        });
      });
    });
  });

  test('Invalid size values fail', (t) => {
    t.plan(5);
    ['zoinks', 1.1, -1, 0, 8193].forEach((size) => {
      t.assert.throws(() => {
        sharp().tile({
          size
        });
      });
    });
  });

  test('Valid overlap values pass', (t) => {
    t.plan(2);
    [0, 8192].forEach((overlap) => {
      t.assert.doesNotThrow(() => {
        sharp().tile({
          size: 8192,
          overlap
        });
      });
    });
  });

  test('Invalid overlap values fail', (t) => {
    t.plan(4);
    ['zoinks', 1.1, -1, 8193].forEach((overlap) => {
      t.assert.throws(() => {
        sharp().tile({
          overlap
        });
      });
    });
  });

  test('Valid container values pass', (t) => {
    t.plan(2);
    ['fs', 'zip'].forEach((container) => {
      t.assert.doesNotThrow(() => {
        sharp().tile({
          container
        });
      });
    });
  });

  test('Invalid container values fail', (t) => {
    t.plan(2);
    ['zoinks', 1].forEach((container) => {
      t.assert.throws(() => {
        sharp().tile({
          container
        });
      });
    });
  });

  test('Valid layout values pass', (t) => {
    t.plan(3);
    ['dz', 'google', 'zoomify'].forEach((layout) => {
      t.assert.doesNotThrow(() => {
        sharp().tile({
          layout
        });
      });
    });
  });

  test('Invalid layout values fail', (t) => {
    t.plan(2);
    ['zoinks', 1].forEach((layout) => {
      t.assert.throws(() => {
        sharp().tile({
          layout
        });
      });
    });
  });

  test('Valid formats pass', (t) => {
    t.plan(3);
    ['jpeg', 'png', 'webp'].forEach((format) => {
      t.assert.doesNotThrow(() => {
        sharp().toFormat(format).tile();
      });
    });
  });

  test('Invalid formats fail', (t) => {
    t.plan(2);
    ['tiff', 'raw'].forEach((format) => {
      t.assert.throws(() => {
        sharp().toFormat(format).tile();
      });
    });
  });

  test('Valid depths pass', (t) => {
    t.plan(3);
    ['onepixel', 'onetile', 'one'].forEach((depth) => {
      t.assert.doesNotThrow(() => sharp().tile({ depth }));
    });
  });

  test('Invalid depths fail', (t) => {
    t.plan(2);
    ['depth', 1].forEach((depth) => {
      t.assert.throws(
        () => sharp().tile({ depth }),
        /Expected one of: onepixel, onetile, one for depth but received/
      );
    });
  });

  test('Prevent larger overlap than default size', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tile({
        overlap: 257
      });
    });
  });

  test('Prevent larger overlap than provided size', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tile({
        size: 512,
        overlap: 513
      });
    });
  });

  test('Valid rotation angle values pass', (t) => {
    t.plan(3);
    [90, 270, -90].forEach((angle) => {
      t.assert.doesNotThrow(() => {
        sharp().tile({
          angle
        });
      });
    });
  });

  test('Invalid rotation angle values fail', (t) => {
    t.plan(4);
    ['zoinks', 1.1, -1, 27].forEach((angle) => {
      t.assert.throws(() => {
        sharp().tile({
          angle
        });
      });
    });
  });

  test('Valid skipBlanks threshold values pass', (t) => {
    t.plan(4);
    [-1, 0, 255, 65535].forEach((skipBlanksThreshold) => {
      t.assert.doesNotThrow(() => {
        sharp().tile({
          skipBlanks: skipBlanksThreshold
        });
      });
    });
  });

  test('InvalidskipBlanks threshold values fail', (t) => {
    t.plan(3);
    ['zoinks', -2, 65536].forEach((skipBlanksThreshold) => {
      t.assert.throws(() => {
        sharp().tile({
          skipBlanks: skipBlanksThreshold
        });
      });
    });
  });

  test('Valid center parameter value passes', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(
      () => sharp().tile({ center: true })
    );
  });

  test('Invalid centre parameter value fails', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().tile({ centre: 'true' }),
      /Expected boolean for tileCentre but received true of type string/
    );
  });

  test('Valid id parameter value passes', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tile({
        id: 'test'
      });
    });
  });

  test('Invalid id parameter value fails', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tile({
        id: true
      });
    });
  });

  test('Valid basename parameter value passes', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(
      () => sharp().tile({ basename: 'pass' })
    );
  });

  test('Invalid basename parameter value fails', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().tile({ basename: true }),
      /Expected string for basename but received/
    );
  });

  if (sharp.format.dz.output.file) {
    test('Deep Zoom layout', async (t) => {
      const directory = fixtures.path('output.dzi_files');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .toFile(fixtures.path('output.dzi'));
      t.plan(5 + await countDeepZoomAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual('undefined', typeof info.size);
      await assertDeepZoomTiles(t, directory, 256, 13);
    });

    test('Deep Zoom layout with custom size+overlap', async (t) => {
      const directory = fixtures.path('output.512.dzi_files');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          size: 512,
          overlap: 16
        })
        .toFile(fixtures.path('output.512.dzi'));
      t.plan(7 + await countDeepZoomAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual('undefined', typeof info.size);
      await assertDeepZoomTiles(t, directory, 512 + (2 * 16), 13);
      await assertTileOverlap(t, directory, 512);
    });

    test('Deep Zoom layout with custom size+angle', async (t) => {
      const directory = fixtures.path('output.512_90.dzi_files');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          size: 512,
          angle: 90
        })
        .toFile(fixtures.path('output.512_90.dzi'));
      t.plan(7 + await countDeepZoomAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual('undefined', typeof info.size);
      await assertDeepZoomTiles(t, directory, 512, 13);

      const tile = path.join(directory, '10', '0_1.jpeg');
      const metadata = await sharp(tile).metadata();
      t.assert.strictEqual(true, metadata.width === 512);
      t.assert.strictEqual(true, metadata.height === 170);
    });

    test('Deep Zoom layout with depth of one', async (t) => {
      const directory = fixtures.path('output.512_depth_one.dzi_files');
      await fs.rm(directory, { recursive: true, force: true });
      await sharp(fixtures.inputJpg)
        .tile({
          size: 512,
          depth: 'one'
        })
        .toFile(fixtures.path('output.512_depth_one.dzi'));
      t.plan(await countDeepZoomAssertions(directory));
      await assertDeepZoomTiles(t, directory, 512, 1);
    });

    test('Deep Zoom layout with depth of onepixel', async (t) => {
      const directory = fixtures.path('output.512_depth_onepixel.dzi_files');
      await fs.rm(directory, { recursive: true, force: true });
      await sharp(fixtures.inputJpg)
        .tile({
          size: 512,
          depth: 'onepixel'
        })
        .toFile(fixtures.path('output.512_depth_onepixel.dzi'));
      t.plan(await countDeepZoomAssertions(directory));
      await assertDeepZoomTiles(t, directory, 512, 13);
    });

    test('Deep Zoom layout with depth of onetile', async (t) => {
      const directory = fixtures.path('output.256_depth_onetile.dzi_files');
      await fs.rm(directory, { recursive: true, force: true });
      await sharp(fixtures.inputJpg)
        .tile({
          size: 256,
          depth: 'onetile'
        })
        .toFile(fixtures.path('output.256_depth_onetile.dzi'));
      t.plan(await countDeepZoomAssertions(directory));
      await assertDeepZoomTiles(t, directory, 256, 5);
    });

    test('Deep Zoom layout with skipBlanks', async (t) => {
      const directory = fixtures.path('output.256_skip_blanks.dzi_files');
      await fs.rm(directory, { recursive: true, force: true });
      await sharp(fixtures.inputJpgOverlayLayer2)
        .tile({
          size: 256,
          skipBlanks: 0
        })
        .toFile(fixtures.path('output.256_skip_blanks.dzi'));
      t.plan(1 + await countDeepZoomAssertions(directory));
      const whiteTilePath = path.join(directory, '11', '0_0.jpeg');
      t.assert.rejects(async () => fs.access(whiteTilePath), 'Tile should not exist');
      await assertDeepZoomTiles(t, directory, 256, 12);
    });

    test('Zoomify layout', async (t) => {
      const directory = fixtures.path('output.zoomify.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          layout: 'zoomify'
        })
        .toFile(fixtures.path('output.zoomify.dzi'));
      t.plan(5 + await countZoomifyAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertZoomifyTiles(t, directory, 5);
    });

    test('Zoomify layout with depth one', async (t) => {
      const directory = fixtures.path('output.zoomify.depth_one.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          size: 256,
          layout: 'zoomify',
          depth: 'one'
        })
        .toFile(directory);
      t.plan(5 + await countZoomifyAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertZoomifyTiles(t, directory, 1);
    });

    test('Zoomify layout with depth onetile', async (t) => {
      const directory = fixtures.path('output.zoomify.depth_onetile.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          size: 256,
          layout: 'zoomify',
          depth: 'onetile'
        })
        .toFile(directory);
      t.plan(5 + await countZoomifyAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertZoomifyTiles(t, directory, 5);
    });

    test('Zoomify layout with depth onepixel', async (t) => {
      const directory = fixtures.path('output.zoomify.depth_onepixel.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          size: 256,
          layout: 'zoomify',
          depth: 'onepixel'
        })
        .toFile(directory);
      t.plan(5 + await countZoomifyAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertZoomifyTiles(t, directory, 13);
    });

    test('Zoomify layout with skip blanks', async (t) => {
      const directory = fixtures.path('output.zoomify.skipBlanks.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpgOverlayLayer2)
        .tile({
          size: 256,
          layout: 'zoomify',
          skipBlanks: 0
        })
        .toFile(directory);
      t.plan(6 + await countZoomifyAssertions(directory));
      const whiteTilePath = path.join(directory, 'TileGroup0', '2-0-0.jpg');
      t.assert.rejects(async () => fs.access(whiteTilePath), 'Tile should not exist');
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2048, info.width);
      t.assert.strictEqual(1536, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertZoomifyTiles(t, directory, 4);
    });

    test('Google layout', async (t) => {
      t.plan(12);
      const directory = fixtures.path('output.google.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          layout: 'google'
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertGoogleTiles(t, directory, 5);
    });

    test('Google layout with jpeg format', async (t) => {
      t.plan(20);
      const directory = fixtures.path('output.jpg.google.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .jpeg({
          quality: 1
        })
        .tile({
          layout: 'google'
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertGoogleTiles(t, directory, 5, 'jpg');
      const sample = path.join(directory, '0', '0', '0.jpg');
      const metadata = await sharp(sample).metadata();
      t.assert.strictEqual('jpeg', metadata.format);
      t.assert.strictEqual('srgb', metadata.space);
      t.assert.strictEqual(3, metadata.channels);
      t.assert.strictEqual(false, metadata.hasProfile);
      t.assert.strictEqual(false, metadata.hasAlpha);
      t.assert.strictEqual(256, metadata.width);
      t.assert.strictEqual(256, metadata.height);
      const stat = await fs.stat(sample);
      t.assert.ok(stat.size < 2000);
    });

    test('Google layout with png format', async (t) => {
      t.plan(20);
      const directory = fixtures.path('output.png.google.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .png({
          compressionLevel: 0
        })
        .tile({
          layout: 'google'
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertGoogleTiles(t, directory, 5, 'png');
      const sample = path.join(directory, '0', '0', '0.png');
      const metadata = await sharp(sample).metadata();
      t.assert.strictEqual('png', metadata.format);
      t.assert.strictEqual('srgb', metadata.space);
      t.assert.strictEqual(3, metadata.channels);
      t.assert.strictEqual(false, metadata.hasProfile);
      t.assert.strictEqual(false, metadata.hasAlpha);
      t.assert.strictEqual(256, metadata.width);
      t.assert.strictEqual(256, metadata.height);
      const stat = await fs.stat(sample);
      t.assert.ok(stat.size > 44000);
    });

    test('Google layout with webp format', async (t) => {
      t.plan(20);
      const directory = fixtures.path('output.webp.google.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .webp({
          quality: 1,
          effort: 0
        })
        .tile({
          layout: 'google'
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertGoogleTiles(t, directory, 5, 'webp');
      const sample = path.join(directory, '0', '0', '0.webp');
      const metadata = await sharp(sample).metadata();
      t.assert.strictEqual('webp', metadata.format);
      t.assert.strictEqual('srgb', metadata.space);
      t.assert.strictEqual(3, metadata.channels);
      t.assert.strictEqual(false, metadata.hasProfile);
      t.assert.strictEqual(false, metadata.hasAlpha);
      t.assert.strictEqual(256, metadata.width);
      t.assert.strictEqual(256, metadata.height);
      const stat = await fs.stat(sample);
      t.assert.ok(stat.size < 2000);
    });

    test('Google layout with depth one', async (t) => {
      t.plan(12);
      const directory = fixtures.path('output.google_depth_one.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          layout: 'google',
          depth: 'one',
          size: 256
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertGoogleTiles(t, directory, 1);
    });

    test('Google layout with depth onetile', async (t) => {
      t.plan(12);
      const directory = fixtures.path('output.google_depth_onetile.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          layout: 'google',
          depth: 'onetile',
          size: 256
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertGoogleTiles(t, directory, 5);
    });

    test('Google layout with default skip Blanks', async (t) => {
      t.plan(13);
      const directory = fixtures.path('output.google_depth_skipBlanks.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputPng)
        .tile({
          layout: 'google',
          size: 256
        })
        .toFile(directory);
      const whiteTilePath = path.join(directory, '4', '8', '0.jpg');
      t.assert.rejects(async () => fs.access(whiteTilePath), 'Tile should not exist');
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2809, info.width);
      t.assert.strictEqual(2074, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await assertGoogleTiles(t, directory, 5);
    });

    test('Google layout with center image in tile', async (t) => {
      t.plan(6);
      const directory = fixtures.path('output.google_center.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          center: true,
          layout: 'google'
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await t.assert.doesNotReject(async () => {
        const actual = await fs.readFile(path.join(directory, '0', '0', '0.jpg'));
        return fixtures.assertSimilar(fixtures.expected('tile_centered.jpg'), actual);
      });
    });

    test('Google layout with center image in tile centre', async (t) => {
      t.plan(6);
      const directory = fixtures.path('output.google_center.dzi');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          centre: true,
          layout: 'google'
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      await t.assert.doesNotReject(async () => {
        const actual = await fs.readFile(path.join(directory, '0', '0', '0.jpg'));
        return fixtures.assertSimilar(fixtures.expected('tile_centered.jpg'), actual);
      });
    });

    test('IIIFv2 layout', async (t) => {
      t.plan(9);
      const name = 'output.iiif.info';
      const directory = fixtures.path(name);
      await fs.rm(directory, { recursive: true, force: true });
      const id = 'https://sharp.test.com/iiif';
      const info = await sharp(fixtures.inputJpg)
        .tile({
          layout: 'iiif',
          id
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      const infoJson = require(path.join(directory, 'info.json'));
      t.assert.strictEqual('http://iiif.io/api/image/2/context.json', infoJson['@context']);
      t.assert.strictEqual(`${id}/${name}`, infoJson['@id']);
      const stat = await fs.stat(path.join(directory, '0,0,256,256', '256,', '0', 'default.jpg'));
      t.assert.ok(stat.isFile());
      t.assert.ok(stat.size > 0);
    });

    test('IIIFv3 layout', async (t) => {
      t.plan(10);
      const name = 'output.iiif3.info';
      const directory = fixtures.path(name);
      await fs.rm(directory, { recursive: true, force: true });
      const id = 'https://sharp.test.com/iiif3';
      const info = await sharp(fixtures.inputJpg)
        .tile({
          layout: 'iiif3',
          id
        })
        .toFile(directory);
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(undefined, info.size);
      const infoJson = require(path.join(directory, 'info.json'));
      t.assert.strictEqual('http://iiif.io/api/image/3/context.json', infoJson['@context']);
      t.assert.strictEqual('ImageService3', infoJson.type);
      t.assert.strictEqual(`${id}/${name}`, infoJson.id);
      const stat = await fs.stat(path.join(directory, '0,0,256,256', '256,256', '0', 'default.jpg'));
      t.assert.ok(stat.isFile());
      t.assert.ok(stat.size > 0);
    });

    test('Write to ZIP container using file extension', async (t) => {
      const container = fixtures.path('output.dz.container.zip');
      const extractTo = fixtures.path('output.dz.container');
      const directory = path.join(extractTo, 'output.dz.container_files');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .toFile(container);
      await extractZip(container, { dir: extractTo });
      t.plan(7 + await countDeepZoomAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual('number', typeof info.size);
      const stat = await fs.stat(container);
      t.assert.ok(stat.isFile());
      t.assert.ok(stat.size > 0);
      await assertDeepZoomTiles(t, directory, 256, 13);
    });

    test('Write to ZIP container using container tile option', async (t) => {
      const container = fixtures.path('output.dz.containeropt.zip');
      const extractTo = fixtures.path('output.dz.containeropt');
      const directory = path.join(extractTo, 'output.dz.containeropt_files');
      await fs.rm(directory, { recursive: true, force: true });
      const info = await sharp(fixtures.inputJpg)
        .tile({
          container: 'zip'
        })
        .toFile(container);
      await extractZip(container, { dir: extractTo });
      t.plan(7 + await countDeepZoomAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual('number', typeof info.size);
      const stat = await fs.stat(container);
      t.assert.ok(stat.isFile());
      t.assert.ok(stat.size > 0);
      await assertDeepZoomTiles(t, directory, 256, 13);
    });

    test('Write ZIP container to Buffer', async (t) => {
      const container = fixtures.path('output.dz.tiles.zip');
      const extractTo = fixtures.path('output.dz.tiles');
      const directory = path.join(extractTo, 'output.dz.tiles_files');
      await fs.rm(directory, { recursive: true, force: true });
      const { data, info } = await sharp(fixtures.inputJpg)
        .tile({ basename: 'output.dz.tiles' })
        .toBuffer({ resolveWithObject: true });
      await fs.writeFile(container, data);
      await extractZip(container, { dir: extractTo });
      t.plan(7 + await countDeepZoomAssertions(directory));
      t.assert.strictEqual('dz', info.format);
      t.assert.strictEqual(2725, info.width);
      t.assert.strictEqual(2225, info.height);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual('number', typeof info.size);
      const stat = await fs.stat(container);
      t.assert.ok(stat.isFile());
      t.assert.ok(stat.size > 0);
      await assertDeepZoomTiles(t, directory, 256, 13);
    });
  }
});