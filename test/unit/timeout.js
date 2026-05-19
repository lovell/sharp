/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Timeout', () => {
  test('Will timeout after 1s when performing slow blur operation', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      () => sharp(fixtures.inputJpg)
        .blur(200)
        .timeout({ seconds: 1 })
        .toBuffer(),
      /timeout: [0-9]+% complete/
    );
  });

  test('invalid object', async (t) => {
    t.plan(1);
    await t.assert.throws(
      () => sharp().timeout('fail'),
      /Expected object for options but received fail of type string/
    );
  });

  test('invalid seconds', async (t) => {
    t.plan(1);
    await t.assert.throws(
      () => sharp().timeout({ seconds: 'fail' }),
      /Expected integer between 0 and 3600 for seconds but received fail of type string/
    );
  });
});
