'use strict';

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(bufferutil|sharp)" }] */

describe('Require-time checks', function () {
  /**
    Including sharp alongside another C++ module that does not require
    -stdlib=libc++ (for its C++11 features) has caused clang/llvm to
    segfault due to the use of static function variables.
  */
  it('Require alongside C++ module that does not use libc++', function () {
    const bufferutil = require('bufferutil');
    const sharp = require('../../index');
  });
});
