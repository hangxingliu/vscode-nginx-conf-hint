#!/usr/bin/env bash

pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

mkdir -p "./artifacts/npm";

PKG_NAME="$(awk '/"name"/{ print substr($2,2, length($2)-3); }' ./package.json)"
PKG_VERSION="$(awk '/"version"/{ print substr($2,2, length($2)-3); }' ./package.json)"
PKG="${PKG_NAME}-${PKG_VERSION}";

npm pack --dryrun 2>&1 |
	sed 's/npm notice//' |
	tee "./artifacts/npm/${PKG}.list";

echo "created './artifacts/vscode/${PKG}.list'";

npm pack && mv -f "${PKG}.tgz" "./artifacts/npm" ||
	throw 'npm pack failed!';
