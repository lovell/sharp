// @ts-check
import * as fs from 'node:fs/promises';
import * as esbuild from 'esbuild';

await fs.rm(new URL('./dist/', import.meta.url), { force: true, recursive: true });
await esbuild.build({
  minify: false,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  sourcemap: false,
  sourcesContent: false,
  bundle: false,
  entryPoints: ['./lib/*.js'],
  outdir: 'dist',
});
await esbuild.build({
  minify: false,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: false,
  sourcesContent: false,
  bundle: false,
  entryPoints: ['./lib/*.js'],
  outdir: 'dist',
  plugins: [
    // ESM TLA to CJS require() is not supported ootb
    // https://github.com/evanw/esbuild/issues/253
    {
      name: 'tla-to-require',
      setup(build) {
        build.onLoad({ filter: /\.js$/ }, async (args) => {
          const contents = await fs.readFile(args.path, 'utf-8');
          return {
            contents: contents.replaceAll('await import(', 'require('),
            loader: 'js',
          };
        });
      },
    },
  ],
  outExtension: { '.js': '.cjs' },
});
