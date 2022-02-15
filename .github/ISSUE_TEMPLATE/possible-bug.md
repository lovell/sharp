---
name: Possible bug
about: Installation of sharp was successful but then something unexpected occurred using one of its features
labels: triage

---

<!-- If this issue relates to installation, please use https://github.com/lovell/sharp/issues/new?labels=installation&template=installation.md instead. -->

## Possible bug

### Is this a possible bug in a feature of sharp, unrelated to installation?

<!-- Please place an [x] in the box to confirm. -->

- [ ] Running `npm install sharp` completes without error.
- [ ] Running `node -e "require('sharp')"` completes without error.

If you cannot confirm both of these, please open an [installation issue](https://github.com/lovell/sharp/issues/new?labels=installation&template=installation.md) instead.

### Are you using the latest version of sharp?

<!-- Please place an [x] in the box to confirm. -->

- [ ] I am using the latest version of `sharp` as reported by `npm view sharp dist-tags.latest`.

If you cannot confirm this, please upgrade to the latest version and try again before opening an issue.

If you are using another package which depends on a version of `sharp` that is not the latest, please open an issue against that package instead.

### What is the output of running `npx envinfo --binaries --system --npmPackages=sharp --npmGlobalPackages=sharp`?

<!-- Please provide output of the above command here. -->

### What are the steps to reproduce?

<!-- Please enter steps to reproduce here. -->

### What is the expected behaviour?

<!-- Please enter the expected behaviour here. -->

### Please provide a minimal, standalone code sample, without other dependencies, that demonstrates this problem

<!-- Please provide either formatted code or a link to a repo/gist that allows someone else to reproduce here. -->

### Please provide sample image(s) that help explain this problem

<!-- Please provide links to one or more images here. -->
