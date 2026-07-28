# overviews of analysis runs
from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import select

from db.database import get_session
from db.models import AnalysisRun
from app.schemas import RunOverview

router = APIRouter(prefix='/analyses',tags=['runs'])

SORT_OPTIONS = {
    "analysis_time_desc": AnalysisRun.analysis_time.desc(),
    "analysis_time_asc": AnalysisRun.analysis_time.asc(),
    "obs_time_desc": AnalysisRun.obs_time.desc(),
    "obs_time_asc": AnalysisRun.obs_time.asc(),
    "name": AnalysisRun.display_name.asc(),
}

@router.get("", response_model=list[RunOverview])
def list_analyses(
    natural_key: str | None = Query(default=None),
    status: str | None = Query(default=None),
    results_db_id: int | None = Query(default=None),
    dataset_id: int | None = Query(default=None),
    sort: str = Query(default="analysis_time_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = select(AnalysisRun).order_by(SORT_OPTIONS[sort])

    if natural_key is not None:
        stmt = stmt.where(AnalysisRun.natural_key == natural_key)
    if status is not None:
        stmt = stmt.where(AnalysisRun.status == status)
    if results_db_id is not None:
        stmt = stmt.where(AnalysisRun.results_db_id == results_db_id)
    if dataset_id is not None:
        stmt = stmt.where(AnalysisRun.dataset_id == dataset_id)

    stmt = stmt.limit(limit).offset(offset)
    runs = db.execute(stmt).scalars().all()
    if natural_key is not None and not runs:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return runs