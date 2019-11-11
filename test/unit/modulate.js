'use strict';

const sharp = require('../../');
const assert = require('assert');
const fixtures = require('../fixtures');

describe('Modulate', function () {
  describe('Invalid options', function () {
    [
      null,
      undefined,
      10,
      { brightness: -1 },
      { brightness: '50%' },
      { brightness: null },
      { saturation: -1 },
      { saturation: '50%' },
      { saturation: null },
      { hue: '50deg' },
      { hue: 1.5 },
      { hue: null }
    ].forEach(function (options) {
      it('should throw', function () {
        assert.throws(function () {
          sharp(fixtures.inputJpg).modulate(options);
        });
      });
    });
  });

  it('should be able to hue-rotate', function () {
    const base = 'modulate-hue-120.jpg';
    const actual = fixtures.path('output.' + base);
    const expected = fixtures.expected(base);

    return sharp(fixtures.inputJpg)
      .modulate({ hue: 120 })
      .toFile(actual)
      .then(function () {
        fixtures.assertMaxColourDistance(actual, expected, 25);
      });
  });

  it('should be able to brighten', function () {
    const base = 'modulate-brightness-2.jpg';
    const actual = fixtures.path('output.' + base);
    const expected = fixtures.expected(base);

    return sharp(fixtures.inputJpg)
      .modulate({ brightness: 2 })
      .toFile(actual)
      .then(function () {
        fixtures.assertMaxColourDistance(actual, expected, 25);
      });
  });

  it('should be able to unbrighten', function () {
    const base = 'modulate-brightness-0-5.jpg';
    const actual = fixtures.path('output.' + base);
    const expected = fixtures.expected(base);

    return sharp(fixtures.inputJpg)
      .modulate({ brightness: 0.5 })
      .toFile(actual)
      .then(function () {
        fixtures.assertMaxColourDistance(actual, expected, 25);
      });
  });

  it('should be able to saturate', function () {
    const base = 'modulate-saturation-2.jpg';
    const actual = fixtures.path('output.' + base);
    const expected = fixtures.expected(base);

    return sharp(fixtures.inputJpg)
      .modulate({ saturation: 2 })
      .toFile(actual)
      .then(function () {
        fixtures.assertMaxColourDistance(actual, expected, 30);
      });
  });

  it('should be able to desaturate', function () {
    const base = 'modulate-saturation-0.5.jpg';
    const actual = fixtures.path('output.' + base);
    const expected = fixtures.expected(base);

    return sharp(fixtures.inputJpg)
      .modulate({ saturation: 0.5 })
      .toFile(actual)
      .then(function () {
        fixtures.assertMaxColourDistance(actual, expected, 25);
      });
  });

  it('should be able to modulate all channels', function () {
    const base = 'modulate-all.jpg';
    const actual = fixtures.path('output.' + base);
    const expected = fixtures.expected(base);

    return sharp(fixtures.inputJpg)
      .modulate({ brightness: 2, saturation: 0.5, hue: 180 })
      .toFile(actual)
      .then(function () {
        fixtures.assertMaxColourDistance(actual, expected, 25);
      });
  });

  describe('hue-rotate', function (done) {
    [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].forEach(function (angle) {
      it('should properly hue rotate by ' + angle + 'deg', function () {
        const base = 'modulate-hue-angle-' + angle + '.png';
        const actual = fixtures.path('output.' + base);
        const expected = fixtures.expected(base);

        return sharp(fixtures.testPattern)
          .modulate({ hue: angle })
          .toFile(actual)
          .then(function () {
            fixtures.assertMaxColourDistance(actual, expected, 25);
          });
      });
    });
  });

  it('should be able to use linear and modulate together', function () {
    const base = 'modulate-linear.jpg';
    const actual = fixtures.path('output.' + base);
    const expected = fixtures.expected(base);

    const contrast = 1.5;
    const brightness = 0.5;

    return sharp(fixtures.testPattern)
      .linear(contrast, -(128 * contrast) + 128)
      .modulate({ brightness })
      .toFile(actual)
      .then(function () {
        fixtures.assertMaxColourDistance(actual, expected);
      });
  });
});
