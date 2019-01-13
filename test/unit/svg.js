'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('SVG input', function () {
  it('Convert SVG to PNG at default 72DPI', function (done) {
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

  it('Convert SVG to PNG at 1200DPI', function (done) {
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

  it('Convert SVG to PNG at 14.4DPI', function (done) {
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

  it('Convert SVG with embedded images to PNG, respecting dimensions, autoconvert to PNG', function (done) {
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
});
