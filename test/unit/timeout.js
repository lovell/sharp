'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Timeout', function () {
  it('Will timeout after 1s when performing slow blur operation', () => assert.rejects(
    () => sharp(fixtures.inputJpg)
      .blur(100)
      .timeout({ seconds: 1 })
      .toBuffer(),
    /timeout: [0-9]+% complete/
  ));

  it('invalid object', () => assert.throws(
    () => sharp().timeout('fail'),
    /Expected object for options but received fail of type string/
  ));

  it('invalid seconds', () => assert.throws(
    () => sharp().timeout({ seconds: 'fail' }),
    /Expected integer between 0 and 3600 for seconds but received fail of type string/
  ));
});
