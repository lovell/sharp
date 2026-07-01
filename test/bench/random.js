/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import imagemagick from 'imagemagick';
import gm from 'gm';
import assert from 'node:assert';
import Benchmark from 'benchmark';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

sharp.cache(false);

const min = 320;
const max = 960;

const randomDimension = () => Math.ceil((Math.random() * (max - min)) + min);

new Benchmark.Suite('random').add('imagemagick', {
  defer: true,
  fn: (deferred) => {
    imagemagick.resize({
      srcPath: fixtures.inputJpg,
      dstPath: fixtures.path('output.jpg'),
      quality: 0.8,
      width: randomDimension(),
      height: randomDimension(),
      format: 'jpg',
      filter: 'Lanczos'
    }, (err) => {
      if (err) {
        throw err;
      } else {
        deferred.resolve();
      }
    });
  }
}).add('gm', {
  defer: true,
  fn: (deferred) => {
    gm(fixtures.inputJpg)
      .resize(randomDimension(), randomDimension())
      .filter('Lanczos')
      .quality(80)
      .toBuffer((err, buffer) => {
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
  fn: (deferred) => {
    sharp(fixtures.inputJpg)
      .resize(randomDimension(), randomDimension())
      .toBuffer((err, buffer) => {
        if (err) {
          throw err;
        } else {
          assert.notStrictEqual(null, buffer);
          deferred.resolve();
        }
      });
  }
}).on('cycle', (event) => {
  console.log(String(event.target));
}).on('complete', function () {
  const winner = this.filter('fastest').map('name');
  assert.strictEqual('sharp', String(winner), `sharp was slower than ${winner}`);
}).run();
