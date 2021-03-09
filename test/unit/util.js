'use strict';

const assert = require('assert');
const sharp = require('../../');

describe('Utilities', function () {
  describe('Cache', function () {
    it('Can be disabled', function () {
      sharp.cache(false);
      const cache = sharp.cache(false);
      assert.strictEqual(cache.memory.current, 0);
      assert.strictEqual(cache.memory.max, 0);
      assert.strictEqual(typeof cache.memory.high, 'number');
      assert.strictEqual(cache.files.current, 0);
      assert.strictEqual(cache.files.max, 0);
      assert.strictEqual(cache.items.current, 0);
      assert.strictEqual(cache.items.max, 0);
    });
    it('Can be enabled with defaults', function () {
      const cache = sharp.cache(true);
      assert.strictEqual(cache.memory.max, 50);
      assert.strictEqual(cache.files.max, 20);
      assert.strictEqual(cache.items.max, 100);
    });
    it('Can be set to zero', function () {
      const cache = sharp.cache({
        memory: 0,
        files: 0,
        items: 0
      });
      assert.strictEqual(cache.memory.max, 0);
      assert.strictEqual(cache.files.max, 0);
      assert.strictEqual(cache.items.max, 0);
    });
    it('Can be set to a maximum of 10MB, 100 files and 1000 items', function () {
      const cache = sharp.cache({
        memory: 10,
        files: 100,
        items: 1000
      });
      assert.strictEqual(cache.memory.max, 10);
      assert.strictEqual(cache.files.max, 100);
      assert.strictEqual(cache.items.max, 1000);
    });
    it('Ignores invalid values', function () {
      sharp.cache(true);
      const cache = sharp.cache('spoons');
      assert.strictEqual(cache.memory.max, 50);
      assert.strictEqual(cache.files.max, 20);
      assert.strictEqual(cache.items.max, 100);
    });
  });

  describe('Concurrency', function () {
    it('Can be set to use 16 threads', function () {
      sharp.concurrency(16);
      assert.strictEqual(16, sharp.concurrency());
    });
    it('Can be reset to default', function () {
      sharp.concurrency(0);
      assert.strictEqual(true, sharp.concurrency() > 0);
    });
    it('Ignores invalid values', function () {
      const defaultConcurrency = sharp.concurrency();
      sharp.concurrency('spoons');
      assert.strictEqual(defaultConcurrency, sharp.concurrency());
    });
  });

  describe('Counters', function () {
    it('Have zero value at rest', function () {
      const counters = sharp.counters();
      assert.strictEqual(0, counters.queue);
      assert.strictEqual(0, counters.process);
    });
  });

  describe('SIMD', function () {
    it('Can get current state', function () {
      const simd = sharp.simd();
      assert.strictEqual(typeof simd, 'boolean');
    });
    it('Can disable', function () {
      const simd = sharp.simd(false);
      assert.strictEqual(simd, false);
    });
    it('Can attempt to enable', function () {
      const simd = sharp.simd(true);
      assert.strictEqual(typeof simd, 'boolean');
    });
  });

  describe('Format', function () {
    it('Contains expected attributes', function () {
      assert.strictEqual('object', typeof sharp.format);
      Object.keys(sharp.format).forEach(function (format) {
        assert.strictEqual(true, 'id' in sharp.format[format]);
        assert.strictEqual(format, sharp.format[format].id);
        ['input', 'output'].forEach(function (direction) {
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
    it('Raw file=false, buffer=true, stream=true', function () {
      ['input', 'output'].forEach(function (direction) {
        assert.strictEqual(false, sharp.format.raw[direction].file);
        assert.strictEqual(true, sharp.format.raw[direction].buffer);
        assert.strictEqual(true, sharp.format.raw[direction].stream);
      });
    });
    it('vips format supports filesystem only', function () {
      ['input', 'output'].forEach(function (direction) {
        assert.strictEqual(true, sharp.format.vips[direction].file);
        assert.strictEqual(false, sharp.format.vips[direction].buffer);
        assert.strictEqual(false, sharp.format.vips[direction].stream);
      });
    });
  });

  describe('Versions', function () {
    it('Contains expected attributes', function () {
      assert.strictEqual('object', typeof sharp.versions);
      assert.strictEqual('string', typeof sharp.versions.vips);
    });
  });
});
