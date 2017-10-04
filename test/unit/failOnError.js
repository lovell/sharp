'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe.only('failOnError', function () {
  it('handles truncated images by default', function (done) {
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

  it('handles zero-punched corrupted JPEG', function (done) {
    sharp(fixtures.inputJpgPunched)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('punched.jpg'), data, done);
      });
  });

  it('handles zero-punched corrupted PNG', function (done) {
    sharp(fixtures.inputPngPunched)
      // .toFile(fixtures.expected('truncated.png'), done);
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('punched.jpg'), data, done);
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
    sharp(fixtures.inputJpgTruncated, { failOnError: true })
      .toBuffer(function (err, data, info) {
        console.dir({err, info});  // TODO(mceachen): delete
        assert.equal(err, 'Error: Premature end of JPEG file');
        assert.equal(data, null);
        assert.equal(info.size, 0);
        done();
      });
  });

  it('returns errors to callback for truncated PNG when failOnError is set', function (done) {
    sharp(fixtures.inputPngTruncated, { failOnError: true })
      .toBuffer(function (err, data, info) {
        console.dir({err, info});  // TODO(mceachen): delete
        assert.equal(err, 'Error: Premature end of PNG file');
        assert.equal(data, null);
        assert.equal(info.size, 0);
        done();
      });
  });

  it('returns errors to callback for zero-punched JPEG when failOnError is set', function (done) {
    sharp(fixtures.inputJpgPunched, { failOnError: true })
      .toBuffer(function (err, data, info) {
        console.dir({err, info});  // TODO(mceachen): delete
        assert.equal(err, 'Error: Corrupt JPEG data: 66 extraneous bytes before marker 0xd9');
        assert.equal(data, null);
        assert.equal(info.size, 0);
        done();
      });
  });

  it('returns errors to callback for zero-punched PNG when failOnError is set', function (done) {
    sharp(fixtures.inputPngPunched, { failOnError: true })
      .toBuffer(function (err, data, info) {
        console.dir({err, info});  // TODO(mceachen): delete
        assert.equal(err, 'Error: Corrupt PNG data: (something about CRC error, probably) ');
        assert.equal(data, null);
        assert.equal(info.size, 0);
        done();
      });
  });

  it('rejects promises for truncated images when failOnError is set', function () {
    return new Promise(function (resolve, reject) {
      sharp(fixtures.inputJpgTruncated, { failOnError: true })
        .toBuffer()
        .then(function () {
          reject(new Error('Error was expected'));
        })
      .catch(function (err) {
        console.log('Caught expected error ' + err);  // TODO(mceachen): delete
        assert.include(err.toString(), 'Premature end of JPEG file');
        resolve();
      });
    });
  });
});
