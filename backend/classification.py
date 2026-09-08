import sys, os
from os.path import dirname, exists, getmtime, getsize, join, abspath
import glob
from datetime import datetime, timezone
from typing import Optional, Tuple
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from obs.calibs import is_bias, is_dark, is_flat, is_science
from obs.metadata import MetadataDat, MetadataDB, get_obs_details, read_schedule
from db.database import get_record_db, reset_db
from db.models import FitsFile, MPCEncounter, MPCCandidate, MPCStatus, Observation, Tag, ObservationTag, Schedule, MetadataDBRecord as RecordMetadataDB
from core.keys import obs_key
from core.config import get_config
from sqlalchemy import select, exists, func, or_, delete
from sqlalchemy.orm import Session
from collections import defaultdict

from db.database import get_session
from db.models import DetectedObject, AnalysisRun, Flag, ObjectFlag, EntityFlag
from core.flag_ops import add_entity_flag, add_object_flag, purge_object_flag, remove_entity_flag
from app.schemas import DetectedObjectOverview

tags: dict[str,Tag] = None

def attach_tag(obs: Observation, tag_name, db: Session):
    global tags
    if tags is None:
        _tags = db.query(Tag).scalars().all()
        tags = {t.name:t for t in _tags}
    stmt = (
        insert(ObservationTag)
        .values(observation_key=obs.natural_key,tag_id=tags[tag_name].id)
        .on_conflict_do_nothing(index_elements=["observation_key"])
    )
    db.execute(stmt)
    db.flush()

def detection_mag_classification(logger):
    logger.info("Classifying objects by detection threshold")
    # flag sources whose mag is > than the detection mag threshold
    with get_record_db() as db:
        excess_tolerance = get_config(db, "detection_mag_excess_tolerance", 0)
        stmt = select(Flag).where(Flag.name == "Too Dim")
        too_dim_flag = db.execute(stmt).scalar()

        # select objects where their mag > detection mag threshold (maybe by some amt? do we need uncerts here?)
        stmt = (
            select(DetectedObject, AnalysisRun.detection_limit_mag)
            .join(DetectedObject.analysis_run)
            .where(DetectedObject.magnitude > AnalysisRun.detection_limit_mag + excess_tolerance)
        )
        rows = db.execute(stmt).all()
        logger.info(f"{len(rows)} objects are too dim")
        newly_flagged = 0
        for obj, limit_mag in rows:
            note = f"mag {obj.magnitude:.2f}; limit {limit_mag:.2f}"
            newly_flagged += add_object_flag(db, obj.natural_key, too_dim_flag, "detection_threshold", note)
        db.flush()

    logger.info(f"{newly_flagged} newly flagged")
    logger.info("Done detection threshold")

def mpc_bad_classification(logger):
    # a bad status is intrinsic to the mpc object, so the flag goes on the candidate and every
    # object under it inherits. nothing here is user-settable, and re-running just re-syncs
    # against the current status.
    # if a candidate has no mpc status that probably means it's still in the confirmation process, which is fine
    logger.info("Classifying by MPC object status")
    with get_record_db() as db:
        stmt = select(Flag).where(Flag.name == "Bad MPC")
        bad_mpc_flag = db.execute(stmt).scalar()

        # this flag used to be attached per-object. those rows are unreachable now that it is
        # inherited, so clear out any left over from before
        purged = purge_object_flag(db, bad_mpc_flag, "mpc_status", "moved to the MPC object")
        if purged:
            logger.info(f"cleared {purged} leftover object-level Bad MPC flags")

        rows = db.execute(select(MPCCandidate.designation, MPCStatus.status).outerjoin(MPCStatus)).all()

        num_bad = 0
        changed = 0
        for designation, status in rows:
            if status is not None and status not in ("None", "lost"):
                changed += add_entity_flag(db, "mpc", designation, bad_mpc_flag, "mpc_status", f"MPC status: {status}")
                num_bad += 1
            else:
                changed += remove_entity_flag(db, "mpc", designation, bad_mpc_flag, "mpc_status",
                                              f"MPC status: {status or 'none'}")
        db.flush()
    logger.info(f"{num_bad} MPC objects have a bad status ({changed} changed)")
    logger.info("Done MPC status")


def mpc_vel_classification(logger):
    logger.info("Classifying objects by MPC velocity")
    with get_record_db() as db:
        ra_tolerance = get_config(db, "mpc_ra_deviation_tolerance", 0.25)
        dec_tolerance = get_config(db, "mpc_dec_deviation_tolerance", 0.25)
        stmt = select(Flag).where(Flag.name == "Wrong Velocity")
        wrong_velocity_flag = db.execute(stmt).scalar()
        stmt = select(DetectedObject, MPCEncounter.d_ra, MPCEncounter.d_dec).join(AnalysisRun).join(Observation).join(MPCEncounter)
        rows = db.execute(stmt).all()

        num_wrong = 0
        newly_flagged = 0
        for obj, dRA, dDec in rows:
            if abs(obj.v_ra - dRA) > ra_tolerance or abs(obj.v_dec - dDec) > dec_tolerance:
                note = f"ra vel {obj.v_ra:.2f}; expected {dRA:.2f} | dec vel {obj.v_dec:.2f}; expected {dDec:.2f}"
                newly_flagged += add_object_flag(db, obj.natural_key, wrong_velocity_flag, "mpc_velocity", note)
                num_wrong += 1
        db.flush()
    logger.info(f"{num_wrong} objects have an incorrect velocity ({newly_flagged} newly flagged)")
    logger.info("Done MPC")
    
def main():
    from core.log import configure_logger

    logger = configure_logger("classification")
    logger.info("Running automatic classifications")
    mpc_vel_classification(logger)
    detection_mag_classification(logger)
    mpc_bad_classification(logger)
    logger.info("Done with classification.")
        
if __name__=="__main__":
    main()