# Pre-commit eslint and prettier

This package is meant to be used as a pre-commit hook that runs prettier and eslint on
anything being committed. If not all changes of a file are being committed, it only
does these checks on the parts in the commit.

Fixes from prettier and eslint fix are applied automatically.

## Automatic installation

Both version of automatic installation uninstall the deprecated predecessors
of this package.

### Full installation

    npx pre-commit-eslint-and-prettier --full-install

The automatic full installation installs the package itself, pre-commit, prettier,
module sort for prettier and a simple .prettierrc if one is missing, and of course
sets up the hook.

It also does its best to set up a script to run prettier on all files as well as it can.

You are still responsible for setting up eslint.

### Minimal installation

    npx pre-commit-eslint-and-prettier --install

This installs just the package itself, pre-commit and sets up the hook. You are
responsible for setting up prettier and eslint.

## Manual installation

    npm i -D pre-commit-eslint-and-prettier pre-commit

Add to your package.json

    "pre-commit": ["pre-commit-eslint-and-prettier"]

And a script

    "pre-commit-eslint-and-prettier": "pre-commit-eslint-and-prettier"

