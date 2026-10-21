/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('AbortSignal', () => {
  test('Will abort when signal is triggered during toBuffer', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000);

    await t.assert.rejects(
      () => sharp(fixtures.inputJpg).blur(300).toBuffer({ signal: controller.signal }),
      /abort: ran for [0-9]+ second[s]?, [0-9]+% complete/
    );
  });

  test('Will abort when signal is triggered during toFile', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000);

    await t.assert.rejects(
      () => sharp(fixtures.inputJpg).blur(300).toFile(fixtures.path('output.abort.jpg'), { signal: controller.signal }),
      /abort: ran for [0-9]+ second[s]?, [0-9]+% complete/
    );
  });

  test('Will abort when signal is triggered during toUint8Array', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000);

    await t.assert.rejects(
      () => sharp(fixtures.inputJpg).blur(300).toUint8Array({ signal: controller.signal }),
      /abort: ran for [0-9]+ second[s]?, [0-9]+% complete/
    );
  });

  test('Will abort immediately if signal already aborted', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    controller.abort();

    await t.assert.rejects(
      () => sharp(fixtures.inputJpg).toBuffer({ signal: controller.signal }),
      /abort: ran for 0 seconds, [0-9]+% complete/
    );
  });

  test('Will complete normally if signal is not aborted', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    const { data } = await sharp(fixtures.inputJpg)
      .resize(100)
      .toBuffer({ signal: controller.signal });

    t.assert.ok(data.length > 0);
  });

  suite('Invalid signal', () => {
    test('toBuffer with invalid signal throws', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp(fixtures.inputJpg).toBuffer({ signal: 'fail' }),
        /Expected AbortSignal for signal but received fail of type string/
      );
    });
    test('toFile with invalid signal throws', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp(fixtures.inputJpg).toFile('fail', { signal: 'fail' }),
        /Expected AbortSignal for signal but received fail of type string/
      );
    });
    test('toUint8Array with invalid signal throws', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp(fixtures.inputJpg).toUint8Array({ signal: 'fail' }),
        /Expected AbortSignal for signal but received fail of type string/
      );
    });
    test('toBuffer with signal rejects resolveWithObject: true', (t) => {
      t.plan(1);
      const { signal} = new AbortController();
      t.assert.throws(
        () => sharp(fixtures.inputJpg).toBuffer({ signal, resolveWithObject: true }),
        /The signal and resolveWithObject options are mutually exclusive/
      );
    });
    test('toBuffer with signal rejects resolveWithObject: false', (t) => {
      t.plan(1);
      const { signal } = new AbortController();
      t.assert.throws(
        () => sharp(fixtures.inputJpg).toBuffer({ signal, resolveWithObject: false }),
        /The signal and resolveWithObject options are mutually exclusive/
      );
    });
    test('toFile with callback rejects when signal is present', (t) => {
      t.plan(1);
      const { signal } = new AbortController();
      t.assert.throws(
        () => sharp(fixtures.inputJpg).toFile('fail', { signal }, () => {}),
        /The signal option can only be used with Promises but a callback was provided/
      );
    });
  });
});
