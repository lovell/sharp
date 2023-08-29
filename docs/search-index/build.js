// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const fs = require('fs');
const path = require('path');
const { extractDescription, extractKeywords, extractParameters } = require('./extract');

const searchIndex = [];

// Install
const contents = fs.readFileSync(path.join(__dirname, '..', 'install.md'), 'utf8');
const matches = contents.matchAll(
  /## (?<title>[A-Za-z0-9 ]+)\n\n(?<body>[^#]+)/gs
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
  const contents = fs.readFileSync(path.join(__dirname, '..', `api-${section}.md`), 'utf8');
  const matches = contents.matchAll(
    /## (?<title>[A-Za-z]+)\n[^\n]+\n(?<firstparagraph>.+?)\n\n.+?(?<parameters>\| Param .+?\n\n)?\*\*Example/gs
  );
  for (const match of matches) {
    const { title, firstparagraph, parameters } = match.groups;
    const description = firstparagraph.startsWith('###')
      ? 'Constructor'
      : extractDescription(firstparagraph);
    const parameterNames = parameters ? extractParameters(parameters) : '';

    searchIndex.push({
      t: title,
      d: description,
      k: extractKeywords(`${title} ${description} ${parameterNames}`),
      l: `/api-${section}#${title.toLowerCase()}`
    });
  }
});

fs.writeFileSync(
  path.join(__dirname, '..', 'search-index.json'),
  JSON.stringify(searchIndex)
);
