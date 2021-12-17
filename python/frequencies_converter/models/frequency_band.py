from __future__ import annotations

from dataclasses import dataclass
import copy

from mashumaro import DataClassJSONMixin

from frequencies_converter.protos import frequencies_pb2

@dataclass(frozen=True)
class FrequencyBand(DataClassJSONMixin):
    # Units are in Hz
    lower: int
    upper: int

    def copy(self) -> FrequencyBand:
        return copy.deepcopy(self)

    def to_proto(self) -> frequencies_pb2.FrequencyBand:
        return frequencies_pb2.FrequencyBand(lower=self.lower, upper=self.upper)