# overview of results dbs
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

@router.get("", response_model=list[ResultsDBOverview])
def list_results_dbs(
    natural_key: str | None = Query(default=None),
    search: str | None = Query(default=None),
    sort: str = Query(default="date_updated_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = (
        select(ResultsDB)
        .outerjoin(n_runs_subq, ResultsDB.id == n_runs_subq.c.results_db_id)
        .order_by(SORT_OPTIONS[sort])
    )

    if natural_key is not None:
        stmt = stmt.where(ResultsDB.natural_key == natural_key)
    if search is not None:
        stmt = stmt.where(ResultsDB.display_name.ilike(f"%{search}%"))

    stmt = stmt.limit(limit).offset(offset)
    results_dbs = db.execute(stmt).scalars().all()
    if natural_key is not None and not results_dbs:
        raise HTTPException(status_code=404, detail="ResultsDB not found")
    return results_dbs
