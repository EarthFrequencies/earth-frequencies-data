#!/usr/bin/env python
from pathlib import Path
import fire
from frequencies_converter.converter import convert_allocations_to_json


def run_conversion(output_directory: str = "build/rest",
                   input_directory: str = "../data/allocation-tables"):

    output_directory = str(Path(output_directory).resolve())
    input_directory = str(Path(input_directory).resolve())

    print("reading from .... " + input_directory)
    print("writing to ...... : " + output_directory)

    convert_allocations_to_json(
        parent_input_directory=input_directory,
        parent_output_directory=output_directory,
        merge_entries=True,
    )


if __name__ == "__main__":
    fire.Fire(run_conversion)
