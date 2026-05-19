/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs/promises');
const { suite, test } = require('node:test');

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

suite('Image Stats', () => {
  test('JPEG', async (t) => {
    t.plan(48);
    const stats = await sharp(fixtures.inputJpg).stats();

    t.assert.strictEqual(true, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.332915340666659));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0.7883011147075762));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(40, r);
    t.assert.strictEqual(40, g);
    t.assert.strictEqual(40, b);

    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(255, stats.channels[0].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 615101275));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 83061892917));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 101.44954540768993));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 58.373870588815414));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

    t.assert.strictEqual(0, stats.channels[1].min);
    t.assert.strictEqual(255, stats.channels[1].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 462824115));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 47083677255));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 76.33425255128337));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 44.03023262954866));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 2725));

    t.assert.strictEqual(0, stats.channels[2].min);
    t.assert.strictEqual(255, stats.channels[2].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 372986756));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 32151543524));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 61.51724663436759));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 38.96702865090125));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 2725));
  });

  test('PNG without transparency', async (t) => {
    t.plan(20);
    const stats = await sharp(fixtures.inputPng).stats();

    t.assert.strictEqual(true, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 0.3409031108021736));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 9.111356137722868));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(248, r);
    t.assert.strictEqual(248, g);
    t.assert.strictEqual(248, b);

    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(255, stats.channels[0].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 1391368230));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 354798898650));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 238.8259925648822));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 62.15121915523771));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2809));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2074));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2809));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2074));
  });

  test('PNG with transparency', async (t) => {
    t.plan(62);
    const stats = await sharp(fixtures.inputPngWithTransparency).stats();

    t.assert.strictEqual(false, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 0.06778064835816622));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 2.522916068931278));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(248, r);
    t.assert.strictEqual(248, g);
    t.assert.strictEqual(248, b);

    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(255, stats.channels[0].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 795678795));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 202898092725));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 252.9394769668579));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 22.829537532816));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2048));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 1536));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2048));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 1536));

    t.assert.strictEqual(0, stats.channels[1].min);
    t.assert.strictEqual(255, stats.channels[1].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 795678795));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 202898092725));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 252.9394769668579));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 22.829537532816));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 2048));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 1536));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 2048));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 1536));

    t.assert.strictEqual(0, stats.channels[2].min);
    t.assert.strictEqual(255, stats.channels[2].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 795678795));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 202898092725));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 252.9394769668579));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 22.829537532816));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 2048));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 1536));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 2048));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 1536));

    t.assert.strictEqual(0, stats.channels[3].min);
    t.assert.strictEqual(255, stats.channels[3].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].sum, 5549142));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].squaresSum, 1333571132));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].mean, 1.7640247344970703));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].stdev, 20.51387814157297));
    t.assert.strictEqual(true, isInteger(stats.channels[3].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[3].minX, 0, 2048));
    t.assert.strictEqual(true, isInteger(stats.channels[3].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[3].minY, 0, 1536));
    t.assert.strictEqual(true, isInteger(stats.channels[3].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[3].maxX, 0, 2048));
    t.assert.strictEqual(true, isInteger(stats.channels[3].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[3].maxY, 0, 1536));
  });

  test('PNG fully transparent', async (t) => {
    t.plan(20);
    const stats = await sharp(fixtures.inputPngCompleteTransparency).stats();

    t.assert.strictEqual(false, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 0));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(72, r);
    t.assert.strictEqual(104, g);
    t.assert.strictEqual(72, b);

    t.assert.strictEqual(0, stats.channels[3].min);
    t.assert.strictEqual(0, stats.channels[3].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].sum, 0));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].squaresSum, 0));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].mean, 0));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].stdev, 0));
    t.assert.strictEqual(true, isInteger(stats.channels[3].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[3].minX, 0, 300));
    t.assert.strictEqual(true, isInteger(stats.channels[3].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[3].minY, 0, 300));
    t.assert.strictEqual(true, isInteger(stats.channels[3].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[3].maxX, 0, 300));
    t.assert.strictEqual(true, isInteger(stats.channels[3].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[3].maxY, 0, 300));
  });

  test('TIFF', async (t) => {
    t.plan(20);
    const stats = await sharp(fixtures.inputTiff).stats();

    t.assert.strictEqual(true, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 0.3851250782608986));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 10.312521863719589));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(248, r);
    t.assert.strictEqual(248, g);
    t.assert.strictEqual(248, b);

    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(255, stats.channels[0].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 1887266220));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 481252886100));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 235.81772349417824));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 67.25712856093298));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2464));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 3248));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2464));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 3248));
  });

  test('WebP', async (t) => {
    t.plan(48);
    const stats = await sharp(fixtures.inputWebP).stats();

    t.assert.strictEqual(true, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.51758075132966));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 9.971384105278734));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(40, r);
    t.assert.strictEqual(136, g);
    t.assert.strictEqual(200, b);

    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(true, isInRange(stats.channels[0].max, 254, 255));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 83291370));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 11379783198));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 105.36169496842616));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 57.39412151419967));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 1024));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 772));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 1024));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 772));

    t.assert.strictEqual(0, stats.channels[1].min);
    t.assert.strictEqual(true, isInRange(stats.channels[1].max, 254, 255));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 120877425));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 20774687595));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 152.9072025279307));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 53.84143349689916));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 1024));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 772));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 1024));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 772));

    t.assert.strictEqual(0, stats.channels[2].min);
    t.assert.strictEqual(true, isInRange(stats.channels[2].max, 254, 255));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 138938859));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 28449125593));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 175.75450711423252));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 71.39929031070358));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 1024));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 772));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 1024));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 772));
  });

  test('GIF', async (t) => {
    t.plan(48);
    const stats = await sharp(fixtures.inputGif).stats();

    t.assert.strictEqual(true, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 6.08118048729375));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 2.936767879098001));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(120, r);
    t.assert.strictEqual(136, g);
    t.assert.strictEqual(88, b);

    t.assert.strictEqual(35, stats.channels[0].min);
    t.assert.strictEqual(254, stats.channels[0].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 56088385));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 8002132113));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 131.53936444652908));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 38.26389131415863));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 800));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 533));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 800));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 533));

    t.assert.strictEqual(43, stats.channels[1].min);
    t.assert.strictEqual(255, stats.channels[1].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 58612156));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 8548344254));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 137.45815196998123));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 33.955424103758205));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 800));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 533));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 800));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 533));

    t.assert.strictEqual(51, stats.channels[2].min);
    t.assert.strictEqual(254, stats.channels[2].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 49628525));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 6450556071));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 116.38959896810506));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 39.7669551046809));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 800));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 533));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 800));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 533));
  });

  test('Grayscale GIF with alpha', async (t) => {
    t.plan(34);
    const stats = await sharp(fixtures.inputGifGreyPlusAlpha).stats();

    t.assert.strictEqual(false, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 1));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 15.870619016486861));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(8, r);
    t.assert.strictEqual(8, g);
    t.assert.strictEqual(8, b);

    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(101, stats.channels[0].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 101));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 10201));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 50.5));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 71.4177848998413));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 1));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 1));

    t.assert.strictEqual(0, stats.channels[3].min);
    t.assert.strictEqual(255, stats.channels[3].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].sum, 255));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].squaresSum, 65025));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].mean, 127.5));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[3].stdev, 180.31222920256963));
    t.assert.strictEqual(true, isInteger(stats.channels[3].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[3].minX, 0, 2));
    t.assert.strictEqual(true, isInteger(stats.channels[3].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[3].minY, 0, 1));
    t.assert.strictEqual(true, isInteger(stats.channels[3].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[3].maxX, 0, 2));
    t.assert.strictEqual(true, isInteger(stats.channels[3].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[3].maxY, 0, 1));
  });

  test('CMYK input without profile', async (t) => {
    t.plan(2);
    const stats = await sharp(fixtures.inputJpgWithCmykNoProfile).stats();
    t.assert.strictEqual(4, stats.channels.length);
    t.assert.strictEqual(true, stats.isOpaque);
  });

  test('Dominant colour', async (t) => {
    t.plan(3);
    const { dominant } = await sharp(fixtures.inputJpgBooleanTest).stats();
    const { r, g, b } = dominant;
    t.assert.strictEqual(r, 8);
    t.assert.strictEqual(g, 136);
    t.assert.strictEqual(b, 248);
  });

  test('Entropy and sharpness of 1x1 input are zero', async (t) => {
    t.plan(2);
    const { entropy, sharpness } = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: 'red'
      }
    }).stats();
    t.assert.strictEqual(entropy, 0);
    t.assert.strictEqual(sharpness, 0);
  });

  test('Stream in, Callback out', (t, done) => {
    t.plan(49);
    const pipeline = sharp();
    fs.open(fixtures.inputJpg).then((fd) => {
      fd.createReadStream().pipe(pipeline);
    });
    pipeline.stats((err, stats) => {
      t.assert.ok(!err);

      t.assert.strictEqual(true, stats.isOpaque);
      t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.332915340666659));
      t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0.788301114707569));

      const { r, g, b } = stats.dominant;
      t.assert.strictEqual(40, r);
      t.assert.strictEqual(40, g);
      t.assert.strictEqual(40, b);

      t.assert.strictEqual(0, stats.channels[0].min);
      t.assert.strictEqual(255, stats.channels[0].max);
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 615101275));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 83061892917));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 101.44954540768993));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 58.373870588815414));
      t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
      t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
      t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
      t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
      t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

      t.assert.strictEqual(0, stats.channels[1].min);
      t.assert.strictEqual(255, stats.channels[1].max);
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 462824115));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 47083677255));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 76.33425255128337));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 44.03023262954866));
      t.assert.strictEqual(true, isInteger(stats.channels[1].minX));
      t.assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[1].minY));
      t.assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[1].maxX));
      t.assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[1].maxY));
      t.assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 2725));

      t.assert.strictEqual(0, stats.channels[2].min);
      t.assert.strictEqual(255, stats.channels[2].max);
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 372986756));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 32151543524));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 61.51724663436759));
      t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 38.96702865090125));
      t.assert.strictEqual(true, isInteger(stats.channels[2].minX));
      t.assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[2].minY));
      t.assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[2].maxX));
      t.assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 2725));
      t.assert.strictEqual(true, isInteger(stats.channels[2].maxY));
      t.assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 2725));
      done();
    });
  });

  test('Stream in, Promise out', async (t) => {
    t.plan(48);
    const fd = await fs.open(fixtures.inputJpg);
    const pipeline = sharp();
    fd.createReadStream().pipe(pipeline);
    const stats = await pipeline.stats();

    t.assert.strictEqual(true, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.332915340666659));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0.788301114707569));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(40, r);
    t.assert.strictEqual(40, g);
    t.assert.strictEqual(40, b);

    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(255, stats.channels[0].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 615101275));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 83061892917));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 101.44954540768993));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 58.373870588815414));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

    t.assert.strictEqual(0, stats.channels[1].min);
    t.assert.strictEqual(255, stats.channels[1].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 462824115));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 47083677255));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 76.33425255128337));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 44.03023262954866));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 2725));

    t.assert.strictEqual(0, stats.channels[2].min);
    t.assert.strictEqual(255, stats.channels[2].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 372986756));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 32151543524));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 61.51724663436759));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 38.96702865090125));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 2725));
  });

  test('File in, Promise out', async (t) => {
    t.plan(48);
    const stats = await sharp(fixtures.inputJpg).stats();

    t.assert.strictEqual(true, stats.isOpaque);
    t.assert.strictEqual(true, isInAcceptableRange(stats.entropy, 7.332915340666659));
    t.assert.strictEqual(true, isInAcceptableRange(stats.sharpness, 0.788301114707569));

    const { r, g, b } = stats.dominant;
    t.assert.strictEqual(40, r);
    t.assert.strictEqual(40, g);
    t.assert.strictEqual(40, b);

    t.assert.strictEqual(0, stats.channels[0].min);
    t.assert.strictEqual(255, stats.channels[0].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].sum, 615101275));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].squaresSum, 83061892917));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].mean, 101.44954540768993));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[0].stdev, 58.373870588815414));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[0].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[0].maxY, 0, 2725));

    t.assert.strictEqual(0, stats.channels[1].min);
    t.assert.strictEqual(255, stats.channels[1].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].sum, 462824115));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].squaresSum, 47083677255));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].mean, 76.33425255128337));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[1].stdev, 44.03023262954866));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[1].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[1].maxY, 0, 2725));

    t.assert.strictEqual(0, stats.channels[2].min);
    t.assert.strictEqual(255, stats.channels[2].max);
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].sum, 372986756));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].squaresSum, 32151543524));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].mean, 61.51724663436759));
    t.assert.strictEqual(true, isInAcceptableRange(stats.channels[2].stdev, 38.96702865090125));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].minY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].minY, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxX));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxX, 0, 2725));
    t.assert.strictEqual(true, isInteger(stats.channels[2].maxY));
    t.assert.strictEqual(true, isInRange(stats.channels[2].maxY, 0, 2725));
  });

  test('Blurred image has lower sharpness than original', async (t) => {
    t.plan(2);
    const original = sharp(fixtures.inputJpg).stats();
    const blurred = sharp(fixtures.inputJpg).blur().toBuffer().then(blur => sharp(blur).stats());

    const [originalStats, blurredStats] = await Promise.all([original, blurred]);
    t.assert.strictEqual(true, isInAcceptableRange(originalStats.sharpness, 0.789046400439488));
    t.assert.strictEqual(true, isInAcceptableRange(blurredStats.sharpness, 0.47985138441709047));
  });

  test('File input with corrupt header fails gracefully', async (t) => {
    t.plan(4);
    await t.assert.rejects(
      () => sharp(fixtures.inputJpgWithCorruptHeader).stats(),
      (err) => {
        t.assert.ok(err.message.includes('Input file has corrupt header'));
        t.assert.ok(err.stack.includes('at Sharp.stats'));
        t.assert.ok(err.stack.includes(__filename));
        return true;
      }
    );
  });

  test('Stream input with corrupt header fails gracefully', async (t) => {
    t.plan(4);
    const fd = await fs.open(fixtures.inputJpgWithCorruptHeader);
    const pipeline = sharp();
    fd.createReadStream().pipe(pipeline);

    await t.assert.rejects(
      () => pipeline.stats(),
      (err) => {
        t.assert.ok(err.message.includes('Input buffer has corrupt header'));
        t.assert.ok(err.stack.includes('at Sharp.stats'));
        t.assert.ok(err.stack.includes(__filename));
        return true;
      }
    );
  });

  test('File input with corrupt header fails gracefully', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputJpgWithCorruptHeader).stats());
  });

  test('Stream input with corrupt header fails gracefully', async (t) => {
    t.plan(1);
    const fd = await fs.open(fixtures.inputJpgWithCorruptHeader);
    const pipeline = sharp();
    fd.createReadStream().pipe(pipeline);
    await t.assert.rejects(() => pipeline.stats());
  });

  test('Buffer input with corrupt header fails gracefully', async (t) => {
    t.plan(1);
    const input = await fs.readFile(fixtures.inputJpgWithCorruptHeader);
    await t.assert.rejects(() => sharp(input).stats());
  });

  test('Non-existent file fails gracefully', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp('fail').stats());
  });

  test('Sequential read option is ignored', async (t) => {
    t.plan(1);
    const { isOpaque } = await sharp(fixtures.inputJpg, { sequentialRead: true }).stats();
    t.assert.strictEqual(isOpaque, true);
  });
});
