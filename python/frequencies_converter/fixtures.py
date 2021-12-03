from contextlib import contextmanager
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Generator, List

from frequencies_converter.models.allocation import Allocation
from frequencies_converter.models.allocation_service import AllocationService
from frequencies_converter.models.allocation_table import AllocationTable
from frequencies_converter.models.frequency_band import FrequencyBand


@contextmanager
def temp_allocations_data_directory(
    allocations: List[AllocationTable],
) -> Generator[str, None, None]:
    with TemporaryDirectory() as temp_dir:
        for allocation_table in allocations:
            print(f"writing allocation to {temp_dir}")
            allocation_dir = Path(temp_dir) / Path(allocation_table.name)
            allocation_table.to_data_file_directory(str(allocation_dir))
        yield temp_dir


def make_allocation_table() -> AllocationTable:
    """Make an allocation table with random data."""
    metadata = {"name": "some metadata"}
    allocations = make_allocations()
    return AllocationTable(
        name="test",
        allocations=allocations,
        metadata=metadata,
    )


def make_allocations() -> List[Allocation]:
    """Make some test allocations. Doesn't have to be perfect.
    Just enough to run crude tests.
    """
    return [
        Allocation(
            band=FrequencyBand(lower_frequency=1000, upper_frequency=2000),
            service=AllocationService(
                applications=["test", "applications"],
                category="test_cat",
                footnotes=["A1"],
                region="CA",
                service="some_service",
                sub_table="some_subtable",
            ),
        ),
        Allocation(
            band=FrequencyBand(lower_frequency=2000, upper_frequency=5000),
            service=AllocationService(
                applications=["application1", "application2"],
                category="test_cat",
                footnotes=["A1"],
                region="CA",
                service="some_service",
                sub_table="some_subtable",
            ),
        ),
    ]
