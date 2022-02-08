'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Resize dimensions', function () {
  it('Exact crop', function (done) {
    sharp(fixtures.inputJpg).resize(320, 240).toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  });

  it('Fixed width', function (done) {
    sharp(fixtures.inputJpg).resize(320).toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  });

  it('Fixed height', function (done) {
    sharp(fixtures.inputJpg).resize(null, 320).toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(392, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Identity transform', function (done) {
    sharp(fixtures.inputJpg).toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  });

  it('Upscale', function (done) {
    sharp(fixtures.inputJpg)
      .resize(3000)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3000, info.width);
        assert.strictEqual(2450, info.height);
        done();
      });
  });

  it('Invalid width - NaN', function () {
    assert.throws(function () {
      sharp().resize('spoons', 240);
    }, /Expected positive integer for width but received spoons of type string/);
  });

  it('Invalid height - NaN', function () {
    assert.throws(function () {
      sharp().resize(320, 'spoons');
    }, /Expected positive integer for height but received spoons of type string/);
  });

  it('Invalid width - float', function () {
    assert.throws(function () {
      sharp().resize(1.5, 240);
    }, /Expected positive integer for width but received 1.5 of type number/);
  });

  it('Invalid height - float', function () {
    assert.throws(function () {
      sharp().resize(320, 1.5);
    }, /Expected positive integer for height but received 1.5 of type number/);
  });

  it('Invalid width - via options', () => {
    assert.throws(() => {
      sharp().resize({ width: 1.5, height: 240 });
    }, /Expected positive integer for width but received 1.5 of type number/);
  });

  it('Invalid height - via options', () => {
    assert.throws(() => {
      sharp().resize({ width: 320, height: 1.5 });
    }, /Expected positive integer for height but received 1.5 of type number/);
  });

  it('Invalid width - too large', function (done) {
    sharp(fixtures.inputJpg)
      .resize(0x4000, 1)
      .webp()
      .toBuffer(function (err) {
        assert.strictEqual(true, err instanceof Error);
        assert.strictEqual('Processed image is too large for the WebP format', err.message);
        done();
      });
  });

  it('Invalid height - too large', function (done) {
    sharp(fixtures.inputJpg)
      .resize(1, 0x4000)
      .webp()
      .toBuffer(function (err) {
        assert.strictEqual(true, err instanceof Error);
        assert.strictEqual('Processed image is too large for the WebP format', err.message);
        done();
      });
  });

  it('WebP shrink-on-load rounds to zero, ensure recalculation is correct', function (done) {
    sharp(fixtures.inputJpg)
      .resize(1080, 607)
      .webp()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
        assert.strictEqual(1080, info.width);
        assert.strictEqual(607, info.height);
        sharp(data)
          .resize(233, 131)
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual('webp', info.format);
            assert.strictEqual(233, info.width);
            assert.strictEqual(131, info.height);
            done();
          });
      });
  });

  it('JPEG shrink-on-load with 90 degree rotation, ensure recalculation is correct', function (done) {
    sharp(fixtures.inputJpg)
      .resize(1920, 1280)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(1920, info.width);
        assert.strictEqual(1280, info.height);
        sharp(data)
          .rotate(90)
          .resize(533, 800)
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual(533, info.width);
            assert.strictEqual(800, info.height);
            done();
          });
      });
  });

  it('TIFF embed known to cause rounding errors', function (done) {
    sharp(fixtures.inputTiff)
      .resize(240, 320, { fit: sharp.fit.contain })
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(240, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('TIFF known to cause rounding errors', function (done) {
    sharp(fixtures.inputTiff)
      .resize(240, 320)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(240, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('fit=inside, portrait', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 320, { fit: sharp.fit.inside })
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(243, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('fit=outside, portrait', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 320, { fit: sharp.fit.outside })
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(422, info.height);
        done();
      });
  });

  it('fit=inside, landscape', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: sharp.fit.inside })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        done();
      });
  });

  it('fit=outside, landscape', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: sharp.fit.outside })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(392, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('fit=inside, provide only one dimension', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 320,
        fit: sharp.fit.inside
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        done();
      });
  });

  it('fit=outside, provide only one dimension', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 320,
        fit: sharp.fit.outside
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        done();
      });
  });

  it('Do not enlarge when input width is already less than output width', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 2800,
        withoutEnlargement: true
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do not enlarge when input height is already less than output height', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        height: 2300,
        withoutEnlargement: true
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do crop when fit = cover and withoutEnlargement = true and width >= outputWidth, and height < outputHeight', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 3000,
        height: 1000,
        withoutEnlargement: true
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(1000, info.height);
        done();
      });
  });

  it('Do crop when fit = cover and withoutEnlargement = true and width < outputWidth, and height >= outputHeight', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 1500,
        height: 2226,
        withoutEnlargement: true
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(1500, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do enlarge when input width is less than output width', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 2800,
        withoutEnlargement: false
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2800, info.width);
        assert.strictEqual(2286, info.height);
        done();
      });
  });

  it('Do enlarge when input width is less than output width', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 2800,
        withoutReduction: true
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2800, info.width);
        assert.strictEqual(2286, info.height);
        done();
      });
  });

  it('Do enlarge when input height is less than output height', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        height: 2300,
        withoutReduction: true
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2817, info.width);
        assert.strictEqual(2300, info.height);
        done();
      });
  });

  it('Do enlarge when input width is less than output width', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 2800,
        withoutReduction: false
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2800, info.width);
        assert.strictEqual(2286, info.height);
        done();
      });
  });

  it('Do not resize when both withoutEnlargement and withoutReduction are true', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: 'fill', withoutEnlargement: true, withoutReduction: true })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do not reduce size when fit = outside and withoutReduction are true and height > outputHeight and width > outputWidth', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: 'outside', withoutReduction: true })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do resize when fit = outside and withoutReduction are true and input height > height and input width > width ', function (done) {
    sharp(fixtures.inputJpg)
      .resize(3000, 3000, { fit: 'outside', withoutReduction: true })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3674, info.width);
        assert.strictEqual(3000, info.height);
        done();
      });
  });

  it('fit=fill, downscale width and height', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320, { fit: 'fill' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('fit=fill, downscale width', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        width: 320,
        fit: 'fill'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('fit=fill, downscale height', function (done) {
    sharp(fixtures.inputJpg)
      .resize({
        height: 320,
        fit: 'fill'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('fit=fill, upscale width and height', function (done) {
    sharp(fixtures.inputJpg)
      .resize(3000, 3000, { fit: 'fill' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3000, info.width);
        assert.strictEqual(3000, info.height);
        done();
      });
  });

  it('fit=fill, upscale width', function (done) {
    sharp(fixtures.inputJpg)
      .resize(3000, null, { fit: 'fill' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3000, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('fit=fill, upscale height', function (done) {
    sharp(fixtures.inputJpg)
      .resize(null, 3000, { fit: 'fill' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(3000, info.height);
        done();
      });
  });

  it('fit=fill, downscale width, upscale height', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 3000, { fit: 'fill' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(3000, info.height);
        done();
      });
  });

  it('fit=fill, upscale width, downscale height', function (done) {
    sharp(fixtures.inputJpg)
      .resize(3000, 320, { fit: 'fill' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3000, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('fit=fill, identity transform', function (done) {
    sharp(fixtures.inputJpg)
      .resize(null, null, { fit: 'fill' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Dimensions that result in differing even shrinks on each axis', function (done) {
    sharp(fixtures.inputJpg)
      .resize(645, 399)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(645, info.width);
        assert.strictEqual(399, info.height);
        sharp(data)
          .resize(150, 100)
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual(150, info.width);
            assert.strictEqual(100, info.height);
            fixtures.assertSimilar(fixtures.expected('resize-diff-shrink-even.jpg'), data, done);
          });
      });
  });

  it('Dimensions that result in differing odd shrinks on each axis', function (done) {
    return sharp(fixtures.inputJpg)
      .resize(600, 399)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(600, info.width);
        assert.strictEqual(399, info.height);
        sharp(data)
          .resize(200)
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual(200, info.width);
            assert.strictEqual(133, info.height);
            fixtures.assertSimilar(fixtures.expected('resize-diff-shrink-odd.jpg'), data, done);
          });
      });
  });

  [
    true,
    false
  ].forEach(function (value) {
    it(`fastShrinkOnLoad: ${value} does not causes image shifts`, function (done) {
      sharp(fixtures.inputJpgCenteredImage)
        .resize(9, 8, { fastShrinkOnLoad: value })
        .png()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(9, info.width);
          assert.strictEqual(8, info.height);
          fixtures.assertSimilar(fixtures.expected('fast-shrink-on-load.png'), data, done);
        });
    });
  });

  [
    sharp.kernel.nearest,
    sharp.kernel.cubic,
    sharp.kernel.mitchell,
    sharp.kernel.lanczos2,
    sharp.kernel.lanczos3
  ].forEach(function (kernel) {
    it(`kernel ${kernel}`, function (done) {
      sharp(fixtures.inputJpg)
        .resize(320, null, { kernel: kernel })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          fixtures.assertSimilar(fixtures.inputJpg, data, done);
        });
    });
  });

  it('nearest upsampling with integral factor', function (done) {
    sharp(fixtures.inputTiff8BitDepth)
      .resize(210, 210, { kernel: 'nearest' })
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(210, info.width);
        assert.strictEqual(210, info.height);
        done();
      });
  });

  it('Ensure shortest edge (height) is at least 1 pixel', function () {
    return sharp({
      create: {
        width: 10,
        height: 2,
        channels: 3,
        background: 'red'
      }
    })
      .resize(2)
      .toBuffer({ resolveWithObject: true })
      .then(function (output) {
        assert.strictEqual(2, output.info.width);
        assert.strictEqual(1, output.info.height);
      });
  });

  it('Ensure shortest edge (width) is at least 1 pixel', function () {
    return sharp({
      create: {
        width: 2,
        height: 10,
        channels: 3,
        background: 'red'
      }
    })
      .resize(null, 2)
      .toBuffer({ resolveWithObject: true })
      .then(function (output) {
        assert.strictEqual(1, output.info.width);
        assert.strictEqual(2, output.info.height);
      });
  });

  it('Ensure embedded shortest edge (height) is at least 1 pixel', function () {
    return sharp({
      create: {
        width: 200,
        height: 1,
        channels: 3,
        background: 'red'
      }
    })
      .resize({ width: 50, height: 50, fit: sharp.fit.contain })
      .toBuffer({ resolveWithObject: true })
      .then(function (output) {
        assert.strictEqual(50, output.info.width);
        assert.strictEqual(50, output.info.height);
      });
  });

  it('Ensure embedded shortest edge (width) is at least 1 pixel', function () {
    return sharp({
      create: {
        width: 1,
        height: 200,
        channels: 3,
        background: 'red'
      }
    })
      .resize({ width: 50, height: 50, fit: sharp.fit.contain })
      .toBuffer({ resolveWithObject: true })
      .then(function (output) {
        assert.strictEqual(50, output.info.width);
        assert.strictEqual(50, output.info.height);
      });
  });

  it('Skip shrink-on-load where one dimension <4px', async () => {
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

    assert.strictEqual(info.width, 8);
    assert.strictEqual(info.height, 1);
  });

  it('Skip JPEG shrink-on-load for known libjpeg rounding errors', async () => {
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
    assert.strictEqual(width, 500);
    assert.strictEqual(height, 334);
  });

  it('unknown kernel throws', function () {
    assert.throws(function () {
      sharp().resize(null, null, { kernel: 'unknown' });
    });
  });

  it('unknown fit throws', function () {
    assert.throws(function () {
      sharp().resize(null, null, { fit: 'unknown' });
    });
  });

  it('unknown position throws', function () {
    assert.throws(function () {
      sharp().resize(null, null, { position: 'unknown' });
    });
  });
});
