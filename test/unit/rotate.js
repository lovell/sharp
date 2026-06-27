/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

const bufferWithInfo = (image) => image.toBuffer({ resolveWithObject: true });
const expectSimilar = async (t, expectedImage, actualImage) => {
  await t.assert.doesNotReject(() => fixtures.assertSimilar(expectedImage, actualImage));
};

suite('Rotation', () => {
  ['autoOrient', 'constructor'].forEach((rotateMethod) => {
    suite(`Auto orientation via ${rotateMethod}:`, () => {
      const options = rotateMethod === 'constructor' ? { autoOrient: true } : {};

      ['Landscape', 'Portrait'].forEach((orientation) => {
        [1, 2, 3, 4, 5, 6, 7, 8].forEach((exifTag) => {
          const input = fixtures[`inputJpgWith${orientation}Exif${exifTag}`];
          const expectedOutput = fixtures.expected(`${orientation}_${exifTag}-out.jpg`);

          test(`${orientation} image with EXIF Orientation ${exifTag}: Auto-rotate`, async (t) => {
            t.plan(3);
            const [expectedWidth, expectedHeight] = orientation === 'Landscape' ? [600, 450] : [450, 600];
            const img = sharp(input, options);
            if (rotateMethod === 'autoOrient') {
              img.autoOrient();
            }
            const { data, info } = await bufferWithInfo(img);
            t.assert.strictEqual(info.width, expectedWidth);
            t.assert.strictEqual(info.height, expectedHeight);
            await expectSimilar(t, expectedOutput, data);
          });

          test(`${orientation} image with EXIF Orientation ${exifTag}: Auto-rotate then resize`, async (t) => {
            t.plan(3);
            const [expectedWidth, expectedHeight] = orientation === 'Landscape' ? [320, 240] : [320, 427];
            const img = sharp(input, options);
            if (rotateMethod === 'autoOrient') {
              img.autoOrient();
            }
            const { data, info } = await bufferWithInfo(img.resize({ width: 320 }));
            t.assert.strictEqual(info.width, expectedWidth);
            t.assert.strictEqual(info.height, expectedHeight);
            await expectSimilar(t, expectedOutput, data);
          });

          if (rotateMethod !== 'constructor') {
            test(`${orientation} image with EXIF Orientation ${exifTag}: Resize then auto-rotate`, async (t) => {
              t.plan(3);
              const [expectedWidth, expectedHeight] = orientation === 'Landscape'
                ? [320, 240]
                : [320, 427];
              const img = sharp(input, options).resize({ width: 320 });
              if (rotateMethod === 'autoOrient') {
                img.autoOrient();
              }
              const { data, info } = await bufferWithInfo(img);
              t.assert.strictEqual(info.width, expectedWidth);
              t.assert.strictEqual(info.height, expectedHeight);
              await expectSimilar(t, expectedOutput, data);
            });
          }

          [true, false].forEach((doResize) => {
            [90, 180, 270, 45].forEach((angle) => {
              const [inputWidth, inputHeight] = orientation === 'Landscape' ? [600, 450] : [450, 600];
              const expectedOutput = fixtures.expected(`${orientation}_${exifTag}_rotate${angle}-out.jpg`);
              test(`${orientation} image with EXIF Orientation ${exifTag}: Auto-rotate then rotate ${angle} ${doResize ? 'and resize' : ''}`, async (t) => {
                t.plan(3);
                const [width, height] = (angle === 45 ? [742, 742] : [inputWidth, inputHeight]).map((x) => doResize ? Math.floor(x / 1.875) : x);
                const [expectedWidth, expectedHeight] = angle % 180 === 0 ? [width, height] : [height, width];
                const img = sharp(input, options);
                if (rotateMethod === 'autoOrient') {
                  img.autoOrient();
                }
                img.rotate(angle);
                if (doResize) {
                  img.resize(expectedWidth);
                }
                const { data, info } = await bufferWithInfo(img);
                t.assert.strictEqual(info.width, expectedWidth);
                t.assert.strictEqual(info.height, expectedHeight);
                await expectSimilar(t, expectedOutput, data);
              });
            });

            [[true, true], [true, false], [false, true]].forEach(([flip, flop]) => {
              const [inputWidth, inputHeight] = orientation === 'Landscape' ? [600, 450] : [450, 600];
              const flipFlopFileName = [flip && 'flip', flop && 'flop'].filter(Boolean).join('_');
              const flipFlopTestName = [flip && 'flip', flop && 'flop'].filter(Boolean).join(' & ');
              test(`${orientation} image with EXIF Orientation ${exifTag}: Auto-rotate then ${flipFlopTestName} ${doResize ? 'and resize' : ''}`, async (t) => {
                t.plan(3);
                const expectedOutput = fixtures.expected(`${orientation}_${exifTag}_${flipFlopFileName}-out.jpg`);
                const img = sharp(input, options);
                if (rotateMethod === 'autoOrient') {
                  img.autoOrient();
                }
                if (flip) {
                  img.flip();
                }
                if (flop) {
                  img.flop();
                }
                if (doResize) {
                  img.resize(orientation === 'Landscape' ? 320 : 240);
                }
                const { data, info } = await bufferWithInfo(img);
                t.assert.strictEqual(info.width, inputWidth / (doResize ? 1.875 : 1));
                t.assert.strictEqual(info.height, inputHeight / (doResize ? 1.875 : 1));
                await expectSimilar(t, expectedOutput, data);
              });
            });
          });
        });
      });
    });
  });

  test('Rotate by 30 degrees with semi-transparent background', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(320)
        .rotate(30, { background: { r: 255, g: 0, b: 0, alpha: 0.5 } })
        .png()
    );
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(408, info.width);
    t.assert.strictEqual(386, info.height);
    await expectSimilar(t, fixtures.expected('rotate-transparent-bg.png'), data);
  });

  test('Rotate by 30 degrees with solid background', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(320)
        .rotate(30, { background: { r: 255, g: 0, b: 0 } })
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(408, info.width);
    t.assert.strictEqual(386, info.height);
    await expectSimilar(t, fixtures.expected('rotate-solid-bg.jpg'), data);
  });

  test('Rotate by 90 degrees, respecting output input size', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .rotate(90)
        .resize(320, 240)
    );
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
  });

  test('Resize then rotate by 30 degrees, respecting output input size', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .rotate(30)
    );
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(397, info.width);
    t.assert.strictEqual(368, info.height);
  });

  [-3690, -450, -90, 90, 450, 3690].forEach((angle) => {
    test(`Rotate by any 90-multiple angle (${angle}deg)`, async (t) => {
      t.plan(2);
      const { info } = await bufferWithInfo(sharp(fixtures.inputJpg320x240).rotate(angle));
      t.assert.strictEqual(240, info.width);
      t.assert.strictEqual(320, info.height);
    });
  });

  [-3750, -510, -150, 30, 390, 3630].forEach((angle) => {
    test(`Rotate by any 30-multiple angle (${angle}deg)`, async (t) => {
      t.plan(2);
      const { info } = await bufferWithInfo(sharp(fixtures.inputJpg320x240).rotate(angle));
      t.assert.strictEqual(397, info.width);
      t.assert.strictEqual(368, info.height);
    });
  });

  [-3780, -540, 0, 180, 540, 3780].forEach((angle) => {
    test(`Rotate by any 180-multiple angle (${angle}deg)`, async (t) => {
      t.plan(2);
      const { info } = await bufferWithInfo(sharp(fixtures.inputJpg320x240).rotate(angle));
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(240, info.height);
    });
  });

  test('Rotate by 270 degrees, square output ignoring aspect ratio', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(240, 240, { fit: sharp.fit.fill })
        .rotate(270)
    );
    t.assert.strictEqual(240, info.width);
    t.assert.strictEqual(240, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(240, metadata.width);
    t.assert.strictEqual(240, metadata.height);
  });

  test('Rotate by 315 degrees, square output ignoring aspect ratio', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(240, 240, { fit: sharp.fit.fill })
        .rotate(315)
    );
    t.assert.strictEqual(339, info.width);
    t.assert.strictEqual(339, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(339, metadata.width);
    t.assert.strictEqual(339, metadata.height);
  });

  test('Rotate by 270 degrees, rectangular output ignoring aspect ratio', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .rotate(270)
        .resize(320, 240, { fit: sharp.fit.fill })
    );
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(320, metadata.width);
    t.assert.strictEqual(240, metadata.height);
  });

  test('Auto-rotate by 270 degrees, rectangular output ignoring aspect ratio', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpgWithLandscapeExif8)
        .resize(320, 240, { fit: sharp.fit.fill })
        .rotate()
    );
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(320, metadata.width);
    t.assert.strictEqual(240, metadata.height);
  });

  test('Rotate by 30 degrees, rectangular output ignoring aspect ratio', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(320, 240, { fit: sharp.fit.fill })
        .rotate(30)
    );
    t.assert.strictEqual(397, info.width);
    t.assert.strictEqual(368, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(397, metadata.width);
    t.assert.strictEqual(368, metadata.height);
  });

  test('Input image has Orientation EXIF tag but do not rotate output', async (t) => {
    t.plan(5);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpgWithExif)
        .resize(320)
        .withMetadata()
    );
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(427, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(8, metadata.orientation);
  });

  test('Input image has Orientation EXIF tag value of 8 (270 degrees), auto-rotate', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpgWithExif)
        .rotate()
        .resize(320)
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await expectSimilar(t, fixtures.expected('exif-8.jpg'), data);
  });

  test('Override EXIF Orientation tag metadata after auto-rotate', async (t) => {
    t.plan(5);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpgWithExif)
        .rotate()
        .resize(320)
        .withMetadata({ orientation: 3 })
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(3, metadata.orientation);
    await expectSimilar(t, fixtures.expected('exif-8.jpg'), data);
  });

  test('Input image has Orientation EXIF tag value of 5 (270 degrees + flip), auto-rotate', async (t) => {
    t.plan(5);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpgWithExifMirroring)
        .rotate()
        .resize(320)
        .withMetadata()
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(1, metadata.orientation);
    await expectSimilar(t, fixtures.expected('exif-5.jpg'), data);
  });

  test('Attempt to auto-rotate using image that has no EXIF', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(sharp(fixtures.inputJpg).rotate().resize(320));
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
  });

  test('Attempt to auto-rotate image format without EXIF support', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputPng)
        .rotate()
        .resize(320)
        .jpeg()
    );
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(236, info.height);
  });

  test('Rotate with a string argument, should fail', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).rotate('not-a-number');
    });
  });

  test('Animated image rotate-then-extract rejects', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .rotate(1)
      .extract({
        top: 1,
        left: 1,
        width: 10,
        height: 10
      })
      .toBuffer(), /Rotate is not supported for multi-page images/);
  });

  test('Animated image extract-then-rotate rejects', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .extract({
        top: 1,
        left: 1,
        width: 10,
        height: 10
      })
      .rotate(1)
      .toBuffer(), /Rotate is not supported for multi-page images/);
  });

  test('Animated image rotate 180', async (t) => {
    t.plan(1);
    await t.assert.doesNotReject(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .rotate(180)
      .toBuffer());
  });

  test('Animated image rotate non-180 rejects', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .rotate(90)
      .toBuffer(), /Rotate is not supported for multi-page images/);
  });

  test('Multiple rotate emits warning', (t) => {
    t.plan(2);
    let warningMessage = '';
    const s = sharp();
    s.on('warning', (msg) => { warningMessage = msg; });
    s.rotate(90);
    t.assert.strictEqual(warningMessage, '');
    s.rotate(180);
    t.assert.strictEqual(warningMessage, 'ignoring previous rotate options');
  });

  test('Multiple rotate: last one wins (cardinal)', async (t) => {
    t.plan(2);
    const { info } = await bufferWithInfo(sharp(fixtures.inputJpg).rotate(45).rotate(90));
    t.assert.strictEqual(2225, info.width);
    t.assert.strictEqual(2725, info.height);
  });

  test('Multiple rotate: last one wins (non cardinal)', async (t) => {
    t.plan(2);
    const { info } = await bufferWithInfo(sharp(fixtures.inputJpg).rotate(90).rotate(45));
    t.assert.strictEqual(3500, info.width);
    t.assert.strictEqual(3500, info.height);
  });

  test('Flip - vertical', async (t) => {
    t.plan(5);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(320)
        .flip()
        .withMetadata()
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(1, metadata.orientation);
    await expectSimilar(t, fixtures.expected('flip.jpg'), data);
  });

  test('Flop - horizontal', async (t) => {
    t.plan(5);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(320)
        .flop()
        .withMetadata()
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(1, metadata.orientation);
    await expectSimilar(t, fixtures.expected('flop.jpg'), data);
  });

  test('Flip and flop', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(320)
        .flip()
        .flop()
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
    await expectSimilar(t, fixtures.expected('flip-and-flop.jpg'), data);
  });

  test('Neither flip nor flop', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpg)
        .resize(320)
        .flip(false)
        .flop(false)
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(261, info.height);
    await expectSimilar(t, fixtures.inputJpg, data);
  });

  test('Auto-rotate and flip', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpgWithExif)
        .rotate()
        .flip()
        .resize(320)
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await expectSimilar(t, fixtures.expected('rotate-and-flip.jpg'), data);
  });

  test('Auto-rotate and flop', async (t) => {
    t.plan(4);
    const { data, info } = await bufferWithInfo(
      sharp(fixtures.inputJpgWithExif)
        .rotate()
        .flop()
        .resize(320)
    );
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await expectSimilar(t, fixtures.expected('rotate-and-flop.jpg'), data);
  });

  test('Auto-rotate and shrink-on-load', async (t) => {
    t.plan(3);
    const [r, g, b] = await sharp(fixtures.inputJpgWithLandscapeExif3)
      .rotate()
      .resize(8)
      .raw()
      .toBuffer();
    t.assert.strictEqual(r, 61);
    t.assert.strictEqual(g, 74);
    t.assert.strictEqual(b, 51);
  });

  test('Flip and rotate ordering', async (t) => {
    t.plan(3);
    const [r, g, b] = await sharp(fixtures.inputJpgWithPortraitExif5)
      .flip()
      .rotate(90)
      .raw()
      .toBuffer();
    t.assert.strictEqual(r, 55);
    t.assert.strictEqual(g, 65);
    t.assert.strictEqual(b, 31);
  });

  test('Flip, rotate and resize ordering', async (t) => {
    t.plan(3);
    const [r, g, b] = await sharp(fixtures.inputJpgWithPortraitExif5)
      .flip()
      .rotate(90)
      .resize(449)
      .raw()
      .toBuffer();
    t.assert.strictEqual(r, 54);
    t.assert.strictEqual(g, 64);
    t.assert.strictEqual(b, 30);
  });

  test('Resize after affine-based rotation does not overcompute', async (t) => {
    t.plan(1);
    const data = await sharp({
      create: {
        width: 4640,
        height: 2610,
        channels: 3,
        background: 'black'
      }
    })
      .rotate(28)
      .resize({ width: 640, height: 360 })
      .raw()
      .timeout({ seconds: 5 })
      .toBuffer();
    t.assert.strictEqual(data.length, 640 * 360 * 3);
  });

  test('Rotate 90 then resize with inside fit', async (t) => {
    t.plan(2);
    const data = await sharp({ create: { width: 16, height: 8, channels: 3, background: 'red' } })
      .rotate(90)
      .resize({ width: 6, fit: 'inside' })
      .png({ compressionLevel: 0 })
      .toBuffer();
    const { width, height } = await sharp(data).metadata();
    t.assert.strictEqual(width, 6);
    t.assert.strictEqual(height, 12);
  });

  test('Resize with inside fit then rotate 90', async (t) => {
    t.plan(2);
    const data = await sharp({ create: { width: 16, height: 8, channels: 3, background: 'red' } })
      .resize({ width: 6, fit: 'inside' })
      .rotate(90)
      .png({ compressionLevel: 0 })
      .toBuffer();
    const { width, height } = await sharp(data).metadata();
    t.assert.strictEqual(width, 3);
    t.assert.strictEqual(height, 6);
  });

  test('Shrink-on-load with autoOrient', async (t) => {
    t.plan(3);
    const data = await sharp(fixtures.inputJpgWithLandscapeExif6)
      .resize(8)
      .autoOrient()
      .avif({ effort: 0 })
      .toBuffer();
    const { width, height, orientation } = await sharp(data).metadata();
    t.assert.strictEqual(width, 8);
    t.assert.strictEqual(height, 6);
    t.assert.strictEqual(orientation, undefined);
  });

  test('Auto-orient and rotate 45', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputJpgWithLandscapeExif2, { autoOrient: true })
      .rotate(45)
      .toBuffer();
    const { width, height } = await sharp(data).metadata();
    t.assert.strictEqual(width, 742);
    t.assert.strictEqual(height, 742);
  });

  test('Auto-orient, extract and rotate 45', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputJpgWithLandscapeExif2, { autoOrient: true })
      .extract({ left: 20, top: 20, width: 200, height: 100 })
      .rotate(45)
      .toBuffer();
    const { width, height } = await sharp(data).metadata();
    t.assert.strictEqual(width, 212);
    t.assert.strictEqual(height, 212);
  });

  test('Invalid autoOrient throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp({ autoOrient: 'fail' }),
      /Expected boolean for autoOrient but received fail of type string/
    );
  });
});
