'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var cpplint = require('node-cpplint/lib/');

describe('cpplint', function() {

  // Ignore cpplint failures, possibly newline-related, on Windows
  if (process.platform !== 'win32') {
    // List C++ source files
    fs.readdirSync(path.join(__dirname, '..', '..', 'src')).forEach(function (source) {
      var file = path.join('src', source);
      it(file, function(done) {
        // Lint each source file
        cpplint({
          files: [file],
          linelength: 140,
          filters: {
            legal: {
              copyright: false
            },
            build: {
              include: false,
              include_order: false
            },
            whitespace: {
              blank_line: false,
              comments: false,
              parens: false
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
