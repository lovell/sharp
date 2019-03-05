'use strict';

const sharp = require('../../');
const fixtures = require('../fixtures');

describe.only('Modulate', function () {
  it('should be able to hue-rotate', function (done) {
    sharp(fixtures.inputJpg)
      .modulate({ hue: 120 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('modulate-hue-120.jpg'), data, { threshold: 1 }, done);
      });
  });

  it('should be able to brighten', function (done) {
    sharp(fixtures.inputJpg)
      .modulate({ brightness: 2 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('modulate-brightness-2.jpg'), data, { threshold: 1 }, done);
      });
  });

  it('should be able to unbrighten', function (done) {
    sharp(fixtures.inputJpg)
      .modulate({ brightness: 0.5 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('modulate-brightness-0-5.jpg'), data, { threshold: 1 }, done);
      });
  });

  it('should be able to saturate', function (done) {
    sharp(fixtures.inputJpg)
      .modulate({ saturation: 2 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('modulate-saturation-2.jpg'), data, { threshold: 1 }, done);
      });
  });

  it('should be able to desaturate', function (done) {
    sharp(fixtures.inputJpg)
      .modulate({ saturation: 0.5 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('modulate-saturation-0-5.jpg'), data, { threshold: 1 }, done);
      });
  });

  it('should be able to modulate all channels', function (done) {
    sharp(fixtures.inputJpg)
      .modulate({ brightness: 2, saturation: 0.5, hue: 180 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('modulate-all.jpg'), data, { threshold: 1 }, done);
      });
  });
});
