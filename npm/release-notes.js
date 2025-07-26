const { readFileSync, writeFileSync } = require('node:fs');

const { version } = require('./package.json');
const versionWithoutPreRelease = version.replace(/-rc\.\d+$/, '');

const markdown = readFileSync(`./docs/src/content/docs/changelog/v${versionWithoutPreRelease}.md`, 'utf8');
const markdownWithoutFrontmatter = markdown.replace(/---\n.*?\n---\n+/s, '');

writeFileSync('./release-notes.md', markdownWithoutFrontmatter);
