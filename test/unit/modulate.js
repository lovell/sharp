'use strict';

const sharp = require('../../');
const assert = require('assert');
const fixtures = require('../fixtures');

describe('Modulate', function () {
  describe('Invalid options', function () {
    [
      null,
      undefined,
      10,
      { brightness: -1 },
      { brightness: '50%' },
      { brightness: null },
      { saturation: -1 },
      { saturation: '50%' },
      { saturation: null },
      { hue: '50deg' },
      { hue: 1.5 },
      { hue: null },
      { lightness: '+50' },
      { lightness: null }
    ].forEach(function (options) {
      it('should throw', function () {
        assert.throws(function () {
          sharp(fixtures.inputJpg).modulate(options);
        });
      });
    });
  });

  it('should be able to hue-rotate', async () => {
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 153, g: 68, b: 68 }
      }
    })
      .modulate({ hue: 120 })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 41, g: 107, b: 57 }, { r, g, b });
  });

  it('should be able to brighten', async () => {
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 153, g: 68, b: 68 }
      }
    })
      .modulate({ brightness: 2 })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 255, g: 173, b: 168 }, { r, g, b });
  });

  it('should be able to darken', async () => {
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 153, g: 68, b: 68 }
      }
    })
      .modulate({ brightness: 0.5 })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 97, g: 17, b: 25 }, { r, g, b });
  });

  it('should be able to saturate', async () => {
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 153, g: 68, b: 68 }
      }
    })
      .modulate({ saturation: 2 })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 198, g: 0, b: 43 }, { r, g, b });
  });

  it('should be able to desaturate', async () => {
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 153, g: 68, b: 68 }
      }
    })
      .modulate({ saturation: 0.5 })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 127, g: 83, b: 81 }, { r, g, b });
  });

  it('should be able to lighten', async () => {
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 153, g: 68, b: 68 }
      }
    })
      .modulate({ lightness: 10 })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 182, g: 93, b: 92 }, { r, g, b });
  });

  it('should be able to modulate all channels', async () => {
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 153, g: 68, b: 68 }
      }
    })
      .modulate({ brightness: 2, saturation: 0.5, hue: 180 })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 149, g: 209, b: 214 }, { r, g, b });
  });

  it('should be able to use linear and modulate together', async () => {
    const contrast = 1.5;
    const brightness = 0.5;

    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 153, g: 68, b: 68 }
      }
    })
      .linear(contrast, -(128 * contrast) + 128)
      .modulate({ brightness })
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r: 81, g: 0, b: 0 }, { r, g, b });
  });

  describe('hue-rotate', () => {
    [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].forEach(angle => {
      it(`should hue rotate by ${angle} deg`, async () => {
        const base = `modulate-hue-angle-${angle}.png`;
        const actual = fixtures.path(`output.${base}`);
        const expected = fixtures.expected(base);

        await sharp(fixtures.testPattern)
          .resize(320)
          .modulate({ hue: angle })
          .png({ compressionLevel: 0 })
          .toFile(actual)
          .then(() => {
            fixtures.assertMaxColourDistance(actual, expected);
          });
      });
    });
  });
});
