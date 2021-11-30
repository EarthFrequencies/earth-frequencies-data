from pathlib import Path


DATA_DIR = Path(__file__).parent.parent.parent / Path("data/allocation-tables")

# TODO (jrmlhermitte): These should be renamed to .tsv
#  (tab separated values).
# Names for the csv files
ALLOCATION_FILENAME = "allocations.txt"
METADATA_FILENAME = "metadata.txt"
JSON_INDEX_FILENAME = "index.json"
