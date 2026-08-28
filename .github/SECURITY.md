### Security policy

The latest version published to npm is supported with security updates.
```sh frame="none"
npm view sharp dist-tags.latest
```

To report a vulnerability, please use
[e-mail](https://github.com/lovell/sharp/blob/main/package.json#L5).
You can expect a response within 48 hours if you are a human reporting a genuine issue.
Thank you in advance.

### Security features

All input is assumed to be untrusted and will be rejected if there are any warnings whilst decoding is attempted.

Support for various input formats can be controlled at runtime using
[block](/api-utility/#block) and [unblock](/api-utility/#unblock).
For example, to allow only JPEG input:
```sh frame="none"
sharp.block({
  operation: ['VipsForeignLoad']
});
sharp.unblock({
  operation: ['VipsForeignLoadJpeg']
});
```

For *trusted* input, the following constructor options can be used to relax various security-related checks.

- [failOn](/api-constructor/#:~:text=options.failOn)
- [limitInputPixels](/api-constructor/#:~:text=options.limitInputPixels)
- [limitInputChannels](/api-constructor/#:~:text=options.limitInputChannels)
- [unlimited](/api-constructor/#:~:text=options.unlimited)

The latest versions of C, C++ and Rust-based dependencies in the prebuilt binaries are continuously fuzz-tested.
Potential security issues are co-ordinated, fixed and published ahead of details being made public.

### Security considerations

#### Reduce effects of memory-related vulnerabilities

High severity issues often relate to heap-buffer overflow,
the effects of which can be mitigated with Address Space Layout Randomisation (ASLR).

This feature is available in Linux when the Node.js binary is a Position Independent Executable (PIE),
and almost all OS package managers already use this.

However be warned that the [official Node.js binaries](https://nodejs.org/download/release/)
are not security hardened in this way and should be avoided when processing untrusted content.

#### Limit runtime resources

To protect against unbounded memory growth or CPU starvation,
run your Node.js process within a control group to limit resource consumption.
