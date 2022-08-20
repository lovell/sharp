'use strict';

const fs = require('fs').promises;
const path = require('path');

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
  const documentation = await import('documentation');

  const input = path.join('lib', `${m}.js`);
  const output = path.join('docs', `api-${m}.md`);

  const ast = await documentation.build(input, { shallow: true });
  const markdown = await documentation.formats.md(ast, { markdownToc: false });

  await fs.writeFile(output, markdown);
});
