# app/routers/objects.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from db.database import get_session
from db.models import DetectedObject, AnalysisRun
from app.schemas import DetectedObjectOverview

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


@router.get("", response_model=list[DetectedObjectOverview])
def list_objects(
    natural_key: str | None = Query(default=None),
    analysis_key: str | None = Query(default=None),
    dataset_id: int | None = Query(default=None),
    results_db_id: int | None = Query(default=None),
    classification: str | None = Query(default=None),
    type: str | None = Query(default=None),
    min_snr: float | None = Query(default=None),
    sort: str = Query(default="snr_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session),
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = select(DetectedObject).order_by(SORT_OPTIONS[sort])
    if natural_key is not None:
        stmt = stmt.where(DetectedObject.natural_key == natural_key)
    if analysis_key is not None or dataset_id is not None or results_db_id is not None:
        stmt = stmt.join(AnalysisRun)
        if analysis_key is not None:
            stmt = stmt.where(AnalysisRun.natural_key == analysis_key)
        if dataset_id is not None:
            stmt = stmt.where(AnalysisRun.dataset_id == dataset_id)
        if results_db_id is not None:
            stmt = stmt.where(AnalysisRun.results_db_id == results_db_id)
    if classification is not None:
        stmt = stmt.where(DetectedObject.classification == classification)
    if type is not None:
        stmt = stmt.where(DetectedObject.type == type)
    if min_snr is not None:
        stmt = stmt.where(DetectedObject.snr >= min_snr)

    stmt = stmt.limit(limit).offset(offset)
    return db.execute(stmt).scalars().all()