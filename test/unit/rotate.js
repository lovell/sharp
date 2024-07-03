// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Rotation', function () {
  ['autoOrient', 'constructor'].forEach(function (rotateMethod) {
    describe(`Auto orientation via ${rotateMethod}:`, () => {
      const options = rotateMethod === 'constructor' ? { autoOrient: true } : {};

      ['Landscape', 'Portrait'].forEach(function (orientation) {
        [1, 2, 3, 4, 5, 6, 7, 8].forEach(function (exifTag) {
          const input = fixtures[`inputJpgWith${orientation}Exif${exifTag}`];
          const expectedOutput = fixtures.expected(`${orientation}_${exifTag}-out.jpg`);
          it(`${orientation} image with EXIF Orientation ${exifTag}: Auto-rotate`, function (done) {
            const [expectedWidth, expectedHeight] = orientation === 'Landscape' ? [600, 450] : [450, 600];

            const img = sharp(input, options);
            rotateMethod === 'autoOrient' && img.autoOrient();

            img.toBuffer(function (err, data, info) {
              if (err) throw err;
              assert.strictEqual(info.width, expectedWidth);
              assert.strictEqual(info.height, expectedHeight);
              fixtures.assertSimilar(expectedOutput, data, done);
            });
          });

          it(`${orientation} image with EXIF Orientation ${exifTag}: Auto-rotate then resize`, function (done) {
            const [expectedWidth, expectedHeight] = orientation === 'Landscape' ? [320, 240] : [320, 427];

            const img = sharp(input, options);
            rotateMethod === 'autoOrient' && img.autoOrient();

            img.resize({ width: 320 })
              .toBuffer(function (err, data, info) {
                if (err) throw err;
                assert.strictEqual(info.width, expectedWidth);
                assert.strictEqual(info.height, expectedHeight);
                fixtures.assertSimilar(expectedOutput, data, done);
              });
          });

          if (rotateMethod !== 'constructor') {
            it(`${orientation} image with EXIF Orientation ${exifTag}: Resize then auto-rotate`, function (done) {
              const [expectedWidth, expectedHeight] = orientation === 'Landscape'
                ? (exifTag < 5) ? [320, 240] : [320, 240]
                : [320, 427];

              const img = sharp(input, options)
                .resize({ width: 320 });

              rotateMethod === 'autoOrient' && img.autoOrient();
              img.toBuffer(function (err, data, info) {
                if (err) throw err;
                assert.strictEqual(info.width, expectedWidth);
                assert.strictEqual(info.height, expectedHeight);
                fixtures.assertSimilar(expectedOutput, data, done);
              });
            });
          }

          [true, false].forEach((doResize) => {
            [90, 180, 270, 45].forEach(function (angle) {
              const [inputWidth, inputHeight] = orientation === 'Landscape' ? [600, 450] : [450, 600];
              const expectedOutput = fixtures.expected(`${orientation}_${exifTag}_rotate${angle}-out.jpg`);
              it(`${orientation} image with EXIF Orientation ${exifTag}: Auto-rotate then rotate ${angle} ${doResize ? 'and resize' : ''}`, function (done) {
                const [width, height] = (angle === 45 ? [742, 742] : [inputWidth, inputHeight]).map((x) => doResize ? Math.floor(x / 1.875) : x);
                const [expectedWidth, expectedHeight] = angle % 180 === 0 ? [width, height] : [height, width];

                const img = sharp(input, options);
                rotateMethod === 'autoOrient' && img.autoOrient();

                img.rotate(angle);
                doResize && img.resize(expectedWidth);

                img.toBuffer(function (err, data, info) {
                  if (err) throw err;
                  assert.strictEqual(info.width, expectedWidth);
                  assert.strictEqual(info.height, expectedHeight);
                  fixtures.assertSimilar(expectedOutput, data, done);
                });
              });
            });

            [[true, true], [true, false], [false, true]].forEach(function ([flip, flop]) {
              const [inputWidth, inputHeight] = orientation === 'Landscape' ? [600, 450] : [450, 600];
              const flipFlopFileName = [flip && 'flip', flop && 'flop'].filter(Boolean).join('_');
              const flipFlopTestName = [flip && 'flip', flop && 'flop'].filter(Boolean).join(' & ');
              it(`${orientation} image with EXIF Orientation ${exifTag}: Auto-rotate then ${flipFlopTestName} ${doResize ? 'and resize' : ''}`, function (done) {
                const expectedOutput = fixtures.expected(`${orientation}_${exifTag}_${flipFlopFileName}-out.jpg`);

                const img = sharp(input, options);

                rotateMethod === 'autoOrient' && img.autoOrient();

                flip && img.flip();
                flop && img.flop();
                doResize && img.resize(orientation === 'Landscape' ? 320 : 240);

                img.toBuffer(function (err, data, info) {
                  if (err) throw err;
                  assert.strictEqual(info.width, inputWidth / (doResize ? 1.875 : 1));
                  assert.strictEqual(info.height, inputHeight / (doResize ? 1.875 : 1));
                  fixtures.assertSimilar(expectedOutput, data, done);
                });
              });
            });
          });
        });
      });
    });
  });

  it('Rotate by 30 degrees with semi-transparent background', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .rotate(30, { background: { r: 255, g: 0, b: 0, alpha: 0.5 } })
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(408, info.width);
        assert.strictEqual(386, info.height);
        fixtures.assertSimilar(fixtures.expected('rotate-transparent-bg.png'), data, done);
      });
  });

  it('Rotate by 30 degrees with solid background', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .rotate(30, { background: { r: 255, g: 0, b: 0 } })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(408, info.width);
        assert.strictEqual(386, info.height);
        fixtures.assertSimilar(fixtures.expected('rotate-solid-bg.jpg'), data, done);
      });
  });

  it('Rotate by 90 degrees, respecting output input size', function (done) {
    sharp(fixtures.inputJpg)
      .rotate(90)
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Resize then rotate by 30 degrees, respecting output input size', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .rotate(30)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(397, info.width);
        assert.strictEqual(368, info.height);
        done();
      });
  });

  [-3690, -450, -90, 90, 450, 3690].forEach(function (angle) {
    it('Rotate by any 90-multiple angle (' + angle + 'deg)', function (done) {
      sharp(fixtures.inputJpg320x240).rotate(angle).toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(240, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
    });
  });

  [-3750, -510, -150, 30, 390, 3630].forEach(function (angle) {
    it('Rotate by any 30-multiple angle (' + angle + 'deg)', function (done) {
      sharp(fixtures.inputJpg320x240).rotate(angle).toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(397, info.width);
        assert.strictEqual(368, info.height);
        done();
      });
    });
  });

  [-3780, -540, 0, 180, 540, 3780].forEach(function (angle) {
    it('Rotate by any 180-multiple angle (' + angle + 'deg)', function (done) {
      sharp(fixtures.inputJpg320x240).rotate(angle).toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
    });
  });

  it('Rotate by 270 degrees, square output ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(240, 240, { fit: sharp.fit.fill })
      .rotate(270)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(240, info.width);
        assert.strictEqual(240, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(240, metadata.width);
          assert.strictEqual(240, metadata.height);
          done();
        });
      });
  });

  it('Rotate by 315 degrees, square output ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(240, 240, { fit: sharp.fit.fill })
      .rotate(315)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(339, info.width);
        assert.strictEqual(339, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(339, metadata.width);
          assert.strictEqual(339, metadata.height);
          done();
        });
      });
  });

  it('Rotate by 270 degrees, rectangular output ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .rotate(270)
      .resize(320, 240, { fit: sharp.fit.fill })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(320, metadata.width);
          assert.strictEqual(240, metadata.height);
          done();
        });
      });
  });

  it('Auto-rotate by 270 degrees, rectangular output ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpgWithLandscapeExif8)
      .resize(320, 240, { fit: sharp.fit.fill })
      .rotate()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(320, metadata.width);
          assert.strictEqual(240, metadata.height);
          done();
        });
      });
  });

  it('Rotate by 30 degrees, rectangular output ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240, { fit: sharp.fit.fill })
      .rotate(30)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(397, info.width);
        assert.strictEqual(368, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(397, metadata.width);
          assert.strictEqual(368, metadata.height);
          done();
        });
      });
  });

  it('Input image has Orientation EXIF tag but do not rotate output', function (done) {
    sharp(fixtures.inputJpgWithExif)
      .resize(320)
      .withMetadata()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(427, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(8, metadata.orientation);
          done();
        });
      });
  });

  it('Input image has Orientation EXIF tag value of 8 (270 degrees), auto-rotate', function (done) {
    sharp(fixtures.inputJpgWithExif)
      .rotate()
      .resize(320)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('exif-8.jpg'), data, done);
      });
  });

  it('Override EXIF Orientation tag metadata after auto-rotate', function (done) {
    sharp(fixtures.inputJpgWithExif)
      .rotate()
      .resize(320)
      .withMetadata({ orientation: 3 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(3, metadata.orientation);
          fixtures.assertSimilar(fixtures.expected('exif-8.jpg'), data, done);
        });
      });
  });

  it('Input image has Orientation EXIF tag value of 5 (270 degrees + flip), auto-rotate', function (done) {
    sharp(fixtures.inputJpgWithExifMirroring)
      .rotate()
      .resize(320)
      .withMetadata()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(1, metadata.orientation);
          fixtures.assertSimilar(fixtures.expected('exif-5.jpg'), data, done);
        });
      });
  });

  it('Attempt to auto-rotate using image that has no EXIF', function (done) {
    sharp(fixtures.inputJpg).rotate().resize(320).toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  });

  it('Attempt to auto-rotate image format without EXIF support', function (done) {
    sharp(fixtures.inputPng)
      .rotate()
      .resize(320)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(236, info.height);
        done();
      });
  });

  it('Rotate with a string argument, should fail', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).rotate('not-a-number');
    });
  });

  it('Animated image rotate-then-extract rejects', () =>
    assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .rotate(1)
      .extract({
        top: 1,
        left: 1,
        width: 10,
        height: 10
      })
      .toBuffer(),
    /Rotate is not supported for multi-page images/
    )
  );

  it('Animated image extract-then-rotate rejects', () =>
    assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .extract({
        top: 1,
        left: 1,
        width: 10,
        height: 10
      })
      .rotate(1)
      .toBuffer(),
    /Rotate is not supported for multi-page images/
    )
  );

  it('Animated image rotate 180', () =>
    assert.doesNotReject(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .rotate(180)
      .toBuffer()
    )
  );

  it('Animated image rotate non-180 rejects', () =>
    assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .rotate(90)
      .toBuffer(),
    /Rotate is not supported for multi-page images/
    )
  );

  it('Multiple rotate emits warning', () => {
    let warningMessage = '';
    const s = sharp();
    s.on('warning', function (msg) { warningMessage = msg; });
    s.rotate(90);
    assert.strictEqual(warningMessage, '');
    s.rotate(180);
    assert.strictEqual(warningMessage, 'ignoring previous rotate options');
  });

  it('Multiple rotate: last one wins (cardinal)', function (done) {
    sharp(fixtures.inputJpg)
      .rotate(45)
      .rotate(90)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(2225, info.width);
        assert.strictEqual(2725, info.height);
        done();
      });
  });

  it('Multiple rotate: last one wins (non cardinal)', function (done) {
    sharp(fixtures.inputJpg)
      .rotate(90)
      .rotate(45)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(3500, info.width);
        assert.strictEqual(3500, info.height);
        done();
      });
  });

  it('Flip - vertical', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .flip()
      .withMetadata()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(1, metadata.orientation);
          fixtures.assertSimilar(fixtures.expected('flip.jpg'), data, done);
        });
      });
  });

  it('Flop - horizontal', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .flop()
      .withMetadata()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        sharp(data).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(1, metadata.orientation);
          fixtures.assertSimilar(fixtures.expected('flop.jpg'), data, done);
        });
      });
  });

  it('Flip and flop', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .flip()
      .flop()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        fixtures.assertSimilar(fixtures.expected('flip-and-flop.jpg'), data, done);
      });
  });

  it('Neither flip nor flop', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .flip(false)
      .flop(false)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        fixtures.assertSimilar(fixtures.inputJpg, data, done);
      });
  });

  it('Auto-rotate and flip', function (done) {
    sharp(fixtures.inputJpgWithExif)
      .rotate()
      .flip()
      .resize(320)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('rotate-and-flip.jpg'), data, done);
      });
  });

  it('Auto-rotate and flop', function (done) {
    sharp(fixtures.inputJpgWithExif)
      .rotate()
      .flop()
      .resize(320)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('rotate-and-flop.jpg'), data, done);
      });
  });

  it('Auto-rotate and shrink-on-load', async () => {
    const [r, g, b] = await sharp(fixtures.inputJpgWithLandscapeExif3)
      .rotate()
      .resize(8)
      .raw()
      .toBuffer();

    assert.strictEqual(r, 60);
    assert.strictEqual(g, 73);
    assert.strictEqual(b, 52);
  });

  it('Flip and rotate ordering', async () => {
    const [r, g, b] = await sharp(fixtures.inputJpgWithPortraitExif5)
      .flip()
      .rotate(90)
      .raw()
      .toBuffer();

    assert.strictEqual(r, 55);
    assert.strictEqual(g, 65);
    assert.strictEqual(b, 31);
  });

  it('Flip, rotate and resize ordering', async () => {
    const [r, g, b] = await sharp(fixtures.inputJpgWithPortraitExif5)
      .flip()
      .rotate(90)
      .resize(449)
      .raw()
      .toBuffer();

    assert.strictEqual(r, 54);
    assert.strictEqual(g, 64);
    assert.strictEqual(b, 30);
  });

  it('Resize after affine-based rotation does not overcompute', async () =>
    sharp({
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
      .toBuffer()
  );

  it('Rotate 90 then resize with inside fit', async () => {
    const data = await sharp({ create: { width: 16, height: 8, channels: 3, background: 'red' } })
      .rotate(90)
      .resize({ width: 6, fit: 'inside' })
      .png({ compressionLevel: 0 })
      .toBuffer();

    const { width, height } = await sharp(data).metadata();
    assert.strictEqual(width, 6);
    assert.strictEqual(height, 12);
  });

  it('Resize with inside fit then rotate 90', async () => {
    const data = await sharp({ create: { width: 16, height: 8, channels: 3, background: 'red' } })
      .resize({ width: 6, fit: 'inside' })
      .rotate(90)
      .png({ compressionLevel: 0 })
      .toBuffer();

    const { width, height } = await sharp(data).metadata();
    assert.strictEqual(width, 3);
    assert.strictEqual(height, 6);
  });

  it('Invalid autoOrient throws', () =>
    assert.throws(
      () => sharp({ autoOrient: 'fail' }),
      /Expected boolean for autoOrient but received fail of type string/
    )
  );
});
