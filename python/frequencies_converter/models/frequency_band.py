from __future__ import annotations

from dataclasses import dataclass
import copy

from mashumaro import DataClassJSONMixin


@dataclass(frozen=True)
class FrequencyBand(DataClassJSONMixin):
    # Units are in Hz
    lower: int
    upper: int

    def copy(self) -> FrequencyBand:
        return copy.deepcopy(self)
