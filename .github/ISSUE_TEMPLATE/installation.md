---
name: Installation
about: Something went wrong during either 'npm install sharp' or 'require("sharp")'
labels: installation

---

<!-- Please try to answer as many of these questions as possible. -->

## Possible install-time or require-time problem

<!-- Please place an [x] in the box to confirm. -->

- [ ] I have read the [documentation relating to installation](https://sharp.pixelplumbing.com/install).
- [ ] I have ensured that the architecture and platform of Node.js used for `npm install` is the same as the architecture and platform of Node.js used at runtime.

### Are you using the latest version of sharp?

<!-- Please place an [x] in the box to confirm. -->

- [ ] I am using the latest version of `sharp` as reported by `npm view sharp dist-tags.latest`.

If you cannot confirm this, please upgrade to the latest version and try again before opening an issue.

If you are using another package which depends on a version of `sharp` that is not the latest, please open an issue against that package instead.

### Is this a problem with filesystem permissions?

If you are using npm v6 or earlier and installing as a `root` or `sudo` user, have you tried with the `npm install --unsafe-perm` flag?

If you are using npm v7 or later, does the user running `npm install` own the directory it is run in?

If you are using the `ignore-scripts` feature of `npm`, have you tried with the `npm install --ignore-scripts=false` flag?

### What is the complete output of running `npm install --verbose --foreground-scripts sharp` in an empty directory?

<details>

<!-- Please provide output of `npm install --verbose --foreground-scripts sharp` in an empty directory here. -->

</details>

### What is the output of running `npx envinfo --binaries --system --npmPackages=sharp --npmGlobalPackages=sharp`?

<!-- Please provide output of `npx envinfo --binaries --system --npmPackages=sharp --npmGlobalPackages=sharp` here. -->
