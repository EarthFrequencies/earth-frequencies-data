from __future__ import annotations

import copy
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
from mashumaro import DataClassJSONMixin

from frequencies_converter.models.frequency_allocation_block import (
    FrequencyAllocationBlock,
)
from frequencies_converter import config


@dataclass
class AllocationTable(DataClassJSONMixin):
    allocation_blocks: List[FrequencyAllocationBlock]
    name: str
    region: str
    year: int
    meta: Optional[Dict[str, str]] = None
    parent_region: Optional[str] = None

    def copy(self) -> AllocationTable:
        return copy.deepcopy(self)

    @staticmethod
    def from_data_file_directory(path: str, name: str) -> AllocationTable:
        allocations_file = path / Path(config.ALLOCATION_FILENAME)
        print(allocations_file)
        df = pd.read_csv(str(allocations_file), sep="\t")
        # TODO (jrmlhermitte): group by region and return multiple allocation tables
        if len(df) > 0:
            region = df.iloc[0].get("region") or "N/A"
        else:
            region = "N/A"
        # TODO (jrmlhermitte): get parent region somehow
        parent_region = None
        # TODO (jrmlhermitte): pass through year
        year = 1973
        entries = FrequencyAllocationBlock.from_csv_file(str(allocations_file))
        metadata_file = Path(path) / Path(config.METADATA_FILENAME)
        metadata: Optional[Dict]
        if metadata_file.exists():
            metadata = _read_metadata(metadata_file)
        else:
            metadata = None
        return AllocationTable(
            name=name,
            allocation_blocks=entries,
            meta=metadata,
            parent_region=parent_region,
            region=region,
            year=year,
        )

    @staticmethod
    def from_json_file(json_file: str) -> AllocationTable:
        with open(json_file, "r", encoding="utf-8") as file:
            json_data = file.read()
            return AllocationTable.from_json(json_data)

    @staticmethod
    def has_allocation_table(directory: Path) -> bool:
        filenames = directory.glob(config.ALLOCATION_FILENAME)
        if filenames:
            return True
        return False

    def to_json_file(self, filename: str) -> None:
        with open(filename, "w", encoding="utf-8") as file:
            json_data = self.to_json()
            assert isinstance(json_data, str)
            file.write(json_data)

    def to_data_file_directory(self, directory: str) -> None:
        allocation_directory = Path(directory)
        allocation_directory.mkdir(parents=True, exist_ok=True)
        if self.meta:
            metadata_path = allocation_directory / config.METADATA_FILENAME
            _write_metadata(self.meta, metadata_path)
        allocation_data_file = allocation_directory / config.ALLOCATION_FILENAME
        FrequencyAllocationBlock.list_to_csv_file(
            filename=str(allocation_data_file),
            entries=self.allocation_blocks,
            parent_region=self.parent_region,
            region=self.region,
            year=self.year,
        )

    @staticmethod
    def list_to_data_file_directory(
        allocation_tables: List[AllocationTable], directory: str
    ) -> None:
        for allocation_table in allocation_tables:
            allocation_directory = Path(directory) / Path(allocation_table.name)
            allocation_directory.mkdir(parents=True, exist_ok=True)
            allocation_table.to_data_file_directory(str(allocation_directory))


def _read_metadata(metadata_file: Path) -> Dict[str, str]:
    df = pd.read_csv(metadata_file, sep="\t")
    metadata = {}
    for _, row in df.iterrows():
        name = _coerce_to_string(row["name"])
        value = _coerce_to_string(row["value"])
        metadata[name] = value
    return metadata


def _write_metadata(metadata: Dict[str, str], metadata_file: Path) -> None:
    metadata_list = [{"name": key, "value": value} for key, value in metadata.items()]
    df = pd.DataFrame(metadata_list)
    df.to_csv(metadata_file, sep="\t", index=False)


def _coerce_to_string(item) -> str:
    if pd.isna(item):
        return ""
    return str(item)
