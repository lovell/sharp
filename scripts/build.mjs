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
function esmToCjs(input) {
  return input
    // Turn import into require() and .mjs into .cjs
    .replace(
      /import\s+(.+)\s+from\s+('[^']+'|"[^"]+")(?:\s+with\s+\{[^}]*\})?;?/g,
      (_, bindings, path) => `const ${bindings} = require(${path.replace(".mjs", ".cjs")});`,
    )
    .replace(/import\s+('[^']+'|"[^"]+")(?:\s+with\s+\{[^}]*\})?;?/g, (_, path) => `require(${path.replace(".mjs", ".cjs")});`)
    // Transforms TLA
    .replaceAll("export default", "module.exports =")
    // Remove createRequire
    .replaceAll("const { createRequire } = require(\"node:module\");", "")
    .replaceAll("const require = createRequire(import.meta.url);", "")
}

const entries = (await fs.readdir(libDir)).filter(e => e.endsWith('.mjs'));

for (const entry of entries) {
  await fs.cp(new URL(entry, libDir), new URL(entry, distDir));
  const contents = await fs.readFile(new URL(entry, libDir), "utf-8");
  await fs.writeFile(new URL(entry.replace(".mjs", ".cjs"), distDir), esmToCjs(contents));
} 

const indexDts = await fs.readFile(new URL("index.d.ts", libDir), "utf-8");
await fs.writeFile(new URL("index.d.mts", distDir), indexDts);
await fs.writeFile(new URL("index.d.cts", distDir), indexDts.replace(/export default /, "export = "));
