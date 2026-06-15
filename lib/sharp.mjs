/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

// Inspects the runtime environment and exports the relevant sharp.node binary

import { createRequire } from "node:module"
import { familySync, versionSync } from "detect-libc";

import libvips from "./libvips.mjs";
import pkg from '../package.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const { version } = pkg;

const { runtimePlatformArch, isUnsupportedNodeRuntime, prebuiltPlatforms, minimumLibvipsVersion } = libvips;
const runtimePlatform = runtimePlatformArch();

/* node:coverage disable */

let sharp;
const errors = [];
try {
  sharp = require(`../src/build/Release/sharp-${runtimePlatform}-${version}.node`);
} catch (err) {
  errors.push(err);
}
if (!sharp) {
  try {
    sharp = require(`../src/build/Release/sharp-wasm32-${version}.node`);
  } catch (err) {
    errors.push(err);
  }
}
if (!sharp) {
  try {
    switch (runtimePlatform) {
      case "darwin-arm64":
        sharp = require("@img/sharp-darwin-arm64/sharp.node");
        break;
      case "darwin-x64":
        sharp = require("@img/sharp-darwin-x64/sharp.node");
        break;
      case "linux-arm":
        sharp = require("@img/sharp-linux-arm/sharp.node");
        break;
      case "linux-arm64":
        sharp = require("@img/sharp-linux-arm64/sharp.node");
        break;
      case "linux-ppc64":
        sharp = require("@img/sharp-linux-ppc64/sharp.node");
        break;
      case "linux-riscv64":
        sharp = require("@img/sharp-linux-riscv64/sharp.node");
        break;
      case "linux-s390x":
        sharp = require("@img/sharp-linux-s390x/sharp.node");
        break;
      case "linux-x64":
        sharp = require("@img/sharp-linux-x64/sharp.node");
        break;
      case "linuxmusl-arm64":
        sharp = require("@img/sharp-linuxmusl-arm64/sharp.node");
        break;
      case "linuxmusl-x64":
        sharp = require("@img/sharp-linuxmusl-x64/sharp.node");
        break;
      case "win32-arm64":
        sharp = require("@img/sharp-win32-arm64/sharp.node");
        break;
      case "win32-ia32":
        sharp = require("@img/sharp-win32-ia32/sharp.node");
        break;
      case "win32-x64":
        sharp = require("@img/sharp-win32-x64/sharp.node");
        break;
      case "freebsd-arm64":
      case "freebsd-x64":
        sharp = require("@img/sharp-freebsd-wasm32/sharp.node");
        break;
      case "linux-wasm32":
        sharp = require("@img/sharp-webcontainers-wasm32/sharp.node");
        break;
    }
    if (sharp && ["linux-x64", "linuxmusl-x64"].includes(runtimePlatform) && !sharp._isUsingX64V2()) {
      const err = new Error("Prebuilt binaries for Linux x64 require v2 microarchitecture");
      err.code = "Unsupported CPU";
      errors.push(err);
      sharp = null;
    }
  } catch (err) {
    errors.push(err);
  }
}
if (!sharp) {
  try {
    sharp = require("@img/sharp-wasm32/sharp.node");
  } catch (err) {
    errors.push(err);
  }
}

if (!sharp) {
  const [isLinux, isMacOs, isWindows] = ["linux", "darwin", "win32"].map((os) => runtimePlatform.startsWith(os));

  const help = [`Could not load the "sharp" module using the ${runtimePlatform} runtime`];
  errors.forEach((err) => {
    if (!err.code.endsWith("MODULE_NOT_FOUND")) {
      help.push(`${err.code}: ${err.message}`);
    }
  });
  const messages = errors.map((err) => err.message).join(" ");
  help.push("Possible solutions:");
  // Common error messages
  if (isUnsupportedNodeRuntime()) {
    const { found, expected } = isUnsupportedNodeRuntime();
    help.push("- Please upgrade Node.js:", `    Found ${found}`, `    Requires ${expected}`);
  } else if (prebuiltPlatforms.includes(runtimePlatform)) {
    const [os, cpu] = runtimePlatform.split("-");
    const libc = os.endsWith("musl") ? " --libc=musl" : "";
    help.push(
      "- Ensure optional dependencies can be installed:",
      "    npm install --include=optional sharp",
      "- Ensure your package manager supports multi-platform installation:",
      "    See https://sharp.pixelplumbing.com/install#cross-platform",
      "- Add platform-specific dependencies:",
      `    npm install --os=${os.replace("musl", "")}${libc} --cpu=${cpu} sharp`,
    );
  } else {
    help.push(
      `- Manually install libvips >= ${minimumLibvipsVersion}`,
      "    See https://sharp.pixelplumbing.com/install#building-from-source",
      "- Add WebAssembly-based dependencies:",
      "    npm install sharp @img/sharp-wasm32",
    );
  }
  if (isLinux && /(symbol not found|CXXABI_)/i.test(messages)) {
    try {
      const { config } = require(`@img/sharp-libvips-${runtimePlatform}/package`);
      const libcFound = `${familySync()} ${versionSync()}`;
      const libcRequires = `${config.musl ? "musl" : "glibc"} ${config.musl || config.glibc}`;
      help.push("- Update your OS:", `    Found ${libcFound}`, `    Requires ${libcRequires}`);
    } catch (_errEngines) {}
  }
  if (isLinux && /\/snap\/core[0-9]{2}/.test(messages)) {
    help.push("- Remove the Node.js Snap, which does not support native modules", "    snap remove node");
  }
  if (isMacOs && /Incompatible library version/.test(messages)) {
    help.push("- Update Homebrew:", "    brew update && brew upgrade vips");
  }
  if (errors.some((err) => err.code === "ERR_DLOPEN_DISABLED")) {
    help.push("- Run Node.js without using the --no-addons flag");
  }
  // Link to installation docs
  if (isWindows && /The specified procedure could not be found/.test(messages)) {
    help.push(
      "- Using the canvas package on Windows?",
      "    See https://sharp.pixelplumbing.com/install#canvas-and-windows",
      "- Check for outdated versions of sharp in the dependency tree:",
      "    npm ls sharp",
    );
  }
  help.push("- Consult the installation documentation:", "    See https://sharp.pixelplumbing.com/install");
  throw new Error(help.join("\n"));
}

export default sharp;
