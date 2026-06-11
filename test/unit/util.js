/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';
import semver from 'semver';

import sharp from '../../lib/index.js';

suite('Utilities', () => {
  suite('Cache', () => {
    test('Can be disabled', (t, done) => {
      t.plan(1);
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
          t.assert.ok(empty);
          done();
        }
      }, 2000);
    });
    test('Can be enabled with defaults', (t) => {
      t.plan(3);
      const cache = sharp.cache(true);
      t.assert.strictEqual(cache.memory.max, 50);
      t.assert.strictEqual(cache.files.max, 20);
      t.assert.strictEqual(cache.items.max, 100);
    });
    test('Can be set to zero', (t) => {
      t.plan(3);
      const cache = sharp.cache({
        memory: 0,
        files: 0,
        items: 0
      });
      t.assert.strictEqual(cache.memory.max, 0);
      t.assert.strictEqual(cache.files.max, 0);
      t.assert.strictEqual(cache.items.max, 0);
    });
    test('Can be set to a maximum of 10MB, 100 files and 1000 items', (t) => {
      t.plan(3);
      const cache = sharp.cache({
        memory: 10,
        files: 100,
        items: 1000
      });
      t.assert.strictEqual(cache.memory.max, 10);
      t.assert.strictEqual(cache.files.max, 100);
      t.assert.strictEqual(cache.items.max, 1000);
    });
    test('Ignores invalid values', (t) => {
      t.plan(3);
      sharp.cache(true);
      const cache = sharp.cache('spoons');
      t.assert.strictEqual(cache.memory.max, 50);
      t.assert.strictEqual(cache.files.max, 20);
      t.assert.strictEqual(cache.items.max, 100);
    });
  });

  suite('Concurrency', () => {
    test('Can be set to use 16 threads', (t) => {
      t.plan(1);
      sharp.concurrency(16);
      t.assert.strictEqual(16, sharp.concurrency());
    });
    test('Can be reset to default', (t) => {
      t.plan(1);
      sharp.concurrency(0);
      t.assert.ok(sharp.concurrency() > 0);
    });
    test('Ignores invalid values', (t) => {
      t.plan(1);
      const defaultConcurrency = sharp.concurrency();
      sharp.concurrency('spoons');
      t.assert.strictEqual(defaultConcurrency, sharp.concurrency());
    });
  });

  suite('Counters', () => {
    test('Have zero value at rest', async (t) => {
      t.plan(2);
      await new Promise((resolve) => queueMicrotask(resolve));
      const counters = sharp.counters();
      t.assert.strictEqual(counters.queue, 0);
      t.assert.strictEqual(counters.process, 0);
    });
  });

  suite('SIMD', () => {
    test('Can get current state', (t) => {
      t.plan(1);
      const simd = sharp.simd();
      t.assert.strictEqual(typeof simd, 'boolean');
    });
    test('Can disable', (t) => {
      t.plan(1);
      const simd = sharp.simd(false);
      t.assert.strictEqual(simd, false);
    });
    test('Can attempt to enable', (t) => {
      t.plan(1);
      const simd = sharp.simd(true);
      t.assert.strictEqual(typeof simd, 'boolean');
    });
  });

  suite('Format', () => {
    test('Contains expected attributes', (t) => {
      const formats = Object.keys(sharp.format);
      t.plan((formats.length * 20) + 1);
      t.assert.strictEqual(typeof sharp.format, 'object');
      formats.forEach((format) => {
        t.assert.ok('id' in sharp.format[format]);
        t.assert.strictEqual(format, sharp.format[format].id);
        ['input', 'output'].forEach((direction) => {
          t.assert.ok(direction in sharp.format[format]);
          t.assert.strictEqual(typeof sharp.format[format][direction], 'object');
          t.assert.ok([3, 4].includes(Object.keys(sharp.format[format][direction]).length));
          t.assert.ok('file' in sharp.format[format][direction]);
          t.assert.ok('buffer' in sharp.format[format][direction]);
          t.assert.ok('stream' in sharp.format[format][direction]);
          t.assert.strictEqual(typeof sharp.format[format][direction].file, 'boolean');
          t.assert.strictEqual(typeof sharp.format[format][direction].buffer, 'boolean');
          t.assert.strictEqual(typeof sharp.format[format][direction].stream, 'boolean');
        });
      });
    });
    test('Raw file=false, buffer=true, stream=true', (t) => {
      t.plan(6);
      ['input', 'output'].forEach((direction) => {
        t.assert.strictEqual(sharp.format.raw[direction].file, false);
        t.assert.strictEqual(sharp.format.raw[direction].buffer, true);
        t.assert.strictEqual(sharp.format.raw[direction].stream, true);
      });
    });
    test('vips format supports filesystem only', (t) => {
      t.plan(6);
      ['input', 'output'].forEach((direction) => {
        t.assert.strictEqual(sharp.format.vips[direction].file, true);
        t.assert.strictEqual(sharp.format.vips[direction].buffer, false);
        t.assert.strictEqual(sharp.format.vips[direction].stream, false);
      });
    });
    test('input fileSuffix', (t) => {
      t.plan(1);
      t.assert.deepStrictEqual(['.jpg', '.jpeg', '.jpe', '.jfif'], sharp.format.jpeg.input.fileSuffix);
    });
    test('output alias', (t) => {
      t.plan(1);
      t.assert.deepStrictEqual(['jpe', 'jpg'], sharp.format.jpeg.output.alias);
    });
  });

  suite('Versions', () => {
    test('Contains expected attributes', (t) => {
      t.plan(3);
      t.assert.strictEqual(typeof sharp.versions, 'object');
      t.assert.ok(semver.valid(sharp.versions.vips));
      t.assert.ok(semver.valid(sharp.versions.sharp));
    });
  });

  suite('Block', () => {
    test('Can block a named operation', (t) => {
      t.plan(1);
      t.assert.doesNotThrow(() => sharp.block({ operation: ['test'] }));
    });
    test('Can unblock a named operation', (t) => {
      t.plan(1);
      t.assert.doesNotThrow(() => sharp.unblock({ operation: ['test'] }));
    });
    test('Invalid block operation throws', (t) => {
      t.plan(4);
      t.assert.throws(() => sharp.block(1),
        /Expected object for options but received 1 of type number/
      );
      t.assert.throws(() => sharp.block({}),
        /Expected Array<string> for operation but received undefined of type undefined/
      );
      t.assert.throws(() => sharp.block({ operation: 'fail' }),
        /Expected Array<string> for operation but received fail of type string/
      );
      t.assert.throws(() => sharp.block({ operation: ['maybe', false] }),
        /Expected Array<string> for operation but received maybe,false of type object/
      );
    });
    test('Invalid unblock operation throws', (t) => {
      t.plan(4);
      t.assert.throws(() => sharp.unblock(1),
        /Expected object for options but received 1 of type number/
      );
      t.assert.throws(() => sharp.unblock({}),
        /Expected Array<string> for operation but received undefined of type undefined/
      );
      t.assert.throws(() => sharp.unblock({ operation: 'fail' }),
        /Expected Array<string> for operation but received fail of type string/
      );
      t.assert.throws(() => sharp.unblock({ operation: ['maybe', false] }),
        /Expected Array<string> for operation but received maybe,false of type object/
      );
    });
  });
});
