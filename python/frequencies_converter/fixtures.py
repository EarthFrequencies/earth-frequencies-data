from contextlib import contextmanager
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Generator, List

from frequencies_converter.models.frequency_entry import FrequencyEntry
from frequencies_converter.models.allocation import Allocation
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
    entries = make_frequency_entries()
    return AllocationTable(
        name="test",
        entries=entries,
        metadata=metadata,
        parent_region="ITU1",
        region="us",
        sub_region=None,
        year=None,
    )


def make_frequency_entries() -> List[FrequencyEntry]:
    """Make some test allocations. Doesn't have to be perfect.
    Just enough to run crude tests.
    """
    return [
        FrequencyEntry(
            band=FrequencyBand(lower=1000, upper=2000),
            allocations=[Allocation(service="some_service", primary=True)],
            bandnotes=None,
            footnotes=[],
        ),
        FrequencyEntry(
            band=FrequencyBand(lower=2000, upper=5000),
            allocations=[
                Allocation(
                    service="some_service",
                    primary=True,
                )
            ],
            bandnotes=None,
            footnotes=[],
        ),
    ]
