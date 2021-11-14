#!/usr/bin/env bash

pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

mkdir -p "./artifacts/vscode";

PKG_NAME="$(awk '/"name"/{ print substr($2,2, length($2)-3); }' ./package.json)"
PKG_VERSION="$(awk '/"version"/{ print substr($2,2, length($2)-3); }' ./package.json)"
PKG="${PKG_NAME}-${PKG_VERSION}";

bash ./scripts/vsce.sh ls |
	awk '!/Detected presence of yarn.lock/' |
	tee "./artifacts/vscode/${PKG}.list";

echo "created './artifacts/vscode/${PKG}.list'";

bash ./scripts/vsce.sh package --out "./artifacts/vscode/${PKG}.vsix"
