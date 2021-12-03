"""
This is the entry point for the converter.
"""
import os
from pathlib import Path
from typing import List

from frequencies_converter.config import ALLOCATION_FILENAME
from frequencies_converter.models.allocation_table import (
    AllocationTable,
)
from frequencies_converter import config


def convert_allocations_to_json(
    parent_input_directory: str,
    parent_output_directory: str,
) -> None:
    """
    Main converter that converts allocations from csv files into
    json files to be served by a rest endpoint.

    The CSV files are used for easy data entry.
    The json files are used for a more logical format for
    rest endpoints that serve and help visualize the data.

    Arguments:
        parent_input_directory: The parent directory for the input csv files
        parent_output_directory: The parent directory for the output json files.
    """
    allocation_tables = get_allocations_from_csv_files(parent_input_directory)
    write_allocations_to_json_files(
        allocation_tables=allocation_tables, parent_directory=parent_output_directory
    )


def get_allocation_csv_dirs(parent_dir: str) -> List[Path]:
    allocation_dirs = []
    for root, dirs, files in os.walk(parent_dir):
        if ALLOCATION_FILENAME in set(files):
            allocation_dirs.append(Path(root))
        for directory in dirs:
            if not directory.startswith("."):
                allocation_dirs.extend(get_allocation_csv_dirs(directory))
    return allocation_dirs


def get_allocations_from_csv_files(parent_directory: str) -> List[AllocationTable]:
    directories = get_allocation_csv_dirs(str(parent_directory))
    parent_directory_substring = str(parent_directory) + "/"

    allocation_tables: List[AllocationTable] = []
    for path in directories:
        name = str(path).replace(parent_directory_substring, "")
        allocation_tables.append(
            AllocationTable.from_data_file_directory(str(path), name=name)
        )
    return allocation_tables


def write_allocations_to_csv_files(
    allocation_tables: List[AllocationTable], parent_directory: str
) -> None:
    for allocation_table in allocation_tables:
        new_path = Path(parent_directory) / Path(allocation_table.name)
        new_path.mkdir(exist_ok=True, parents=True)
        allocation_table.to_data_file_directory(str(new_path))


def write_allocation_to_json_file(
    allocation_table: AllocationTable, output_filename: str
) -> None:
    with open(output_filename, "w", encoding="utf-8") as file:
        json_data = allocation_table.to_json()
        assert isinstance(json_data, str)
        file.write(json_data)


def write_allocations_to_json_files(
    allocation_tables: List[AllocationTable], parent_directory: str
) -> None:
    for allocation_table in allocation_tables:
        new_path = Path(parent_directory) / Path(allocation_table.name)
        new_path.mkdir(exist_ok=True, parents=True)
        output_filename = str(new_path / Path(config.JSON_INDEX_FILENAME))
        write_allocation_to_json_file(allocation_table, output_filename)


if __name__ == "__main__":
    convert_allocations_to_json(str(config.DATA_DIR), "./rest")
