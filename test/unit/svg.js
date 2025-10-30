/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs');
const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('SVG input', function () {
  it('Convert SVG to PNG at default 72DPI', function (_t, done) {
    sharp(fixtures.inputSvg)
      .resize(1024)
      .extract({ left: 290, top: 760, width: 40, height: 40 })
      .toFormat('png')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(40, info.width);
        assert.strictEqual(40, info.height);
        fixtures.assertSimilar(fixtures.expected('svg72.png'), data, function (err) {
          if (err) throw err;
          sharp(data).metadata(function (err, info) {
            if (err) throw err;
            assert.strictEqual(72, info.density);
            done();
          });
        });
      });
  });

  it('Convert SVG to PNG at 1200DPI', function (_t, done) {
    sharp(fixtures.inputSvg, { density: 1200 })
      .resize(1024)
      .extract({ left: 290, top: 760, width: 40, height: 40 })
      .toFormat('png')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(40, info.width);
        assert.strictEqual(40, info.height);
        fixtures.assertSimilar(fixtures.expected('svg1200.png'), data, function (err) {
          if (err) throw err;
          sharp(data).metadata(function (err, info) {
            if (err) throw err;
            assert.strictEqual(1200, info.density);
            done();
          });
        });
      });
  });

  it('Convert SVG to PNG at DPI larger than 2400', function (_t, done) {
    const size = 1024;
    sharp(fixtures.inputSvgSmallViewBox).metadata(function (err, metadata) {
      if (err) throw err;
      const density = (size / Math.max(metadata.width, metadata.height)) * metadata.density;
      sharp(fixtures.inputSvgSmallViewBox, { density })
        .resize(size)
        .toFormat('png')
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual('png', info.format);
          assert.strictEqual(size, info.width);
          assert.strictEqual(size, info.height);
          fixtures.assertSimilar(fixtures.expected('circle.png'), data, function (err) {
            if (err) throw err;
            sharp(data).metadata(function (err, info) {
              if (err) throw err;
              assert.strictEqual(9216, info.density);
              done();
            });
          });
        });
    });
  });

  it('Convert SVG to PNG utilizing scale-on-load', function (_t, done) {
    const size = 1024;
    sharp(fixtures.inputSvgSmallViewBox)
      .resize(size)
      .toFormat('png')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(size, info.width);
        assert.strictEqual(size, info.height);
        fixtures.assertSimilar(fixtures.expected('circle.png'), data, function (err) {
          if (err) throw err;
          sharp(data).metadata(function (err, info) {
            if (err) throw err;
            assert.strictEqual(72, info.density);
            done();
          });
        });
      });
  });

  it('Convert SVG to PNG at 14.4DPI', function (_t, done) {
    sharp(fixtures.inputSvg, { density: 14.4 })
      .toFormat('png')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(20, info.width);
        assert.strictEqual(20, info.height);
        fixtures.assertSimilar(fixtures.expected('svg14.4.png'), data, function (err) {
          if (err) throw err;
          done();
        });
      });
  });

  it('Convert SVG with embedded images to PNG, respecting dimensions, autoconvert to PNG', function (_t, done) {
    sharp(fixtures.inputSvgWithEmbeddedImages)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(480, info.width);
        assert.strictEqual(360, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('svg-embedded.png'), data, done);
      });
  });

  it('Converts SVG with truncated embedded PNG', async () => {
    const truncatedPng = fs.readFileSync(fixtures.inputPngTruncated).toString('base64');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg width="294" height="240" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image width="294" height="240" xlink:href="data:image/png;base64,${truncatedPng}"/>
      </svg>`;

    const { info } = await sharp(Buffer.from(svg)).toBuffer({ resolveWithObject: true });
    assert.strictEqual(info.format, 'png');
    assert.strictEqual(info.width, 294);
    assert.strictEqual(info.height, 240);
    assert.strictEqual(info.channels, 4);
  });

  it('Can apply custom CSS', async () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg  width="10" height="10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="5" r="4" fill="green" />
      </svg>`;
    const stylesheet = 'circle { fill: red }';

    const [r, g, b, a] = await sharp(Buffer.from(svg), { svg: { stylesheet } })
      .extract({ left: 5, top: 5, width: 1, height: 1 })
      .raw()
      .toBuffer();

    assert.deepEqual([r, g, b, a], [255, 0, 0, 255]);
  });

  it('Invalid stylesheet input option throws', () =>
    assert.throws(
      () => sharp({ svg: { stylesheet: 123 } }),
      /Expected string for svg\.stylesheet but received 123 of type number/
    )
  );

  it('Valid highBitdepth input option does not throw', () =>
    assert.doesNotThrow(
      () => sharp({ svg: { highBitdepth: true } })
    )
  );

  it('Invalid highBitdepth input option throws', () =>
    assert.throws(
      () => sharp({ svg: { highBitdepth: 123 } }),
      /Expected boolean for svg\.highBitdepth but received 123 of type number/
    )
  );

  it('Fails to render SVG larger than 32767x32767', () =>
    assert.rejects(
      () => sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32768" height="1" />')).toBuffer(),
      /Input SVG image exceeds 32767x32767 pixel limit/
    )
  );

  it('Fails to render scaled SVG larger than 32767x32767', () =>
    assert.rejects(
      () => sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32767" height="1" />')).resize(32768).toBuffer(),
      /Input SVG image will exceed 32767x32767 pixel limit when scaled/
    )
  );

  it('Detects SVG passed as a string', () =>
    assert.rejects(
      () => sharp('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toBuffer(),
      /Input file is missing, did you mean/
    )
  );
});
