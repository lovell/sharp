/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Resize fit=contain', () => {
  it('Allows specifying the position as a string', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240, {
        fit: 'contain',
        position: 'center'
      })
      .png()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('embed-3-into-3.png'), data, done);
      });
  });

  it('JPEG within PNG, no alpha channel', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240, { fit: 'contain' })
      .png()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-3-into-3.png'), data, done);
      });
  });

  it('JPEG within WebP, to include alpha channel', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-3-into-4.webp'), data, done);
      });
  });

  it('PNG with alpha channel', (_t, done) => {
    sharp(fixtures.inputPngWithTransparency)
      .resize(50, 50, { fit: 'contain' })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(50, info.width);
        assert.strictEqual(50, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-4-into-4.png'), data, done);
      });
  });

  it('16-bit PNG with alpha channel', (_t, done) => {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 16, { fit: 'contain' })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-16bit.png'), data, done);
      });
  });

  it('16-bit PNG with alpha channel onto RGBA', (_t, done) => {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-16bit-rgba.png'), data, done);
      });
  });

  it('PNG with 2 channels', (_t, done) => {
    sharp(fixtures.inputPngWithGreyAlpha)
      .resize(32, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-2channel.png'), data, done);
      });
  });

  it('TIFF in LAB colourspace onto RGBA background', (_t, done) => {
    sharp(fixtures.inputTiffCielab)
      .resize(64, 128, {
        fit: 'contain',
        background: { r: 255, g: 102, b: 0, alpha: 0.5 }
      })
      .png()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(64, info.width);
        assert.strictEqual(128, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-lab-into-rgba.png'), data, done);
      });
  });

  it('Enlarge', (_t, done) => {
    sharp(fixtures.inputPngWithOneColor)
      .resize(320, 240, { fit: 'contain' })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-enlarge.png'), data, done);
      });
  });

  describe('Animated WebP', () => {
    it('Width only', (_t, done) => {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(320, 240, {
          fit: 'contain',
          background: { r: 255, g: 0, b: 0 }
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240 * 9, info.height);
          assert.strictEqual(4, info.channels);
          fixtures.assertSimilar(fixtures.expected('embed-animated-width.webp'), data, done);
        });
    });

    it('Height only', (_t, done) => {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(240, 320, {
          fit: 'contain',
          background: { r: 255, g: 0, b: 0 }
        })
        .toBuffer((err, data, info) => {
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

  it('Invalid position values should fail', () => {
    [-1, 8.1, 9, 1000000, false, 'vallejo'].forEach((position) => {
      assert.throws(() => {
        sharp().resize(null, null, { fit: 'contain', position });
      });
    });
  });

  it('Position horizontal top', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'top'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a2-n.png'), data, done);
      });
  });

  it('Position horizontal right top', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right top'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a3-ne.png'), data, done);
      });
  });

  it('Position horizontal right', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a4-e.png'), data, done);
      });
  });

  it('Position horizontal right bottom', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right bottom'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a5-se.png'), data, done);
      });
  });

  it('Position horizontal bottom', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'bottom'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a6-s.png'), data, done);
      });
  });

  it('Position horizontal left bottom', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left bottom'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a7-sw.png'), data, done);
      });
  });

  it('Position horizontal left', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a8-w.png'), data, done);
      });
  });

  it('Position horizontal left top', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left top'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a1-nw.png'), data, done);
      });
  });

  it('Position horizontal north', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.north
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a2-n.png'), data, done);
      });
  });

  it('Position horizontal northeast', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northeast
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a3-ne.png'), data, done);
      });
  });

  it('Position horizontal east', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.east
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a4-e.png'), data, done);
      });
  });

  it('Position horizontal southeast', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southeast
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a5-se.png'), data, done);
      });
  });

  it('Position horizontal south', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.south
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a6-s.png'), data, done);
      });
  });

  it('Position horizontal southwest', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southwest
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a7-sw.png'), data, done);
      });
  });

  it('Position horizontal west', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.west
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a8-w.png'), data, done);
      });
  });

  it('Position horizontal northwest', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northwest
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a1-nw.png'), data, done);
      });
  });

  it('Position horizontal center', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.center
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(100, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a9-c.png'), data, done);
      });
  });

  it('Position vertical top', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'top'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/2-n.png'), data, done);
      });
  });

  it('Position vertical right top', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right top'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/3-ne.png'), data, done);
      });
  });

  it('Position vertical right', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/4-e.png'), data, done);
      });
  });

  it('Position vertical right bottom', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right bottom'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/5-se.png'), data, done);
      });
  });

  it('Position vertical bottom', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'bottom'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/6-s.png'), data, done);
      });
  });

  it('Position vertical left bottom', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left bottom'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/7-sw.png'), data, done);
      });
  });

  it('Position vertical left', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/8-w.png'), data, done);
      });
  });

  it('Position vertical left top', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left top'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/1-nw.png'), data, done);
      });
  });

  it('Position vertical north', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.north
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/2-n.png'), data, done);
      });
  });

  it('Position vertical northeast', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northeast
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/3-ne.png'), data, done);
      });
  });

  it('Position vertical east', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.east
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/4-e.png'), data, done);
      });
  });

  it('Position vertical southeast', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southeast
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/5-se.png'), data, done);
      });
  });

  it('Position vertical south', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.south
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/6-s.png'), data, done);
      });
  });

  it('Position vertical southwest', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southwest
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/7-sw.png'), data, done);
      });
  });

  it('Position vertical west', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.west
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/8-w.png'), data, done);
      });
  });

  it('Position vertical northwest', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northwest
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/1-nw.png'), data, done);
      });
  });

  it('Position vertical center', (_t, done) => {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.center
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('./embedgravitybird/9-c.png'), data, done);
      });
  });

  it('multiple alpha channels', async () => {
    const create = {
      width: 20,
      height: 12,
      channels: 4,
      background: 'green'
    };
    const multipleAlphaChannels = await sharp({ create })
      .joinChannel({ create })
      .tiff({ compression: 'deflate' })
      .toBuffer();

    const data = await sharp(multipleAlphaChannels)
      .resize({
        width: 8,
        height: 8,
        fit: 'contain',
        background: 'blue'
      })
      .tiff({ compression: 'deflate' })
      .toBuffer();
    const { format, width, height, space, channels } = await sharp(data).metadata();
    assert.deepStrictEqual(format, 'tiff');
    assert.deepStrictEqual(width, 8);
    assert.deepStrictEqual(height, 8);
    assert.deepStrictEqual(space, 'srgb');
    assert.deepStrictEqual(channels, 8);
  });
});
