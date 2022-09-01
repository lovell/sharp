#!/usr/bin/env bash
set -e

if ! type docker >/dev/null; then
  echo "Please install docker"
  exit 1
fi

BRANCH=$(git branch --show-current)
echo "Running sharp performance tests using $BRANCH branch"

docker build --build-arg "BRANCH=$BRANCH" -t sharp-test-bench .
docker run --rm -it sharp-test-bench
