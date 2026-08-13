""" run ingest of obs and results, in that order

recursive search after reading a json config of the form:
{
  "obs": [{"dir": "/path/to/search", "pattern": "Metadata.db"}, ...],
  "results": [{"dir": "/path/to/search", "pattern": "*.db"}, ...]
}
"""

import argparse
import fnmatch
import json
import os

from core.log import configure_logger
from db.database import reset_db
from obs_ingest import ingest_md_db
from results_ingest import ingest_results_db


def find_matches(entries: list[dict]) -> list[str]:
    matches = []
    for entry in entries:
        for root, _, files in os.walk(entry["dir"]):
            matches += [os.path.join(root, f) for f in files if fnmatch.fnmatch(f, entry["pattern"])]
    return matches


def main():
    parser = argparse.ArgumentParser(description="Run obs and results ingestion over configured directories")
    parser.add_argument("config", help="Path to json config listing obs/results dirs and patterns")
    parser.add_argument("--rebuild", action="store_true", help="Wipe the existing records database before ingesting")
    args = parser.parse_args()

    with open(args.config) as f:
        config = json.load(f)

    if args.rebuild:
        reset_db()

    logger = configure_logger("ingest")

    for path in find_matches(config.get("obs", [])):
        ingest_md_db(path, logger)

    for path in find_matches(config.get("results", [])):
        ingest_results_db(path, logger)


if __name__ == "__main__":
    main()
