/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Image channel insertion', () => {
  it('Grayscale to RGB, buffer', (_t, done) => {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel(fixtures.inputPngTestJoinChannel) // new green channel
      .joinChannel(fixtures.inputPngStripesH) // new blue channel
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data, done);
      });
  });

  it('Grayscale to RGB, file', (_t, done) => {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel(fs.readFileSync(fixtures.inputPngTestJoinChannel)) // new green channel
      .joinChannel(fs.readFileSync(fixtures.inputPngStripesH)) // new blue channel
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data, done);
      });
  });

  it('Grayscale to RGBA, buffer', (_t, done) => {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([
        fixtures.inputPngTestJoinChannel,
        fixtures.inputPngStripesH,
        fixtures.inputPngStripesV
      ]) // new green + blue + alpha channel
      .toColourspace(sharp.colourspace.srgb)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data, done);
      });
  });

  it('Grayscale to RGBA, file', (_t, done) => {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([
        fs.readFileSync(fixtures.inputPngTestJoinChannel), // new green channel
        fs.readFileSync(fixtures.inputPngStripesH), // new blue channel
        fs.readFileSync(fixtures.inputPngStripesV) // new alpha channel
      ])
      .toColourspace('srgb')
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data, done);
      });
  });

  it('Grayscale to CMYK, buffers', (_t, done) => {
    sharp(fixtures.inputPng) // gray -> magenta
      .resize(320, 240)
      .joinChannel([
        fs.readFileSync(fixtures.inputPngTestJoinChannel), // new cyan channel
        fs.readFileSync(fixtures.inputPngStripesH), // new yellow channel
        fs.readFileSync(fixtures.inputPngStripesV) // new black channel
      ])
      .toColorspace('cmyk')
      .toFormat('jpeg')
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-cmyk.jpg'), data, done);
      });
  });

  it('Join raw buffers to RGB', (_t, done) => {
    Promise.all([
      sharp(fixtures.inputPngTestJoinChannel).toColourspace('b-w').raw().toBuffer(),
      sharp(fixtures.inputPngStripesH).toColourspace('b-w').raw().toBuffer()
    ])
      .then((buffers) => {
        sharp(fixtures.inputPng)
          .resize(320, 240)
          .joinChannel(buffers, {
            raw: {
              width: 320,
              height: 240,
              channels: 1
            }
          })
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data, done);
          });
      })
      .catch((err) => {
        throw err;
      });
  });

  it('Grayscale to RGBA, files, two arrays', (_t, done) => {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([fs.readFileSync(fixtures.inputPngTestJoinChannel)]) // new green channel
      .joinChannel([
        fs.readFileSync(fixtures.inputPngStripesH), // new blue channel
        fs.readFileSync(fixtures.inputPngStripesV) // new alpha channel
      ])
      .toColourspace('srgb')
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data, done);
      });
  });

  it('Invalid raw buffer description', () => {
    assert.throws(() => {
      sharp().joinChannel(fs.readFileSync(fixtures.inputPng), { raw: {} });
    });
  });

  it('Invalid input', () => {
    assert.throws(() => {
      sharp(fixtures.inputJpg).joinChannel(1);
    });
  });

  it('No arguments', () => {
    assert.throws(() => {
      sharp(fixtures.inputJpg).joinChannel();
    });
  });
});
