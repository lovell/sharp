// @ts-check
import * as fs from "node:fs/promises";
import * as esbuild from "esbuild";

await fs.rm(new URL("../dist/", import.meta.url), { force: true, recursive: true });

/** @satisfies {esbuild.BuildOptions} */
const sharedOptions = {
  minify: false,
  platform: "node",
  target: "node18",
  sourcemap: false,
  sourcesContent: false,
  bundle: false,
  entryPoints: ["./lib/*.mjs"],
  outdir: "dist",
};

await esbuild.build({
  ...sharedOptions,
  format: "esm",
  outExtension: { ".js": ".mjs" },
});
await esbuild.build({
  ...sharedOptions,
  format: "cjs",
  outExtension: { ".js": ".cjs" },
  plugins: [
    {
      name: "cjs-compat",
      setup(build) {
        build.onLoad({ filter: /\.mjs$/ }, async (args) => {
          const contents = await fs.readFile(args.path, "utf-8");
          return {
            contents: contents
              // ESM TLA to CJS require() is not supported ootb
              // https://github.com/evanw/esbuild/issues/253
              .replaceAll("await import(", "require(")
              .replaceAll("import.meta.url", "require('node:url').pathToFileURL(__filename)"),
            loader: "js",
          };
        });
      },
    },
  ],
});
