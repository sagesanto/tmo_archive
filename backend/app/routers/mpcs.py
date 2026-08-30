# overviews of analysis runs
from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import select

from db.database import get_session
from db.models import AnalysisRun, MPCEncounter, MPCCandidate, Observation, DetectedObject
from app.schemas import MPCCandidateOverview, MPCEncounterOverview, MPCIdentification

router = APIRouter(prefix='/mpc',tags=['mpc'])

@router.get("/encounters", response_model=list[MPCEncounterOverview])
def list_encounters(
    designation: str | None = Query(default=None),
    observation_id: int | None = Query(default=None),
    analysis_id: int | None = Query(default=None),
    object_key: str | None = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    stmt = select(MPCEncounter)

    if designation is not None:
        stmt = stmt.where(MPCEncounter.designation == designation)
    if analysis_id is not None or object_key is not None or observation_id is not None:
        stmt=stmt.join(Observation)
        if observation_id is not None:
            stmt = stmt.where(Observation.id==observation_id)
        if analysis_id is not None or object_key is not None:
            stmt = stmt.join(AnalysisRun, AnalysisRun.observation_id==Observation.id)
            if analysis_id is not None:
                stmt = stmt.where(AnalysisRun.id == analysis_id)
            if object_key is not None:
                stmt = stmt.join(DetectedObject, DetectedObject.analysis_run_id==AnalysisRun.id).where(DetectedObject.natural_key == object_key)

    stmt = stmt.limit(limit).offset(offset)
    mpcs = db.execute(stmt).scalars().all()
    if designation is not None and not mpcs:
        raise HTTPException(status_code=404, detail="MPC not found")
    return mpcs

@router.get("/candidates", response_model=list[MPCCandidateOverview])
def list_candidates(
    designation: str | None = Query(default=None),
    observation_id: int | None = Query(default=None),
    analysis_id: int | None = Query(default=None),
    object_key: str | None = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session)
):
    stmt = select(MPCCandidate)

    if designation is not None:
        stmt = stmt.where(MPCCandidate.designation == designation)
    if analysis_id is not None or object_key is not None or observation_id is not None:
        stmt=stmt.join(Observation)
        if observation_id is not None:
            stmt = stmt.where(Observation.id==observation_id)
        if analysis_id is not None or object_key is not None:
            stmt = stmt.join(AnalysisRun, AnalysisRun.observation_id==Observation.id)
            if analysis_id is not None:
                stmt = stmt.where(AnalysisRun.id == analysis_id)
            if object_key is not None:
                stmt = stmt.join(DetectedObject, DetectedObject.analysis_run_id==AnalysisRun.id).where(DetectedObject.natural_key == object_key)

    stmt = stmt.limit(limit).offset(offset)
    mpcs = db.execute(stmt).scalars().all()
    if designation is not None and not mpcs:
        raise HTTPException(status_code=404, detail="MPC not found")
    return mpcs

@router.get("/info", response_model=MPCIdentification)
def get_mpc_id(
    designation: str = Query(...),
    db: Session = Depends(get_session),
):
    # served from the DB, not a live MPC lookup -- see mpc_ingest.py
    candidate = db.execute(select(MPCCandidate).where(MPCCandidate.designation == designation)).scalar_one_or_none()
    if candidate is None or candidate.status is None:
        raise HTTPException(status_code=404, detail="MPC designation not found")
    return candidate.status