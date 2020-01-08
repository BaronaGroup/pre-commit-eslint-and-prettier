#!/bin/sh
if ! [ -e package.json ]
then
  echo "Run this command in a directory with a package.json"
  exit 1
fi

npm i -D prettier 'BaronaGroup/barona-style-server#dist' import-sort-style-module prettier-plugin-import-sort pre-commit
if ! [ -e .prettierrc ]
then
    cp node_modules/barona-style-server/.prettierrc .
fi

node node_modules/barona-style-server/dist/install-2.js
