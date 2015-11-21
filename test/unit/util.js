'use strict';

var assert = require('assert');
var fixtures = require('../fixtures');
var sharp = require('../../index');

var defaultConcurrency = sharp.concurrency();

describe('Utilities', function() {

  describe('Cache', function() {
    it('Can be disabled', function() {
      var cache = sharp.cache(0, 0);
      assert.strictEqual(0, cache.memory);
      assert.strictEqual(0, cache.items);
    });
    it('Can be set to a maximum of 50MB and 500 items', function() {
      var cache = sharp.cache(50, 500);
      assert.strictEqual(50, cache.memory);
      assert.strictEqual(500, cache.items);
    });
    it('Ignores invalid values', function() {
      sharp.cache(50, 500);
      var cache = sharp.cache('spoons');
      assert.strictEqual(50, cache.memory);
      assert.strictEqual(500, cache.items);
    });
  });

  describe('Concurrency', function() {
    it('Can be set to use 16 threads', function() {
      sharp.concurrency(16);
      assert.strictEqual(16, sharp.concurrency());
    });
    it('Can be reset to default', function() {
      sharp.concurrency(0);
      assert.strictEqual(defaultConcurrency, sharp.concurrency());
    });
    it('Ignores invalid values', function() {
      sharp.concurrency(0);
      sharp.concurrency('spoons');
      assert.strictEqual(defaultConcurrency, sharp.concurrency());
    });
  });

  describe('Counters', function() {
    it('Have zero value at rest', function() {
      var counters = sharp.counters();
      assert.strictEqual(0, counters.queue);
      assert.strictEqual(0, counters.process);
    });
  });

  describe('Format', function() {
    it('Contains expected attributes', function() {
      assert.strictEqual('object', typeof sharp.format);
      Object.keys(sharp.format).forEach(function(format) {
        assert.strictEqual(true, 'id' in sharp.format[format]);
        assert.strictEqual(format, sharp.format[format].id);
        ['input', 'output'].forEach(function(direction) {
          assert.strictEqual(true, direction in sharp.format[format]);
          assert.strictEqual('object', typeof sharp.format[format][direction]);
          assert.strictEqual(3, Object.keys(sharp.format[format][direction]).length);
          assert.strictEqual(true, 'file' in sharp.format[format][direction]);
          assert.strictEqual(true, 'buffer' in sharp.format[format][direction]);
          assert.strictEqual(true, 'stream' in sharp.format[format][direction]);
          assert.strictEqual('boolean', typeof sharp.format[format][direction].file);
          assert.strictEqual('boolean', typeof sharp.format[format][direction].buffer);
          assert.strictEqual('boolean', typeof sharp.format[format][direction].stream);
        });
      });
    });
  });

});
