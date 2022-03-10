#!/bin/bash

abs_path () {
  echo "$(cd "$1"; pwd)"
}

output_directory="$PWD/build/rest"

## make sure we navigate to project base
script_dir="$(dirname $0)"
cd "$script_dir"

output_directory="../build/rest"

set -e
# Small hack to get python path.
pushd python

# If it can't finy poetry, then pip bin folder is probably
# not in the $PATH
PYTHON_BINARY=$(poetry run which python)
PYTHON_PATH=$(dirname $PYTHON_BINARY)
popd

mkdir -p "$output_directory"

PATH=PYTHON_PATH:$PATH ./python/frequencies_converter/run_converter.py --output_directory="$output_directory"
