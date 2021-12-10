'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Resize fit=contain', function () {
  it('Allows specifying the position as a string', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240, {
        fit: 'contain',
        position: 'center'
      })
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('embed-3-into-3.png'), data, done);
      });
  });

  it('JPEG within PNG, no alpha channel', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240, { fit: 'contain' })
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-3-into-3.png'), data, done);
      });
  });

  it('JPEG within WebP, to include alpha channel', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-3-into-4.webp'), data, done);
      });
  });

  it('PNG with alpha channel', function (done) {
    sharp(fixtures.inputPngWithTransparency)
      .resize(50, 50, { fit: 'contain' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(50, info.width);
        assert.strictEqual(50, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-4-into-4.png'), data, done);
      });
  });

  it('16-bit PNG with alpha channel', function (done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 16, { fit: 'contain' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-16bit.png'), data, done);
      });
  });

  it('16-bit PNG with alpha channel onto RGBA', function (done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-16bit-rgba.png'), data, done);
      });
  });

  it('PNG with 2 channels', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .resize(32, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-2channel.png'), data, done);
      });
  });

  it('TIFF in LAB colourspace onto RGBA background', function (done) {
    sharp(fixtures.inputTiffCielab)
      .resize(64, 128, {
        fit: 'contain',
        background: { r: 255, g: 102, b: 0, alpha: 0.5 }
      })
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(64, info.width);
        assert.strictEqual(128, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-lab-into-rgba.png'), data, done);
      });
  });

  it('Enlarge', function (done) {
    sharp(fixtures.inputPngWithOneColor)
      .resize(320, 240, { fit: 'contain' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-enlarge.png'), data, done);
      });
  });

  describe('Animated WebP', function () {
    it('Width only', function (done) {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(320, 240, {
          fit: 'contain',
          background: { r: 255, g: 0, b: 0 }
        })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240 * 9, info.height);
          assert.strictEqual(4, info.channels);
          fixtures.assertSimilar(fixtures.expected('embed-animated-width.webp'), data, done);
        });
    });

    it('Height only', function (done) {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(240, 320, {
          fit: 'contain',
          background: { r: 255, g: 0, b: 0 }
        })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(240, info.width);
          assert.strictEqual(320 * 9, info.height);
          assert.strictEqual(4, info.channels);
          fixtures.assertSimilar(fixtures.expected('embed-animated-height.webp'), data, done);
        });
    });
  });

  it('Invalid position values should fail', function () {
    [-1, 8.1, 9, 1000000, false, 'vallejo'].forEach(function (position) {
      assert.throws(function () {
        sharp().resize(null, null, { fit: 'contain', position });
      });
    });
  });

  it('Position horizontal top', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'top'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a2-n.png'), data, done);
      });
  });

  it('Position horizontal right top', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right top'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a3-ne.png'), data, done);
      });
  });

  it('Position horizontal right', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a4-e.png'), data, done);
      });
  });

  it('Position horizontal right bottom', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right bottom'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a5-se.png'), data, done);
      });
  });

  it('Position horizontal bottom', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'bottom'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a6-s.png'), data, done);
      });
  });

  it('Position horizontal left bottom', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left bottom'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a7-sw.png'), data, done);
      });
  });

  it('Position horizontal left', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a8-w.png'), data, done);
      });
  });

  it('Position horizontal left top', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left top'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a1-nw.png'), data, done);
      });
  });

  it('Position horizontal north', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.north
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a2-n.png'), data, done);
      });
  });

  it('Position horizontal northeast', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northeast
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a3-ne.png'), data, done);
      });
  });

  it('Position horizontal east', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.east
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a4-e.png'), data, done);
      });
  });

  it('Position horizontal southeast', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southeast
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a5-se.png'), data, done);
      });
  });

  it('Position horizontal south', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.south
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a6-s.png'), data, done);
      });
  });

  it('Position horizontal southwest', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southwest
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a7-sw.png'), data, done);
      });
  });

  it('Position horizontal west', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.west
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a8-w.png'), data, done);
      });
  });

  it('Position horizontal northwest', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northwest
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a1-nw.png'), data, done);
      });
  });

  it('Position horizontal center', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.center
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a9-c.png'), data, done);
      });
  });

  it('Position vertical top', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'top'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/2-n.png'), data, done);
      });
  });

  it('Position vertical right top', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right top'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/3-ne.png'), data, done);
      });
  });

  it('Position vertical right', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/4-e.png'), data, done);
      });
  });

  it('Position vertical right bottom', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right bottom'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/5-se.png'), data, done);
      });
  });

  it('Position vertical bottom', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'bottom'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/6-s.png'), data, done);
      });
  });

  it('Position vertical left bottom', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left bottom'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/7-sw.png'), data, done);
      });
  });

  it('Position vertical left', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/8-w.png'), data, done);
      });
  });

  it('Position vertical left top', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left top'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/1-nw.png'), data, done);
      });
  });

  it('Position vertical north', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.north
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/2-n.png'), data, done);
      });
  });

  it('Position vertical northeast', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northeast
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/3-ne.png'), data, done);
      });
  });

  it('Position vertical east', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.east
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/4-e.png'), data, done);
      });
  });

  it('Position vertical southeast', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southeast
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/5-se.png'), data, done);
      });
  });

  it('Position vertical south', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.south
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/6-s.png'), data, done);
      });
  });

  it('Position vertical southwest', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southwest
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/7-sw.png'), data, done);
      });
  });

  it('Position vertical west', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.west
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/8-w.png'), data, done);
      });
  });

  it('Position vertical northwest', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northwest
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/1-nw.png'), data, done);
      });
  });

  it('Position vertical center', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.center
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/9-c.png'), data, done);
      });
  });
});
