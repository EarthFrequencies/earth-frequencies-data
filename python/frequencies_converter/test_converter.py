from pathlib import Path

from frequencies_converter import config
from frequencies_converter.converter import convert_allocations_to_json
from frequencies_converter.fixtures import (
    make_allocation_table,
    temp_allocations_data_directory,
)
from frequencies_converter.models.allocation_table import AllocationTable


def test_convert_writes_json():
    allocation_table = make_allocation_table()
    with temp_allocations_data_directory([allocation_table]) as directory:
        convert_allocations_to_json(
            parent_input_directory=directory, parent_output_directory=directory
        )
        expected_json_filename = str(
            Path(directory)
            / Path(allocation_table.name)
            / Path(config.JSON_INDEX_FILENAME)
        )
        table_from_json = AllocationTable.from_json_file(expected_json_filename)
    assert table_from_json == allocation_table
