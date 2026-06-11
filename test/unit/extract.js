/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Partial image extraction', () => {
  test('JPEG', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .extract({ left: 2, top: 2, width: 20, height: 20 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(20, info.width);
    t.assert.strictEqual(20, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract.jpg'), data));
  });

  test('PNG', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPng)
      .extract({ left: 200, top: 300, width: 400, height: 200 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(400, info.width);
    t.assert.strictEqual(200, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract.png'), data));
  });

  test('WebP', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputWebP)
      .extract({ left: 100, top: 50, width: 125, height: 200 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(125, info.width);
    t.assert.strictEqual(200, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract.webp'), data));
  });

  suite('Animated WebP', () => {
    test('Before resize', async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .extract({ left: 0, top: 30, width: 80, height: 20 })
        .resize(320, 80)
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80 * 9, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gravity-center-height.webp'), data));
    });

    test('After resize', async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(320, 320)
        .extract({ left: 0, top: 120, width: 320, height: 80 })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80 * 9, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gravity-center-height.webp'), data));
    });
  });

  test('TIFF', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputTiff)
      .extract({ left: 34, top: 63, width: 341, height: 529 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(341, info.width);
    t.assert.strictEqual(529, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract.tiff'), data));
  });

  test('Before resize', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .extract({ left: 10, top: 10, width: 10, height: 500 })
      .resize(100, 100)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(100, info.width);
    t.assert.strictEqual(100, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-resize.jpg'), data));
  });

  test('After resize and crop', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(500, 500, {
        position: sharp.gravity.north
      })
      .extract({ left: 10, top: 10, width: 100, height: 100 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(100, info.width);
    t.assert.strictEqual(100, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('resize-crop-extract.jpg'), data));
  });

  test('Before and after resize and crop', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .extract({ left: 0, top: 0, width: 700, height: 700 })
      .resize(500, 500, {
        position: sharp.gravity.north
      })
      .extract({ left: 10, top: 10, width: 100, height: 100 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(100, info.width);
    t.assert.strictEqual(100, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-resize-crop-extract.jpg'), data));
  });

  test('Extract then rotate', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .extract({ left: 20, top: 10, width: 380, height: 280 })
      .rotate(90)
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(280, info.width);
    t.assert.strictEqual(380, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-rotate.jpg'), data));
  });

  test('Rotate then extract', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .rotate(90)
      .extract({ left: 20, top: 10, width: 280, height: 380 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(280, info.width);
    t.assert.strictEqual(380, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('rotate-extract.jpg'), data));
  });

  test('Extract then rotate then extract', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .extract({ left: 20, top: 10, width: 180, height: 280 })
      .rotate(90)
      .extract({ left: 20, top: 10, width: 200, height: 100 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-rotate-extract.jpg'), data));
  });

  test('Extract then rotate non-90 anagle', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .extract({ left: 20, top: 10, width: 380, height: 280 })
      .rotate(45)
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(467, info.width);
    t.assert.strictEqual(467, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-rotate-45.jpg'), data));
  });

  test('Rotate then extract non-90 angle', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .rotate(45)
      .extract({ left: 20, top: 10, width: 380, height: 280 })
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(380, info.width);
    t.assert.strictEqual(280, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('rotate-extract-45.jpg'), data));
  });

  suite('Apply exif orientation and mirroring then extract', () => {
    [
      {
        name: 'EXIF-1',
        image: fixtures.inputJpgWithLandscapeExif1
      },
      {
        name: 'EXIF-2',
        image: fixtures.inputJpgWithLandscapeExif2
      },
      {
        name: 'EXIF-3',
        image: fixtures.inputJpgWithLandscapeExif3
      },
      {
        name: 'EXIF-4',
        image: fixtures.inputJpgWithLandscapeExif4
      },
      {
        name: 'EXIF-5',
        image: fixtures.inputJpgWithLandscapeExif5
      },
      {
        name: 'EXIF-6',
        image: fixtures.inputJpgWithLandscapeExif6
      },
      {
        name: 'EXIF-7',
        image: fixtures.inputJpgWithLandscapeExif7
      },
      {
        name: 'EXIF-8',
        image: fixtures.inputJpgWithLandscapeExif8
      }
    ].forEach(({ name, image }) => {
      test(name, async (t) => {
        t.plan(1);
        const data = await sharp(image)
          .rotate()
          .extract({ left: 0, top: 208, width: 60, height: 40 })
          .toBuffer();
        await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('rotate-mirror-extract.jpg'), data));
      });
    });
  });

  suite('Invalid parameters', () => {
    suite('using the legacy extract(top,left,width,height) syntax', () => {
      test('String top', (t) => {
        t.plan(1);
        t.assert.throws(() => {
          sharp(fixtures.inputJpg).extract('spoons', 10, 10, 10);
        });
      });

      test('Non-integral left', (t) => {
        t.plan(1);
        t.assert.throws(() => {
          sharp(fixtures.inputJpg).extract(10, 10.2, 10, 10);
        });
      });

      test('Negative width - negative', (t) => {
        t.plan(1);
        t.assert.throws(() => {
          sharp(fixtures.inputJpg).extract(10, 10, -10, 10);
        });
      });

      test('Null height', (t) => {
        t.plan(1);
        t.assert.throws(() => {
          sharp(fixtures.inputJpg).extract(10, 10, 10, null);
        });
      });
    });

    test('Undefined', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).extract();
      });
    });

    test('String top', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).extract({ left: 10, top: 'spoons', width: 10, height: 10 });
      });
    });

    test('Non-integral left', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).extract({ left: 10.2, top: 10, width: 10, height: 10 });
      });
    });

    test('Negative width - negative', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).extract({ left: 10, top: 10, width: -10, height: 10 });
      });
    });

    test('Null height', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).extract({ left: 10, top: 10, width: 10, height: null });
      });
    });

    test('Bad image area', async (t) => {
      t.plan(1);
      t.assert.rejects(
        () => sharp(fixtures.inputJpg)
          .extract({ left: 3000, top: 10, width: 10, height: 10 })
          .toBuffer(),
        /bad extract area/);
    });

    test('Multiple extract emits warning', (t) => {
      t.plan(2);
      let warningMessage = '';
      const s = sharp();
      s.on('warning', (msg) => { warningMessage = msg; });
      const options = { top: 0, left: 0, width: 1, height: 1 };
      s.extract(options).extract(options);
      t.assert.strictEqual(warningMessage, '');
      s.extract(options);
      t.assert.strictEqual(warningMessage, 'ignoring previous extract options');
    });

    test('Multiple rotate+extract emits warning', (t) => {
      t.plan(2);
      let warningMessage = '';
      const s = sharp().rotate();
      s.on('warning', (msg) => { warningMessage = msg; });
      const options = { top: 0, left: 0, width: 1, height: 1 };
      s.extract(options).extract(options);
      t.assert.strictEqual(warningMessage, '');
      s.extract(options);
      t.assert.strictEqual(warningMessage, 'ignoring previous extract options');
    });

    test('Multiple extract+resize emits warning', (t) => {
      t.plan(2);
      let warningMessage = '';
      const s = sharp();
      s.on('warning', (msg) => { warningMessage = msg; });
      const options = { top: 0, left: 0, width: 1, height: 1 };
      s.extract(options).extract(options);
      t.assert.strictEqual(warningMessage, '');
      s.resize(1);
      t.assert.strictEqual(warningMessage, 'operation order will be: extract, resize, extract');
    });
  });
});
