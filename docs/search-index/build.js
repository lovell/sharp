'use strict';

const fs = require('fs');
const { extractDescription, extractKeywords } = require('./extract');

const searchIndex = [];

// Install
const contents = fs.readFileSync(`${__dirname}/../install.md`, 'utf8');
const matches = contents.matchAll(
  /## (?<title>[A-Za-z ]+)\n\n(?<body>[^#]+)/gs
);
for (const match of matches) {
  const { title, body } = match.groups;
  const description = extractDescription(body);

  searchIndex.push({
    t: title,
    d: description,
    k: extractKeywords(`${title} ${description}`),
    l: `/install#${title.toLowerCase().replace(/ /g, '-')}`
  });
}

// API
[
  'constructor',
  'input',
  'output',
  'resize',
  'composite',
  'operation',
  'channel',
  'colour',
  'utility'
].forEach((section) => {
  const contents = fs.readFileSync(`${__dirname}/../api-${section}.md`, 'utf8');
  const matches = contents.matchAll(
    /\n## (?<title>[A-Za-z]+)\n\n(?<firstparagraph>.+?)\n\n/gs
  );
  for (const match of matches) {
    const { title, firstparagraph } = match.groups;
    const description = firstparagraph.startsWith('###')
      ? 'Constructor'
      : extractDescription(firstparagraph);

    searchIndex.push({
      t: title,
      d: description,
      k: extractKeywords(`${title} ${description}`),
      l: `/api-${section}#${title.toLowerCase()}`
    });
  }
});

fs.writeFileSync(
  `${__dirname}/../search-index.json`,
  JSON.stringify(searchIndex)
);
