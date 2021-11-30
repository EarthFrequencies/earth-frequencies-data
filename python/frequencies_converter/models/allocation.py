from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List, Optional

import pandas as pd
from mashumaro import DataClassJSONMixin
from frequencies_converter.models.allocation_service import AllocationService
from frequencies_converter.models.frequency_band import FrequencyBand


@dataclass
class Allocation(DataClassJSONMixin):
    band: FrequencyBand
    service: AllocationService

    @classmethod
    def from_csv_file(cls, filename: str) -> List[Allocation]:
        df = pd.read_csv(filename, sep="\t")
        return cls.from_dataframe(df)

    @staticmethod
    def from_dataframe(df: pd.DataFrame) -> List[Allocation]:
        allocations = []
        for _, row in df.iterrows():
            allocation = Allocation.from_pandas_row(row)
            allocations.append(allocation)
        return allocations

    @staticmethod
    def from_pandas_row(row: pd.Row) -> Allocation:
        upper_frequency = _get_float(row, "upper_frequency")
        lower_frequency = _get_float(row, "lower_frequency")
        band = FrequencyBand(
            upper_frequency=upper_frequency, lower_frequency=lower_frequency
        )
        service = AllocationService(
            applications=_get_optional_csv_string(row, "applications"),
            category=_get_optional_string(row, "category"),
            footnotes=_get_optional_csv_string(row, "footnotes"),
            region=_get_string(row, "region"),
            service=_get_optional_string(row, "service"),
            sub_table=_get_optional_string(row, "sub-table"),
        )
        return Allocation(
            band=band,
            service=service,
        )

    @classmethod
    def list_to_csv_file(cls, allocations: List[Allocation], filename: str) -> None:
        df = cls.list_to_dataframe(allocations)
        df.to_csv(filename, sep="\t", index=False)

    @staticmethod
    def list_to_dataframe(allocations: List[Allocation]) -> pd.DataFrame:
        return pd.DataFrame([allocation.to_pandas_row() for allocation in allocations])

    def to_pandas_row(self) -> pd.Series:
        applications: Optional[str] = None
        if self.service.applications is not None:
            applications = ",".join(self.service.applications)
        footnotes: Optional[str] = None
        if self.service.footnotes is not None:
            footnotes = ",".join(self.service.footnotes)
        return pd.Series(
            {
                "upper_frequency": self.band.upper_frequency,
                "lower_frequency": self.band.lower_frequency,
                "applications": applications,
                "category": self.service.category,
                "footnotes": footnotes,
                "region": self.service.region,
                "service": self.service.service,
                "sub-table": self.service.sub_table,
            }
        )


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
