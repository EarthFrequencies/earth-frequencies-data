#!/usr/bin/env python
import fire
from frequencies_converter.converter import convert_allocations_to_json
from frequencies_converter import config


def run_conversion(output_directory: str = "build/rest"):
    convert_allocations_to_json(
        parent_input_directory=str(config.DATA_DIR),
        parent_output_directory=output_directory,
    )


if __name__ == "__main__":
    fire.Fire(run_conversion)
