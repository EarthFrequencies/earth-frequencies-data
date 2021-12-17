from __future__ import annotations

import copy
from dataclasses import dataclass
from typing import List, Optional

from mashumaro import DataClassJSONMixin
from frequencies_converter.protos import frequencies_pb2


@dataclass
class FrequencyAllocation(DataClassJSONMixin):
    service: str
    primary: bool
    footnotes: Optional[List[str]] = None

    def copy(self) -> FrequencyAllocation:
        return copy.deepcopy(self)

    def to_proto(self) -> frequencies_pb2.FrequencyAllocation:
        return frequencies_pb2.FrequencyAllocation(
            service=self.service,
            primary=self.primary,
            footnotes=self.footnotes,
        )
