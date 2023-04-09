// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Text to image', function () {
  this.retries(3);

  it('text with default values', async () => {
    const output = fixtures.path('output.text-default.png');
    const text = sharp({
      text: {
        text: 'Hello, world !'
      }
    });
    const info = await text.png().toFile(output);
    assert.strictEqual('png', info.format);
    assert.strictEqual(3, info.channels);
    assert.strictEqual(false, info.premultiplied);
    assert.ok(info.width > 10);
    assert.ok(info.height > 8);
    const metadata = await sharp(output).metadata();
    assert.strictEqual('uchar', metadata.depth);
    assert.strictEqual('srgb', metadata.space);
    assert.strictEqual(72, metadata.density);
    const stats = await sharp(output).stats();
    assert.strictEqual(0, stats.channels[0].min);
    assert.strictEqual(255, stats.channels[0].max);
    assert.strictEqual(0, stats.channels[1].min);
    assert.strictEqual(255, stats.channels[1].max);
    assert.strictEqual(0, stats.channels[2].min);
    assert.strictEqual(255, stats.channels[2].max);
    assert.ok(info.textAutofitDpi > 0);
  });

  it('text with width and height', function (done) {
    const output = fixtures.path('output.text-width-height.png');
    const maxWidth = 500;
    const maxHeight = 500;
    const text = sharp({
      text: {
        text: 'Hello, world!',
        width: maxWidth,
        height: maxHeight
      }
    });
    text.toFile(output, function (err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(3, info.channels);
      assert.ok(info.width <= maxWidth);
      assert.ok(info.height <= maxHeight);
      assert.ok(info.textAutofitDpi > 0);
      done();
    });
  });

  it('text with dpi', function (done) {
    const output = fixtures.path('output.text-dpi.png');
    const dpi = 300;
    const text = sharp({
      text: {
        text: 'Hello, world!',
        dpi: dpi
      }
    });
    text.toFile(output, function (err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      sharp(output).metadata(function (err, metadata) {
        if (err) throw err;
        assert.strictEqual(dpi, metadata.density);
        done();
      });
    });
  });

  it('text with color and pango markup', function (done) {
    const output = fixtures.path('output.text-color-pango.png');
    const dpi = 300;
    const text = sharp({
      text: {
        text: '<span foreground="red" font="100">red</span><span font="50" background="cyan">blue</span>',
        rgba: true,
        dpi: dpi
      }
    });
    text.toFile(output, function (err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(4, info.channels);
      sharp(output).metadata(function (err, metadata) {
        if (err) throw err;
        assert.strictEqual(dpi, metadata.density);
        assert.strictEqual('uchar', metadata.depth);
        assert.strictEqual(true, metadata.hasAlpha);
        done();
      });
    });
  });

  it('text with font', function (done) {
    const output = fixtures.path('output.text-with-font.png');
    const text = sharp({
      text: {
        text: 'Hello, world!',
        font: 'sans 100'
      }
    });
    text.toFile(output, function (err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(3, info.channels);
      assert.ok(info.width > 30);
      assert.ok(info.height > 10);
      done();
    });
  });

  it('text with justify and composite', done => {
    const output = fixtures.path('output.text-composite.png');
    const width = 500;
    const dpi = 300;
    const text = sharp(fixtures.inputJpg)
      .resize(width)
      .composite([{
        input: {
          text: {
            text: '<span foreground="#ffff00">Watermark</span> <span foreground="white"><i>is cool</i></span>',
            width: 300,
            height: 300,
            justify: true,
            align: 'right',
            spacing: 50,
            rgba: true
          }
        },
        gravity: 'northeast'
      }, {
        input: {
          text: {
            text: '<span background="cyan">cool</span>',
            font: 'sans 30',
            dpi: dpi,
            rgba: true
          }
        },
        left: 30,
        top: 250
      }]);
    text.toFile(output, function (err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(4, info.channels);
      assert.strictEqual(width, info.width);
      assert.strictEqual(true, info.premultiplied);
      sharp(output).metadata(function (err, metadata) {
        if (err) throw err;
        assert.strictEqual('srgb', metadata.space);
        assert.strictEqual('uchar', metadata.depth);
        assert.strictEqual(true, metadata.hasAlpha);
        done();
      });
    });
  });

  it('bad text input', function () {
    assert.throws(function () {
      sharp({
        text: {
        }
      });
    });
  });

  it('fontfile input', function () {
    assert.doesNotThrow(function () {
      sharp({
        text: {
          text: 'text',
          fontfile: 'UnknownFont.ttf'
        }
      });
    });
  });

  it('bad font input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          font: 12
        }
      });
    });
  });

  it('bad fontfile input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          fontfile: true
        }
      });
    });
  });

  it('bad width input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          width: 'bad'
        }
      });
    });
  });

  it('bad height input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          height: 'bad'
        }
      });
    });
  });

  it('bad align input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          align: 'unknown'
        }
      });
    });
  });

  it('bad justify input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          justify: 'unknown'
        }
      });
    });
  });

  it('bad dpi input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          dpi: -10
        }
      });
    });
  });

  it('bad rgba input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          rgba: -10
        }
      });
    });
  });

  it('bad spacing input', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          spacing: 'number expected'
        }
      });
    });
  });

  it('only height or dpi not both', function () {
    assert.throws(function () {
      sharp({
        text: {
          text: 'text',
          height: 400,
          dpi: 100
        }
      });
    });
  });

  it('valid wrap throws', () => {
    assert.doesNotThrow(() => sharp({ text: { text: 'text', wrap: 'none' } }));
    assert.doesNotThrow(() => sharp({ text: { text: 'text', wrap: 'wordChar' } }));
  });

  it('invalid wrap throws', () => {
    assert.throws(
      () => sharp({ text: { text: 'text', wrap: 1 } }),
      /Expected one of: word, char, wordChar, none for text\.wrap but received 1 of type number/
    );
    assert.throws(
      () => sharp({ text: { text: 'text', wrap: false } }),
      /Expected one of: word, char, wordChar, none for text\.wrap but received false of type boolean/
    );
    assert.throws(
      () => sharp({ text: { text: 'text', wrap: 'invalid' } }),
      /Expected one of: word, char, wordChar, none for text\.wrap but received invalid of type string/
    );
  });
});
