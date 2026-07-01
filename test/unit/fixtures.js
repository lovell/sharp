/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import fixtures from '../fixtures/index.js';

suite('Test fixtures', () => {
  suite('assertMaxColourDistance', () => {
    test('should throw an Error when images have a different number of channels', (t) => {
      t.plan(1);
      t.assert.throws(
        () => fixtures.assertMaxColourDistance(fixtures.inputPngOverlayLayer1, fixtures.inputJpg)
      );
    });
    test('should throw an Error when images have different dimensions', (t) => {
      t.plan(1);
      t.assert.throws(
        () => fixtures.assertMaxColourDistance(fixtures.inputJpg, fixtures.inputJpgWithExif)
      );
    });
    test('should accept a zero threshold when comparing an image to itself', (t) => {
      t.plan(1);
      const image = fixtures.inputPngOverlayLayer0;
      t.assert.doesNotThrow(
        () => fixtures.assertMaxColourDistance(image, image, 1E-6)
      );
    });
    test('should accept a numeric threshold for two different images', (t) => {
      t.plan(1);
      t.assert.doesNotThrow(
        () => fixtures.assertMaxColourDistance(fixtures.inputPngOverlayLayer0, fixtures.inputPngOverlayLayer1, 100)
      );
    });
  });
});
