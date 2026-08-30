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
from db.models import DetectedObject, AnalysisRun, Flag, ObjectFlag
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
            select(DetectedObject)
            .join(DetectedObject.analysis_run)
            .where(DetectedObject.magnitude > AnalysisRun.detection_limit_mag + excess_tolerance)
        )
        too_dim = db.scalars(stmt).all()
        logger.info(f"{len(too_dim)} objects are too dim")
        for obj in too_dim:
            stmt = (
                insert(ObjectFlag)
                .values(object_key=obj.natural_key, flag_id=too_dim_flag.id)
                .on_conflict_do_nothing(index_elements=["object_key", "flag_id"])
            )
            db.execute(stmt)
        db.flush()
    
    logger.info("Done detection threshold")

def mpc_bad_classification(logger):
    # classify MPC objects with the bad mpc flag if they're associated with an mpc obj that has a bad mpc status
    # if they have no mpc status that probably means theyre still in the confirmation process which is fine
    # also, remove bad mpc tags from obs whose status may have previously been bad but now is good
    logger.info("Classifying by MPC object status")
    with get_record_db() as db:
        stmt = select(Flag).where(Flag.name == "Bad MPC")
        bad_mpc_flag = db.execute(stmt).scalar()

        stmt = (
            select(DetectedObject, MPCStatus.status)
            .join(AnalysisRun).join(Observation).join(MPCEncounter).join(MPCCandidate)
            .outerjoin(MPCStatus)
        )
        rows = db.execute(stmt).all()

        num_bad = 0
        for obj, status in rows:
            if status is not None and status not in ("None", "lost"):
                stmt = (
                    insert(ObjectFlag)
                    .values(object_key=obj.natural_key, flag_id=bad_mpc_flag.id)
                    .on_conflict_do_nothing(index_elements=["object_key", "flag_id"])
                )
                db.execute(stmt)
                num_bad += 1
            else:
                db.execute(delete(ObjectFlag).where(ObjectFlag.object_key == obj.natural_key, ObjectFlag.flag_id == bad_mpc_flag.id))
        db.flush()
    logger.info(f"{num_bad} objects have a bad MPC status")
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
        for obj, dRA, dDec in rows:
            if abs(obj.v_ra - dRA) > ra_tolerance or abs(obj.v_dec - dDec) > dec_tolerance:
                stmt = (
                    insert(ObjectFlag)
                    .values(object_key=obj.natural_key, flag_id=wrong_velocity_flag.id)
                    .on_conflict_do_nothing(index_elements=["object_key", "flag_id"])
                )
                db.execute(stmt)
                num_wrong += 1
        db.flush()
    logger.info(f"{num_wrong} objects have an incorrect velocity")
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