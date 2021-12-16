from __future__ import annotations

import copy
from dataclasses import dataclass

from mashumaro import DataClassJSONMixin


@dataclass
class Allocation(DataClassJSONMixin):
    service: str
    primary: bool

    def copy(self) -> Allocation:
        return copy.deepcopy(self)
