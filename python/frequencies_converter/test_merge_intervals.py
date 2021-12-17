"""
This test file tests the merging of intervals.
How to add tests to this file:
If you just want to add a new interval test case.
Just add an interval in INTERVALS_TO_TEST.

Every test in this file tests these intervals.
"""
from typing import Dict, List, Tuple

import pytest

from frequencies_converter.aggregation import group_entries
from frequencies_converter.models.frequency_allocation import FrequencyAllocation
from frequencies_converter.models.frequency_band import FrequencyBand
from frequencies_converter.models.frequency_allocation_block import (
    FrequencyAllocationBlock,
)

INTERVALS = Dict[Tuple[int, int], List[str]]

# These are a list of test cases to try.
# The intervals are of the form (lower_frequency, upper_frequency) -> names
# where names are some arbitrary given names
INTERVALS_TO_TEST: List[Tuple[INTERVALS, INTERVALS]] = [
    # Case 1: Assortment of overlapping intervals
    (
        {
            (10, 100): ["A"],
            (10, 90): ["B"],
            (30, 50): ["C"],
            (40, 400): ["D"],
            (150, 300): ["E"],
        },
        {
            (0, 10): [],
            (10, 30): ["A", "B"],
            (30, 40): ["A", "B", "C"],
            (40, 50): ["A", "B", "C", "D"],
            (50, 90): ["A", "B", "D"],
            (90, 100): ["A", "D"],
            (100, 150): ["D"],
            (150, 300): ["D", "E"],
            (300, 400): ["D"],
        },
    ),
    # Case 2: Non-overlapping intervals stay the same
    (
        {
            (0, 10): ["A"],
            (10, 20): ["B"],
            (20, 30): ["C"],
            (30, 50): ["D"],
            (50, 400): ["E"],
        },
        # expected results
        {
            (0, 10): ["A"],
            (10, 20): ["B"],
            (20, 30): ["C"],
            (30, 50): ["D"],
            (50, 400): ["E"],
        },
    ),
    # Case 3: gaps
    (
        {
            (10, 20): ["A"],
            (30, 40): ["B"],
            (50, 60): ["C"],
        },
        {
            (0, 10): [],
            (10, 20): ["A"],
            (20, 30): [],
            (30, 40): ["B"],
            (40, 50): [],
            (50, 60): ["C"],
        },
    ),
    # Case 4: empty intervals and gaps
    (
        {
            (10, 20): [],
            (30, 40): [],
            (50, 60): [],
        },
        # NOTE: This is not so desired but is a drawback of segmenting
        # Our segments are only as good as our TSV files.
        # TODO (jrmlhermitte): We could possibly add an additional cleanup
        #  method that merges similar intervals together after the grouping.
        {
            (0, 10): [],
            (10, 20): [],
            (20, 30): [],
            (30, 40): [],
            (40, 50): [],
            (50, 60): [],
        },
    ),
    # Case 5: interval edges off by one
    (
        {
            (1, 2): [],
            (3, 4): ["A"],
            (5, 6): ["B"],
            (3, 10): ["D"],
        },
        {
            (0, 1): [],
            (1, 2): [],
            (2, 3): [],
            (3, 4): ["A", "D"],
            (4, 5): ["D"],
            (5, 6): ["B", "D"],
            (6, 10): ["D"],
        },
    ),
]


def _intervals_to_allocations(intervals: INTERVALS) -> List[FrequencyAllocationBlock]:
    entries: List[FrequencyAllocationBlock] = []
    for interval, names in intervals.items():
        lower, upper = interval
        frequency_range = FrequencyBand(lower=lower, upper=upper)
        allocations = []
        for name in names:
            allocation = FrequencyAllocation(service=name, primary=True)
            allocations.append(allocation)
        entry = FrequencyAllocationBlock(band=frequency_range, allocations=allocations)
        entries.append(entry)
    return entries


def _allocations_to_intervals(entries: List[FrequencyAllocationBlock]) -> INTERVALS:
    intervals = {}
    for entry in entries:
        frequency_range = entry.band
        frequency_range_tuple = (frequency_range.lower, frequency_range.upper)
        allocations = entry.allocations
        intervals[frequency_range_tuple] = sorted(
            [allocation.service for allocation in allocations]
        )
    return intervals


@pytest.mark.parametrize(("input_intervals", "expected_intervals"), INTERVALS_TO_TEST)
def test_merge(
    input_intervals: INTERVALS,
    expected_intervals: INTERVALS,
):
    input_allocations = _intervals_to_allocations(input_intervals)
    output_allocations = group_entries(input_allocations)
    output_intervals = _allocations_to_intervals(output_allocations)
    assert output_intervals == expected_intervals


@pytest.mark.parametrize(
    "input_intervals", [interval[0] for interval in INTERVALS_TO_TEST]
)
def test_idempotence(input_intervals: INTERVALS):
    """Running a second time should always lead to the same result."""
    input_allocations = _intervals_to_allocations(input_intervals)
    output_allocations = group_entries(input_allocations)
    output_allocations_2 = group_entries(output_allocations)
    output_intervals = _allocations_to_intervals(output_allocations)
    output_intervals_2 = _allocations_to_intervals(output_allocations_2)

    assert output_intervals == output_intervals_2
