import sys, os
from os.path import dirname, exists, getmtime, getsize, join, abspath
import glob
from datetime import datetime, timezone
from typing import Optional, Tuple
import numpy as np
import requests
from sqlalchemy.orm import Session

from obs.calibs import is_bias, is_dark, is_flat, is_science
from obs.metadata import MetadataDat, MetadataDB, get_obs_details, read_schedule
from db.database import get_record_db, reset_db
from db.models import FitsFile, MPCEncounter, MPCCandidate, Observation, Schedule, MetadataDBRecord as RecordMetadataDB, MPCStatus
from core.keys import obs_key
from mpc import MPCIdentifier, MPCStatus as MPCStatusEnum, parse_obs_description, make_encounter


def main():
    from core.log import configure_logger

    logger = configure_logger("mpc_ingest")
    
    # first, create candidates for each desig, where necessary, and add to DB
    # assemble dict of {desig: Candidate} for all candidates
    # go thru the Observations and find ones that don't have encounters
    
    with MPCIdentifier() as identifier:
        with get_record_db() as db:
            mpc_observations_without_encounters = db.query(Observation).filter(Observation.description.contains("MPC Asteroid"), ~Observation.mpc_encounter.has()).all()
            for obs in mpc_observations_without_encounters:
                d = parse_obs_description(obs.description)
                desig = d['desig']
                candidate = db.query(MPCCandidate).filter_by(designation=desig).one_or_none()
                if candidate is None:
                    candidate = MPCCandidate(designation=desig)
                    db.add(candidate)
                    db.flush()
                encounter = make_encounter(d,obs,candidate.id)
                obs.mpc_encounter=encounter
                # TODO: ADD MPC TAG TO OBSERVATION HERE
                db.add(encounter)
                db.flush()
            db.flush()
            candidates = db.query(MPCCandidate).all()
            for candidate in candidates:
                # find and delete existing status
                desig = candidate.designation
                existing_status = db.query(MPCStatus).filter(MPCStatus.trksub==desig).one_or_none()
                if existing_status is not None:
                    db.delete(existing_status)
                    db.flush()
                try:
                    status = identifier.get_mpc_status(desig)
                except requests.exceptions.RequestException as e:
                    # site down -- stop instead of retrying per candidate
                    logger.error(f"MPC site unreachable, aborting remaining status lookups: {e}")
                    break
                except Exception as e:
                    logger.error(f"Couldn't retrieve MPC status for candidate {desig}: {e}")
                    continue
                else:
                    if not status:
                        logger.warning(f"No status from MPC found for candidate {desig}.")
                        continue
                mpc_status = MPCStatus(
                    mpc_candidate_id=candidate.id,
                    **status
                )
                db.add(mpc_status)
                

    
if __name__ == "__main__":
    main()


