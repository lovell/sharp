'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Rotation', function () {
  ['Landscape', 'Portrait'].forEach(function (orientation) {
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(function (exifTag) {
      it('Input image has Orientation EXIF tag value of (' + exifTag + '), auto-rotate', function (done) {
        sharp(fixtures['inputJpgWith' + orientation + 'Exif' + exifTag])
          .rotate()
          .resize(320)
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(320, info.width);
            assert.strictEqual(orientation === 'Landscape' ? 240 : 427, info.height);
            fixtures.assertSimilar(fixtures.expected(orientation + '_' + exifTag + '-out.jpg'), data, done);
          });
      });
    });
  });

  it('Rotate by 30 degrees with semi-transparent background', function (done) {
    sharp(fixtures.inputJpg)
      .rotate(30, { background: { r: 255, g: 0, b: 0, alpha: 0.5 } })
      .resize(320)
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
      .rotate(30, { background: { r: 255, g: 0, b: 0, alpha: 0.5 } })
      .resize(320)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(408, info.width);
        assert.strictEqual(386, info.height);
        fixtures.assertSimilar(fixtures.expected('rotate-solid-bg.jpg'), data, done);
      });
  });

  it('Rotate by 90 degrees, respecting output input size', function (done) {
    sharp(fixtures.inputJpg).rotate(90).resize(320, 240).toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  });

  it('Rotate by 30 degrees, respecting output input size', function (done) {
    sharp(fixtures.inputJpg).rotate(30).resize(320, 240).toBuffer(function (err, data, info) {
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
      .resize(320, 240, { fit: sharp.fit.fill })
      .rotate(270)
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
});
