'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('failOnError', function () {
  it('handles truncated JPEG by default', function (done) {
    sharp(fixtures.inputJpgTruncated)
      .resize(320, 240)
      // .toFile(fixtures.expected('truncated.jpg'), done);
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('truncated.jpg'), data, done);
      });
  });

  it('handles truncated PNG by default', function (done) {
    sharp(fixtures.inputPngTruncated)
      .resize(320, 240)
      // .toFile(fixtures.expected('truncated.png'), done);
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('rejects invalid values', function () {
    assert.doesNotThrow(function () {
      sharp(fixtures.inputJpg, { failOnError: true });
    });

    assert.throws(function () {
      sharp(fixtures.inputJpg, { failOnError: 'zoinks' });
    });

    assert.throws(function () {
      sharp(fixtures.inputJpg, { failOnError: 1 });
    });
  });

  it('returns errors to callback for truncated JPEG when failOnError is set', function (done) {
    sharp(fixtures.inputJpgTruncated, { failOnError: true }).toBuffer(function (err, data, info) {
      assert.ok(err.message.includes('VipsJpeg: Premature end of JPEG file'), err);
      assert.equal(data, null);
      assert.equal(info, null);
      done();
    });
  });

  it('returns errors to callback for truncated PNG when failOnError is set', function (done) {
    sharp(fixtures.inputPngTruncated, { failOnError: true }).toBuffer(function (err, data, info) {
      assert.ok(err.message.includes('vipspng: libpng read error'), err);
      assert.equal(data, null);
      assert.equal(info, null);
      done();
    });
  });

  it('rejects promises for truncated JPEG when failOnError is set', function (done) {
    sharp(fixtures.inputJpgTruncated, { failOnError: true })
      .toBuffer()
      .then(() => {
        throw new Error('Expected rejection');
      })
      .catch(err => {
        done(err.message.includes('VipsJpeg: Premature end of JPEG file') ? undefined : err);
      });
  });
});
