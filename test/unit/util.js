'use strict';

var assert = require('assert');
var sharp = require('../../index');

var defaultConcurrency = sharp.concurrency();

describe('Utilities', function() {

  describe('Cache', function() {
    it('Can be disabled', function() {
      sharp.cache(0);
    });
    it('Can be set to a maximum of 50MB and 500 items', function() {
      sharp.cache(50, 500);
    });
  });

  describe('Concurrency', function() {
    it('Can be set to use 16 threads', function() {
      sharp.concurrency(16);
      assert.strictEqual(16, sharp.concurrency());
    });
    it('Can be reset to default', function() {
      sharp.concurrency(0);
      assert.strictEqual(defaultConcurrency, sharp.concurrency());
    });
  });

  describe('Counters', function() {
    it('Have zero value at rest', function() {
      var counters = sharp.counters();
      assert.strictEqual(0, counters.queue);
      assert.strictEqual(0, counters.process);
    });
  });

});
