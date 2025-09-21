import { readdir } from 'node:fs/promises';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const files = (await readdir('./test/unit')).map((f) => `./test/unit/${f}`);

run({
  files,
  concurrency: true,
  timeout: 60000,
  coverage: true,
  coverageIncludeGlobs: ['lib/*.js'],
  branchCoverage: 100,
})
  .compose(new spec())
  .pipe(process.stdout);
