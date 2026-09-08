# app/routers/objects.py
from dataclasses import dataclass
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, exists, func, or_
from sqlalchemy.orm import Session
from collections import defaultdict

from db.database import get_session
from db.models import DetectedObject, AnalysisRun, Flag, ObjectFlag, MPCEncounter
from app.schemas import DetectedObjectOverview
from core.flag_inherit import any_flag_exists, attach_flags

router = APIRouter(prefix="/objects", tags=["objects"])

SORT_OPTIONS = {
    "snr_desc": DetectedObject.snr.desc(),
    "snr_asc": DetectedObject.snr.asc(),
    "magnitude_desc": DetectedObject.magnitude.desc(),
    "magnitude_asc": DetectedObject.magnitude.asc(),
    "num_frames_desc": DetectedObject.num_frames.desc(),
    "analysis_time_desc": DetectedObject.analysis_time.desc(),
    "analysis_time_asc": DetectedObject.analysis_time.asc(),
}


@dataclass
class ObjectFilterParams:
    natural_key: str | None = Query(default=None)
    analysis_key: str | None = Query(default=None)
    observation_id: int | None = Query(default=None)
    results_db_id: int | None = Query(default=None)
    classification: str | None = Query(default=None)
    type: str | None = Query(default=None)
    min_snr: float | None = Query(default=None)
    has_flags: list[int] | None = Query(default=None)
    excludes_flags: list[int] | None = Query(default=None)
    no_flags: bool | None = Query(default=None, description="true: only objects with no flags. false: only objects with at least one flag.")
    designation: str | None = Query(default=None, description="MPC designation of an encounter tied to the object's observation")

    def apply(self, stmt):
        if self.natural_key is not None:
            stmt = stmt.where(DetectedObject.natural_key == self.natural_key)
        if self.analysis_key is not None or self.observation_id is not None or self.results_db_id is not None or self.designation is not None:
            stmt = stmt.join(AnalysisRun)
            if self.analysis_key is not None:
                stmt = stmt.where(AnalysisRun.natural_key == self.analysis_key)
            if self.observation_id is not None:
                stmt = stmt.where(AnalysisRun.observation_id == self.observation_id)
            if self.results_db_id is not None:
                stmt = stmt.where(AnalysisRun.results_db_id == self.results_db_id)
            if self.designation is not None:
                stmt = stmt.join(MPCEncounter, MPCEncounter.observation_id == AnalysisRun.observation_id).where(MPCEncounter.designation == self.designation)
        if self.classification is not None:
            stmt = stmt.where(DetectedObject.classification == self.classification)
        if self.type is not None:
            stmt = stmt.where(DetectedObject.type == self.type)
        if self.min_snr is not None:
            stmt = stmt.where(DetectedObject.snr >= self.min_snr)
        # flags inherited from an ancestor count the same as ones attached to the object itself
        has_any_flag = any_flag_exists()

        include_conditions = []
        if self.has_flags:
            include_conditions.append(any_flag_exists(self.has_flags))
        if self.no_flags is True:
            include_conditions.append(~has_any_flag)
        if include_conditions:
            stmt = stmt.where(or_(*include_conditions))

        if self.excludes_flags:
            stmt = stmt.where(~any_flag_exists(self.excludes_flags))
        if self.no_flags is False:
            stmt = stmt.where(has_any_flag)
        return stmt


@router.get("/count")
def count_objects(
    filters: ObjectFilterParams = Depends(),
    db: Session = Depends(get_session),
) -> int:
    stmt = filters.apply(select(func.count(DetectedObject.id.distinct())))
    return db.execute(stmt).scalar_one()


@router.get("", response_model=list[DetectedObjectOverview])
def list_objects(
    filters: ObjectFilterParams = Depends(),
    sort: str = Query(default="snr_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session),
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = filters.apply(select(DetectedObject)).order_by(SORT_OPTIONS[sort])

    stmt = stmt.limit(limit).offset(offset)
    objects = db.execute(stmt).scalars().all()
    attach_flags(db, objects)
    return objects