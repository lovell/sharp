/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs/promises');
const { suite, test } = require('node:test');

const sharp = require('../../lib/index.js');
const fixtures = require('../fixtures');

suite('failOn', () => {
  test('handles truncated JPEG', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpgTruncated, { failOn: 'none' })
      .resize(32, 24)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(32, info.width);
    t.assert.strictEqual(24, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('truncated.jpg'), data));
  });

  test('handles truncated PNG, emits warnings', async (t) => {
    t.plan(5);
    let isWarningEmitted = false;
    const { info } = await sharp(fixtures.inputPngTruncated, { failOn: 'none' })
      .on('warning', (warning) => {
        t.assert.ok(
          ['read gave 2 warnings', 'not enough data', 'end of stream']
            .some(m => warning.includes(m)));
        isWarningEmitted = true;
      })
      .resize(32, 24)
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(true, isWarningEmitted);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(32, info.width);
    t.assert.strictEqual(24, info.height);
  });

  test('throws for invalid options', (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp({ failOn: 'zoinks' }),
      /Expected one of: none, truncated, error, warning for failOn but received zoinks of type string/
    );
    t.assert.throws(
      () => sharp({ failOn: 1 }),
      /Expected one of: none, truncated, error, warning for failOn but received 1 of type number/
    );
  });

  test('returns errors to callback for truncated JPEG', (t, done) => {
    t.plan(3);
    sharp(fixtures.inputJpgTruncated, { failOn: 'truncated' }).toBuffer((err, data, info) => {
      t.assert.ok(err.message.includes('VipsJpeg: premature end of'), err);
      t.assert.strictEqual(data, undefined);
      t.assert.strictEqual(info, undefined);
      done();
    });
  });

  test('returns errors to callback for truncated PNG', (t, done) => {
    t.plan(3);
    sharp(fixtures.inputPngTruncated, { failOn: 'truncated' }).toBuffer((err, data, info) => {
      t.assert.ok(err.message.includes('read error'), err);
      t.assert.strictEqual(data, undefined);
      t.assert.strictEqual(info, undefined);
      done();
    });
  });

  test('rejects promises for truncated JPEG', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      sharp(fixtures.inputJpgTruncated, { failOn: 'error' }).toBuffer(),
      /VipsJpeg: premature end of/
    );
  });

  test('handles stream-based input', async (t) => {
    t.plan(1);
    const writable = sharp({ failOn: 'none' }).resize(32, 24);
    const fd = await fs.open(fixtures.inputJpgTruncated);
    fd.createReadStream().pipe(writable);
    await writable.toBuffer();
    t.assert.ok(true);
  });

  test('converts warnings to error for GeoTIFF', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      sharp(fixtures.inputTiffGeo).toBuffer(),
      /Tag 34737/
    );
  });
});
