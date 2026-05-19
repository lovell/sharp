/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Resize dimensions', () => {
  test('Exact crop', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg).resize(320, 240).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
  });

  test('Fixed width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg).resize(320).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
  });

  test('Fixed height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg).resize(null, 320).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(392, info.width);
    t.assert.strictEqual(320, info.height);
  });

  test('Identity transform', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('Upscale', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg).resize(3000).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3000, info.width);
    t.assert.strictEqual(2450, info.height);
  });

  test('Invalid width - NaN', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize('spoons', 240);
    }, /Expected positive integer for width but received spoons of type string/);
  });

  test('Invalid height - NaN', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize(320, 'spoons');
    }, /Expected positive integer for height but received spoons of type string/);
  });

  test('Invalid width - float', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize(1.5, 240);
    }, /Expected positive integer for width but received 1.5 of type number/);
  });

  test('Invalid height - float', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize(320, 1.5);
    }, /Expected positive integer for height but received 1.5 of type number/);
  });

  test('Invalid width - via options', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize({ width: 1.5, height: 240 });
    }, /Expected positive integer for width but received 1.5 of type number/);
  });

  test('Invalid height - via options', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize({ width: 320, height: 1.5 });
    }, /Expected positive integer for height but received 1.5 of type number/);
  });

  test('Invalid width - too large', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputJpg).resize(0x4000, 1).webp().toBuffer(), /Processed image is too large for the WebP format/);
  });

  test('Invalid height - too large', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputJpg).resize(1, 0x4000).webp().toBuffer(), /Processed image is too large for the WebP format/);
  });

  test('Webp resize then extract large image', async (t) => {
    t.plan(3);
    const { info } = await sharp(fixtures.inputWebP)
      .resize(0x4000, 0x4000)
      .extract({ top: 0x2000, left: 0x2000, width: 256, height: 256 })
      .webp()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('webp', info.format);
    t.assert.strictEqual(256, info.width);
    t.assert.strictEqual(256, info.height);
  });

  test('WebP shrink-on-load rounds to zero, ensure recalculation is correct', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(1080, 607)
      .webp()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('webp', info.format);
    t.assert.strictEqual(1080, info.width);
    t.assert.strictEqual(607, info.height);

    const second = await sharp(data)
      .resize(233, 131)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('webp', second.info.format);
    t.assert.strictEqual(233, second.info.width);
    t.assert.strictEqual(131, second.info.height);
  });

  test('JPEG shrink-on-load with 90 degree rotation, ensure recalculation is correct', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(1920, 1280)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(1920, info.width);
    t.assert.strictEqual(1280, info.height);

    const second = await sharp(data)
      .rotate(90)
      .resize(533, 800)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(533, second.info.width);
    t.assert.strictEqual(800, second.info.height);
  });

  test('TIFF embed known to cause rounding errors', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputTiff)
      .resize(240, 320, { fit: sharp.fit.contain })
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(240, info.width);
    t.assert.strictEqual(320, info.height);
  });

  test('TIFF known to cause rounding errors', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputTiff)
      .resize(240, 320)
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(240, info.width);
    t.assert.strictEqual(320, info.height);
  });

  test('fit=inside, portrait', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputTiff)
      .resize(320, 320, { fit: sharp.fit.inside })
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(243, info.width);
    t.assert.strictEqual(320, info.height);
  });

  test('fit=outside, portrait', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputTiff)
      .resize(320, 320, { fit: sharp.fit.outside })
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(422, info.height);
  });

  test('fit=inside, landscape', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: sharp.fit.inside })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
  });

  test('fit=outside, landscape', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: sharp.fit.outside })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(392, info.width);
    t.assert.strictEqual(320, info.height);
  });

  test('fit=inside, provide only one dimension', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 320, fit: sharp.fit.inside })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
  });

  test('fit=outside, provide only one dimension', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 320, fit: sharp.fit.outside })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
  });

  test('Do not enlarge when input width is already less than output width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 2800, withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('Do not enlarge when input height is already less than output height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ height: 2300, withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('Do crop when fit = cover and withoutEnlargement = true and width >= outputWidth, and height < outputHeight', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 3000, height: 1000, withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(1000, info.height);
  });

  test('Do crop when fit = cover and withoutEnlargement = true and width < outputWidth, and height >= outputHeight', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 1500, height: 2226, withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(1500, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('Do enlarge when input width is less than output width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 2800, withoutEnlargement: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2800, info.width);
    t.assert.strictEqual(2286, info.height);
  });

  test('Do enlarge when input width is less than output width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 2800, withoutReduction: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2800, info.width);
    t.assert.strictEqual(2286, info.height);
  });

  test('Do enlarge when input height is less than output height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ height: 2300, withoutReduction: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2817, info.width);
    t.assert.strictEqual(2300, info.height);
  });

  test('Do enlarge when input width is less than output width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 2800, withoutReduction: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2800, info.width);
    t.assert.strictEqual(2286, info.height);
  });

  test('Do not resize when both withoutEnlargement and withoutReduction are true', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: 'fill', withoutEnlargement: true, withoutReduction: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('Do not reduce size when fit = outside and withoutReduction are true and height > outputHeight and width > outputWidth', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: 'outside', withoutReduction: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('Do resize when fit = outside and withoutReduction are true and input height > height and input width > width ', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(3000, 3000, { fit: 'outside', withoutReduction: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3674, info.width);
    t.assert.strictEqual(3000, info.height);
  });

  test('fit=fill, downscale width and height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(320, info.height);
  });

  test('fit=fill, downscale width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ width: 320, fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('fit=fill, downscale height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize({ height: 320, fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(320, info.height);
  });

  test('fit=fill, upscale width and height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(3000, 3000, { fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3000, info.width);
    t.assert.strictEqual(3000, info.height);
  });

  test('fit=fill, upscale width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(3000, null, { fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3000, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('fit=fill, upscale height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(null, 3000, { fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(3000, info.height);
  });

  test('fit=fill, downscale width, upscale height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 3000, { fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(3000, info.height);
  });

  test('fit=fill, upscale width, downscale height', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(3000, 320, { fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3000, info.width);
    t.assert.strictEqual(320, info.height);
  });

  test('fit=fill, identity transform', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(null, null, { fit: 'fill' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(2725, info.width);
    t.assert.strictEqual(2225, info.height);
  });

  test('Dimensions that result in differing even shrinks on each axis', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(645, 399)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(645, info.width);
    t.assert.strictEqual(399, info.height);
    const second = await sharp(data)
      .resize(150, 100)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(150, second.info.width);
    t.assert.strictEqual(100, second.info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('resize-diff-shrink-even.jpg'), second.data));
  });

  test('Dimensions that result in differing odd shrinks on each axis', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(600, 399)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(600, info.width);
    t.assert.strictEqual(399, info.height);
    const second = await sharp(data)
      .resize(200)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(200, second.info.width);
    t.assert.strictEqual(133, second.info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('resize-diff-shrink-odd.jpg'), second.data));
  });

  [true, false].forEach((value) => {
    test(`fastShrinkOnLoad: ${value} does not causes image shifts`, async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputJpgCenteredImage)
        .resize(9, 8, { fastShrinkOnLoad: value })
        .png()
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(9, info.width);
      t.assert.strictEqual(8, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('fast-shrink-on-load.png'), data));
    });
  });

  [
    sharp.kernel.nearest,
    sharp.kernel.cubic,
    sharp.kernel.mitchell,
    sharp.kernel.lanczos2,
    sharp.kernel.lanczos3
  ].forEach((kernel) => {
    test(`kernel ${kernel}`, async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputJpg)
        .resize(320, null, { kernel })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(320, info.width);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.inputJpg, data));
    });
  });

  test('nearest upsampling with integral factor', async (t) => {
    t.plan(2);
    const { info } = await sharp(fixtures.inputTiff8BitDepth)
      .resize(210, 210, { kernel: 'nearest' })
      .png()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(210, info.width);
    t.assert.strictEqual(210, info.height);
  });

  test('Ensure shortest edge (height) is at least 1 pixel', async (t) => {
    t.plan(2);
    const output = await sharp({
      create: {
        width: 10,
        height: 2,
        channels: 3,
        background: 'red'
      }
    })
      .resize(2)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(2, output.info.width);
    t.assert.strictEqual(1, output.info.height);
  });

  test('Ensure shortest edge (width) is at least 1 pixel', async (t) => {
    t.plan(2);
    const output = await sharp({
      create: {
        width: 2,
        height: 10,
        channels: 3,
        background: 'red'
      }
    })
      .resize(null, 2)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(1, output.info.width);
    t.assert.strictEqual(2, output.info.height);
  });

  test('Ensure embedded shortest edge (height) is at least 1 pixel', async (t) => {
    t.plan(2);
    const output = await sharp({
      create: {
        width: 200,
        height: 1,
        channels: 3,
        background: 'red'
      }
    })
      .resize({ width: 50, height: 50, fit: sharp.fit.contain })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(50, output.info.width);
    t.assert.strictEqual(50, output.info.height);
  });

  test('Ensure embedded shortest edge (width) is at least 1 pixel', async (t) => {
    t.plan(2);
    const output = await sharp({
      create: {
        width: 1,
        height: 200,
        channels: 3,
        background: 'red'
      }
    })
      .resize({ width: 50, height: 50, fit: sharp.fit.contain })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(50, output.info.width);
    t.assert.strictEqual(50, output.info.height);
  });

  test('Skip shrink-on-load where one dimension <4px', async (t) => {
    t.plan(2);
    const jpeg = await sharp({
      create: {
        width: 100,
        height: 3,
        channels: 3,
        background: 'red'
      }
    })
      .jpeg()
      .toBuffer();

    const { info } = await sharp(jpeg)
      .resize(8)
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(info.width, 8);
    t.assert.strictEqual(info.height, 1);
  });

  test('Skip JPEG shrink-on-load for known libjpeg rounding errors', async (t) => {
    t.plan(2);
    const input = await sharp({
      create: {
        width: 1000,
        height: 667,
        channels: 3,
        background: 'red'
      }
    })
      .jpeg()
      .toBuffer();

    const output = await sharp(input)
      .resize({ width: 500 })
      .toBuffer();

    const { width, height } = await sharp(output).metadata();
    t.assert.strictEqual(width, 500);
    t.assert.strictEqual(height, 334);
  });

  test('unknown kernel throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize(null, null, { kernel: 'unknown' });
    });
  });

  test('unknown fit throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize(null, null, { fit: 'unknown' });
    });
  });

  test('unknown position throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().resize(null, null, { position: 'unknown' });
    });
  });

  test('Multiple resize emits warning', (t) => {
    t.plan(2);
    let warningMessage = '';
    const s = sharp();
    s.on('warning', (msg) => {
      warningMessage = msg;
    });
    s.resize(1);
    t.assert.strictEqual(warningMessage, '');
    s.resize(2);
    t.assert.strictEqual(warningMessage, 'ignoring previous resize options');
  });
});
