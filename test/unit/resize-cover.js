/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import is from '../../lib/is.js';
import fixtures from '../fixtures/index.js';
const { inRange } = is;

suite('Resize fit=cover', () => {
  [
    // Position
    {
      name: 'Position: top',
      width: 320,
      height: 80,
      gravity: sharp.position.top,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Position: right',
      width: 80,
      height: 320,
      gravity: sharp.position.right,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Position: bottom',
      width: 320,
      height: 80,
      gravity: sharp.position.bottom,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Position: left',
      width: 80,
      height: 320,
      gravity: sharp.position.left,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Position: right top (top)',
      width: 320,
      height: 80,
      gravity: sharp.position['right top'],
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Position: right top (right)',
      width: 80,
      height: 320,
      gravity: sharp.position['right top'],
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Position: right bottom (bottom)',
      width: 320,
      height: 80,
      gravity: sharp.position['right bottom'],
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Position: right bottom (right)',
      width: 80,
      height: 320,
      gravity: sharp.position['right bottom'],
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Position: left bottom (bottom)',
      width: 320,
      height: 80,
      gravity: sharp.position['left bottom'],
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Position: left bottom (left)',
      width: 80,
      height: 320,
      gravity: sharp.position['left bottom'],
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Position: left top (top)',
      width: 320,
      height: 80,
      gravity: sharp.position['left top'],
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Position: left top (left)',
      width: 80,
      height: 320,
      gravity: sharp.position['left top'],
      fixture: 'gravity-west.jpg'
    },
    // Gravity
    {
      name: 'Gravity: north',
      width: 320,
      height: 80,
      gravity: sharp.gravity.north,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Gravity: east',
      width: 80,
      height: 320,
      gravity: sharp.gravity.east,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Gravity: south',
      width: 320,
      height: 80,
      gravity: sharp.gravity.south,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Gravity: west',
      width: 80,
      height: 320,
      gravity: sharp.gravity.west,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Gravity: center',
      width: 320,
      height: 80,
      gravity: sharp.gravity.center,
      fixture: 'gravity-center.jpg'
    },
    {
      name: 'Gravity: centre',
      width: 80,
      height: 320,
      gravity: sharp.gravity.centre,
      fixture: 'gravity-centre.jpg'
    },
    {
      name: 'Default (centre)',
      width: 80,
      height: 320,
      gravity: undefined,
      fixture: 'gravity-centre.jpg'
    },
    {
      name: 'Gravity: northeast (north)',
      width: 320,
      height: 80,
      gravity: sharp.gravity.northeast,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Gravity: northeast (east)',
      width: 80,
      height: 320,
      gravity: sharp.gravity.northeast,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Gravity: southeast (south)',
      width: 320,
      height: 80,
      gravity: sharp.gravity.southeast,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Gravity: southeast (east)',
      width: 80,
      height: 320,
      gravity: sharp.gravity.southeast,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Gravity: southwest (south)',
      width: 320,
      height: 80,
      gravity: sharp.gravity.southwest,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Gravity: southwest (west)',
      width: 80,
      height: 320,
      gravity: sharp.gravity.southwest,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Gravity: northwest (north)',
      width: 320,
      height: 80,
      gravity: sharp.gravity.northwest,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Gravity: northwest (west)',
      width: 80,
      height: 320,
      gravity: sharp.gravity.northwest,
      fixture: 'gravity-west.jpg'
    }
  ].forEach((settings) => {
    test(settings.name, async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputJpg)
        .resize(settings.width, settings.height, {
          fit: sharp.fit.cover,
          position: settings.gravity
        })
        .toBuffer({ resolveWithObject: true });

      t.assert.strictEqual(settings.width, info.width);
      t.assert.strictEqual(settings.height, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(settings.fixture), data));
    });
  });

  test('Allows specifying the gravity as a string', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(80, 320, {
        fit: sharp.fit.cover,
        position: 'east'
      })
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(80, info.width);
    t.assert.strictEqual(320, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gravity-east.jpg'), data));
  });

  test('Invalid position values fail', (t) => {
    t.plan(4);
    t.assert.throws(() => {
      sharp().resize(null, null, { fit: 'cover', position: 9 });
    }, /Expected valid position\/gravity\/strategy for position but received 9 of type number/);
    t.assert.throws(() => {
      sharp().resize(null, null, { fit: 'cover', position: 1.1 });
    }, /Expected valid position\/gravity\/strategy for position but received 1.1 of type number/);
    t.assert.throws(() => {
      sharp().resize(null, null, { fit: 'cover', position: -1 });
    }, /Expected valid position\/gravity\/strategy for position but received -1 of type number/);
    t.assert.throws(() => {
      sharp().resize(null, null, { fit: 'cover', position: 'zoinks' }).crop();
    }, /Expected valid position\/gravity\/strategy for position but received zoinks of type string/);
  });

  test('Uses default value when none specified', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().resize(null, null, { fit: 'cover' });
    });
  });

  test('Skip crop when post-resize dimensions are at target', async (t) => {
    t.plan(4);
    const input = await sharp(fixtures.inputJpg)
      .resize(1600, 1200)
      .toBuffer();
    const { info } = await sharp(input)
      .resize(1110, null, {
        fit: sharp.fit.cover,
        position: sharp.strategy.attention
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(1110, info.width);
    t.assert.strictEqual(832, info.height);
    t.assert.strictEqual(undefined, info.cropOffsetLeft);
    t.assert.strictEqual(undefined, info.cropOffsetTop);
  });

  suite('Animated WebP', () => {
    test('Width only', async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(80, 320, { fit: sharp.fit.cover })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(80, info.width);
      t.assert.strictEqual(320 * 9, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gravity-center-width.webp'), data));
    });

    test('Height only', async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(320, 80, { fit: sharp.fit.cover })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80 * 9, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('gravity-center-height.webp'), data));
    });
  });

  suite('Entropy-based strategy', () => {
    test('JPEG', async (t) => {
      t.plan(7);
      const options = {
        fit: 'cover',
        position: sharp.strategy.entropy
      };
      const { data, info } = await sharp(fixtures.inputJpg)
        .resize(80, 320, options)
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(80, info.width);
      t.assert.strictEqual(320, info.height);
      t.assert.strictEqual(-117, info.cropOffsetLeft);
      t.assert.strictEqual(0, info.cropOffsetTop);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('crop-strategy-entropy.jpg'), data));
    });

    test('PNG', async (t) => {
      t.plan(7);
      const { data, info } = await sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: sharp.strategy.entropy
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('png', info.format);
      t.assert.strictEqual(4, info.channels);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      t.assert.strictEqual(0, info.cropOffsetLeft);
      t.assert.strictEqual(-80, info.cropOffsetTop);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data));
    });

    test('supports the strategy passed as a string', async (t) => {
      t.plan(7);
      const { data, info } = await sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: 'entropy'
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('png', info.format);
      t.assert.strictEqual(4, info.channels);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      t.assert.strictEqual(0, info.cropOffsetLeft);
      t.assert.strictEqual(-80, info.cropOffsetTop);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data));
    });

    test('Animated image rejects', async (t) => {
      t.plan(1);
      await t.assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
        .resize({
          width: 100,
          height: 8,
          position: sharp.strategy.entropy
        })
        .toBuffer(),
      /Resize strategy is not supported for multi-page images/
      );
    });
  });

  suite('Attention strategy', () => {
    test('JPEG', async (t) => {
      t.plan(9);
      const { data, info } = await sharp(fixtures.inputJpg)
        .resize(80, 320, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(80, info.width);
      t.assert.strictEqual(320, info.height);
      t.assert.strictEqual(-107, info.cropOffsetLeft);
      t.assert.strictEqual(0, info.cropOffsetTop);
      t.assert.strictEqual(588, info.attentionX);
      t.assert.ok(inRange(info.attentionY, 636, 640));
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('crop-strategy-attention.jpg'), data));
    });

    test('PNG', async (t) => {
      t.plan(9);
      const { data, info } = await sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('png', info.format);
      t.assert.strictEqual(4, info.channels);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      t.assert.strictEqual(0, info.cropOffsetLeft);
      t.assert.strictEqual(0, info.cropOffsetTop);
      t.assert.strictEqual(0, info.attentionX);
      t.assert.strictEqual(0, info.attentionY);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data));
    });

    test('WebP', async (t) => {
      t.plan(9);
      const { data, info } = await sharp(fixtures.inputWebP)
        .resize(320, 80, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('webp', info.format);
      t.assert.strictEqual(3, info.channels);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      t.assert.strictEqual(0, info.cropOffsetLeft);
      t.assert.strictEqual(-161, info.cropOffsetTop);
      t.assert.ok(inRange(info.attentionX, 284, 288));
      t.assert.strictEqual(745, info.attentionY);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('crop-strategy.webp'), data));
    });

    test('supports the strategy passed as a string', async (t) => {
      t.plan(7);
      const { data, info } = await sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80, {
          fit: 'cover',
          position: 'attention'
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual('png', info.format);
      t.assert.strictEqual(4, info.channels);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(80, info.height);
      t.assert.strictEqual(0, info.cropOffsetLeft);
      t.assert.strictEqual(0, info.cropOffsetTop);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data));
    });

    test('Animated image rejects', async (t) => {
      t.plan(1);
      await t.assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
        .resize({
          width: 100,
          height: 8,
          position: sharp.strategy.attention
        })
        .toBuffer(),
      /Resize strategy is not supported for multi-page images/
      );
    });
  });
});
