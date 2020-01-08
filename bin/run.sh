#!/bin/sh
$(dirname $0/)/start-style-server.sh
$(dirname $0/)/prettier-staged-files.sh
if [ -e node_modules/eslint ]
then
  $(dirname $0/)/eslint-staged-files.sh
fi
