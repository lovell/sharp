import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { suite, test } from 'node:test';
import { pathToFileURL } from 'node:url';

import pkg from '../../package.json' with { type: 'json' };

suite('ESM', () => {
  test('await import', async (t) => {
    t.plan(1);
    const sharp = await import(pathToFileURL(resolve(pkg.main)));
    t.assert.deepStrictEqual(typeof sharp.default.versions, 'object');
  });

  test('createRequire', async (t) => {
    t.plan(1);
    const require = createRequire(import.meta.url);
    const sharp = require(resolve(pkg.main));
    t.assert.deepStrictEqual(typeof sharp.default.versions, 'object');
  });
});
