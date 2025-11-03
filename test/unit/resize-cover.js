/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Resize fit=cover', () => {
  [
    // Position
    {
      name: 'Position: top',
      width: 320,
      height: 80,
      gravity: sharp.position.top,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Position: right',
      width: 80,
      height: 320,
      gravity: sharp.position.right,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Position: bottom',
      width: 320,
      height: 80,
      gravity: sharp.position.bottom,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Position: left',
      width: 80,
      height: 320,
      gravity: sharp.position.left,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Position: right top (top)',
      width: 320,
      height: 80,
      gravity: sharp.position['right top'],
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Position: right top (right)',
      width: 80,
      height: 320,
      gravity: sharp.position['right top'],
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Position: right bottom (bottom)',
      width: 320,
      height: 80,
      gravity: sharp.position['right bottom'],
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Position: right bottom (right)',
      width: 80,
      height: 320,
      gravity: sharp.position['right bottom'],
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Position: left bottom (bottom)',
      width: 320,
      height: 80,
      gravity: sharp.position['left bottom'],
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Position: left bottom (left)',
      width: 80,
      height: 320,
      gravity: sharp.position['left bottom'],
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Position: left top (top)',
      width: 320,
      height: 80,
      gravity: sharp.position['left top'],
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Position: left top (left)',
      width: 80,
      height: 320,
      gravity: sharp.position['left top'],
      fixture: 'gravity-west.jpg'
    },
    // Gravity
    {
      name: 'Gravity: north',
      width: 320,
      height: 80,
      gravity: sharp.gravity.north,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Gravity: east',
      width: 80,
      height: 320,
      gravity: sharp.gravity.east,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Gravity: south',
      width: 320,
      height: 80,
      gravity: sharp.gravity.south,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Gravity: west',
      width: 80,
      height: 320,
      gravity: sharp.gravity.west,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Gravity: center',
      width: 320,
      height: 80,
      gravity: sharp.gravity.center,
      fixture: 'gravity-center.jpg'
    },
    {
      name: 'Gravity: centre',
      width: 80,
      height: 320,
      gravity: sharp.gravity.centre,
      fixture: 'gravity-centre.jpg'
    },
    {
      name: 'Default (centre)',
      width: 80,
      height: 320,
      gravity: undefined,
      fixture: 'gravity-centre.jpg'
    },
    {
      name: 'Gravity: northeast (north)',
      width: 320,
      height: 80,
      gravity: sharp.gravity.northeast,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Gravity: northeast (east)',
      width: 80,
      height: 320,
      gravity: sharp.gravity.northeast,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Gravity: southeast (south)',
      width: 320,
      height: 80,
      gravity: sharp.gravity.southeast,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Gravity: southeast (east)',
      width: 80,
      height: 320,
      gravity: sharp.gravity.southeast,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Gravity: southwest (south)',
      width: 320,
      height: 80,
      gravity: sharp.gravity.southwest,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Gravity: southwest (west)',
      width: 80,
      height: 320,
      gravity: sharp.gravity.southwest,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Gravity: northwest (north)',
      width: 320,
      height: 80,
      gravity: sharp.gravity.northwest,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Gravity: northwest (west)',
      width: 80,
      height: 320,
      gravity: sharp.gravity.northwest,
      fixture: 'gravity-west.jpg'
    }
  ].forEach((settings) => {
    it(settings.name, (_t, done) => {
      sharp(fixtures.inputJpg)
        .resize(settings.width, settings.height, {
          fit: sharp.fit.cover,
          position: settings.gravity
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual(settings.width, info.width);
          assert.strictEqual(settings.height, info.height);
          fixtures.assertSimilar(fixtures.expected(settings.fixture), data, done);
        });
    });
  });

  it('Allows specifying the gravity as a string', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(80, 320, {
        fit: sharp.fit.cover,
        position: 'east'
      })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-east.jpg'), data, done);
      });
  });

  it('Invalid position values fail', () => {
    assert.throws(() => {
      sharp().resize(null, null, { fit: 'cover', position: 9 });
    }, /Expected valid position\/gravity\/strategy for position but received 9 of type number/);
    assert.throws(() => {
      sharp().resize(null, null, { fit: 'cover', position: 1.1 });
    }, /Expected valid position\/gravity\/strategy for position but received 1.1 of type number/);
    assert.throws(() => {
      sharp().resize(null, null, { fit: 'cover', position: -1 });
    }, /Expected valid position\/gravity\/strategy for position but received -1 of type number/);
    assert.throws(() => {
      sharp().resize(null, null, { fit: 'cover', position: 'zoinks' }).crop();
    }, /Expected valid position\/gravity\/strategy for position but received zoinks of type string/);
  });

  it('Uses default value when none specified', () => {
    assert.doesNotThrow(() => {
      sharp().resize(null, null, { fit: 'cover' });
    });
  });

  it('Skip crop when post-resize dimensions are at target', () => sharp(fixtures.inputJpg)
      .resize(1600, 1200)
      .toBuffer()
      .then((input) => sharp(input)
          .resize(1110, null, {
            fit: sharp.fit.cover,
            position: sharp.strategy.attention
          })
          .toBuffer({ resolveWithObject: true })
          .then((result) => {
            assert.strictEqual(1110, result.info.width);
            assert.strictEqual(832, result.info.height);
            assert.strictEqual(undefined, result.info.cropOffsetLeft);
            assert.strictEqual(undefined, result.info.cropOffsetTop);
          })));

  describe('Animated WebP', () => {
    it('Width only', (_t, done) => {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(80, 320, { fit: sharp.fit.cover })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual(80, info.width);
          assert.strictEqual(320 * 9, info.height);
          fixtures.assertSimilar(fixtures.expected('gravity-center-width.webp'), data, done);
        });
    });

    it('Height only', (_t, done) => {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(320, 80, { fit: sharp.fit.cover })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual(320, info.width);
          assert.strictEqual(80 * 9, info.height);
          fixtures.assertSimilar(fixtures.expected('gravity-center-height.webp'), data, done);
        });
    });
  });

  describe('Entropy-based strategy', () => {
    it('JPEG', (_t, done) => {
      sharp(fixtures.inputJpg)
        .resize(80, 320, {
          fit: 'cover',
          position: sharp.strategy.entropy
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          assert.strictEqual(80, info.width);
          assert.strictEqual(320, info.height);
          assert.strictEqual(-117, info.cropOffsetLeft);
          assert.strictEqual(0, info.cropOffsetTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy-entropy.jpg'), data, done);
        });
    });

    it('PNG', (_t, done) => {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: sharp.strategy.entropy
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual('png', info.format);
          assert.strictEqual(4, info.channels);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          assert.strictEqual(0, info.cropOffsetLeft);
          assert.strictEqual(-80, info.cropOffsetTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data, done);
        });
    });

    it('supports the strategy passed as a string', (_t, done) => {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: 'entropy'
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual('png', info.format);
          assert.strictEqual(4, info.channels);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          assert.strictEqual(0, info.cropOffsetLeft);
          assert.strictEqual(-80, info.cropOffsetTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data, done);
        });
    });

    it('Animated image rejects', () =>
      assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
        .resize({
          width: 100,
          height: 8,
          position: sharp.strategy.entropy
        })
        .toBuffer(),
      /Resize strategy is not supported for multi-page images/
      )
    );
  });

  describe('Attention strategy', () => {
    it('JPEG', (_t, done) => {
      sharp(fixtures.inputJpg)
        .resize(80, 320, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          assert.strictEqual(80, info.width);
          assert.strictEqual(320, info.height);
          assert.strictEqual(-107, info.cropOffsetLeft);
          assert.strictEqual(0, info.cropOffsetTop);
          assert.strictEqual(588, info.attentionX);
          assert.strictEqual(640, info.attentionY);
          fixtures.assertSimilar(fixtures.expected('crop-strategy-attention.jpg'), data, done);
        });
    });

    it('PNG', (_t, done) => {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual('png', info.format);
          assert.strictEqual(4, info.channels);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          assert.strictEqual(0, info.cropOffsetLeft);
          assert.strictEqual(0, info.cropOffsetTop);
          assert.strictEqual(0, info.attentionX);
          assert.strictEqual(0, info.attentionY);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data, done);
        });
    });

    it('WebP', (_t, done) => {
      sharp(fixtures.inputWebP)
        .resize(320, 80, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual('webp', info.format);
          assert.strictEqual(3, info.channels);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          assert.strictEqual(0, info.cropOffsetLeft);
          assert.strictEqual(-161, info.cropOffsetTop);
          assert.strictEqual(288, info.attentionX);
          assert.strictEqual(745, info.attentionY);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.webp'), data, done);
        });
    });

    it('supports the strategy passed as a string', (_t, done) => {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: 'attention'
        })
        .toBuffer((err, data, info) => {
          if (err) throw err;
          assert.strictEqual('png', info.format);
          assert.strictEqual(4, info.channels);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          assert.strictEqual(0, info.cropOffsetLeft);
          assert.strictEqual(0, info.cropOffsetTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data, done);
        });
    });

    it('Animated image rejects', () =>
      assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
        .resize({
          width: 100,
          height: 8,
          position: sharp.strategy.attention
        })
        .toBuffer(),
      /Resize strategy is not supported for multi-page images/
      )
    );
  });
});
