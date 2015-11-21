'use strict';

var imagemagick = require('imagemagick');
var gm = require('gm');
var assert = require('assert');
var Benchmark = require('benchmark');

var sharp = require('../../index');
var fixtures = require('../fixtures');

var min = 320;
var max = 960;

// Nearest equivalent to bilinear
var magickFilter = 'Triangle';

var randomDimension = function() {
  return Math.ceil(Math.random() * (max - min) + min);
};

new Benchmark.Suite('random').add('imagemagick', {
  defer: true,
  fn: function(deferred) {
    imagemagick.resize({
      srcPath: fixtures.inputJpg,
      dstPath: fixtures.outputJpg,
      quality: 0.8,
      width: randomDimension(),
      height: randomDimension(),
      format: 'jpg',
      filter: magickFilter
    }, function(err) {
      if (err) {
        throw err;
      } else {
        deferred.resolve();
      }
    });
  }
}).add('gm', {
  defer: true,
  fn: function(deferred) {
    gm(fixtures.inputJpg)
      .resize(randomDimension(), randomDimension())
      .filter(magickFilter)
      .quality(80)
      .toBuffer(function (err, buffer) {
        if (err) {
          throw err;
        } else {
          assert.notStrictEqual(null, buffer);
          deferred.resolve();
        }
      });
  }
}).add('sharp', {
  defer: true,
  fn: function(deferred) {
    sharp(fixtures.inputJpg).resize(randomDimension(), randomDimension()).toBuffer(function(err, buffer) {
      if (err) {
        throw err;
      } else {
        assert.notStrictEqual(null, buffer);
        deferred.resolve();
      }
    });
  }
}).on('cycle', function(event) {
  console.log(String(event.target));
}).on('complete', function() {
  var winner = this.filter('fastest').pluck('name');
  assert.strictEqual('sharp', String(winner), 'sharp was slower than ' + winner);
  console.dir(sharp.cache());
}).run();
