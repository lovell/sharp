// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://sharp.pixelplumbing.com',
  integrations: [
    starlight({
      title: 'sharp',
      description:
        'High performance Node.js image processing. The fastest module to resize JPEG, PNG, WebP and TIFF images.',
      logo: {
        src: './src/assets/sharp-logo.svg',
        alt: '#'
      },
      customCss: ['./src/styles/custom.css'],
      head: [{
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; connect-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com/beacon.min.js/;"
        }
      }, {
        tag: 'link',
        attrs: {
          rel: 'author',
          href: '/humans.txt',
          type: 'text/plain'
        }
      }, {
        tag: 'script',
        attrs: {
          type: 'application/ld+json'
        },
        content: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          name: 'sharp',
          description: 'High performance Node.js image processing',
          url: 'https://sharp.pixelplumbing.com',
          codeRepository: 'https://github.com/lovell/sharp',
          programmingLanguage: ['JavaScript', 'C++'],
          runtimePlatform: 'Node.js',
          copyrightHolder: {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Lovell Fuller'
          },
          copyrightYear: 2013,
          license: 'https://www.apache.org/licenses/LICENSE-2.0'
        })
      }],
      sidebar: [
        { label: 'Home', link: '/' },
        { label: 'Installation', slug: 'install' },
        {
          label: 'API',
          items: [
            { label: 'Constructor', slug: 'api-constructor' },
            { label: 'Input metadata', slug: 'api-input' },
            { label: 'Output options', slug: 'api-output' },
            { label: 'Resizing images', slug: 'api-resize' },
            { label: 'Compositing images', slug: 'api-composite' },
            { label: 'Image operations', slug: 'api-operation' },
            { label: 'Colour manipulation', slug: 'api-colour' },
            { label: 'Channel manipulation', slug: 'api-channel' },
            { label: 'Global properties', slug: 'api-utility' }
          ]
        },
        { label: 'Performance', slug: 'performance' },
        { label: 'Changelog', slug: 'changelog' }
      ],
      social: {
        openCollective: 'https://opencollective.com/libvips',
        github: 'https://github.com/lovell/sharp'
      }
    })
  ]
});
