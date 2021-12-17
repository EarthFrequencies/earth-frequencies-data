#!/usr/bin/bash
protoc -I=protos --js_out=import_style=commonjs,binary:js/protos --python_out=python/frequencies_converter/protos protos/frequencies.proto
