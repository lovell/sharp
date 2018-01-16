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

  it('TIFF embed known to cause rounding errors', function (done) {
    sharp(fixtures.inputTiff)
      .resize(240, 320)
      .embed()
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

  it('Max width or height considering ratio (portrait)', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 320)
      .max()
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

  it('Min width or height considering ratio (portrait)', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 320)
      .min()
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

  it('Max width or height considering ratio (landscape)', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320)
      .max()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        done();
      });
  });

  it('Provide only one dimension with max, should default to crop', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .max()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        done();
      });
  });

  it('Min width or height considering ratio (landscape)', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320)
      .min()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(392, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('Provide only one dimension with min, should default to crop', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .min()
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
      .resize(2800)
      .withoutEnlargement()
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
      .resize(null, 2300)
      .withoutEnlargement()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do enlarge when input width is less than output width', function (done) {
    sharp(fixtures.inputJpg)
      .resize(2800)
      .withoutEnlargement(false)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2800, info.width);
        assert.strictEqual(2286, info.height);
        done();
      });
  });

  it('Downscale width and height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).resize(320, 320).ignoreAspectRatio().toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Downscale width, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).resize(320).ignoreAspectRatio().toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  });

  it('Downscale height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).resize(null, 320).ignoreAspectRatio().toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Upscale width and height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).resize(3000, 3000).ignoreAspectRatio().toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(3000, info.height);
      done();
    });
  });

  it('Upscale width, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).resize(3000).ignoreAspectRatio().toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  });

  it('Upscale height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).resize(null, 3000).ignoreAspectRatio().toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(3000, info.height);
      done();
    });
  });

  it('Downscale width, upscale height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).resize(320, 3000).ignoreAspectRatio().toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(3000, info.height);
      done();
    });
  });

  it('Upscale width, downscale height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).resize(3000, 320).ignoreAspectRatio().toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Identity transform, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg).ignoreAspectRatio().toBuffer(function (err, data, info) {
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

  it('fastShrinkOnLoad: false ensures image is not shifted', function (done) {
    return sharp(fixtures.inputJpgCenteredImage)
      .resize(9, 8, { fastShrinkOnLoad: false })
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(9, info.width);
        assert.strictEqual(8, info.height);
        fixtures.assertSimilar(fixtures.expected('fast-shrink-on-load-false.png'), data, done);
      });
  });

  it('fastShrinkOnLoad: true (default) might result in shifted image', function (done) {
    return sharp(fixtures.inputJpgCenteredImage)
      .resize(9, 8)
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(9, info.width);
        assert.strictEqual(8, info.height);
        fixtures.assertSimilar(fixtures.expected('fast-shrink-on-load-true.png'), data, done);
      });
  });

  [
    sharp.kernel.nearest,
    sharp.kernel.cubic,
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

  it('unknown kernel throws', function () {
    assert.throws(function () {
      sharp().resize(null, null, { kernel: 'unknown' });
    });
  });
});
