#!/usr/bin/env bash

#
# Update: 2024-02-29
#
throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "Failed to execute '$1'"; }
command -v jq >/dev/null || throw "jq is not installed! (https://jqlang.github.io/jq/)";

# change the current directory to the project directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

PKG="$(jq -r '.name+"-"+.version' ./package.json)";
TARGET_DIR="./artifacts/vscode";
LIST_FILE="./artifacts/vscode/${PKG}.list";
echo "PKG=${PKG}";

execute mkdir -p "$TARGET_DIR";

echo "$ ./scripts/vsce.sh ls | tee $LIST_FILE";
bash ./scripts/vsce.sh ls |
	awk '!/Detected presence of yarn.lock/' |
	tee "$LIST_FILE";

execute bash ./scripts/vsce.sh package --out "${TARGET_DIR}/${PKG}.vsix";
