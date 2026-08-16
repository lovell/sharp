const { resolve } = require('node:path');
const { suite, test } = require('node:test');
const pkg = require('../../package.json');

suite('CJS', () => {
  test('require', async (t) => {
    t.plan(1);
    const sharp = require(resolve(pkg.main));
    t.assert.deepStrictEqual(typeof sharp.default.versions, 'object');
  });
});
