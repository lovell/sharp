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

function typeDefsToEsm(input) {
  input = input.replace(/\r\n/g, '\n');
  input = input.replace(/declare function sharp\(options\?:\s*sharp\.SharpOptions\):\s*sharp\.Sharp;\n?/g, '');
  input = input.replace(/declare function sharp\(\s*\n\s*input\?:\s*sharp\.SharpInput\s*\|\s*Array<sharp\.SharpInput>,\s*\n\s*options\?:\s*sharp\.SharpOptions,\s*\n\):\s*sharp\.Sharp;\n?/g, '');

  const namespaceStart = input.indexOf('declare namespace sharp {');
  if (namespaceStart === -1) {
    throw new Error('declare namespace sharp { not found');
  }
  const namespaceEnd = input.indexOf('\n}\n\nexport = sharp;', namespaceStart);
  if (namespaceEnd === -1) {
    throw new Error('namespace closing pattern not found');
  }

  const namespaceBody = input.slice(namespaceStart + 'declare namespace sharp {'.length, namespaceEnd);
  const before = input.slice(0, namespaceStart);
  const after = input.slice(namespaceEnd + '\n}\n\nexport = sharp;'.length);

  const lines = namespaceBody.split('\n').map(line => {
    let out = line.replace(/^ {4}/, '');
    out = out.replace(/\bsharp\./g, '');
    if (/^(const|function|interface|type|class|enum)\b/.test(out) && !/^export\b/.test(out)) {
      out = `export ${out}`;
    }
    return out;
  });

  const ctor = [
    '',
    'export interface SharpConstructor {',
    '  (options?: SharpOptions): Sharp;',
    '  (input?: SharpInput | SharpInput[], options?: SharpOptions): Sharp;',
    '  new (options?: SharpOptions): Sharp;',
    '  new (input?: SharpInput | SharpInput[], options?: SharpOptions): Sharp;',
    '  format: FormatEnum;',
    '  versions: {',
    '    aom?: string | undefined;',
    '    archive?: string | undefined;',
    '    cairo?: string | undefined;',
    '    cgif?: string | undefined;',
    '    exif?: string | undefined;',
    '    expat?: string | undefined;',
    '    ffi?: string | undefined;',
    '    fontconfig?: string | undefined;',
    '    freetype?: string | undefined;',
    '    fribidi?: string | undefined;',
    '    glib?: string | undefined;',
    '    harfbuzz?: string | undefined;',
    '    heif?: string | undefined;',
    '    highway?: string | undefined;',
    '    imagequant?: string | undefined;',
    '    lcms?: string | undefined;',
    '    mozjpeg?: string | undefined;',
    '    pango?: string | undefined;',
    '    pixman?: string | undefined;',
    '    png?: string | undefined;',
    '    "proxy-libintl"?: string | undefined;',
    '    rsvg?: string | undefined;',
    '    sharp: string;',
    '    spng?: string | undefined;',
    '    tiff?: string | undefined;',
    '    vips: string;',
    '    webp?: string | undefined;',
    '    xml?: string | undefined;',
    '    "zlib-ng"?: string | undefined;',
    '  };',
    '  interpolators: Interpolators;',
    '  queue: NodeJS.EventEmitter;',
    '  cache(options?: boolean | CacheOptions): CacheResult;',
    '  concurrency(concurrency?: number): number;',
    '  counters(): SharpCounters;',
    '  simd(enable?: boolean): boolean;',
    '  block(options: { operation: string[] }): void;',
    '  unblock(options: { operation: string[] }): void;',
    '  gravity: GravityEnum;',
    '  strategy: StrategyEnum;',
    '  kernel: KernelEnum;',
    '  fit: FitEnum;',
    '  bool: BoolEnum;',
    '}',
    '',
    'export const sharp: SharpConstructor;',
    'export default sharp;',
    '',
  ].join('\n');

  return [before.trimEnd(), '', lines.join('\n').trim(), ctor, after.trimStart()].join('\n').replace(/\bsharp\./g, '');
}

const entries = (await fs.readdir(libDir)).filter(e => e.endsWith('.mjs'));

for (const entry of entries) {
  await fs.cp(new URL(entry, libDir), new URL(entry, distDir));
  const contents = await fs.readFile(new URL(entry, libDir), "utf-8");
  await fs.writeFile(new URL(entry.replace(".mjs", ".cjs"), distDir), esmToCjs(contents));
} 

const typeDefsCjs = await fs.readFile(new URL("index.d.ts", libDir), "utf-8");
await fs.writeFile(new URL("index.d.cts", distDir), typeDefsCjs);

const typeDefsEsm = typeDefsToEsm(typeDefsCjs);
await fs.writeFile(new URL("index.d.mts", distDir), typeDefsEsm);
