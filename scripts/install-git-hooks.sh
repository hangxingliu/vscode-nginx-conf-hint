#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
pushd "$DIR";

FROM="git_commit_hook";
TO="../.git/hooks/pre-commit";

cp "$FROM" "$TO" && chmod +x "$TO";
if [[ "$?" != "0" ]]; then
	echo "[fatal] install git commit hook failed!";
	exit 1;
else
	echo "[success] hook script install to ${TO}";
fi

