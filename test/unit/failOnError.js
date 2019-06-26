'use strict';

const assert = require('assert');
const fs = require('fs');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('failOnError', function () {
  it('handles truncated JPEG', function (done) {
    sharp(fixtures.inputJpgTruncated, { failOnError: false })
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('truncated.jpg'), data, done);
      });
  });

  it('handles truncated PNG', function (done) {
    sharp(fixtures.inputPngTruncated, { failOnError: false })
      .resize(320, 240)
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

  it('returns errors to callback for truncated JPEG', function (done) {
    sharp(fixtures.inputJpgTruncated).toBuffer(function (err, data, info) {
      assert.ok(err.message.includes('VipsJpeg: Premature end of JPEG file'), err);
      assert.strictEqual(data, null);
      assert.strictEqual(info, null);
      done();
    });
  });

  it('returns errors to callback for truncated PNG', function (done) {
    sharp(fixtures.inputPngTruncated).toBuffer(function (err, data, info) {
      assert.ok(err.message.includes('vipspng: libpng read error'), err);
      assert.strictEqual(data, null);
      assert.strictEqual(info, null);
      done();
    });
  });

  it('rejects promises for truncated JPEG', function (done) {
    sharp(fixtures.inputJpgTruncated)
      .toBuffer()
      .then(() => {
        throw new Error('Expected rejection');
      })
      .catch(err => {
        done(err.message.includes('VipsJpeg: Premature end of JPEG file') ? undefined : err);
      });
  });

  it('handles stream-based input', function () {
    const writable = sharp({ failOnError: false });
    fs.createReadStream(fixtures.inputJpgTruncated).pipe(writable);
    return writable.toBuffer();
  });
});
