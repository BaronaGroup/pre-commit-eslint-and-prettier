#!/bin/sh
set -e
git show :$FILE | \
  curl "http://localhost:15077/eslint?filename=$FILE&baseDir=$(pwd)" -XPOST --data-binary @- --header "Content-Type: text/plain" --output /dev/stderr --write-out "%{http_code}" -s | \
  grep 200 > /dev/null
