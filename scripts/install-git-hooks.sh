#!/usr/bin/env bash
# shellcheck disable=SC2181

# change the current directory to the script directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )" >/dev/null || exit 1;

FROM="git_commit_hook";
TO="../.git/hooks/pre-commit";

cp "$FROM" "$TO" && chmod +x "$TO";
if [[ "$?" != "0" ]]; then
	echo "[fatal] install git commit hook failed!";
	exit 1;
else
	echo "[success] hook script install to ${TO}";
fi

