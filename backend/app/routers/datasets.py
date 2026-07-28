# overview of datasets
from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from db.database import get_session
from db.models import Dataset, AnalysisRun
from app.schemas import DatasetOverview

router = APIRouter(prefix='/datasets', tags=['datasets'])

n_runs_subq = (
    select(AnalysisRun.dataset_id, func.count(AnalysisRun.id).label("n_runs"))
    .group_by(AnalysisRun.dataset_id)
    .subquery()
)

SORT_OPTIONS = {
    "acq_timestamp_desc": Dataset.acq_timestamp.desc(),
    "acq_timestamp_asc": Dataset.acq_timestamp.asc(),
    "name": Dataset.display_name.asc(),
    "n_runs_desc": func.coalesce(n_runs_subq.c.n_runs, 0).desc(),
}

@router.get("", response_model=list[DatasetOverview])
def list_datasets(
    natural_key: str | None = Query(default=None),
    search: str | None = Query(default=None),
    sort: str = Query(default="acq_timestamp_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = (
        select(Dataset)
        .outerjoin(n_runs_subq, Dataset.id == n_runs_subq.c.dataset_id)
        .order_by(SORT_OPTIONS[sort])
    )

    if natural_key is not None:
        stmt = stmt.where(Dataset.natural_key == natural_key)
    if search is not None:
        stmt = stmt.where(Dataset.display_name.ilike(f"%{search}%"))

    stmt = stmt.limit(limit).offset(offset)
    datasets = db.execute(stmt).scalars().all()
    if natural_key is not None and not datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return datasets
