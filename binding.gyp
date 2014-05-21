{
  'targets': [{
    'target_name': 'sharp',
    'sources': ['src/sharp.cc'],
    'libraries': [
      '<!@(PKG_CONFIG_PATH="/usr/local/Library/ENV/pkgconfig/10.8:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig" pkg-config --libs vips)'
    ],
    'include_dirs': [
      '/usr/local/include/glib-2.0',
      '/usr/local/lib/glib-2.0/include',
      '/usr/include/glib-2.0',
      '/usr/lib/glib-2.0/include',
      '/usr/lib/x86_64-linux-gnu/glib-2.0/include',
      '/usr/lib/i386-linux-gnu/glib-2.0/include',
      '<!(node -e "require(\'nan\')")'
    ],
    'cflags': ['-fexceptions', '-pedantic', '-Wall', '-O3'],
    'cflags_cc': ['-fexceptions', '-pedantic', '-Wall', '-O3']
  }]
}
