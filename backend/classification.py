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
from db.models import FitsFile, MPCEncounter, MPCCandidate, Observation, Schedule, MetadataDBRecord as RecordMetadataDB
from core.keys import obs_key
from sqlalchemy import select, exists, func, or_
from sqlalchemy.orm import Session
from collections import defaultdict

from db.database import get_session
from db.models import DetectedObject, AnalysisRun, Flag, ObjectFlag
from app.schemas import DetectedObjectOverview

D_RA_DEVIATION_TOLERANCE = 0.25  # "/s
D_DEC_DEVIATION_TOLERANCE = 0.25  # "/s

def main():
    with get_record_db() as db:
        stmt = select(Flag).where(Flag.name == "Wrong Velocity")
        wrong_velocity_flag = db.execute(stmt).scalar()
        print(wrong_velocity_flag)
        stmt = select(DetectedObject, MPCEncounter.d_ra, MPCEncounter.d_dec).join(AnalysisRun).join(Observation).join(MPCEncounter)
        rows = db.execute(stmt).all()
        
        for obj, dRA, dDec in rows:
            if abs(obj.v_ra - dRA) > D_RA_DEVIATION_TOLERANCE or abs(obj.v_dec - dDec) > D_DEC_DEVIATION_TOLERANCE:
                stmt = (
                    insert(ObjectFlag)
                    .values(object_key=obj.natural_key, flag_id=wrong_velocity_flag.id)
                    .on_conflict_do_nothing(index_elements=["object_key", "flag_id"])
                )
                db.execute(stmt)
        db.flush()
        
if __name__=="__main__":
    main()