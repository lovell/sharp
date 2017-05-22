'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Interpolators and kernels', function () {
  describe('Reducers', function () {
    [
      sharp.kernel.nearest,
      sharp.kernel.cubic,
      sharp.kernel.lanczos2,
      sharp.kernel.lanczos3
    ].forEach(function (kernel) {
      it(kernel, function (done) {
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
  });

  describe('Enlargers', function () {
    [
      sharp.interpolator.nearest,
      sharp.interpolator.bilinear,
      sharp.interpolator.bicubic,
      sharp.interpolator.nohalo,
      sharp.interpolator.locallyBoundedBicubic,
      sharp.interpolator.vertexSplitQuadraticBasisSpline
    ].forEach(function (interpolator) {
      describe(interpolator, function () {
        it('x and y', function (done) {
          sharp(fixtures.inputTiff8BitDepth)
            .resize(200, 200, { interpolator: interpolator })
            .png()
            .toBuffer(function (err, data, info) {
              if (err) throw err;
              assert.strictEqual(200, info.width);
              assert.strictEqual(200, info.height);
              done();
            });
        });
        it('x only', function (done) {
          sharp(fixtures.inputTiff8BitDepth)
            .resize(200, 21, { interpolator: interpolator })
            .png()
            .toBuffer(function (err, data, info) {
              if (err) throw err;
              assert.strictEqual(200, info.width);
              assert.strictEqual(21, info.height);
              done();
            });
        });
        it('y only', function (done) {
          sharp(fixtures.inputTiff8BitDepth)
            .resize(21, 200, { interpolator: interpolator })
            .png()
            .toBuffer(function (err, data, info) {
              if (err) throw err;
              assert.strictEqual(21, info.width);
              assert.strictEqual(200, info.height);
              done();
            });
        });
      });
    });

    it('nearest with integral factor', function (done) {
      sharp(fixtures.inputTiff8BitDepth)
        .resize(210, 210, { interpolator: 'nearest' })
        .png()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(210, info.width);
          assert.strictEqual(210, info.height);
          done();
        });
    });
  });

  it('unknown kernel throws', function () {
    assert.throws(function () {
      sharp().resize(null, null, { kernel: 'unknown' });
    });
  });

  it('unknown interpolator throws', function () {
    assert.throws(function () {
      sharp().resize(null, null, { interpolator: 'unknown' });
    });
  });
});
