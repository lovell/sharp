---
name: Installation
about: Something went wrong during either 'npm install sharp' or 'require("sharp")'
labels: installation

---

<!-- Please try to answer as many of these questions as possible. -->

## Possible install-time or require-time problem

<!-- Please place an [x] in the box to confirm. -->

- [ ] I have read the [documentation relating to installation](https://sharp.pixelplumbing.com/install).

### Are you using the latest version of sharp?

<!-- Please place an [x] in the box to confirm. -->

- [ ] I am using the latest version of `sharp` as reported by `npm view sharp dist-tags.latest`.

If you cannot confirm this, please upgrade to the latest version and try again before opening an issue.

If you are using another package which depends on a version of `sharp` that is not the latest, please open an issue against that package instead.

### Are you using a supported runtime?

<!-- Please place an [x] in the relevant box to confirm. -->

- [ ] I am using Node.js 18 with a version >= 18.17.0
- [ ] I am using Node.js 20 with a version >= 20.3.0
- [ ] I am using Node.js 21 or later

If you cannot confirm any of these, please upgrade to the latest version and try again before opening an issue.

### Are you using a supported package manager?

<!-- Please place an [x] in the relevant box to confirm. -->

- [ ] I am using npm >= 9.6.5
- [ ] I am using yarn >= 3.2.0
- [ ] I am using pnpm >= 7.1.0

If you cannot confirm any of these, please upgrade to the latest version and try again before opening an issue.

### What is the complete output of running `npm install --verbose --foreground-scripts sharp` in an empty directory?

<details>

<!-- Please provide output of `npm install --verbose --foreground-scripts sharp` in an empty directory here. -->

</details>

### What is the output of running `npx envinfo --binaries --system --npmPackages=sharp --npmGlobalPackages=sharp`?

<!-- Please provide output of `npx envinfo --binaries --system --npmPackages=sharp --npmGlobalPackages=sharp` here. -->
