from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from mashumaro import DataClassJSONMixin


@dataclass
class AllocationService(DataClassJSONMixin):
    applications: Optional[List[str]]
    category: Optional[str]
    # Do we need this for now?
    footnotes: Optional[List[str]]
    region: str
    service: Optional[str]
    sub_table: Optional[str]
