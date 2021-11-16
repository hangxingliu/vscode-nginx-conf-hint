#!/usr/bin/env bash

image="nginx:latest"

[ -z "$1" ] && exit 1;

file="$(realpath "$1")";
[ -z "$file" ] && exit 1;

dir="$(dirname "$file")";
file="$(basename "$file")";
[ -z "$dir" ] && exit 1;
[ -z "$file" ] && exit 1;

set -x;
docker run --rm -it -v "${dir}:/test:ro" --entrypoint nginx "$image" -t -c "/test/${file}";
echo "$?"
