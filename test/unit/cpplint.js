'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var cpplint = require('node-cpplint/lib/');

describe('cpplint', function() {

  // Ignore cpplint failures, possibly newline-related, on Windows
  if (process.platform !== 'win32') {
    // List C++ source files
    fs.readdirSync(path.join(__dirname, '..', '..', 'src')).filter(function(source) {
      return source !== 'libvips';
    }).forEach(function(source) {
      var file = path.join('src', source);
      it(file, function(done) {
        // Lint each source file
        cpplint({
          files: [file],
          linelength: 120,
          filters: {
            legal: {
              copyright: false
            },
            build: {
              include: false
            },
            whitespace: {
              parens: false
            },
            runtime: {
              indentation_namespace: false
            }
          }
        }, function(err, report) {
          if (err) {
            throw err;
          }
          var expected = {};
          expected[file] = [];
          assert.deepEqual(expected, report);
          done();
        });
      });

    });
  }

});
