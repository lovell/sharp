'use strict';

const detectLibc = require('detect-libc');
const sharp = require('../../');

const usingCache = detectLibc.family !== detectLibc.MUSL;

beforeEach(function () {
  sharp.cache(usingCache);
});
