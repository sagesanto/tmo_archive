# overview of datasets
from dataclasses import dataclass
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, exists

from db.database import get_session
from db.models import Observation, AnalysisRun, MPCEncounter, ObservationTag, Tag
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

@dataclass
class ObservationFilterParams:
    natural_key: str | None = Query(default=None)
    search: str | None = Query(default=None)
    has_tags: list[int] | None = Query(default=None)
    excludes_tags: list[int] | None = Query(default=None)
    no_tags: bool | None = Query(default=None, description="true: only observations with no tags. false: only observations with at least one tag.")
    has_runs: bool | None = Query(default=None)
    designation: str | None = Query(default=None, description="MPC designation of an encounter tied to this observation")
    acq_after: date | None = Query(default=None, description="only observations acquired on or after this UTC date")
    acq_before: date | None = Query(default=None, description="only observations acquired on or before this UTC date")

    def apply(self, stmt):
        if self.natural_key is not None:
            stmt = stmt.where(Observation.natural_key == self.natural_key)
        if self.search is not None:
            stmt = stmt.where(Observation.name.ilike(f"%{self.search}%"))
        if self.acq_after is not None:
            stmt = stmt.where(Observation.acq_timestamp >= int(datetime.combine(self.acq_after, time.min, tzinfo=timezone.utc).timestamp()))
        if self.acq_before is not None:
            stmt = stmt.where(Observation.acq_timestamp < int(datetime.combine(self.acq_before + timedelta(days=1), time.min, tzinfo=timezone.utc).timestamp()))

        has_any_tag = exists().where(ObservationTag.observation_key == Observation.natural_key)

        include_conditions = []
        if self.has_tags:
            include_conditions.append(exists().where(
                ObservationTag.observation_key == Observation.natural_key,
                ObservationTag.tag_id.in_(self.has_tags),
            ))
        if self.no_tags is True:
            include_conditions.append(~has_any_tag)
        if include_conditions:
            stmt = stmt.where(or_(*include_conditions))

        if self.excludes_tags:
            stmt = stmt.where(~exists().where(
                ObservationTag.observation_key == Observation.natural_key,
                ObservationTag.tag_id.in_(self.excludes_tags),
            ))
        if self.no_tags is False:
            stmt = stmt.where(has_any_tag)

        if self.has_runs:
            stmt = stmt.where(func.coalesce(n_runs_subq.c.n_runs, 0) > 0)
        if self.designation is not None:
            stmt = stmt.join(MPCEncounter, MPCEncounter.observation_id == Observation.id).where(MPCEncounter.designation == self.designation)
        return stmt


@router.get("/count")
def count_observations(
    filters: ObservationFilterParams = Depends(),
    db: Session = Depends(get_session),
) -> int:
    stmt = filters.apply(
        select(func.count(Observation.id.distinct())).outerjoin(n_runs_subq, Observation.id == n_runs_subq.c.observation_id)
    )
    return db.execute(stmt).scalar_one()


@router.get("", response_model=list[ObservationOverview])
def list_observations(
    filters: ObservationFilterParams = Depends(),
    sort: str = Query(default="acq_timestamp_desc"),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown sort option: {sort}")
    stmt = (
        filters.apply(select(Observation).outerjoin(n_runs_subq, Observation.id == n_runs_subq.c.observation_id))
        .order_by(SORT_OPTIONS[sort])
    )

    stmt = stmt.limit(limit).offset(offset)
    datasets = db.execute(stmt).scalars().all()
    if filters.natural_key is not None and not datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")

    keys = [d.natural_key for d in datasets]
    rows = db.execute(
        select(ObservationTag.observation_key, Tag)
        .join(Tag, Tag.id == ObservationTag.tag_id)
        .where(ObservationTag.observation_key.in_(keys))
    ).all()

    tags_by_key = defaultdict(list)
    for observation_key, tag in rows:
        tags_by_key[observation_key].append(tag)

    for d in datasets:
        d.tags = tags_by_key.get(d.natural_key, [])

    return datasets
