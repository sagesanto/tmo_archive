# overview of datasets
from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_

from db.database import get_session
from db.models import Observation, AnalysisRun
from app.schemas import ObservationOverview

router = APIRouter(prefix='/observations', tags=['observations'])

n_runs_subq = (
    select(AnalysisRun.observation_id, func.count(AnalysisRun.id).label("n_runs"))
    .group_by(AnalysisRun.observation_id)
    .subquery()
)

SORT_OPTIONS = {
    "acq_timestamp_desc": Observation.acq_timestamp.desc(),
    "acq_timestamp_asc": Observation.acq_timestamp.asc(),
    "name": Observation.display_name.asc(),
    "n_runs_desc": func.coalesce(n_runs_subq.c.n_runs, 0).desc(),
}

# mirrors ObsType classification precedence in app/schemas.py::ObservationOverview.obs_type
OBS_TYPE_CONDITIONS = {
    "Unclassified": Observation.is_science.is_(None),
    "Science": Observation.is_science.is_(True),
    "Dark": and_(Observation.is_science.isnot(True), Observation.is_dark.is_(True)),
    "Flat": and_(Observation.is_science.isnot(True), Observation.is_dark.isnot(True), Observation.is_flat.is_(True)),
    "Bias": and_(Observation.is_science.isnot(True), Observation.is_dark.isnot(True), Observation.is_flat.isnot(True), Observation.is_bias.is_(True)),
    "Other": and_(Observation.is_science.isnot(None), Observation.is_science.isnot(True), Observation.is_dark.isnot(True), Observation.is_flat.isnot(True), Observation.is_bias.isnot(True)),
}

@router.get("", response_model=list[ObservationOverview])
def list_observations(
    natural_key: str | None = Query(default=None),
    search: str | None = Query(default=None),
    obs_types: str | None = Query(default=None),  # comma-separated ObsType names
    has_runs: bool | None = Query(default=None),
    sort: str = Query(default="acq_timestamp_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = (
        select(Observation)
        .outerjoin(n_runs_subq, Observation.id == n_runs_subq.c.observation_id)
        .order_by(SORT_OPTIONS[sort])
    )

    if natural_key is not None:
        stmt = stmt.where(Observation.natural_key == natural_key)
    if search is not None:
        stmt = stmt.where(Observation.display_name.ilike(f"%{search}%"))
    if obs_types is not None:
        conditions = [OBS_TYPE_CONDITIONS[t] for t in obs_types.split(",") if t in OBS_TYPE_CONDITIONS]
        if conditions:
            stmt = stmt.where(or_(*conditions))
    if has_runs:
        stmt = stmt.where(func.coalesce(n_runs_subq.c.n_runs, 0) > 0)

    stmt = stmt.limit(limit).offset(offset)
    datasets = db.execute(stmt).scalars().all()
    if natural_key is not None and not datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return datasets
