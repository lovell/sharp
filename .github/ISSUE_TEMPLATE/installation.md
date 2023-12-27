---
name: Installation
about: Something went wrong during either 'npm install sharp' or 'require("sharp")'
labels: installation

---

<!-- Please try to answer as many of these questions as possible. -->

## Possible install-time or require-time problem

<!-- Please place an [x] in the box to confirm. -->

- [ ] I have read and understood all of the [documentation relating to installation](https://sharp.pixelplumbing.com/install).
- [ ] I have searched for known bugs relating to this problem in my choice of package manager.

You must confirm both of these before continuing.

### Are you using the latest version of sharp?

<!-- Please place an [x] in the box to confirm. -->

- [ ] I am using the latest version of `sharp` as reported by `npm view sharp dist-tags.latest`.

If you cannot confirm this, please upgrade to the latest version and try again before opening an issue.

If you are using another package which depends on a version of `sharp` that is not the latest,
please open an issue against that package instead.

### Are you using a supported runtime?

<!-- Please place an [x] in the relevant box to confirm. -->

- [ ] I am using Node.js with a version that satisfies `^18.17.0 || ^20.3.0 || >=21.0.0`
- [ ] I am using Deno
- [ ] I am using Bun

If you cannot confirm any of these,
please upgrade to the latest version
and try again before opening an issue.

### Are you using a supported package manager and installing optional dependencies?

<!-- Please place an [x] in the relevant box to confirm. -->

- [ ] I am using npm >= 9.6.5 with `--include=optional`
- [ ] I am using yarn >= 3.2.0
- [ ] I am using pnpm >= 7.1.0 with `--no-optional=false`
- [ ] I am using Deno
- [ ] I am using Bun

If you cannot confirm any of these, please upgrade to the latest version of your chosen package manager
and ensure you are allowing the installation of optional or multi-platform dependencies before opening an issue.

### What is the complete error message, including the full stack trace?

<!-- Please provide the error message and stack trace here. -->

### What is the complete output of running `npm install --verbose --foreground-scripts sharp` in an empty directory?

<details>

<!-- Please provide output of `npm install --verbose --foreground-scripts sharp` in an empty directory here. -->

</details>

### What is the output of running `npx envinfo --binaries --system --npmPackages=sharp --npmGlobalPackages=sharp`?

<!-- Please provide output of `npx envinfo --binaries --system --npmPackages=sharp --npmGlobalPackages=sharp` here. -->
