'use strict';

const assert = require('assert');

const fixtures = require('../fixtures');
const sharp = require('../../');

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

// Test
describe('composite', () => {
  blends.forEach(blend => {
    it(`blend ${blend}`, async () => {
      const filename = `composite.blend.${blend}.png`;
      const actual = fixtures.path(`output.${filename}`);
      const expected = fixtures.expected(filename);
      await sharp(redRect)
        .composite([{
          input: blueRect,
          blend
        }])
        .toFile(actual);
      fixtures.assertMaxColourDistance(actual, expected);
    });
  });

  it('premultiplied true', () => {
    const filename = 'composite.premultiplied.png';
    const below = fixtures.path(`input.below.${filename}`);
    const above = fixtures.path(`input.above.${filename}`);
    const actual = fixtures.path(`output.true.${filename}`);
    const expected = fixtures.expected(`expected.true.${filename}`);
    return sharp(below)
      .composite([{
        input: above,
        blend: 'color-burn',
        top: 0,
        left: 0,
        premultiplied: true
      }])
      .toFile(actual)
      .then(() => {
        fixtures.assertMaxColourDistance(actual, expected);
      });
  });

  it('premultiplied false', () => {
    const filename = 'composite.premultiplied.png';
    const below = fixtures.path(`input.below.${filename}`);
    const above = fixtures.path(`input.above.${filename}`);
    const actual = fixtures.path(`output.false.${filename}`);
    const expected = fixtures.expected(`expected.false.${filename}`);
    return sharp(below)
      .composite([{
        input: above,
        blend: 'color-burn',
        top: 0,
        left: 0,
        premultiplied: false
      }])
      .toFile(actual)
      .then(() => {
        fixtures.assertMaxColourDistance(actual, expected);
      });
  });

  it('premultiplied absent', () => {
    const filename = 'composite.premultiplied.png';
    const below = fixtures.path(`input.below.${filename}`);
    const above = fixtures.path(`input.above.${filename}`);
    const actual = fixtures.path(`output.absent.${filename}`);
    const expected = fixtures.expected(`expected.absent.${filename}`);
    return sharp(below)
      .composite([{
        input: above,
        blend: 'color-burn',
        top: 0,
        left: 0
      }])
      .toFile(actual)
      .then(() => {
        fixtures.assertMaxColourDistance(actual, expected);
      });
  });

  it('multiple', async () => {
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
    fixtures.assertMaxColourDistance(actual, expected);
  });

  it('zero offset', done => {
    sharp(fixtures.inputJpg)
      .resize(80)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        top: 0,
        left: 0
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('overlay-offset-0.jpg'), data, done);
      });
  });

  it('offset and gravity', done => {
    sharp(fixtures.inputJpg)
      .resize(80)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        gravity: 4
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('overlay-offset-with-gravity.jpg'), data, done);
      });
  });

  it('negative offset and gravity', done => {
    sharp(fixtures.inputJpg)
      .resize(400)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: -10,
        top: -10,
        gravity: 4
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(
          fixtures.expected('overlay-negative-offset-with-gravity.jpg'), data, done);
      });
  });

  it('offset, gravity and tile', done => {
    sharp(fixtures.inputJpg)
      .resize(80)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        gravity: 4,
        tile: true
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('overlay-offset-with-gravity-tile.jpg'), data, done);
      });
  });

  it('offset and tile', done => {
    sharp(fixtures.inputJpg)
      .resize(80)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        tile: true
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('overlay-offset-with-tile.jpg'), data, done);
      });
  });

  it('centre gravity should replicate correct number of tiles', async () => {
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

    assert.deepStrictEqual({ r, g, b }, red);
  });

  it('cutout via dest-in', done => {
    sharp(fixtures.inputJpg)
      .resize(300, 300)
      .composite([{
        input: Buffer.from('<svg width="200" height="200"><rect x="0" y="0" width="200" height="200" rx="50" ry="50"/></svg>'),
        density: 96,
        blend: 'dest-in',
        cutout: true
      }])
      .png()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(300, info.width);
        assert.strictEqual(300, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('composite-cutout.png'), data, done);
      });
  });

  describe('numeric gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      it(gravity, done => {
        sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            gravity: gravity
          }])
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(80, info.width);
            assert.strictEqual(65, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(fixtures.expected(`overlay-gravity-${gravity}.jpg`), data, done);
          });
      });
    });
  });

  describe('string gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      it(gravity, done => {
        const expected = fixtures.expected('overlay-gravity-' + gravity + '.jpg');
        sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            gravity: sharp.gravity[gravity]
          }])
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(80, info.width);
            assert.strictEqual(65, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(expected, data, done);
          });
      });
    });
  });

  describe('tile and gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      it(gravity, done => {
        const expected = fixtures.expected('overlay-tile-gravity-' + gravity + '.jpg');
        sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            tile: true,
            gravity: gravity
          }])
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(80, info.width);
            assert.strictEqual(65, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(expected, data, done);
          });
      });
    });
  });

  describe('validation', () => {
    it('missing images', () => {
      assert.throws(() => {
        sharp().composite();
      }, /Expected array for images to composite but received undefined of type undefined/);
    });

    it('invalid images', () => {
      assert.throws(() => {
        sharp().composite(['invalid']);
      }, /Expected object for image to composite but received invalid of type string/);
    });

    it('missing input', () => {
      assert.throws(() => {
        sharp().composite([{}]);
      }, /Unsupported input/);
    });

    it('invalid blend', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', blend: 'invalid' }]);
      }, /Expected valid blend name for blend but received invalid of type string/);
    });

    it('invalid tile', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', tile: 'invalid' }]);
      }, /Expected boolean for tile but received invalid of type string/);
    });

    it('invalid premultiplied', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', premultiplied: 'invalid' }]);
      }, /Expected boolean for premultiplied but received invalid of type string/);
    });

    it('invalid left', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', left: 0.5 }]);
      }, /Expected integer for left but received 0.5 of type number/);
      assert.throws(() => {
        sharp().composite([{ input: 'test', left: 'invalid' }]);
      }, /Expected integer for left but received invalid of type string/);
      assert.throws(() => {
        sharp().composite([{ input: 'test', left: 'invalid', top: 10 }]);
      }, /Expected integer for left but received invalid of type string/);
    });

    it('invalid top', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', top: 0.5 }]);
      }, /Expected integer for top but received 0.5 of type number/);
      assert.throws(() => {
        sharp().composite([{ input: 'test', top: 'invalid' }]);
      }, /Expected integer for top but received invalid of type string/);
      assert.throws(() => {
        sharp().composite([{ input: 'test', top: 'invalid', left: 10 }]);
      }, /Expected integer for top but received invalid of type string/);
    });

    it('left but no top', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', left: 1 }]);
      }, /Expected both left and top to be set/);
    });

    it('top but no left', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', top: 1 }]);
      }, /Expected both left and top to be set/);
    });

    it('invalid gravity', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', gravity: 'invalid' }]);
      }, /Expected valid gravity for gravity but received invalid of type string/);
    });
  });

  it('Allow offset beyond bottom/right edge', async () => {
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

    assert.deepStrictEqual(red, { r, g, b });
  });
});
