// @ts-check
import * as fs from "node:fs/promises";

const distDir = new URL("../dist/", import.meta.url);

await fs.rm(distDir, { force: true, recursive: true });
await fs.mkdir(new URL("../dist/", import.meta.url), { recursive: true });

const libDir = new URL("../lib/", import.meta.url);

/**
 * @param {string} input
 * @returns {string}
 */
function cjsToEsm(input) {
  return input
    // Turn import into require() and .mjs into .cjs
    .replace(
      /import\s+(.+)\s+from\s+('[^']+'|"[^"]+");?/g,
      (_, bindings, path) => `const ${bindings} = require(${path.replace(".mjs", ".cjs")});`,
    )
    .replace(/import\s+('[^']+'|"[^"]+");?/g, (_, path) => `require(${path.replace(".mjs", ".cjs")});`)
    // Transforms TLA
    .replaceAll("await import(", "require(")
    .replaceAll("export default", "module.exports =")
    // import.meta.url doesn't exist in cjs
    .replaceAll("import.meta.url", "require('node:url').pathToFileURL(__filename)");
}

const entries = (await fs.readdir(libDir, { recursive: true })).filter(e => e.endsWith('.mjs'));

for (const entry of entries) {
  await fs.cp(new URL(entry, libDir), new URL(entry, distDir));
  const contents = await fs.readFile(new URL(entry, libDir), "utf-8");
  await fs.writeFile(new URL(entry.replace(".mjs", ".cjs"), distDir), cjsToEsm(contents));
}
