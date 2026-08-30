# overviews of analysis runs
from dataclasses import dataclass
from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from db.database import get_session
from db.models import AnalysisRun, MPCEncounter
from app.schemas import RunOverview

router = APIRouter(prefix='/analyses',tags=['runs'])

SORT_OPTIONS = {
    "analysis_time_desc": AnalysisRun.analysis_time.desc(),
    "analysis_time_asc": AnalysisRun.analysis_time.asc(),
    "obs_time_desc": AnalysisRun.obs_time.desc(),
    "obs_time_asc": AnalysisRun.obs_time.asc(),
    "name": AnalysisRun.display_name.asc(),
}

@dataclass
class AnalysisFilterParams:
    natural_key: str | None = Query(default=None)
    status: str | None = Query(default=None)
    results_db_id: int | None = Query(default=None)
    observation_id: int | None = Query(default=None)
    designation: str | None = Query(default=None, description="MPC designation of an encounter tied to the run's observation")

    def apply(self, stmt):
        if self.natural_key is not None:
            stmt = stmt.where(AnalysisRun.natural_key == self.natural_key)
        if self.status is not None:
            stmt = stmt.where(AnalysisRun.status == self.status)
        if self.results_db_id is not None:
            stmt = stmt.where(AnalysisRun.results_db_id == self.results_db_id)
        if self.observation_id is not None:
            stmt = stmt.where(AnalysisRun.observation_id == self.observation_id)
        if self.designation is not None:
            stmt = stmt.join(MPCEncounter, MPCEncounter.observation_id == AnalysisRun.observation_id).where(MPCEncounter.designation == self.designation)
        return stmt


@router.get("/count")
def count_analyses(
    filters: AnalysisFilterParams = Depends(),
    db: Session = Depends(get_session),
) -> int:
    stmt = filters.apply(select(func.count(AnalysisRun.id.distinct())))
    return db.execute(stmt).scalar_one()


@router.get("", response_model=list[RunOverview])
def list_analyses(
    filters: AnalysisFilterParams = Depends(),
    sort: str = Query(default="analysis_time_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = filters.apply(select(AnalysisRun)).order_by(SORT_OPTIONS[sort])

    stmt = stmt.limit(limit).offset(offset)
    runs = db.execute(stmt).scalars().all()
    if filters.natural_key is not None and not runs:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return runs
