'use strict';

const fs = require('fs');
const assert = require('assert');
// const exifReader = require('exif-reader');
// const icc = require('icc');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Image Stats', function () {
  it('JPEG', function (done) {
    sharp(fixtures.inputJpg).stats(function (err, stats) {
      if (err) throw err;
      assert.strictEqual(true, stats.isOpaque);

      // red channel
      assert.strictEqual(0, stats.channels[0]['min']);
      assert.strictEqual(255, stats.channels[0]['max']);
      assert.strictEqual(615101275, stats.channels[0]['sum']);
      assert.strictEqual(83061892917, stats.channels[0]['squaresSum']);
      assert.strictEqual(101.44954540768993, stats.channels[0]['mean']);
      assert.strictEqual(58.373870588815414, stats.channels[0]['stdev']);

      // green channel
      assert.strictEqual(0, stats.channels[1]['min']);
      assert.strictEqual(255, stats.channels[1]['max']);
      assert.strictEqual(462824115, stats.channels[1]['sum']);
      assert.strictEqual(47083677255, stats.channels[1]['squaresSum']);
      assert.strictEqual(76.33425255128337, stats.channels[1]['mean']);
      assert.strictEqual(44.03023262954866, stats.channels[1]['stdev']);

      // blue channel
      assert.strictEqual(0, stats.channels[2]['min']);
      assert.strictEqual(255, stats.channels[2]['max']);
      assert.strictEqual(372986756, stats.channels[2]['sum']);
      assert.strictEqual(32151543524, stats.channels[2]['squaresSum']);
      assert.strictEqual(61.51724663436759, stats.channels[2]['mean']);
      assert.strictEqual(38.96702865090125, stats.channels[2]['stdev']);

      done();
    });
  });

  it('PNG without transparency', function (done) {
    sharp(fixtures.inputPng).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);

      // red channel
      assert.strictEqual(0, stats.channels[0]['min']);
      assert.strictEqual(255, stats.channels[0]['max']);
      assert.strictEqual(1391368230, stats.channels[0]['sum']);
      assert.strictEqual(354798898650, stats.channels[0]['squaresSum']);
      assert.strictEqual(238.8259925648822, stats.channels[0]['mean']);
      assert.strictEqual(62.15121915523771, stats.channels[0]['stdev']);

      done();
    });
  });

  it('PNG with transparency', function (done) {
    sharp(fixtures.inputPngOverlayLayer0).stats(function (err, stats) {
      if (err) throw err;
      assert.strictEqual(false, stats.isOpaque);

      // red channel
      assert.strictEqual(212, stats.channels[0]['min']);
      assert.strictEqual(247, stats.channels[0]['max']);
      assert.strictEqual(770571799, stats.channels[0]['sum']);
      assert.strictEqual(188759304559, stats.channels[0]['squaresSum']);
      assert.strictEqual(244.95817788441977, stats.channels[0]['mean']);
      assert.strictEqual(0.6767578826464375, stats.channels[0]['stdev']);

      // green channel
      assert.strictEqual(211, stats.channels[1]['min']);
      assert.strictEqual(246, stats.channels[1]['max']);
      assert.strictEqual(767426974, stats.channels[1]['sum']);
      assert.strictEqual(187221727388, stats.channels[1]['squaresSum']);
      assert.strictEqual(243.958464940389, stats.channels[1]['mean']);
      assert.strictEqual(0.6720702755728892, stats.channels[1]['stdev']);

      // blue channel
      assert.strictEqual(208, stats.channels[2]['min']);
      assert.strictEqual(243, stats.channels[2]['max']);
      assert.strictEqual(754846269, stats.channels[2]['sum']);
      assert.strictEqual(181133678547, stats.channels[2]['squaresSum']);
      assert.strictEqual(239.95916652679443, stats.channels[2]['mean']);
      assert.strictEqual(0.6663998253271178, stats.channels[2]['stdev']);

      // alpha channel
      assert.strictEqual(255, stats.channels[3]['min']);
      assert.strictEqual(255, stats.channels[3]['max']);
      assert.strictEqual(802160640, stats.channels[3]['sum']);
      assert.strictEqual(204550963200, stats.channels[3]['squaresSum']);
      assert.strictEqual(255, stats.channels[3]['mean']);
      assert.strictEqual(0, stats.channels[3]['stdev']);

      done();
    });
  });

  it('Tiff', function (done) {
    sharp(fixtures.inputTiff).stats(function (err, stats) {
      if (err) throw err;
      assert.strictEqual(true, stats.isOpaque);

      // red channel
      assert.strictEqual(0, stats.channels[0]['min']);
      assert.strictEqual(255, stats.channels[0]['max']);
      assert.strictEqual(1887266220, stats.channels[0]['sum']);
      assert.strictEqual(481252886100, stats.channels[0]['squaresSum']);
      assert.strictEqual(235.81772349417824, stats.channels[0]['mean']);
      assert.strictEqual(67.25712856093298, stats.channels[0]['stdev']);

      done();
    });
  });

  it('WebP', function (done) {
    sharp(fixtures.inputWebP).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);

      // red channel
      assert.strictEqual(0, stats.channels[0]['min']);
      assert.strictEqual(255, stats.channels[0]['max']);
      assert.strictEqual(83291370, stats.channels[0]['sum']);
      assert.strictEqual(11379783198, stats.channels[0]['squaresSum']);
      assert.strictEqual(105.36169496842616, stats.channels[0]['mean']);
      assert.strictEqual(57.39412151419967, stats.channels[0]['stdev']);

      // green channel
      assert.strictEqual(0, stats.channels[1]['min']);
      assert.strictEqual(255, stats.channels[1]['max']);
      assert.strictEqual(120877425, stats.channels[1]['sum']);
      assert.strictEqual(20774687595, stats.channels[1]['squaresSum']);
      assert.strictEqual(152.9072025279307, stats.channels[1]['mean']);
      assert.strictEqual(53.84143349689916, stats.channels[1]['stdev']);

      // blue channel
      assert.strictEqual(0, stats.channels[2]['min']);
      assert.strictEqual(255, stats.channels[2]['max']);
      assert.strictEqual(138938859, stats.channels[2]['sum']);
      assert.strictEqual(28449125593, stats.channels[2]['squaresSum']);
      assert.strictEqual(175.75450711423252, stats.channels[2]['mean']);
      assert.strictEqual(71.39929031070358, stats.channels[2]['stdev']);

      done();
    });
  });

  it('GIF', function (done) {
    sharp(fixtures.inputGif).stats(function (err, stats) {
      if (err) throw err;

      assert.strictEqual(true, stats.isOpaque);

      // red channel
      assert.strictEqual(35, stats.channels[0]['min']);
      assert.strictEqual(254, stats.channels[0]['max']);
      assert.strictEqual(56088385, stats.channels[0]['sum']);
      assert.strictEqual(8002132113, stats.channels[0]['squaresSum']);
      assert.strictEqual(131.53936444652908, stats.channels[0]['mean']);
      assert.strictEqual(38.26389131415863, stats.channels[0]['stdev']);

      // green channel
      assert.strictEqual(43, stats.channels[1]['min']);
      assert.strictEqual(255, stats.channels[1]['max']);
      assert.strictEqual(58612156, stats.channels[1]['sum']);
      assert.strictEqual(8548344254, stats.channels[1]['squaresSum']);
      assert.strictEqual(137.45815196998123, stats.channels[1]['mean']);
      assert.strictEqual(33.955424103758205, stats.channels[1]['stdev']);

      // blue channel
      assert.strictEqual(51, stats.channels[2]['min']);
      assert.strictEqual(254, stats.channels[2]['max']);
      assert.strictEqual(49628525, stats.channels[2]['sum']);
      assert.strictEqual(6450556071, stats.channels[2]['squaresSum']);
      assert.strictEqual(116.38959896810506, stats.channels[2]['mean']);
      assert.strictEqual(39.7669551046809, stats.channels[2]['stdev']);

      done();
    });
  });

  it('Grayscale GIF with alpha', function (done) {
    sharp(fixtures.inputGifGreyPlusAlpha).stats(function (err, stats) {
      if (err) throw err;
      assert.strictEqual(false, stats.isOpaque);

      // gray channel
      assert.strictEqual(0, stats.channels[0]['min']);
      assert.strictEqual(101, stats.channels[0]['max']);
      assert.strictEqual(101, stats.channels[0]['sum']);
      assert.strictEqual(10201, stats.channels[0]['squaresSum']);
      assert.strictEqual(50.5, stats.channels[0]['mean']);
      assert.strictEqual(71.4177848998413, stats.channels[0]['stdev']);

      // alpha channel
      assert.strictEqual(0, stats.channels[1]['min']);
      assert.strictEqual(255, stats.channels[1]['max']);
      assert.strictEqual(255, stats.channels[1]['sum']);
      assert.strictEqual(65025, stats.channels[1]['squaresSum']);
      assert.strictEqual(127.5, stats.channels[1]['mean']);
      assert.strictEqual(180.31222920256963, stats.channels[1]['stdev']);

      done();
    });
  });

  it('Stream in, Callback out', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp().stats(function (err, stats) {
      if (err) throw err;
      assert.strictEqual(true, stats.isOpaque);

      // red channel
      assert.strictEqual(0, stats.channels[0]['min']);
      assert.strictEqual(255, stats.channels[0]['max']);
      assert.strictEqual(615101275, stats.channels[0]['sum']);
      assert.strictEqual(83061892917, stats.channels[0]['squaresSum']);
      assert.strictEqual(101.44954540768993, stats.channels[0]['mean']);
      assert.strictEqual(58.373870588815414, stats.channels[0]['stdev']);

      // green channel
      assert.strictEqual(0, stats.channels[1]['min']);
      assert.strictEqual(255, stats.channels[1]['max']);
      assert.strictEqual(462824115, stats.channels[1]['sum']);
      assert.strictEqual(47083677255, stats.channels[1]['squaresSum']);
      assert.strictEqual(76.33425255128337, stats.channels[1]['mean']);
      assert.strictEqual(44.03023262954866, stats.channels[1]['stdev']);

      // blue channel
      assert.strictEqual(0, stats.channels[2]['min']);
      assert.strictEqual(255, stats.channels[2]['max']);
      assert.strictEqual(372986756, stats.channels[2]['sum']);
      assert.strictEqual(32151543524, stats.channels[2]['squaresSum']);
      assert.strictEqual(61.51724663436759, stats.channels[2]['mean']);
      assert.strictEqual(38.96702865090125, stats.channels[2]['stdev']);

      done();
    });
    readable.pipe(pipeline);
  });

  it('Stream in, Promise out', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp();
    pipeline.stats().then(function (stats) {
      assert.strictEqual(true, stats.isOpaque);

      // red channel
      assert.strictEqual(0, stats.channels[0]['min']);
      assert.strictEqual(255, stats.channels[0]['max']);
      assert.strictEqual(615101275, stats.channels[0]['sum']);
      assert.strictEqual(83061892917, stats.channels[0]['squaresSum']);
      assert.strictEqual(101.44954540768993, stats.channels[0]['mean']);
      assert.strictEqual(58.373870588815414, stats.channels[0]['stdev']);

      // green channel
      assert.strictEqual(0, stats.channels[1]['min']);
      assert.strictEqual(255, stats.channels[1]['max']);
      assert.strictEqual(462824115, stats.channels[1]['sum']);
      assert.strictEqual(47083677255, stats.channels[1]['squaresSum']);
      assert.strictEqual(76.33425255128337, stats.channels[1]['mean']);
      assert.strictEqual(44.03023262954866, stats.channels[1]['stdev']);

      // blue channel
      assert.strictEqual(0, stats.channels[2]['min']);
      assert.strictEqual(255, stats.channels[2]['max']);
      assert.strictEqual(372986756, stats.channels[2]['sum']);
      assert.strictEqual(32151543524, stats.channels[2]['squaresSum']);
      assert.strictEqual(61.51724663436759, stats.channels[2]['mean']);
      assert.strictEqual(38.96702865090125, stats.channels[2]['stdev']);

      done();
    }).catch(function (err) {
      throw err;
    });

    readable.pipe(pipeline);
  });

  it('File input with corrupt header fails gracefully', function (done) {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .stats(function (err) {
        assert.strictEqual(true, !!err);
        done();
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
    sharp('fail').metadata().then(function (metadata) {
      throw new Error('Non-existent file');
    }, function (err) {
      assert.ok(!!err);
      done();
    });
  });
});
