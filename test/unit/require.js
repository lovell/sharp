'use strict';

describe('Require-time checks', function() {

  /*
    Including sharp alongside another C++ module that does not require
    -stdlib=libc++ (for its C++11 features) has caused clang/llvm to
    segfault due to the use of static function variables.
  */
  it('Require alongside C++ module that does not use libc++', function() {
    var bufferutil = require('bufferutil');
    var sharp = require('../../index');
  });

});
