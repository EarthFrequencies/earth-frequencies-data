from __future__ import annotations

import copy
from dataclasses import dataclass, field
from typing import Any, List, Optional, Dict, Tuple

import pandas as pd
from mashumaro import DataClassJSONMixin

from frequencies_converter.models.allocation import Allocation
from frequencies_converter.models.frequency_band import FrequencyBand


@dataclass
class FrequencyEntry(DataClassJSONMixin):
    band: FrequencyBand
    allocations: List[Allocation]
    bandnotes: Optional[str] = None
    footnotes: List[str] = field(default_factory=list)

    def to_pandas_rows(self) -> List[Dict]:
        rows = []
        for allocation in self.allocations:
            row = {
                "lower_frequency": self.band.lower,
                "upper_frequency": self.band.upper,
                "service": allocation.service,
                "primary": allocation.primary,
                "bandnotes": self.bandnotes,
                "footnotes": self.footnotes,
            }
            rows.append(row)
        return rows

    @classmethod
    def from_csv_file(cls, filename: str) -> List[FrequencyEntry]:
        df = pd.read_csv(filename, sep="\t")
        return cls.from_dataframe(df)

    @staticmethod
    def from_dataframe(df: pd.DataFrame) -> List[FrequencyEntry]:
        allocations = []
        for _, row in df.iterrows():
            allocation = FrequencyEntry.from_pandas_row(row)
            allocations.append(allocation)
        return allocations

    @staticmethod
    def from_pandas_row(row: pd.Row) -> FrequencyEntry:
        upper_frequency = int(_get_float(row, "upper_frequency"))
        lower_frequency = int(_get_float(row, "lower_frequency"))
        band = FrequencyBand(upper=upper_frequency, lower=lower_frequency)
        # TODO (jrmlhermitte): add this data back in?
        # applications=_get_optional_csv_string(row, "applications"),
        # category=_get_optional_string(row, "category"),
        # footnotes=_get_optional_csv_string(row, "footnotes"),
        # region=_get_string(row, "region"),
        # sub_table=_get_optional_string(row, "sub-table"),
        allocation = Allocation(
            service=_get_optional_string(row, "service") or "",
            # TODO (jrmlhermitte): fill this in. Note for US frequencies
            #  primary or not is determined by the name casing
            # (uppercase is primary).
            primary=True,
        )
        return FrequencyEntry(
            band=band,
            allocations=[allocation],
            bandnotes=None,
            footnotes=[],
        )

    @classmethod
    def list_to_csv_file(
        cls,
        filename: str,
        entries: List[FrequencyEntry],
        parent_region: str,
        region: str,
        sub_region: Optional[str],
        year: Optional[int],
    ) -> None:
        df = cls.list_to_dataframe(entries)
        df["parent_region"] = parent_region
        df["region"] = region
        df["sub_region"] = sub_region
        df["year"] = year
        df.to_csv(filename, sep="\t", index=False)

    @staticmethod
    def list_to_dataframe(entries: List[FrequencyEntry]) -> pd.DataFrame:
        rows = []
        for entry in entries:
            rows.extend(entry.to_pandas_rows())
        return pd.DataFrame(rows)

    def copy(self) -> FrequencyEntry:
        return copy.deepcopy(self)

    def add_allocation(self, allocation: Allocation) -> None:
        self.add_allocations([allocation])

    def add_allocations(self, allocations: List[Allocation]) -> None:
        self.allocations.extend([allocation.copy() for allocation in allocations])

    def split(self, frequency: int) -> Tuple[FrequencyEntry, FrequencyEntry]:
        if frequency <= self.band.lower or frequency >= self.band.upper:
            raise ValueError("Cannot split. Frequency not in range.")
        left_range = FrequencyEntry(
            band=FrequencyBand(lower=self.band.lower, upper=frequency),
            allocations=self.allocations,
        )
        right_range = FrequencyEntry(
            band=FrequencyBand(lower=frequency, upper=self.band.upper),
            allocations=self.allocations,
        )
        return (left_range.copy(), right_range.copy())


def _get_item(row: pd.Series, key: str) -> Optional[Any]:
    """Used to convert pd.nan to None."""
    item = row.get(key)
    if pd.isna(item):
        return None
    return item


def _get_optional_csv_string(row: pd.Series, key: str) -> Optional[List[str]]:
    item = _get_item(row, key)
    if item is None:
        return item
    return str(item).split(",")


def _get_optional_string(row: pd.Series, key: str) -> Optional[str]:
    item = _get_item(row, key)
    if item is None:
        return item
    return str(item)


def _get_string(row: pd.Series, key: str) -> str:
    item = _get_optional_string(row, key)
    if item is None:
        raise ValueError(f"{key} cannot be none from {row}")
    return item


def _get_float(row: pd.Series, key: str) -> float:
    item = _get_optional_float(row, key)
    if item is None:
        raise ValueError(f"{key} cannot be none from row: {row}")
    return item


def _get_optional_float(row: pd.Series, key: str) -> Optional[float]:
    item = _get_item(row, key)
    if item is None:
        return item
    return float(item)
