#!/bin/bash

## make sure we navigate to project base
script_dir="$(dirname $0)"
cd "$script_dir/../"

pwd

set -e
# Small hack to get python path.
pushd python

# If it can't finy poetry, then pip bin folder is probably
# not in the $PATH
PYTHON_BINARY=$(poetry run which python)
PYTHON_PATH=$(dirname $PYTHON_BINARY)
popd

PATH=PYTHON_PATH:$PATH ./python/frequencies_converter/run_converter.py --output_directory="build/rest"
