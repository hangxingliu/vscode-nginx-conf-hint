#!/usr/bin/env bash

#
# References:
#
# - https://github.com/eslint/eslint/issues/17561
# - https://github.com/eslint/eslint/discussions/17215
# - https://github.com/chalk/strip-ansi/commit/7cda68dcadde18b19bfa31b6223e9f0e60b3e319
#


throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "Failed to execute '$1'"; }

# change the current directory to the project directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

CJS_VERSION=node_modules/strip-ansi-cjs
APPLY_TO=node_modules/eslint/node_modules/strip-ansi

# test $CJS_VERSION is a directory
test -d "$CJS_VERSION"  &&
	execute cp -r "${CJS_VERSION}/." "$APPLY_TO";
true;
