/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');
const semver = require('semver');
const sharp = require('../../');

describe('Utilities', () => {
  describe('Cache', () => {
    it('Can be disabled', (_t, done) => {
      const check = setInterval(() => {
        const cache = sharp.cache(false);
        const empty =
          cache.memory.current +
          cache.memory.max +
          cache.files.current +
          cache.files.max +
          cache.items.current +
          cache.items.max === 0;
        if (empty) {
          clearInterval(check);
          done();
        }
      }, 2000);
    });
    it('Can be enabled with defaults', () => {
      const cache = sharp.cache(true);
      assert.strictEqual(cache.memory.max, 50);
      assert.strictEqual(cache.files.max, 20);
      assert.strictEqual(cache.items.max, 100);
    });
    it('Can be set to zero', () => {
      const cache = sharp.cache({
        memory: 0,
        files: 0,
        items: 0
      });
      assert.strictEqual(cache.memory.max, 0);
      assert.strictEqual(cache.files.max, 0);
      assert.strictEqual(cache.items.max, 0);
    });
    it('Can be set to a maximum of 10MB, 100 files and 1000 items', () => {
      const cache = sharp.cache({
        memory: 10,
        files: 100,
        items: 1000
      });
      assert.strictEqual(cache.memory.max, 10);
      assert.strictEqual(cache.files.max, 100);
      assert.strictEqual(cache.items.max, 1000);
    });
    it('Ignores invalid values', () => {
      sharp.cache(true);
      const cache = sharp.cache('spoons');
      assert.strictEqual(cache.memory.max, 50);
      assert.strictEqual(cache.files.max, 20);
      assert.strictEqual(cache.items.max, 100);
    });
  });

  describe('Concurrency', () => {
    it('Can be set to use 16 threads', () => {
      sharp.concurrency(16);
      assert.strictEqual(16, sharp.concurrency());
    });
    it('Can be reset to default', () => {
      sharp.concurrency(0);
      assert.strictEqual(true, sharp.concurrency() > 0);
    });
    it('Ignores invalid values', () => {
      const defaultConcurrency = sharp.concurrency();
      sharp.concurrency('spoons');
      assert.strictEqual(defaultConcurrency, sharp.concurrency());
    });
  });

  describe('Counters', () => {
    it('Have zero value at rest', (_t, done) => {
      queueMicrotask(() => {
        const counters = sharp.counters();
        assert.strictEqual(0, counters.queue);
        assert.strictEqual(0, counters.process);
        done();
      });
    });
  });

  describe('SIMD', () => {
    it('Can get current state', () => {
      const simd = sharp.simd();
      assert.strictEqual(typeof simd, 'boolean');
    });
    it('Can disable', () => {
      const simd = sharp.simd(false);
      assert.strictEqual(simd, false);
    });
    it('Can attempt to enable', () => {
      const simd = sharp.simd(true);
      assert.strictEqual(typeof simd, 'boolean');
    });
  });

  describe('Format', () => {
    it('Contains expected attributes', () => {
      assert.strictEqual('object', typeof sharp.format);
      Object.keys(sharp.format).forEach((format) => {
        assert.strictEqual(true, 'id' in sharp.format[format]);
        assert.strictEqual(format, sharp.format[format].id);
        ['input', 'output'].forEach((direction) => {
          assert.strictEqual(true, direction in sharp.format[format]);
          assert.strictEqual('object', typeof sharp.format[format][direction]);
          assert.strictEqual(true, [3, 4].includes(Object.keys(sharp.format[format][direction]).length));
          assert.strictEqual(true, 'file' in sharp.format[format][direction]);
          assert.strictEqual(true, 'buffer' in sharp.format[format][direction]);
          assert.strictEqual(true, 'stream' in sharp.format[format][direction]);
          assert.strictEqual('boolean', typeof sharp.format[format][direction].file);
          assert.strictEqual('boolean', typeof sharp.format[format][direction].buffer);
          assert.strictEqual('boolean', typeof sharp.format[format][direction].stream);
        });
      });
    });
    it('Raw file=false, buffer=true, stream=true', () => {
      ['input', 'output'].forEach((direction) => {
        assert.strictEqual(false, sharp.format.raw[direction].file);
        assert.strictEqual(true, sharp.format.raw[direction].buffer);
        assert.strictEqual(true, sharp.format.raw[direction].stream);
      });
    });
    it('vips format supports filesystem only', () => {
      ['input', 'output'].forEach((direction) => {
        assert.strictEqual(true, sharp.format.vips[direction].file);
        assert.strictEqual(false, sharp.format.vips[direction].buffer);
        assert.strictEqual(false, sharp.format.vips[direction].stream);
      });
    });
    it('input fileSuffix', () => {
      assert.deepStrictEqual(['.jpg', '.jpeg', '.jpe', '.jfif'], sharp.format.jpeg.input.fileSuffix);
    });
    it('output alias', () => {
      assert.deepStrictEqual(['jpe', 'jpg'], sharp.format.jpeg.output.alias);
    });
  });

  describe('Versions', () => {
    it('Contains expected attributes', () => {
      assert.strictEqual('object', typeof sharp.versions);
      assert(semver.valid(sharp.versions.vips));
      assert(semver.valid(sharp.versions.sharp));
    });
  });

  describe('Block', () => {
    it('Can block a named operation', () => {
      sharp.block({ operation: ['test'] });
    });
    it('Can unblock a named operation', () => {
      sharp.unblock({ operation: ['test'] });
    });
    it('Invalid block operation throws', () => {
      assert.throws(() => sharp.block(1),
        /Expected object for options but received 1 of type number/
      );
      assert.throws(() => sharp.block({}),
        /Expected Array<string> for operation but received undefined of type undefined/
      );
      assert.throws(() => sharp.block({ operation: 'fail' }),
        /Expected Array<string> for operation but received fail of type string/
      );
      assert.throws(() => sharp.block({ operation: ['maybe', false] }),
        /Expected Array<string> for operation but received maybe,false of type object/
      );
    });
    it('Invalid unblock operation throws', () => {
      assert.throws(() => sharp.unblock(1),
        /Expected object for options but received 1 of type number/
      );
      assert.throws(() => sharp.unblock({}),
        /Expected Array<string> for operation but received undefined of type undefined/
      );
      assert.throws(() => sharp.unblock({ operation: 'fail' }),
        /Expected Array<string> for operation but received fail of type string/
      );
      assert.throws(() => sharp.unblock({ operation: ['maybe', false] }),
        /Expected Array<string> for operation but received maybe,false of type object/
      );
    });
  });
});
