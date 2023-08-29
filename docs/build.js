// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const fs = require('fs').promises;
const path = require('path');
const jsdoc2md = require('jsdoc-to-markdown');

[
  'constructor',
  'input',
  'resize',
  'composite',
  'operation',
  'colour',
  'channel',
  'output',
  'utility'
].forEach(async (m) => {
  const input = path.join('lib', `${m}.js`);
  const output = path.join('docs', `api-${m}.md`);

  const ast = await jsdoc2md.getTemplateData({ files: input });
  const markdown = await jsdoc2md.render({
    data: ast,
    'global-index-format': 'none',
    'module-index-format': 'none'
  });

  const cleanMarkdown = markdown
    .replace(/(## )([A-Za-z0-9]+)([^\n]*)/g, '$1$2\n> $2$3\n') // simplify headings to match those of documentationjs, ensures existing URLs work
    .replace(/<a name="[A-Za-z0-9+]+"><\/a>/g, '') // remove anchors, let docute add these (at markdown to HTML render time)
    .replace(/\*\*Kind\*\*: global[^\n]+/g, '') // remove all "global" Kind labels (requires JSDoc refactoring)
    .trim();

  await fs.writeFile(output, cleanMarkdown);
});
