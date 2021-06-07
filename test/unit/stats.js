'use strict';

const fs = require('fs');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

// Test Helpers
const threshold = 0.001;
function isInAcceptableRange (actual, expected) {
  return actual >= ((1 - threshold) * expected) && actual <= ((1 + threshold) * expected);
}
function isInRange (actual, min, max) {
  return actual >= min && actual <= max;
}
function isInteger (val) {
  return Number.isInteger(val);
}

describe('Image Stats', function () {
  it('JPEG', function (done) {
    sharp(fixtures.inputJpg).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.319914765248541));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0.7883011147075762));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(40, r);
      assert.strictEqual(40, g);
      assert.strictEqual(40, b);

      // red channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(255, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 615101275));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 83061892917));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 101.44954540768993));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 58.373870588815414));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

      // green channel
      assert.strictEqual(0, stats.channels[1].min);
      assert.strictEqual(255, stats.channels[1].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 462824115));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 47083677255));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 76.33425255128337));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 44.03023262954866));
      assert.strictEqual(true, isInteger(stats.channels[1].minX));
      assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[1].minY));
      assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[1].maxX));
      assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[1].maxY));
      assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 2725));

      // blue channel
      assert.strictEqual(0, stats.channels[2].min);
      assert.strictEqual(255, stats.channels[2].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 372986756));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 32151543524));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 61.51724663436759));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 38.96702865090125));
      assert.strictEqual(true, isInteger(stats.channels[2].minX));
      assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[2].minY));
      assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[2].maxX));
      assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[2].maxY));
      assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 2725));

      done();
    });
  });

  it('PNG without transparency', function (done) {
    sharp(fixtures.inputPng).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 0.3409031108021736));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 9.111356137722868));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(248, r);
      assert.strictEqual(248, g);
      assert.strictEqual(248, b);

      // red channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(255, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 1391368230));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 354798898650));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 238.8259925648822));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 62.15121915523771));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2809));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2074));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2809));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2074));
      done();
    });
  });

  it('PNG with transparency', function (done) {
    sharp(fixtures.inputPngWithTransparency).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(false, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 0.06778064835816622));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 2.522916068931278));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(248, r);
      assert.strictEqual(248, g);
      assert.strictEqual(248, b);

      // red channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(255, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 795678795));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 202898092725));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 252.9394769668579));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 22.829537532816));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2048));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 1536));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2048));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 1536));

      // green channel
      assert.strictEqual(0, stats.channels[1].min);
      assert.strictEqual(255, stats.channels[1].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 795678795));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 202898092725));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 252.9394769668579));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 22.829537532816));
      assert.strictEqual(true, isInteger(stats.channels[1].minX));
      assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 2048));
      assert.strictEqual(true, isInteger(stats.channels[1].minY));
      assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 1536));
      assert.strictEqual(true, isInteger(stats.channels[1].maxX));
      assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 2048));
      assert.strictEqual(true, isInteger(stats.channels[1].maxY));
      assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 1536));

      // blue channel
      assert.strictEqual(0, stats.channels[2].min);
      assert.strictEqual(255, stats.channels[2].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 795678795));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 202898092725));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 252.9394769668579));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 22.829537532816));
      assert.strictEqual(true, isInteger(stats.channels[2].minX));
      assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 2048));
      assert.strictEqual(true, isInteger(stats.channels[2].minY));
      assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 1536));
      assert.strictEqual(true, isInteger(stats.channels[2].maxX));
      assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 2048));
      assert.strictEqual(true, isInteger(stats.channels[2].maxY));
      assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 1536));

      // alpha channel
      assert.strictEqual(0, stats.channels[3].min);
      assert.strictEqual(255, stats.channels[3].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].sum, 5549142));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].squaresSum, 1333571132));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].mean, 1.7640247344970703));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].stdev, 20.51387814157297));
      assert.strictEqual(true, isInteger(stats.channels[3].minX));
      assert.strictEqual(true, isInRange(stats.channels[3].minX, 0, 2048));
      assert.strictEqual(true, isInteger(stats.channels[3].minY));
      assert.strictEqual(true, isInRange(stats.channels[3].minY, 0, 1536));
      assert.strictEqual(true, isInteger(stats.channels[3].maxX));
      assert.strictEqual(true, isInRange(stats.channels[3].maxX, 0, 2048));
      assert.strictEqual(true, isInteger(stats.channels[3].maxY));
      assert.strictEqual(true, isInRange(stats.channels[3].maxY, 0, 1536));

      done();
    });
  });

  it('PNG fully transparent', function (done) {
    sharp(fixtures.inputPngCompleteTransparency).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(false, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 0));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(72, r);
      assert.strictEqual(104, g);
      assert.strictEqual(72, b);

      // alpha channel
      assert.strictEqual(0, stats.channels[3].min);
      assert.strictEqual(0, stats.channels[3].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].sum, 0));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].squaresSum, 0));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].mean, 0));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].stdev, 0));
      assert.strictEqual(true, isInteger(stats.channels[3].minX));
      assert.strictEqual(true, isInRange(stats.channels[3].minX, 0, 300));
      assert.strictEqual(true, isInteger(stats.channels[3].minY));
      assert.strictEqual(true, isInRange(stats.channels[3].minY, 0, 300));
      assert.strictEqual(true, isInteger(stats.channels[3].maxX));
      assert.strictEqual(true, isInRange(stats.channels[3].maxX, 0, 300));
      assert.strictEqual(true, isInteger(stats.channels[3].maxY));
      assert.strictEqual(true, isInRange(stats.channels[3].maxY, 0, 300));

      done();
    });
  });

  it('Tiff', function (done) {
    sharp(fixtures.inputTiff).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 0.3851250782608986));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 10.312521863719589));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(248, r);
      assert.strictEqual(248, g);
      assert.strictEqual(248, b);

      // red channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(255, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 1887266220));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 481252886100));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 235.81772349417824));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 67.25712856093298));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2464));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 3248));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2464));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 3248));

      done();
    });
  });

  it('WebP', function (done) {
    sharp(fixtures.inputWebP).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.51758075132966));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 9.959951636662941));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(40, r);
      assert.strictEqual(136, g);
      assert.strictEqual(200, b);

      // red channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(true, isInRange(stats.channels[0].max, 254, 255));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 83291370));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 11379783198));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 105.36169496842616));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 57.39412151419967));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 1024));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 772));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 1024));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 772));

      // green channel
      assert.strictEqual(0, stats.channels[1].min);
      assert.strictEqual(true, isInRange(stats.channels[1].max, 254, 255));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 120877425));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 20774687595));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 152.9072025279307));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 53.84143349689916));
      assert.strictEqual(true, isInteger(stats.channels[1].minX));
      assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 1024));
      assert.strictEqual(true, isInteger(stats.channels[1].minY));
      assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 772));
      assert.strictEqual(true, isInteger(stats.channels[1].maxX));
      assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 1024));
      assert.strictEqual(true, isInteger(stats.channels[1].maxY));
      assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 772));

      // blue channel
      assert.strictEqual(0, stats.channels[2].min);
      assert.strictEqual(true, isInRange(stats.channels[2].max, 254, 255));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 138938859));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 28449125593));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 175.75450711423252));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 71.39929031070358));
      assert.strictEqual(true, isInteger(stats.channels[2].minX));
      assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 1024));
      assert.strictEqual(true, isInteger(stats.channels[2].minY));
      assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 772));
      assert.strictEqual(true, isInteger(stats.channels[2].maxX));
      assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 1024));
      assert.strictEqual(true, isInteger(stats.channels[2].maxY));
      assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 772));

      done();
    });
  });

  it('GIF', function (done) {
    sharp(fixtures.inputGif).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 6.087309412541799));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 2.9250574456255682));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(120, r);
      assert.strictEqual(136, g);
      assert.strictEqual(88, b);

      // red channel
      assert.strictEqual(35, stats.channels[0].min);
      assert.strictEqual(254, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 56088385));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 8002132113));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 131.53936444652908));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 38.26389131415863));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 800));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 533));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 800));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 533));

      // green channel
      assert.strictEqual(43, stats.channels[1].min);
      assert.strictEqual(255, stats.channels[1].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 58612156));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 8548344254));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 137.45815196998123));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 33.955424103758205));
      assert.strictEqual(true, isInteger(stats.channels[1].minX));
      assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 800));
      assert.strictEqual(true, isInteger(stats.channels[1].minY));
      assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 533));
      assert.strictEqual(true, isInteger(stats.channels[1].maxX));
      assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 800));
      assert.strictEqual(true, isInteger(stats.channels[1].maxY));
      assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 533));

      // blue channel
      assert.strictEqual(51, stats.channels[2].min);
      assert.strictEqual(254, stats.channels[2].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 49628525));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 6450556071));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 116.38959896810506));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 39.7669551046809));
      assert.strictEqual(true, isInteger(stats.channels[2].minX));
      assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 800));
      assert.strictEqual(true, isInteger(stats.channels[2].minY));
      assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 533));
      assert.strictEqual(true, isInteger(stats.channels[2].maxX));
      assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 800));
      assert.strictEqual(true, isInteger(stats.channels[2].maxY));
      assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 533));

      done();
    });
  });

  it('Grayscale GIF with alpha', function (done) {
    sharp(fixtures.inputGifGreyPlusAlpha).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(false, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 1));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 15.870619016486861));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(8, r);
      assert.strictEqual(8, g);
      assert.strictEqual(8, b);

      // gray channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(101, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 101));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 10201));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 50.5));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 71.4177848998413));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 1));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 1));

      // alpha channel
      assert.strictEqual(0, stats.channels[3].min);
      assert.strictEqual(255, stats.channels[3].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].sum, 255));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].squaresSum, 65025));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].mean, 127.5));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[3].stdev, 180.31222920256963));
      assert.strictEqual(true, isInteger(stats.channels[3].minX));
      assert.strictEqual(true, isInRange(stats.channels[3].minX, 0, 2));
      assert.strictEqual(true, isInteger(stats.channels[3].minY));
      assert.strictEqual(true, isInRange(stats.channels[3].minY, 0, 1));
      assert.strictEqual(true, isInteger(stats.channels[3].maxX));
      assert.strictEqual(true, isInRange(stats.channels[3].maxX, 0, 2));
      assert.strictEqual(true, isInteger(stats.channels[3].maxY));
      assert.strictEqual(true, isInRange(stats.channels[3].maxY, 0, 1));

      done();
    });
  });

  it('CMYK input without profile', () =>
    sharp(fixtures.inputJpgWithCmykNoProfile)
      .stats()
      .then(stats => {
        assert.strictEqual(4, stats.channels.length);
        assert.strictEqual(true, stats.isOpaque);
      })
  );

  it('Dominant colour', () =>
    sharp(fixtures.inputJpgBooleanTest)
      .stats()
      .then(({ dominant }) => {
        const { r, g, b } = dominant;
        assert.strictEqual(r, 8);
        assert.strictEqual(g, 136);
        assert.strictEqual(b, 248);
      })
  );

  it('Entropy and sharpness of 1x1 input are zero', async () => {
    const { entropy, sharpness } = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: 'red'
      }
    }).stats();
    assert.strictEqual(entropy, 0);
    assert.strictEqual(sharpness, 0);
  });

  it('Stream in, Callback out', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp().stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.319914765248541));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0.788301114707569));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(40, r);
      assert.strictEqual(40, g);
      assert.strictEqual(40, b);

      // red channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(255, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 615101275));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 83061892917));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 101.44954540768993));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 58.373870588815414));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

      // green channel
      assert.strictEqual(0, stats.channels[1].min);
      assert.strictEqual(255, stats.channels[1].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 462824115));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 47083677255));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 76.33425255128337));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 44.03023262954866));
      assert.strictEqual(true, isInteger(stats.channels[1].minX));
      assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[1].minY));
      assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[1].maxX));
      assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[1].maxY));
      assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 2725));

      // blue channel
      assert.strictEqual(0, stats.channels[2].min);
      assert.strictEqual(255, stats.channels[2].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 372986756));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 32151543524));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 61.51724663436759));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 38.96702865090125));
      assert.strictEqual(true, isInteger(stats.channels[2].minX));
      assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[2].minY));
      assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[2].maxX));
      assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[2].maxY));
      assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 2725));

      done();
    });
    readable.pipe(pipeline);
  });

  it('Stream in, Promise out', function () {
    const pipeline = sharp();

    fs.createReadStream(fixtures.inputJpg).pipe(pipeline);

    return pipeline.stats().then(function (stats) {
      assert.strictEqual(true, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.319914765248541));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0.788301114707569));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(40, r);
      assert.strictEqual(40, g);
      assert.strictEqual(40, b);

      // red channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(255, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 615101275));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 83061892917));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 101.44954540768993));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 58.373870588815414));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

      // green channel
      assert.strictEqual(0, stats.channels[1].min);
      assert.strictEqual(255, stats.channels[1].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 462824115));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 47083677255));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 76.33425255128337));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 44.03023262954866));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

      // blue channel
      assert.strictEqual(0, stats.channels[2].min);
      assert.strictEqual(255, stats.channels[2].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 372986756));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 32151543524));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 61.51724663436759));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 38.96702865090125));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));
    }).catch(function (err) {
      throw err;
    });
  });

  it('File in, Promise out', function () {
    return sharp(fixtures.inputJpg).stats().then(function (stats) {
      assert.strictEqual(true, stats.isOpaque);
      assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.319914765248541));
      assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0.788301114707569));

      const { r, g, b } = stats.dominant;
      assert.strictEqual(40, r);
      assert.strictEqual(40, g);
      assert.strictEqual(40, b);

      // red channel
      assert.strictEqual(0, stats.channels[0].min);
      assert.strictEqual(255, stats.channels[0].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 615101275));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 83061892917));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 101.44954540768993));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 58.373870588815414));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

      // green channel
      assert.strictEqual(0, stats.channels[1].min);
      assert.strictEqual(255, stats.channels[1].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 462824115));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 47083677255));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 76.33425255128337));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 44.03023262954866));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

      // blue channel
      assert.strictEqual(0, stats.channels[2].min);
      assert.strictEqual(255, stats.channels[2].max);
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 372986756));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 32151543524));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 61.51724663436759));
      assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 38.96702865090125));
      assert.strictEqual(true, isInteger(stats.channels[0].minX));
      assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].minY));
      assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));
    }).catch(function (err) {
      throw err;
    });
  });

  it('Blurred image has lower sharpness than original', () => {
    const original = sharp(fixtures.inputJpg).stats();
    const blurred = sharp(fixtures.inputJpg).blur().toBuffer().then(blur => sharp(blur).stats());

    return Promise
      .all([original, blurred])
      .then(([original, blurred]) => {
        assert.strictEqual(true, isInAcceptableRange(original.sharpness, 0.7883011147075476));
        assert.strictEqual(true, isInAcceptableRange(blurred.sharpness, 0.4791559805997398));
      });
  });

  it('File input with corrupt header fails gracefully', function (done) {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .stats(function (err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  it('File input with corrupt header fails gracefully, Promise out', function () {
    return sharp(fixtures.inputJpgWithCorruptHeader)
      .stats().then(function (stats) {
        throw new Error('Corrupt Header file');
      }).catch(function (err) {
        assert.ok(!!err);
      });
  });

  it('File input with corrupt header fails gracefully, Stream In, Promise Out', function () {
    const pipeline = sharp();

    fs.createReadStream(fixtures.inputJpgWithCorruptHeader).pipe(pipeline);

    return pipeline
      .stats().then(function (stats) {
        throw new Error('Corrupt Header file');
      }).catch(function (err) {
        assert.ok(!!err);
      });
  });

  it('Buffer input with corrupt header fails gracefully', function (done) {
    sharp(fs.readFileSync(fixtures.inputJpgWithCorruptHeader))
      .stats(function (err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  it('Non-existent file in, Promise out', function (done) {
    sharp('fail').stats().then(function (stats) {
      throw new Error('Non-existent file');
    }, function (err) {
      assert.ok(!!err);
      done();
    });
  });
});
