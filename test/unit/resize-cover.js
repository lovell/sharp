'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Resize fit=cover', function () {
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
  ].forEach(function (settings) {
    it(settings.name, function (done) {
      sharp(fixtures.inputJpg)
        .resize(settings.width, settings.height, {
          fit: sharp.fit.cover,
          position: settings.gravity
        })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(settings.width, info.width);
          assert.strictEqual(settings.height, info.height);
          fixtures.assertSimilar(fixtures.expected(settings.fixture), data, done);
        });
    });
  });

  it('Allows specifying the gravity as a string', function (done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320, {
        fit: sharp.fit.cover,
        position: 'east'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-east.jpg'), data, done);
      });
  });

  it('Invalid position values fail', function () {
    assert.throws(function () {
      sharp().resize(null, null, { fit: 'cover', position: 9 });
    }, /Expected valid position\/gravity\/strategy for position but received 9 of type number/);
    assert.throws(function () {
      sharp().resize(null, null, { fit: 'cover', position: 1.1 });
    }, /Expected valid position\/gravity\/strategy for position but received 1.1 of type number/);
    assert.throws(function () {
      sharp().resize(null, null, { fit: 'cover', position: -1 });
    }, /Expected valid position\/gravity\/strategy for position but received -1 of type number/);
    assert.throws(function () {
      sharp().resize(null, null, { fit: 'cover', position: 'zoinks' }).crop();
    }, /Expected valid position\/gravity\/strategy for position but received zoinks of type string/);
  });

  it('Uses default value when none specified', function () {
    assert.doesNotThrow(function () {
      sharp().resize(null, null, { fit: 'cover' });
    });
  });

  it('Skip crop when post-resize dimensions are at target', function () {
    return sharp(fixtures.inputJpg)
      .resize(1600, 1200)
      .toBuffer()
      .then(function (input) {
        return sharp(input)
          .resize(1110, null, {
            fit: sharp.fit.cover,
            position: sharp.strategy.attention
          })
          .toBuffer({ resolveWithObject: true })
          .then(function (result) {
            assert.strictEqual(1110, result.info.width);
            assert.strictEqual(832, result.info.height);
            assert.strictEqual(undefined, result.info.cropOffsetLeft);
            assert.strictEqual(undefined, result.info.cropOffsetTop);
          });
      });
  });

  describe('Entropy-based strategy', function () {
    it('JPEG', function (done) {
      sharp(fixtures.inputJpg)
        .resize(80, 320, {
          fit: 'cover',
          position: sharp.strategy.entropy
        })
        .toBuffer(function (err, data, info) {
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

    it('PNG', function (done) {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: sharp.strategy.entropy
        })
        .toBuffer(function (err, data, info) {
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

    it('supports the strategy passed as a string', function (done) {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: 'entropy'
        })
        .toBuffer(function (err, data, info) {
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
  });

  describe('Attention strategy', function () {
    it('JPEG', function (done) {
      sharp(fixtures.inputJpg)
        .resize(80, 320, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          assert.strictEqual(80, info.width);
          assert.strictEqual(320, info.height);
          assert.strictEqual(-107, info.cropOffsetLeft);
          assert.strictEqual(0, info.cropOffsetTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy-attention.jpg'), data, done);
        });
    });

    it('PNG', function (done) {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .toBuffer(function (err, data, info) {
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

    it('supports the strategy passed as a string', function (done) {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: 'attention'
        })
        .toBuffer(function (err, data, info) {
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
  });
});
