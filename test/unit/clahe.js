'use strict';

const assert = require('assert');

const sharp = require('../../lib');
const fixtures = require('../fixtures');

describe('Clahe', function () {
  it('width 5 width 5 maxSlope 0', function (done) {
    sharp(fixtures.inputJpgClahe)
      .clahe({ width: 5, height: 5, maxSlope: 0 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fixtures.assertSimilar(fixtures.expected('clahe-5-5-0.jpg'), data, { threshold: 10 }, done);
      });
  });

  it('width 5 width 5 maxSlope 5', function (done) {
    sharp(fixtures.inputJpgClahe)
      .clahe({ width: 5, height: 5, maxSlope: 5 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fixtures.assertSimilar(fixtures.expected('clahe-5-5-5.jpg'), data, done);
      });
  });

  it('width 11 width 25 maxSlope 14', function (done) {
    sharp(fixtures.inputJpgClahe)
      .clahe({ width: 11, height: 25, maxSlope: 14 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fixtures.assertSimilar(fixtures.expected('clahe-11-25-14.jpg'), data, done);
      });
  });

  it('width 50 width 50 maxSlope 0', function (done) {
    sharp(fixtures.inputJpgClahe)
      .clahe({ width: 50, height: 50, maxSlope: 0 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fixtures.assertSimilar(fixtures.expected('clahe-50-50-0.jpg'), data, done);
      });
  });

  it('width 50 width 50 maxSlope 14', function (done) {
    sharp(fixtures.inputJpgClahe)
      .clahe({ width: 50, height: 50, maxSlope: 14 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fixtures.assertSimilar(fixtures.expected('clahe-50-50-14.jpg'), data, done);
      });
  });

  it('width 100 width 50 maxSlope 3', function (done) {
    sharp(fixtures.inputJpgClahe)
      .clahe({ width: 100, height: 50, maxSlope: 3 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fixtures.assertSimilar(fixtures.expected('clahe-100-50-3.jpg'), data, done);
      });
  });

  it('width 100 width 100 maxSlope 0', function (done) {
    sharp(fixtures.inputJpgClahe)
      .clahe({ width: 100, height: 100, maxSlope: 0 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fixtures.assertSimilar(fixtures.expected('clahe-100-100-0.jpg'), data, done);
      });
  });

  it('invalid maxSlope', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100, maxSlope: -5 });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100, maxSlope: 110 });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100, maxSlope: 5.5 });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100, maxSlope: 'a string' });
    });
  });

  it('invalid width', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100.5, height: 100 });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: -5, height: 100 });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: true, height: 100 });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 'string test', height: 100 });
    });
  });

  it('invalid height', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 100.5 });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: -5 });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: true });
    });
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe({ width: 100, height: 'string test' });
    });
  });

  it('invalid options object', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpgClahe).clahe(100, 100, 5);
    });
  });

  it('uses default maxSlope of 3', function (done) {
    sharp(fixtures.inputJpgClahe)
      .clahe({ width: 100, height: 50 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        fixtures.assertSimilar(fixtures.expected('clahe-100-50-3.jpg'), data, done);
      });
  });
});
