// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

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

  describe('Animated WebP', function () {
    it('Before resize', function (done) {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .extract({ left: 0, top: 30, width: 80, height: 20 })
        .resize(320, 80)
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(320, info.width);
          assert.strictEqual(80 * 9, info.height);
          fixtures.assertSimilar(fixtures.expected('gravity-center-height.webp'), data, done);
        });
    });

    it('After resize', function (done) {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(320, 320)
        .extract({ left: 0, top: 120, width: 320, height: 80 })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(320, info.width);
          assert.strictEqual(80 * 9, info.height);
          fixtures.assertSimilar(fixtures.expected('gravity-center-height.webp'), data, done);
        });
    });
  });

  it('TIFF', function (done) {
    sharp(fixtures.inputTiff)
      .extract({ left: 34, top: 63, width: 341, height: 529 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(341, info.width);
        assert.strictEqual(529, info.height);
        fixtures.assertSimilar(fixtures.expected('extract.tiff'), data, done);
      });
  });

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
        fixtures.assertSimilar(fixtures.expected('rotate-extract.jpg'), data, done);
      });
  });

  it('Extract then rotate then extract', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .extract({ left: 20, top: 10, width: 180, height: 280 })
      .rotate(90)
      .extract({ left: 20, top: 10, width: 200, height: 100 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-rotate-extract.jpg'), data, done);
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
        fixtures.assertSimilar(fixtures.expected('rotate-extract-45.jpg'), data, done);
      });
  });

  describe('Apply exif orientation and mirroring then extract', () => {
    [
      {
        name: 'EXIF-1',
        image: fixtures.inputJpgWithLandscapeExif1
      },
      {
        name: 'EXIF-2',
        image: fixtures.inputJpgWithLandscapeExif2
      },
      {
        name: 'EXIF-3',
        image: fixtures.inputJpgWithLandscapeExif3
      },
      {
        name: 'EXIF-4',
        image: fixtures.inputJpgWithLandscapeExif4
      },
      {
        name: 'EXIF-5',
        image: fixtures.inputJpgWithLandscapeExif5
      },
      {
        name: 'EXIF-6',
        image: fixtures.inputJpgWithLandscapeExif6
      },
      {
        name: 'EXIF-7',
        image: fixtures.inputJpgWithLandscapeExif7
      },
      {
        name: 'EXIF-8',
        image: fixtures.inputJpgWithLandscapeExif8
      }
    ].forEach(({ name, image }) => {
      it(name, function (done) {
        sharp(image)
          .rotate()
          .extract({ left: 0, top: 208, width: 60, height: 40 })
          .toBuffer(function (err, data) {
            if (err) throw err;
            fixtures.assertSimilar(fixtures.expected('rotate-mirror-extract.jpg'), data, done);
          });
      });
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
          assert.strictEqual(err.message, 'extract_area: bad extract area');
          done();
        });
    });

    it('Multiple extract emits warning', () => {
      let warningMessage = '';
      const s = sharp();
      s.on('warning', function (msg) { warningMessage = msg; });
      const options = { top: 0, left: 0, width: 1, height: 1 };
      s.extract(options).extract(options);
      assert.strictEqual(warningMessage, '');
      s.extract(options);
      assert.strictEqual(warningMessage, 'ignoring previous extract options');
    });

    it('Multiple rotate+extract emits warning', () => {
      let warningMessage = '';
      const s = sharp().rotate();
      s.on('warning', function (msg) { warningMessage = msg; });
      const options = { top: 0, left: 0, width: 1, height: 1 };
      s.extract(options).extract(options);
      assert.strictEqual(warningMessage, '');
      s.extract(options);
      assert.strictEqual(warningMessage, 'ignoring previous extract options');
    });
  });
});
