if ! type valgrind >/dev/null; then
  echo "Please install valgrind before running memory leak tests"
  exit 1
fi

curl -O https://raw.githubusercontent.com/jcupitt/libvips/master/libvips.supp
G_SLICE=always-malloc G_DEBUG=gc-friendly valgrind --suppressions=libvips.supp --suppressions=sharp.supp --leak-check=full --show-leak-kinds=definite,indirect,possible node unit.js
