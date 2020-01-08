#!/bin/sh
set -e

git diff --diff-filter=d --name-only --cached | \
  grep -E '\.(js|jsx|ts|tsx)$' | \
  xargs -P10 -I@ bash -c 'FILE=@ node_modules/barona-style-server/bin/eslint-staged-file.sh'
