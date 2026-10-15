/**
 * Convert an image to JPEG XL.
 *
 * sharp can write JPEG XL only when its libvips was built with libjxl
 * (probed below via sharp.format); the prebuilt binaries currently do
 * not include it. Fallbacks, in order: cjxl (the libjxl CLI, the only
 * backend that can transcode JPEG losslessly, bit-exact), ffmpeg with
 * libjxl, ImageMagick. Success requires a JPEG XL codestream (FF 0A)
 * or container signature in the output.
 *
 *   node convert-to-jxl.mjs [--lossless] [--distance 1.0] [--effort 7] in.png [out.jxl]
 */
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import sharp from "../lib/index.mjs";

const CODESTREAM = Buffer.from([0xff, 0x0a]);
const CONTAINER = Buffer.from([0, 0, 0, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a]);

export function isJpegXl(buf) {
  return buf.subarray(0, 2).equals(CODESTREAM) || buf.subarray(0, 12).equals(CONTAINER);
}

async function viaSharp(input, { lossless, distance, effort }) {
  if (!sharp.format?.jxl?.output?.buffer) {
    throw new Error("this sharp/libvips build cannot write JPEG XL");
  }
  const quality = lossless ? 100 : Math.max(10, Math.min(100, Math.round(100 - distance * 10)));
  return sharp(input).jxl({ quality, lossless, effort }).toBuffer();
}

function viaTool(args) {
  const r = spawnSync(args[0], args.slice(1), { stdio: "pipe" });
  return r.status === 0;
}

export async function convert(input, output, { lossless = false, distance = 1.0, effort = 7 } = {}) {
  try {
    const buf = await viaSharp(input, { lossless, distance, effort });
    if (!isJpegXl(buf)) throw new Error("sharp produced non-JPEG-XL output");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(output, buf);
    return output;
  } catch { /* fall through to external libjxl backends */ }

  const tools = [
    ["cjxl", input, output, `--effort=${effort}`, lossless ? "--lossless=1" : `--distance=${distance}`],
    ["ffmpeg", "-y", "-i", input, "-c:v", "libjxl", "-effort", String(effort),
     ...(lossless ? ["-lossless", "1"] : ["-distance", String(distance)]), output],
    ["magick", input, output],
  ];
  for (const args of tools) {
    if (viaTool(args) && isJpegXl(await readFile(output))) return output;
  }
  throw new Error("no working JPEG XL backend (build sharp/libvips with libjxl, or install cjxl, ffmpeg --enable-libjxl, or ImageMagick with jxl delegate)");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opts = { lossless: false, distance: 1.0, effort: 7 };
  const pos = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lossless") opts.lossless = true;
    else if (args[i] === "--distance") opts.distance = Number(args[++i]);
    else if (args[i] === "--effort") opts.effort = Number(args[++i]);
    else pos.push(args[i]);
  }
  if (!pos.length || pos.length > 2) {
    console.error("usage: convert-to-jxl.mjs [--lossless] [--distance 1.0] [--effort 7] in [out.jxl]");
    process.exit(2);
  }
  const out = pos[1] ?? pos[0].replace(/\.[^.]+$/, ".jxl");
  console.log(`${pos[0]} -> ${await convert(pos[0], out, opts)}`);
}
