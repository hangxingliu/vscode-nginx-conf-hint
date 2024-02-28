#!/usr/bin/env bash
# shellcheck disable=SC2015

#
# Update: 2024-02-29
#

throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "Failed to execute '$1'"; }
command -v jq >/dev/null || throw "jq is not installed! (https://jqlang.github.io/jq/)";

# change the current directory to the project directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

PKG="$(jq -r '.name+"-"+.version' ./package.json)";
TARGET_DIR="./artifacts/npm";
LIST_FILE="./artifacts/npm/${PKG}.list";
echo "PKG=${PKG}";

execute mkdir -p "$TARGET_DIR";

echo "$ npm pack --dryrun | tee $LIST_FILE";
npm pack --dryrun 2>&1 | sed 's/npm notice//' | tee "$LIST_FILE";

execute npm pack;
execute mv -f "${PKG}.tgz" "$TARGET_DIR";
