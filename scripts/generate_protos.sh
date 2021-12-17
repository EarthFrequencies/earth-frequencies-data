#!/usr/bin/bash
protoc -I=protos --python_out=python/frequencies_converter/protos protos/frequencies.proto
