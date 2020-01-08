#!/bin/sh
set -e
git diff --diff-filter=d --name-only --cached | \
  grep -E '\.(js|jsx|ts|tsx|json)$' | \
  xargs -P10 -I@ bash -c 'FILENAME=@ node_modules/barona-style-server/bin/prettier-staged-file.sh'
