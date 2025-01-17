// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

import fs from 'node:fs/promises';
import path from 'node:path';
import jsdoc2md from 'jsdoc-to-markdown';

const pages = {
  constructor: 'Constructor',
  input: 'Input metadata',
  resize: 'Resizing images',
  composite: 'Compositing images',
  operation: 'Image operations',
  colour: 'Colour manipulation',
  channel: 'Channel manipulation',
  output: 'Output options',
  utility: 'Global properties'
};

Object.keys(pages).forEach(async (m) => {
  const input = path.join('lib', `${m}.js`);
  const output = path.join('docs', 'src', 'content', 'docs', `api-${m}.md`);

  const ast = await jsdoc2md.getTemplateData({ files: input });
  const markdown = await jsdoc2md.render({
    data: ast,
    'global-index-format': 'none',
    'module-index-format': 'none'
  });

  const cleanMarkdown =
    `---\n# This file was auto-generated from JSDoc in lib/${m}.js\ntitle: ${pages[m]}\n---\n\n` +
    markdown
      .replace(/(## )([A-Za-z0-9]+)([^\n]*)/g, '$1$2\n> $2$3\n') // simplify headings
      .replace(/<a name="[A-Za-z0-9+]+"><\/a>/g, '') // remove anchors
      .replace(/\*\*Kind\*\*: global[^\n]+/g, '') // remove all "global" Kind labels (requires JSDoc refactoring)
      .trim();

  await fs.writeFile(output, cleanMarkdown);
});
