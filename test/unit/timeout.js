/*!
  SPDX-FileCopyrightText: 2013 Lovell Fuller and others
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const fs = require('node:fs');
const { pipeline } = require('node:stream/promises');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Timeout', () => {
  test('Will timeout after 1s when performing slow blur operation', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      () => sharp(fixtures.inputJpg)
        .blur(300)
        .timeout({ seconds: 1 })
        .toBuffer(),
      /abort: ran for [0-9]+ second[s]?, [0-9]+% complete/
    );
  });

  test('Will timeout pipeline after 1s when performing slow blur operation', async (t) => {
    t.plan(1);
    const readable = fs.createReadStream(fixtures.inputJpg);
    const writable = fs.createWriteStream(fixtures.path('output.timeout.jpg'));
    const blur = sharp().blur(300);
    const signal = AbortSignal.timeout(500);

    await t.assert.rejects(
      () => pipeline(
        readable,
        blur,
        writable,
        { signal }
      ),
      /The operation was aborted/
    );
  });

  test('Signal takes precedence over timeout for toBuffer', async (t) => {
    t.plan(1);
    const signal = AbortSignal.timeout(1500);

    await t.assert.rejects(
      () => sharp(fixtures.inputJpg)
        .blur(300)
        .timeout({ seconds: 5 })
        .toBuffer({ signal }),
      /abort: ran for 1 second, [0-9]+% complete/
    );
  });

  test('Signal takes precedence over timeout for toFile', async (t) => {
    t.plan(1);
    const signal = AbortSignal.timeout(1500);

    await t.assert.rejects(
      () => sharp(fixtures.inputJpg)
        .blur(300)
        .timeout({ seconds: 5 })
        .toFile(fixtures.path('output.timeout.jpg'), { signal }),
      /abort: ran for 1 second, [0-9]+% complete/
    );
  });

  test('Signal takes precedence over timeout for toUint8Array', async (t) => {
    t.plan(1);
    const signal = AbortSignal.timeout(1500);

    await t.assert.rejects(
      () => sharp(fixtures.inputJpg)
        .blur(300)
        .timeout({ seconds: 5 })
        .toUint8Array({ signal }),
      /abort: ran for 1 second, [0-9]+% complete/
    );
  });

  test('invalid object', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().timeout('fail'),
      /Expected object for options but received fail of type string/
    );
  });

  test('invalid seconds', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().timeout({ seconds: 'fail' }),
      /Expected integer between 0 and 3600 for seconds but received fail of type string/
    );
  });
});
