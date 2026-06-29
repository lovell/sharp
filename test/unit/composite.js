/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import fixtures from '../fixtures/index.js';
import sharp from '../../lib/index.js';

const red = { r: 255, g: 0, b: 0, alpha: 0.5 };
const green = { r: 0, g: 255, b: 0, alpha: 0.5 };
const blue = { r: 0, g: 0, b: 255, alpha: 0.5 };

const redRect = {
  create: {
    width: 80,
    height: 60,
    channels: 4,
    background: red
  }
};

const greenRect = {
  create: {
    width: 40,
    height: 40,
    channels: 4,
    background: green
  }
};

const blueRect = {
  create: {
    width: 60,
    height: 40,
    channels: 4,
    background: blue
  }
};

const blends = [
  'over',
  'xor',
  'saturate',
  'dest-over'
];

suite('composite', () => {
  blends.forEach(blend => {
    test(`blend ${blend}`, async (t) => {
      t.plan(1);
      const filename = `composite.blend.${blend}.png`;
      const actual = fixtures.path(`output.${filename}`);
      const expected = fixtures.expected(filename);
      await sharp(redRect)
        .composite([{
          input: blueRect,
          blend
        }])
        .toFile(actual);
      await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(actual, expected));
    });
  });

  test('premultiplied true', async (t) => {
    t.plan(1);
    const filename = 'composite.premultiplied.png';
    const below = fixtures.path(`input.below.${filename}`);
    const above = fixtures.path(`input.above.${filename}`);
    const actual = fixtures.path(`output.true.${filename}`);
    const expected = fixtures.expected(`expected.true.${filename}`);
    await sharp(below)
      .composite([{
        input: above,
        blend: 'color-burn',
        top: 0,
        left: 0,
        premultiplied: true
      }])
      .toFile(actual);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(actual, expected));
  });

  test('premultiplied false', async (t) => {
    t.plan(1);
    const filename = 'composite.premultiplied.png';
    const below = fixtures.path(`input.below.${filename}`);
    const above = fixtures.path(`input.above.${filename}`);
    const actual = fixtures.path(`output.false.${filename}`);
    const expected = fixtures.expected(`expected.false.${filename}`);
    await sharp(below)
      .composite([{
        input: above,
        blend: 'color-burn',
        top: 0,
        left: 0,
        premultiplied: false
      }])
      .toFile(actual);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(actual, expected));
  });

  test('premultiplied absent', async (t) => {
    t.plan(1);
    const filename = 'composite.premultiplied.png';
    const below = fixtures.path(`input.below.${filename}`);
    const above = fixtures.path(`input.above.${filename}`);
    const actual = fixtures.path(`output.absent.${filename}`);
    const expected = fixtures.expected(`expected.absent.${filename}`);
    await sharp(below)
      .composite([{
        input: above,
        blend: 'color-burn',
        top: 0,
        left: 0
      }])
      .toFile(actual);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(actual, expected));
  });

  test('scrgb pipeline', async (t) => {
    t.plan(1);
    const filename = 'composite-red-scrgb.png';
    const actual = fixtures.path(`output.${filename}`);
    const expected = fixtures.expected(filename);
    await sharp({
      create: {
        width: 32, height: 32, channels: 4, background: red
      }
    })
      .pipelineColourspace('scrgb')
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        blend: 'color-burn'
      }])
      .toFile(actual);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(actual, expected));
  });

  test('multiple', async (t) => {
    t.plan(1);
    const filename = 'composite-multiple.png';
    const actual = fixtures.path(`output.${filename}`);
    const expected = fixtures.expected(filename);
    await sharp(redRect)
      .composite([{
        input: blueRect,
        gravity: 'northeast'
      }, {
        input: greenRect,
        gravity: 'southwest'
      }])
      .toFile(actual);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(actual, expected));
  });

  test('autoOrient', async (t) => {
    t.plan(1);
    const data = await sharp({
      create: {
        width: 600, height: 600, channels: 4, background: { ...red, alpha: 1 }
      }
    })
      .composite([{
        input: fixtures.inputJpgWithExif,
        autoOrient: true
      }])
      .jpeg()
      .toBuffer();

    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('composite-autoOrient.jpg'), data));
  });

  test('zero offset', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(80)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        top: 0,
        left: 0
      }])
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('overlay-offset-0.jpg'), data));
  });

  test('offset and gravity', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(80)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        gravity: 4
      }])
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('overlay-offset-with-gravity.jpg'), data));
  });

  test('negative offset and gravity', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(400)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: -10,
        top: -10,
        gravity: 4
      }])
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(
      fixtures.expected('overlay-negative-offset-with-gravity.jpg'), data));
  });

  test('offset, gravity and tile', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(80)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        gravity: 4,
        tile: true
      }])
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('overlay-offset-with-gravity-tile.jpg'), data));
  });

  test('offset and tile', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(80)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        tile: true
      }])
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('overlay-offset-with-tile.jpg'), data));
  });

  test('centre gravity should replicate correct number of tiles', async (t) => {
    t.plan(1);
    const red = { r: 255, g: 0, b: 0 };
    const [r, g, b] = await sharp({
      create: {
        width: 40, height: 40, channels: 4, background: red
      }
    })
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        gravity: 'centre',
        tile: true
      }])
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual({ r, g, b }, red);
  });

  test('cutout via dest-in', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(300, 300)
      .composite([{
        input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect x="0" y="0" width="200" height="200" rx="50" ry="50"/></svg>'),
        density: 96,
        blend: 'dest-in',
        cutout: true
      }])
      .png()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(300, info.width);
    t.assert.strictEqual(300, info.height);
    t.assert.strictEqual(4, info.channels);
    if (fixtures.isLittleEndian) {
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('composite-cutout.png'), data));
    }
  });

  suite('numeric gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      test(gravity, async (t) => {
        t.plan(5);
        const { data, info } = await sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            gravity
          }])
          .toBuffer({ resolveWithObject: true });
        t.assert.strictEqual('jpeg', info.format);
        t.assert.strictEqual(80, info.width);
        t.assert.strictEqual(65, info.height);
        t.assert.strictEqual(3, info.channels);
        await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`overlay-gravity-${gravity}.jpg`), data));
      });
    });
  });

  suite('string gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      test(gravity, async (t) => {
        t.plan(5);
        const expected = fixtures.expected(`overlay-gravity-${gravity}.jpg`);
        const { data, info } = await sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            gravity: sharp.gravity[gravity]
          }])
          .toBuffer({ resolveWithObject: true });
        t.assert.strictEqual('jpeg', info.format);
        t.assert.strictEqual(80, info.width);
        t.assert.strictEqual(65, info.height);
        t.assert.strictEqual(3, info.channels);
        await t.assert.doesNotReject(() => fixtures.assertSimilar(expected, data));
      });
    });
  });

  suite('tile and gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      test(gravity, async (t) => {
        t.plan(5);
        const expected = fixtures.expected(`overlay-tile-gravity-${gravity}.jpg`);
        const { data, info } = await sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            tile: true,
            gravity
          }])
          .toBuffer({ resolveWithObject: true });
        t.assert.strictEqual('jpeg', info.format);
        t.assert.strictEqual(80, info.width);
        t.assert.strictEqual(65, info.height);
        t.assert.strictEqual(3, info.channels);
        await t.assert.doesNotReject(() => fixtures.assertSimilar(expected, data));
      });
    });
  });

  suite('validation', () => {
    test('missing images', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite();
      }, /Expected array for images to composite but received undefined of type undefined/);
    });

    test('invalid images', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite(['invalid']);
      }, /Expected object for image to composite but received invalid of type string/);
    });

    test('missing input', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite([{}]);
      }, /Unsupported input/);
    });

    test('invalid blend', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', blend: 'invalid' }]);
      }, /Expected valid blend name for blend but received invalid of type string/);
    });

    test('invalid tile', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', tile: 'invalid' }]);
      }, /Expected boolean for tile but received invalid of type string/);
    });

    test('invalid premultiplied', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', premultiplied: 'invalid' }]);
      }, /Expected boolean for premultiplied but received invalid of type string/);
    });

    test('invalid left', (t) => {
      t.plan(3);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', left: 0.5 }]);
      }, /Expected integer for left but received 0.5 of type number/);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', left: 'invalid' }]);
      }, /Expected integer for left but received invalid of type string/);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', left: 'invalid', top: 10 }]);
      }, /Expected integer for left but received invalid of type string/);
    });

    test('invalid top', (t) => {
      t.plan(3);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', top: 0.5 }]);
      }, /Expected integer for top but received 0.5 of type number/);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', top: 'invalid' }]);
      }, /Expected integer for top but received invalid of type string/);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', top: 'invalid', left: 10 }]);
      }, /Expected integer for top but received invalid of type string/);
    });

    test('left but no top', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', left: 1 }]);
      }, /Expected both left and top to be set/);
    });

    test('top but no left', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', top: 1 }]);
      }, /Expected both left and top to be set/);
    });

    test('invalid gravity', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp().composite([{ input: 'test', gravity: 'invalid' }]);
      }, /Expected valid gravity for gravity but received invalid of type string/);
    });
  });

  test('Allow offset beyond bottom/right edge', async (t) => {
    t.plan(1);
    const red = { r: 255, g: 0, b: 0 };
    const blue = { r: 0, g: 0, b: 255 };

    const [r, g, b] = await sharp({ create: { width: 2, height: 2, channels: 4, background: red } })
      .composite([{
        input: { create: { width: 2, height: 2, channels: 4, background: blue } },
        top: 1,
        left: 1
      }])
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual(red, { r, g, b });
  });

  test('Ensure tiled composition works with resized fit=outside', async (t) => {
    t.plan(2);
    const { info } = await sharp({
      create: {
        width: 41, height: 41, channels: 3, background: 'red'
      }
    })
      .resize({
        width: 10,
        height: 40,
        fit: 'outside'
      })
      .composite([
        {
          input: {
            create: {
              width: 16, height: 16, channels: 3, background: 'green'
            }
          },
          tile: true
        }
      ])
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(info.width, 40);
    t.assert.strictEqual(info.height, 40);
  });

  test('Ensure implicit unpremultiply after resize but before composite', async (t) => {
    t.plan(4);
    const [r, g, b, a] = await sharp({
      create: {
        width: 1, height: 1, channels: 4, background: 'saddlebrown'
      }
    })
      .resize({ width: 8 })
      .composite([{
        input: Buffer.from([255, 255, 255, 128]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in'
      }])
      .raw()
      .toBuffer();

    t.assert.strictEqual(r, 139);
    t.assert.strictEqual(g, 69);
    t.assert.strictEqual(b, 19);
    t.assert.strictEqual(a, 128);
  });

  test('Ensure tiled overlay is fully decoded', async (t) => {
    t.plan(2);
    const tile = await sharp({
      create: {
        width: 8, height: 513, channels: 3, background: 'red'
      }
    })
      .png({ compressionLevel: 0 })
      .toBuffer();

    const { info } = await sharp({
      create: {
        width: 8, height: 514, channels: 3, background: 'green'
      }
    })
      .composite([{
        input: tile,
        tile: true
      }])
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(info.width, 8);
    t.assert.strictEqual(info.height, 514);
  });
});
