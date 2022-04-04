'use strict';

const assert = require('assert');
const fs = require('fs');

const sharp = require('../../lib');
const fixtures = require('../fixtures');

describe('failOn', () => {
  it('handles truncated JPEG', function (done) {
    sharp(fixtures.inputJpgTruncated, { failOn: 'none' })
      .resize(32, 24)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(24, info.height);
        fixtures.assertSimilar(fixtures.expected('truncated.jpg'), data, done);
      });
  });

  it('handles truncated PNG, emits warnings', function (done) {
    let isWarningEmitted = false;
    sharp(fixtures.inputPngTruncated, { failOn: 'none' })
      .on('warning', function (warning) {
        assert.ok(warning.includes('not enough data') || warning.includes('end of stream'));
        isWarningEmitted = true;
      })
      .resize(32, 24)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, isWarningEmitted);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(24, info.height);
        done();
      });
  });

  it('throws for invalid options', () => {
    assert.throws(
      () => sharp({ failOn: 'zoinks' }),
      /Expected one of: none, truncated, error, warning for failOn but received zoinks of type string/
    );
    assert.throws(
      () => sharp({ failOn: 1 }),
      /Expected one of: none, truncated, error, warning for failOn but received 1 of type number/
    );
  });

  it('deprecated failOnError', () => {
    assert.doesNotThrow(
      () => sharp({ failOnError: true })
    );
    assert.doesNotThrow(
      () => sharp({ failOnError: false })
    );
    assert.throws(
      () => sharp({ failOnError: 'zoinks' }),
      /Expected boolean for failOnError but received zoinks of type string/
    );
    assert.throws(
      () => sharp({ failOnError: 1 }),
      /Expected boolean for failOnError but received 1 of type number/
    );
  });

  it('returns errors to callback for truncated JPEG', function (done) {
    sharp(fixtures.inputJpgTruncated, { failOn: 'truncated' }).toBuffer(function (err, data, info) {
      assert.ok(err.message.includes('VipsJpeg: Premature end of'), err);
      assert.strictEqual(data, undefined);
      assert.strictEqual(info, undefined);
      done();
    });
  });

  it('returns errors to callback for truncated PNG', function (done) {
    sharp(fixtures.inputPngTruncated, { failOn: 'truncated' }).toBuffer(function (err, data, info) {
      assert.ok(err.message.includes('read error'), err);
      assert.strictEqual(data, undefined);
      assert.strictEqual(info, undefined);
      done();
    });
  });

  it('rejects promises for truncated JPEG', function (done) {
    sharp(fixtures.inputJpgTruncated, { failOn: 'error' })
      .toBuffer()
      .then(() => {
        throw new Error('Expected rejection');
      })
      .catch(err => {
        done(err.message.includes('VipsJpeg: Premature end of') ? undefined : err);
      });
  });

  it('handles stream-based input', async () => {
    const writable = sharp({ failOn: 'none' }).resize(32, 24);
    fs.createReadStream(fixtures.inputJpgTruncated).pipe(writable);
    return writable.toBuffer();
  });
});
