'use strict';

const sharp = require('../../');

// Define SHARP_TEST_WITHOUT_CACHE environment variable to prevent use of libvips' cache

beforeEach(function () {
  sharp.cache(!process.env.SHARP_TEST_WITHOUT_CACHE);
});
