from __future__ import annotations

from typing import Dict, List, Set, Tuple

from frequencies_converter.models.frequency_band import FrequencyBand
from frequencies_converter.models.frequency_allocation_block import (
    FrequencyAllocationBlock,
)

INTERVALS = Dict[Tuple[int, int], Set[str]]


def group_entries(
    entries: List[FrequencyAllocationBlock],
) -> List[FrequencyAllocationBlock]:
    """
    This method groups allocation blocks together from a
    list of non-overlapping frequency allocations by frequency.

    For example, if we have this set of frequency allocations:
        (10, 100): ['A']
        (10, 90): ['B'],
        (30, 50): ['C'],
        (40, 400): ['D']
        (150, 300): ['E']

    The merged result would be:
        (0, 10): []
        (10, 30): ['A', 'B']
        (30, 40): ['A', 'B', 'C']
        (40, 50): ['A', 'B', 'C', 'D']
        (50, 90): ['A', 'B', 'D']
        (90, 100): ['A', 'D']
        (100, 150): ['D']
        (150, 300): ['D', 'E']
        (300, 400): ['D']

    This is useful for plotting frequency allocations.
    We will want to group allocations by non-overlapping
    frequency ranges before we can plot them.
    """
    # 1. Sort by lower frequency
    # O(N Log(N))
    entries = sorted(entries, key=lambda entry: entry.band.lower)

    grouped_entries: Dict[FrequencyBand, FrequencyAllocationBlock] = {}

    highest_frequency: int = 0
    # We iterate through each entry and add, split or merge as needed
    for entry in entries:
        frequency_range = entry.band
        if frequency_range.lower >= frequency_range.upper:
            print(
                f"WARNING. Invalid range: {frequency_range}. Skipping entry: {entry}..."
            )
            continue
        current_ranges = list(grouped_entries.keys())

        # If the new frequency is beyond any other entry, make a new frequency
        # We need an empty frequency range if there is a gap.
        if frequency_range.lower > highest_frequency:
            new_frequency_range = FrequencyBand(
                lower=highest_frequency, upper=frequency_range.lower
            )
            new_entry = FrequencyAllocationBlock(
                band=new_frequency_range, allocations=[]
            )
            grouped_entries[new_frequency_range] = new_entry
            # update highest frequency
            highest_frequency = frequency_range.lower

        # After ensuring there is no gap, we add frequency range on the edge
        if frequency_range.upper > highest_frequency:
            lower_frequency = highest_frequency
            new_frequency_range = FrequencyBand(
                lower=lower_frequency, upper=frequency_range.upper
            )
            new_entry = FrequencyAllocationBlock(
                band=new_frequency_range, allocations=[]
            )
            new_entry.add_allocations(entry.allocations)
            grouped_entries[new_frequency_range] = new_entry
            highest_frequency = frequency_range.upper

        # Now iterate through existing frequencies
        lower_frequency = entry.band.lower
        upper_frequency = entry.band.upper
        for existing_range in current_ranges:
            # A few cases can occur:
            # 1. entry doesn't overlap existing range. Ignore it.
            # 2. range within entry: add allocations
            # 3. start of allocation in middle of range. split and add right
            # 4. end of allocation in middle of range. split and add left
            if (
                lower_frequency >= existing_range.upper
                or upper_frequency <= existing_range.lower
            ):
                continue
            # |----xxxxxxx|
            if (
                lower_frequency > existing_range.lower
                and upper_frequency >= existing_range.upper
            ):
                existing_entry = grouped_entries.pop(existing_range)
                # Split and add to the right range
                left_entry, right_entry = existing_entry.split(lower_frequency)
                right_entry.add_allocations(entry.allocations)

                # Update the map
                grouped_entries[left_entry.band] = left_entry
                grouped_entries[right_entry.band] = right_entry

                # update the existing range to be the right entry since we removed
                # the existing entry
                existing_range = right_entry.band
            # |xxxxxxx---|
            elif (
                upper_frequency < existing_range.upper
                and lower_frequency <= existing_range.lower
            ):
                existing_entry = grouped_entries.pop(existing_range)
                left_entry, right_entry = existing_entry.split(upper_frequency)
                left_entry.add_allocations(entry.allocations)

                # update the map
                grouped_entries[left_entry.band] = left_entry
                grouped_entries[right_entry.band] = right_entry
                existing_range = left_entry.band
            # |----xxxx----| (is within the range)
            elif (
                lower_frequency > existing_range.lower
                and upper_frequency < existing_range.upper
            ):
                existing_entry = grouped_entries.pop(existing_range)
                left_entry, right_entry = existing_entry.split(lower_frequency)
                middle_entry, right_entry = right_entry.split(upper_frequency)
                middle_entry.add_allocations(entry.allocations)

                # update the map
                grouped_entries[left_entry.band] = left_entry
                grouped_entries[middle_entry.band] = middle_entry
                grouped_entries[right_entry.band] = right_entry
                existing_range = middle_entry.band
            # |xxxxxx| (fits completely in range)
            elif (
                lower_frequency <= existing_range.lower
                and upper_frequency >= existing_range.upper
            ):
                grouped_entries[existing_range].add_allocations(entry.allocations)

    return sorted(grouped_entries.values(), key=lambda x: x.band.lower)
