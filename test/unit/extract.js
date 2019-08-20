'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Partial image extraction', function () {
  it('JPEG', function (done) {
    sharp(fixtures.inputJpg)
      .extract({ left: 2, top: 2, width: 20, height: 20 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(20, info.width);
        assert.strictEqual(20, info.height);
        fixtures.assertSimilar(fixtures.expected('extract.jpg'), data, done);
      });
  });

  it('PNG', function (done) {
    sharp(fixtures.inputPng)
      .extract({ left: 200, top: 300, width: 400, height: 200 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(400, info.width);
        assert.strictEqual(200, info.height);
        fixtures.assertSimilar(fixtures.expected('extract.png'), data, done);
      });
  });

  if (sharp.format.webp.output.file) {
    it('WebP', function (done) {
      sharp(fixtures.inputWebP)
        .extract({ left: 100, top: 50, width: 125, height: 200 })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(125, info.width);
          assert.strictEqual(200, info.height);
          fixtures.assertSimilar(fixtures.expected('extract.webp'), data, done);
        });
    });
  }

  if (sharp.format.tiff.output.file) {
    it('TIFF', function (done) {
      sharp(fixtures.inputTiff)
        .extract({ left: 34, top: 63, width: 341, height: 529 })
        .jpeg()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(341, info.width);
          assert.strictEqual(529, info.height);
          fixtures.assertSimilar(fixtures.expected('extract.tiff'), data, done);
        });
    });
  }

  it('Before resize', function (done) {
    sharp(fixtures.inputJpg)
      .extract({ left: 10, top: 10, width: 10, height: 500 })
      .resize(100, 100)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-resize.jpg'), data, done);
      });
  });

  it('After resize and crop', function (done) {
    sharp(fixtures.inputJpg)
      .resize(500, 500, {
        position: sharp.gravity.north
      })
      .extract({ left: 10, top: 10, width: 100, height: 100 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('resize-crop-extract.jpg'), data, done);
      });
  });

  it('Before and after resize and crop', function (done) {
    sharp(fixtures.inputJpg)
      .extract({ left: 0, top: 0, width: 700, height: 700 })
      .resize(500, 500, {
        position: sharp.gravity.north
      })
      .extract({ left: 10, top: 10, width: 100, height: 100 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-resize-crop-extract.jpg'), data, done);
      });
  });

  it('Extract then rotate', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .extract({ left: 20, top: 10, width: 380, height: 280 })
      .rotate(90)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(280, info.width);
        assert.strictEqual(380, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-rotate.jpg'), data, done);
      });
  });

  it('Rotate then extract', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .rotate(90)
      .extract({ left: 20, top: 10, width: 280, height: 380 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(280, info.width);
        assert.strictEqual(380, info.height);
        fixtures.assertSimilar(fixtures.expected('rotate-extract.jpg'), data, { threshold: 7 }, done);
      });
  });

  it('Extract then rotate non-90 anagle', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .extract({ left: 20, top: 10, width: 380, height: 280 })
      .rotate(45)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(467, info.width);
        assert.strictEqual(467, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-rotate-45.jpg'), data, done);
      });
  });

  it('Rotate then extract non-90 angle', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .rotate(45)
      .extract({ left: 20, top: 10, width: 380, height: 280 })
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(380, info.width);
        assert.strictEqual(280, info.height);
        fixtures.assertSimilar(fixtures.expected('rotate-extract-45.jpg'), data, { threshold: 7 }, done);
      });
  });

  describe('Invalid parameters', function () {
    describe('using the legacy extract(top,left,width,height) syntax', function () {
      it('String top', function () {
        assert.throws(function () {
          sharp(fixtures.inputJpg).extract('spoons', 10, 10, 10);
        });
      });

      it('Non-integral left', function () {
        assert.throws(function () {
          sharp(fixtures.inputJpg).extract(10, 10.2, 10, 10);
        });
      });

      it('Negative width - negative', function () {
        assert.throws(function () {
          sharp(fixtures.inputJpg).extract(10, 10, -10, 10);
        });
      });

      it('Null height', function () {
        assert.throws(function () {
          sharp(fixtures.inputJpg).extract(10, 10, 10, null);
        });
      });
    });

    it('Undefined', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).extract();
      });
    });

    it('String top', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).extract({ left: 10, top: 'spoons', width: 10, height: 10 });
      });
    });

    it('Non-integral left', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).extract({ left: 10.2, top: 10, width: 10, height: 10 });
      });
    });

    it('Negative width - negative', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).extract({ left: 10, top: 10, width: -10, height: 10 });
      });
    });

    it('Null height', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).extract({ left: 10, top: 10, width: 10, height: null });
      });
    });

    it('Bad image area', function (done) {
      sharp(fixtures.inputJpg)
        .extract({ left: 3000, top: 10, width: 10, height: 10 })
        .toBuffer(function (err) {
          assert(err instanceof Error);
          assert.strictEqual(err.message, 'extract_area: bad extract area\n');
          done();
        });
    });
  });
});
