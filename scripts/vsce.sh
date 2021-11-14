#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }

WORKSPACE="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )";

VSCE="$(command -v vsce)";
[ -z "$VSCE" ] && VSCE="${WORKSPACE}/node_modules/.bin/vsce";
if [ -x "$VSCE" ]; then
	"$VSCE" "${@}";
	exit "$?";
fi

#
# vsce in docker
#
command -v docker >/dev/null || throw 'docker is not installed!';
[ -d "${WORKSPACE}" ] || throw "workspace '${WORKSPACE}' is not a directory";

VSCE_ID="$(docker images -q vsce:latest)"
[ -n "$VSCE_ID"  ] || throw 'docker image vsce is not found!
       please build vsce docker image by commands from "https://github.com/microsoft/vscode-vsce"'

DOCKER_ARGS=( run --rm -i -t -v "${WORKSPACE}:/workspace" );
[ -n "$VSCE_PAT" ] && DOCKER_ARGS+=( -e "VSCE_PAT=$VSCE_PAT" );

docker "${DOCKER_ARGS[@]}" "$VSCE_ID" "${@}";
