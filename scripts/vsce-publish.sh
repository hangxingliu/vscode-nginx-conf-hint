#!/usr/bin/env bash

WORKSPACE="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )";

throw() { echo -e "fatal: $1" >&2; exit 1; }

[ -d "${WORKSPACE}" ] || throw "workspace '${WORKSPACE}' is not a directory";
pushd "${WORKSPACE}" || exit 1;

command -v node >/dev/null || throw "'node' is not found!";

[ -z "$VSCE_PAT" ] && throw "environment variable 'VSCE_PAT' is empty!";

get_pkg() { node -e 'console.log(require("./package.json").'"$1"')'; }
PKG_VERSION="$(get_pkg version)";
PKG_PUBLISHER="$(get_pkg publisher)";
[ -z "$PKG_VERSION" ] && throw 'get version from package.json failed!';
[ -z "$PKG_PUBLISHER" ] && throw 'get publisher from package.json failed!';

echo "[.] verifying pat token for '$PKG_PUBLISHER' ...";
./scripts/vsce.sh verify-pat "$PKG_PUBLISHER" || throw 'verify failed!';

echo "[.] publishing extension version '$PKG_VERSION'";
./scripts/vsce.sh publish "$PKG_VERSION" || throw 'publish failed!';

echo "[+] vsce-publish.sh done";
