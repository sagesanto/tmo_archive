# overview of results dbs
from dataclasses import dataclass
from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from db.database import get_session
from db.models import ResultsDB, AnalysisRun
from app.schemas import ResultsDBOverview

router = APIRouter(prefix='/results_dbs', tags=['results_dbs'])

n_runs_subq = (
    select(AnalysisRun.results_db_id, func.count(AnalysisRun.id).label("n_runs"))
    .group_by(AnalysisRun.results_db_id)
    .subquery()
)

SORT_OPTIONS = {
    "date_updated_desc": ResultsDB.date_updated.desc(),
    "name": ResultsDB.display_name.asc(),
    "n_runs_desc": func.coalesce(n_runs_subq.c.n_runs, 0).desc(),
}

@dataclass
class ResultsDBFilterParams:
    natural_key: str | None = Query(default=None)
    search: str | None = Query(default=None)

    def apply(self, stmt):
        if self.natural_key is not None:
            stmt = stmt.where(ResultsDB.natural_key == self.natural_key)
        if self.search is not None:
            stmt = stmt.where(ResultsDB.display_name.ilike(f"%{self.search}%"))
        return stmt


@router.get("/count")
def count_results_dbs(
    filters: ResultsDBFilterParams = Depends(),
    db: Session = Depends(get_session),
) -> int:
    stmt = filters.apply(select(func.count(ResultsDB.id.distinct())))
    return db.execute(stmt).scalar_one()


@router.get("", response_model=list[ResultsDBOverview])
def list_results_dbs(
    filters: ResultsDBFilterParams = Depends(),
    sort: str = Query(default="date_updated_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = filters.apply(
        select(ResultsDB)
        .outerjoin(n_runs_subq, ResultsDB.id == n_runs_subq.c.results_db_id)
        .order_by(SORT_OPTIONS[sort])
    )

    stmt = stmt.limit(limit).offset(offset)
    results_dbs = db.execute(stmt).scalars().all()
    if filters.natural_key is not None and not results_dbs:
        raise HTTPException(status_code=404, detail="ResultsDB not found")
    return results_dbs
