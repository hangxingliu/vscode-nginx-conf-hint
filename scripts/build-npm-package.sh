#!/usr/bin/env bash
# shellcheck disable=SC2015

throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "Failed to execute '$1'"; }

# change the current directory to the project directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

execute mkdir -p "./artifacts/npm";

PKG_NAME="$(awk '/"name"/{ print substr($2,2, length($2)-3); }' ./package.json)"
PKG_VERSION="$(awk '/"version"/{ print substr($2,2, length($2)-3); }' ./package.json)"
PKG="${PKG_NAME}-${PKG_VERSION}";

npm pack --dryrun 2>&1 |
	sed 's/npm notice//' |
	tee "./artifacts/npm/${PKG}.list";

echo "created './artifacts/vscode/${PKG}.list'";

execute npm pack;
execute mv -f "${PKG}.tgz" "./artifacts/npm";
