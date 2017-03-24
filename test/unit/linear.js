'use strict';

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Linear adjustment', function () {
  it('applies levels adjustment', function (done) {
    const blackPoint = 70;
    const whitePoint = 203;
    const a = 255 / (whitePoint - blackPoint);
    const b = -blackPoint * a;
    sharp(fixtures.inputJpgWithLowContrast)
      .linear(a, b)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('linear-levels-adjustment.jpg'), data, done);
      });
  });
});
