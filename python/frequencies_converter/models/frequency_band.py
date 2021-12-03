from __future__ import annotations

from dataclasses import dataclass

from mashumaro import DataClassJSONMixin


@dataclass
class FrequencyBand(DataClassJSONMixin):
    lower_frequency: float
    upper_frequency: float
