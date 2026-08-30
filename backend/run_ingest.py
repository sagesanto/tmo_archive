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
from core.paths import to_container_path
from db.database import reset_db
from obs_ingest import ingest_md_db
from mpc_ingest import main as ingest_mpc
from results_ingest import ingest_results_db
from classification import main as run_mpc_classification


def find_matches(entries: list[dict], logger) -> list[str]:
    matches = []
    for entry in entries:
        container_dir = to_container_path(entry["dir"])
        pattern = entry["pattern"]
        logger.info(f"Walking {container_dir} with pattern {pattern}")
        logger.info(os.listdir(container_dir))
        for root, _, files in os.walk(container_dir):
            logger.info(f"root: {root}")
            logger.info(files)
            n_matches = len(matches)
            matches += [os.path.join(root, f) for f in files if fnmatch.fnmatch(f, pattern)]
            logger.info(f"{len(matches)-n_matches} matches in {root}")
    return matches


def run_full_ingest(search_paths: dict, logger) -> dict:
    n_obs = 0
    logger.info("Looking for obs dirs")
    for path in find_matches(search_paths.get("obs", []), logger):
        logger.info(f"Found {path}. Ingesting")
        ingest_md_db(path, logger)
        n_obs += 1

    try:
        ingest_mpc()
    except Exception as e:
        logger.error(f"MPC ingest failed, continuing with results ingest: {e}")

    n_results = 0
    logger.info("Looking for results dirs")
    for path in find_matches(search_paths.get("results", []), logger):
        logger.info(f"Found {path}. Ingesting")
        ingest_results_db(path, logger)
        n_results += 1

    run_mpc_classification()
    return {"obs_matched": n_obs, "results_matched": n_results}


def main():
    parser = argparse.ArgumentParser(description="Run obs and results ingestion over configured directories")
    parser.add_argument("config", help="Path to json config listing obs/results dirs and patterns")
    parser.add_argument("--rebuild", action="store_true", help="Wipe the existing records database before ingesting")
    parser.add_argument("--full", action="store_true", help="Also wipe user-created content when rebuilding")
    args = parser.parse_args()

    with open(args.config) as f:
        config = json.load(f)

    if args.rebuild:
        reset_db(full=args.full)

    logger = configure_logger("ingest")
    run_full_ingest(config, logger)

if __name__ == "__main__":
    main()
