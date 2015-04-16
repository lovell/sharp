if ! type valgrind >/dev/null; then
  echo "Please install valgrind before running memory leak tests"
  exit 1
fi

curl -O https://raw.githubusercontent.com/jcupitt/libvips/master/libvips.supp
cd ../../
G_SLICE=always-malloc G_DEBUG=gc-friendly valgrind --suppressions=test/leak/libvips.supp --suppressions=test/leak/sharp.supp --leak-check=full --show-leak-kinds=definite,indirect,possible --num-callers=20 --trace-children=yes npm test
