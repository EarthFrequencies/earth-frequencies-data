from pathlib import Path

from frequencies_converter.fixtures import (
    make_allocation_table,
    temp_allocations_data_directory,
)
from frequencies_converter.models.allocation_table import AllocationTable


def test_to_from_csv():
    allocation_table = make_allocation_table()
    with temp_allocations_data_directory([allocation_table]) as directory:
        allocation_directory = str(Path(directory) / Path(allocation_table.name))
        allocation_table_from_directory = AllocationTable.from_data_file_directory(
            allocation_directory, name=allocation_table.name
        )
    assert allocation_table_from_directory == allocation_table
