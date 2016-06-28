'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Convolve', function() {

  it('specific convolution kernel 1', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .convolve(
        {
          'width': 3,
          'height': 3,
          'scale': 36,
          'offset': 0,
          'kernel': [ 2, 2, 1,
                      2, 20, 2,
                      1, 2, 4 ]
        })
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('conv-1.jpg'), data, done);
      });
  });

  it('specific convolution kernel 2', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .convolve(
        {
          'width': 3,
          'height': 3,
          'kernel': [ -1,  2, 1,
                      -2, 20, 2,
                      -2,  4, 2 ]
        })
      .toBuffer(function(err, data, info) {
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('conv-2.jpg'), data, done);
      });
  });

  it('invalid kernel specification: no data', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).convolve(
        {
          'width': 3,
          'height': 3,
          'kernel': []
        });
    });
  });

  it('invalid kernel specification: bad data format', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).convolve(
        {
          'width': 3,
          'height': 3,
          'kernel': [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        });
    });
  });
  
  it('invalid kernel specification: wrong width', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).convolve(
        {
          'width': 3,
          'height': 4,
          'kernel': [1, 2, 3, 4, 5, 6, 7, 8, 9]
        });
    });
  });
});
