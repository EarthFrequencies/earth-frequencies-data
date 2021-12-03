#!/usr/bin/bash

set -e
# Small hack to get python path.
pushd python
PYTHON_BINARY=$(poetry run which python)
PYTHON_PATH=$(dirname $PYTHON_BINARY)
popd

PATH=PYTHON_PATH:$PATH ./python/frequencies_converter/run_converter.py --output_directory="build/rest"
