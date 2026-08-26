---
title: Security
---

The default settings help protect against malformed or unusually large input,
but applications that process untrusted images should also enforce their own resource limits.

## Untrusted input

- Keep the default `failOn: 'warning'`, `limitInputPixels`, `limitInputChannels`
  and `unlimited: false` constructor options. Set lower limits when the application
  accepts a smaller range of dimensions or channels.
- When downloading an image, validate the resolved destination initially and after each
  redirect, and enforce time and byte limits while streaming before data reaches `sharp`.
- Use [`timeout`](/api-output/#timeout) to limit active processing after libvips opens
  the input. Apply an outer job deadline and enforce memory and CPU limits at the process
  or container level. Pixel limits rely on image metadata and do not replace runtime limits.
- Restrict the available input loaders with [`block`](/api-utility/#block) and
  [`unblock`](/api-utility/#unblock) when only specific formats are required.
- Use the latest release, which is the only version covered by the
  [security policy](https://github.com/lovell/sharp/security/policy).

## Trusted input

For images generated and controlled by the application, individual safety settings
can be relaxed when their cost or format restrictions are unnecessary. Change only
the specific `limitInputPixels`, `limitInputChannels` or `unlimited` setting required
for the use case and retain the others.
