from __future__ import annotations

import copy
from dataclasses import dataclass
from typing import List, Optional

from mashumaro import DataClassJSONMixin


@dataclass
class FrequencyAllocation(DataClassJSONMixin):
    service: str
    primary: bool
    footnotes: Optional[List[str]] = None

    def copy(self) -> FrequencyAllocation:
        return copy.deepcopy(self)
