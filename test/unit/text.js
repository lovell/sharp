/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');
const { inRange } = require('../../dist/is.cjs');

suite('Text to image', () => {
  test('text with default values', async (t) => {
    const output = fixtures.path('output.text-default.png');
    const text = sharp({
      text: {
        text: 'Hello, world !',
        font: fixtures.fontFamily,
        fontfile: fixtures.fontFile
      }
    });
    if (!sharp.versions.pango) {
      return t.skip();
    }
    t.plan(15);
    const info = await text.png().toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(3, info.channels);
    t.assert.strictEqual(false, info.premultiplied);
    t.assert.ok(info.width > 10);
    t.assert.ok(info.height > 8);
    const metadata = await sharp(output).metadata();
    t.assert.strictEqual('uchar', metadata.depth);
    t.assert.strictEqual('srgb', metadata.space);
    t.assert.strictEqual(72, metadata.density);
    const stats = await sharp(output).stats();
    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(255, stats.channels[0].max);
    t.assert.strictEqual(0, stats.channels[1].min);
    t.assert.strictEqual(255, stats.channels[1].max);
    t.assert.strictEqual(0, stats.channels[2].min);
    t.assert.strictEqual(255, stats.channels[2].max);
    t.assert.ok(info.textAutofitDpi > 0);
  });

  test('text with width and height', async (t) => {
    const output = fixtures.path('output.text-width-height.png');
    const text = sharp({
      text: {
        text: 'Hello, world!',
        font: fixtures.fontFamily,
        fontfile: fixtures.fontFile,
        width: 500,
        height: 400
      }
    });
    if (!sharp.versions.pango) {
      return t.skip();
    }
    t.plan(5);
    const info = await text.toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(3, info.channels);
    t.assert.ok(inRange(info.width, 400, 600), `Actual width ${info.width}`);
    t.assert.ok(inRange(info.height, 290, 500), `Actual height ${info.height}`);
    t.assert.ok(inRange(info.textAutofitDpi, 900, 1300), `Actual textAutofitDpi ${info.textAutofitDpi}`);
  });

  test('text with dpi', async (t) => {
    const output = fixtures.path('output.text-dpi.png');
    const dpi = 300;
    const text = sharp({
      text: {
        text: 'Hello, world!',
        font: fixtures.fontFamily,
        fontfile: fixtures.fontFile,
        dpi
      }
    });
    if (!sharp.versions.pango) {
      return t.skip();
    }
    t.plan(2);
    const info = await text.toFile(output);
    t.assert.strictEqual('png', info.format);
    const metadata = await sharp(output).metadata();
    t.assert.strictEqual(dpi, metadata.density);
  });

  test('text with color and pango markup', async (t) => {
    const output = fixtures.path('output.text-color-pango.png');
    const dpi = 300;
    const text = sharp({
      text: {
        text: '<span foreground="red" font="100">red</span><span font="50" background="cyan">blue</span>',
        font: fixtures.fontFamily,
        fontfile: fixtures.fontFile,
        rgba: true,
        dpi
      }
    });
    if (!sharp.versions.pango) {
      return t.skip();
    }
    t.plan(5);
    const info = await text.toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(4, info.channels);
    const metadata = await sharp(output).metadata();
    t.assert.strictEqual(dpi, metadata.density);
    t.assert.strictEqual('uchar', metadata.depth);
    t.assert.strictEqual(true, metadata.hasAlpha);
  });

  test('text with font', async (t) => {
    const output = fixtures.path('output.text-with-font.png');
    const text = sharp({
      text: {
        text: 'Hello, world!',
        font: `${fixtures.fontFamily} 100`,
        fontfile: fixtures.fontFile
      }
    });
    if (!sharp.versions.pango) {
      return t.skip();
    }
    t.plan(4);
    const info = await text.toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(3, info.channels);
    t.assert.ok(info.width > 30);
    t.assert.ok(info.height > 10);
  });

  test('text with justify and composite', async (t) => {
    const output = fixtures.path('output.text-composite.png');
    const width = 500;
    const dpi = 300;
    const text = sharp(fixtures.inputJpg)
      .resize(width)
      .composite([{
        input: {
          text: {
            text: '<span foreground="#ffff00">Watermark</span> <span foreground="white"><i>is cool</i></span>',
            font: fixtures.fontFamily,
            fontfile: fixtures.fontFile,
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
            font: `${fixtures.fontFamily} 30`,
            fontfile: fixtures.fontFile,
            dpi,
            rgba: true
          }
        },
        left: 30,
        top: 250
      }]);
    if (!sharp.versions.pango) {
      return t.skip();
    }
    t.plan(7);
    const info = await text.toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(4, info.channels);
    t.assert.strictEqual(width, info.width);
    t.assert.strictEqual(true, info.premultiplied);
    const metadata = await sharp(output).metadata();
    t.assert.strictEqual('srgb', metadata.space);
    t.assert.strictEqual('uchar', metadata.depth);
    t.assert.strictEqual(true, metadata.hasAlpha);
  });

  test('bad text input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp({ text: {} });
    });
  });

  test('fontfile input', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp({
        text: {
          text: 'text',
          fontfile: 'UnknownFont.ttf'
        }
      });
    });
  });

  test('bad font input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp({
        text: {
          text: 'text',
          font: 12
        }
      });
    });
  });

  test('bad fontfile input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp({
        text: {
          text: 'text',
          fontfile: true
        }
      });
    });
  });

  test('invalid width', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp({ text: { text: 'text', width: 'bad' } }),
      /Expected integer between 1 and 1000000 for text\.width but received bad of type string/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', width: 0.1 } }),
      /Expected integer between 1 and 1000000 for text\.width but received 0.1 of type number/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', width: -1 } }),
      /Expected integer between 1 and 1000000 for text\.width but received -1 of type number/
    );
  });

  test('invalid height', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp({ text: { text: 'text', height: 'bad' } }),
      /Expected integer between 1 and 1000000 for text\.height but received bad of type string/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', height: 0.1 } }),
      /Expected integer between 1 and 1000000 for text\.height but received 0.1 of type number/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', height: -1 } }),
      /Expected integer between 1 and 1000000 for text\.height but received -1 of type number/
    );
  });

  test('bad align input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp({
        text: {
          text: 'text',
          align: 'unknown'
        }
      });
    });
  });

  test('bad justify input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp({
        text: {
          text: 'text',
          justify: 'unknown'
        }
      });
    });
  });

  test('invalid dpi', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp({ text: { text: 'text', dpi: 'bad' } }),
      /Expected integer between 1 and 1000000 for text\.dpi but received bad of type string/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', dpi: 0.1 } }),
      /Expected integer between 1 and 1000000 for text\.dpi but received 0.1 of type number/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', dpi: -1 } }),
      /Expected integer between 1 and 1000000 for text\.dpi but received -1 of type number/
    );
  });

  test('bad rgba input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp({
        text: {
          text: 'text',
          rgba: -10
        }
      });
    });
  });

  test('invalid spacing', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp({ text: { text: 'text', spacing: 'bad' } }),
      /Expected integer between -1000000 and 1000000 for text\.spacing but received bad of type string/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', spacing: 0.1 } }),
      /Expected integer between -1000000 and 1000000 for text\.spacing but received 0.1 of type number/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', spacing: -1000001 } }),
      /Expected integer between -1000000 and 1000000 for text\.spacing but received -1000001 of type number/
    );
  });

  test('only height or dpi not both', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp({
        text: {
          text: 'text',
          height: 400,
          dpi: 100
        }
      });
    });
  });

  test('valid wrap throws', (t) => {
    t.plan(2);
    t.assert.doesNotThrow(() => sharp({ text: { text: 'text', wrap: 'none' } }));
    t.assert.doesNotThrow(() => sharp({ text: { text: 'text', wrap: 'word-char' } }));
  });

  test('invalid wrap throws', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp({ text: { text: 'text', wrap: 1 } }),
      /Expected one of: word, char, word-char, none for text\.wrap but received 1 of type number/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', wrap: false } }),
      /Expected one of: word, char, word-char, none for text\.wrap but received false of type boolean/
    );
    t.assert.throws(
      () => sharp({ text: { text: 'text', wrap: 'invalid' } }),
      /Expected one of: word, char, word-char, none for text\.wrap but received invalid of type string/
    );
  });
});
