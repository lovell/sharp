'use strict';

const assert = require('assert');
const fs = require('fs');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Image channel insertion', function () {
  it('Grayscale to RGB, buffer', function (done) {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel(fixtures.inputPngTestJoinChannel) // new green channel
      .joinChannel(fixtures.inputPngStripesH) // new blue channel
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data, done);
      });
  });

  it('Grayscale to RGB, file', function (done) {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel(fs.readFileSync(fixtures.inputPngTestJoinChannel)) // new green channel
      .joinChannel(fs.readFileSync(fixtures.inputPngStripesH)) // new blue channel
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data, done);
      });
  });

  it('Grayscale to RGBA, buffer', function (done) {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([
        fixtures.inputPngTestJoinChannel,
        fixtures.inputPngStripesH,
        fixtures.inputPngStripesV
      ]) // new green + blue + alpha channel
      .toColourspace(sharp.colourspace.srgb)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data, done);
      });
  });

  it('Grayscale to RGBA, file', function (done) {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([
        fs.readFileSync(fixtures.inputPngTestJoinChannel), // new green channel
        fs.readFileSync(fixtures.inputPngStripesH), // new blue channel
        fs.readFileSync(fixtures.inputPngStripesV) // new alpha channel
      ])
      .toColourspace('srgb')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data, done);
      });
  });

  it('Grayscale to CMYK, buffers', function (done) {
    sharp(fixtures.inputPng) // gray -> magenta
      .resize(320, 240)
      .joinChannel([
        fs.readFileSync(fixtures.inputPngTestJoinChannel), // new cyan channel
        fs.readFileSync(fixtures.inputPngStripesH), // new yellow channel
        fs.readFileSync(fixtures.inputPngStripesV) // new black channel
      ])
      .toColorspace('cmyk')
      .toFormat('jpeg')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-cmyk.jpg'), data, done);
      });
  });

  it('Join raw buffers to RGB', function (done) {
    Promise.all([
      sharp(fixtures.inputPngTestJoinChannel).toColourspace('b-w').raw().toBuffer(),
      sharp(fixtures.inputPngStripesH).toColourspace('b-w').raw().toBuffer()
    ])
      .then(function (buffers) {
        sharp(fixtures.inputPng)
          .resize(320, 240)
          .joinChannel(buffers, {
            raw: {
              width: 320,
              height: 240,
              channels: 1
            }
          })
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data, done);
          });
      })
      .catch(function (err) {
        throw err;
      });
  });

  it('Grayscale to RGBA, files, two arrays', function (done) {
    sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([fs.readFileSync(fixtures.inputPngTestJoinChannel)]) // new green channel
      .joinChannel([
        fs.readFileSync(fixtures.inputPngStripesH), // new blue channel
        fs.readFileSync(fixtures.inputPngStripesV) // new alpha channel
      ])
      .toColourspace('srgb')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data, done);
      });
  });

  it('Invalid raw buffer description', function () {
    assert.throws(function () {
      sharp().joinChannel(fs.readFileSync(fixtures.inputPng), { raw: {} });
    });
  });

  it('Invalid input', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).joinChannel(1);
    });
  });

  it('No arguments', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).joinChannel();
    });
  });
});
