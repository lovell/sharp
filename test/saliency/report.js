'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const async = require('async');
const sharp = require('../../');

const crops = {
  entropy: sharp.strategy.entropy,
  attention: sharp.strategy.attention
};
const concurrency = os.cpus().length;

const scores = {};

const incrementScore = function (accuracy, crop) {
  if (typeof scores[accuracy] === 'undefined') {
    scores[accuracy] = {};
  }
  if (typeof scores[accuracy][crop] === 'undefined') {
    scores[accuracy][crop] = 0;
  }
  scores[accuracy][crop]++;
};

const userData = require('./userData.json');
const files = Object.keys(userData);

async.eachLimit(files, concurrency, function (file, done) {
  const filename = path.join(__dirname, 'Image', file);
  const salientWidth = userData[file].right - userData[file].left;
  const salientHeight = userData[file].bottom - userData[file].top;
  sharp(filename).metadata(function (err, metadata) {
    if (err) console.log(err);
    const marginWidth = metadata.width - salientWidth;
    const marginHeight = metadata.height - salientHeight;
    async.each(Object.keys(crops), function (crop, done) {
      async.parallel([
        // Left edge accuracy
        function (done) {
          if (marginWidth) {
            sharp(filename).resize(salientWidth, metadata.height).crop(crops[crop]).toBuffer(function (err, data, info) {
              const delta = Math.abs(userData[file].left + info.cropOffsetLeft);
              const accuracy = Math.round(marginWidth / (marginWidth + delta) * 100);
              incrementScore(accuracy, crop);
              done(err);
            });
          } else {
            done();
          }
        },
        // Top edge accuracy
        function (done) {
          if (marginHeight) {
            sharp(filename).resize(metadata.width, salientHeight).crop(crops[crop]).toBuffer(function (err, data, info) {
              const delta = Math.abs(userData[file].top + info.cropOffsetTop);
              const accuracy = Math.round(marginHeight / (marginHeight + delta) * 100);
              incrementScore(accuracy, crop);
              done(err);
            });
          } else {
            done();
          }
        }
      ], done);
    }, done);
  });
}, function () {
  const report = [];
  Object.keys(scores).forEach(function (accuracy) {
    report.push(
      Object.assign({
        accuracy: Number(accuracy)
      }, scores[accuracy])
    );
  });
  fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
});
