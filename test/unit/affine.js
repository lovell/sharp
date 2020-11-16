'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Affine transform', () => {
  describe('Invalid input', () => {
    it('Missing matrix', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine();
      });
    });
    it('Invalid 1d matrix', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine(['123', 123, 123, 123]);
      });
    });
    it('Invalid 2d matrix', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[123, 123], [null, 123]]);
      });
    });
    it('Invalid options parameter type', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[1, 0], [0, 1]], 'invalid options type');
      });
    });
    it('Invalid background color', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([4, 4, 4, 4], { background: 'not a color' });
      });
    });
    it('Invalid idx offset type', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[4, 4], [4, 4]], { idx: 'invalid idx type' });
      });
    });
    it('Invalid idy offset type', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([4, 4, 4, 4], { idy: 'invalid idy type' });
      });
    });
    it('Invalid odx offset type', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[4, 4], [4, 4]], { odx: 'invalid odx type' });
      });
    });
    it('Invalid ody offset type', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[4, 4], [4, 4]], { ody: 'invalid ody type' });
      });
    });
    it('Invalid interpolator', () => {
      assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[4, 4], [4, 4]], { interpolator: 'cubic' });
      });
    });
  });
  it('Applies identity matrix', done => {
    const input = fixtures.inputJpg;
    sharp(input)
      .affine([[1, 0], [0, 1]])
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(input, data, done);
      });
  });
  it('Applies resize affine matrix', done => {
    const input = fixtures.inputJpg;
    const inputWidth = 2725;
    const inputHeight = 2225;
    sharp(input)
      .affine([[0.2, 0], [0, 1.5]])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        fixtures.assertSimilar(input, data, done);
        assert.strictEqual(info.width, Math.ceil(inputWidth * 0.2));
        assert.strictEqual(info.height, Math.ceil(inputHeight * 1.5));
      });
  });
  it('Resizes and applies affine transform', done => {
    const input = fixtures.inputJpg;
    sharp(input)
      .resize(500, 500)
      .affine([[0.5, 1], [1, 0.5]])
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(data, fixtures.expected('affine-resize-expected.jpg'), done);
      });
  });
  it('Extracts and applies affine transform', done => {
    sharp(fixtures.inputJpg)
      .extract({ left: 300, top: 300, width: 600, height: 600 })
      .affine([0.3, 0, -0.5, 0.3])
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(data, fixtures.expected('affine-extract-expected.jpg'), done);
      });
  });
  it('Rotates and applies affine transform', done => {
    sharp(fixtures.inputJpg320x240)
      .rotate(90)
      .affine([[-1.2, 0], [0, -1.2]])
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(data, fixtures.expected('affine-rotate-expected.jpg'), done);
      });
  });
  it('Extracts, rotates and applies affine transform', done => {
    sharp(fixtures.inputJpg)
      .extract({ left: 1000, top: 1000, width: 200, height: 200 })
      .rotate(45, { background: 'blue' })
      .affine([[2, 1], [2, -0.5]], { background: 'red' })
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('affine-extract-rotate-expected.jpg'), data, done);
      });
  });
  it('Applies affine transform with background color', done => {
    sharp(fixtures.inputJpg320x240)
      .rotate(180)
      .affine([[-1.5, 1.2], [-1, 1]], { background: 'red' })
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('affine-background-expected.jpg'), data, done);
      });
  });
  it('Applies affine transform with background color and output offsets', done => {
    sharp(fixtures.inputJpg320x240)
      .rotate(180)
      .affine([[-2, 1.5], [-1, 2]], { background: 'blue', odx: 40, ody: -100 })
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('affine-background-output-offsets-expected.jpg'), data, done);
      });
  });
  it('Applies affine transform with background color and all offsets', done => {
    sharp(fixtures.inputJpg320x240)
      .rotate(180)
      .affine([[-1.2, 1.8], [-1, 2]], { background: 'yellow', idx: 10, idy: -40, odx: 10, ody: -50 })
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('affine-background-all-offsets-expected.jpg'), data, done);
      });
  });
  describe('Interpolations', () => {
    const input = fixtures.inputJpg320x240;
    const inputWidth = 320;
    const inputHeight = 240;
    for (const interp in sharp.interpolators) {
      it(`Performs 2x upscale with ${interp} interpolation`, done => {
        sharp(input)
          .affine([[2, 0], [0, 2]], { interpolator: sharp.interpolators[interp] })
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual(info.width, Math.ceil(inputWidth * 2));
            assert.strictEqual(info.height, Math.ceil(inputHeight * 2));
            fixtures.assertSimilar(fixtures.expected(`affine-${sharp.interpolators[interp]}-2x-upscale-expected.jpg`), data, done);
          });
      });
    }
  });
});
