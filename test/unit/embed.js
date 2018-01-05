'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Embed', function () {
  it('Allows specifying the gravity as a string', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .embed('center')
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
      .embed()
      .resize(320, 240)
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
      .resize(320, 240)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed()
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
      .resize(50, 50)
      .embed()
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
      .resize(32, 16)
      .embed()
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
      .resize(32, 16)
      .embed()
      .background({r: 0, g: 0, b: 0, alpha: 0})
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
      .resize(32, 16)
      .embed()
      .background({r: 0, g: 0, b: 0, alpha: 0})
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

  it.skip('embed TIFF in LAB colourspace onto RGBA background', function (done) {
    sharp(fixtures.inputTiffCielab)
      .resize(64, 128)
      .embed()
      .background({r: 255, g: 102, b: 0, alpha: 0.5})
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

  it('Enlarge and embed', function (done) {
    sharp(fixtures.inputPngWithOneColor)
      .embed()
      .resize(320, 240)
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

  it('Embed invalid param values should fail', function () {
    assert.throws(function () {
      sharp().embed(-1);
    });
    assert.throws(function () {
      sharp().embed(8.1);
    });
    assert.throws(function () {
      sharp().embed(9);
    });
    assert.throws(function () {
      sharp().embed(1000000);
    });
    assert.throws(function () {
      sharp().embed(false);
    });
    assert.throws(function () {
      sharp().embed('vallejo');
    });
  });

  it('Embed gravity horizontal northwest', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.northwest)
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

  it('Embed gravity horizontal north', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.north)
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

  it('Embed gravity horizontal northeast', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.northeast)
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

  it('Embed gravity horizontal east', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.east)
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

  it('Embed gravity horizontal southeast', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.southeast)
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

  it('Embed gravity horizontal south', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.south)
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

  it('Embed gravity horizontal southwest', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.southwest)
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

  it('Embed gravity horizontal west', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.west)
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

  it('Embed gravity horizontal center', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 100)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.center)
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

  it('Embed gravity vertical northwest', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.northwest)
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

  it('Embed gravity vertical north', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.north)
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

  it('Embed gravity vertical northeast', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.northeast)
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

  it('Embed gravity vertical east', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.east)
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

  it('Embed gravity vertical southeast', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.southeast)
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

  it('Embed gravity vertical south', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.south)
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

  it('Embed gravity vertical southwest', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.southwest)
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

  it('Embed gravity vertical west', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.west)
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

  it('Embed gravity vertical center', function (done) {
    sharp(fixtures.inputPngEmbed)
      .resize(200, 200)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed(sharp.gravity.center)
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
