import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import pkg from '../../package.json' with { type: 'json' };

describe('ESM', () => {
  it('await import', async () => {
    const sharp = await import(resolve(pkg.module));
    assert.deepStrictEqual(typeof sharp.default.versions, 'object');
  });

  it('createRequire', async () => {
    const require = createRequire(import.meta.url);
    const sharp = require(resolve(pkg.module));
    assert.deepStrictEqual(typeof sharp.default.versions, 'object');
  });
});
