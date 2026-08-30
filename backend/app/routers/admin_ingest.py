# endpoints for triggering an ingest run and viewing recent ingest job history
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from db.database import get_session
from db.models import IngestJob
from app.schemas import IngestJobOut

router = APIRouter(prefix="/admin/ingest", tags=["admin"])


@router.post("/trigger", response_model=IngestJobOut)
def trigger_ingest(db: Session = Depends(get_session)):
    existing = db.execute(
        select(IngestJob).where(IngestJob.status.in_(["pending", "running"]))
    ).scalars().first()
    if existing is not None:
        return existing  # idempotent -- don't queue duplicate runs on double-click

    job = IngestJob(status="pending", trigger="manual")
    db.add(job)
    db.flush()
    return job


@router.get("/jobs", response_model=list[IngestJobOut])
def list_jobs(limit: int = Query(default=20, le=200), db: Session = Depends(get_session)):
    stmt = select(IngestJob).order_by(IngestJob.requested_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()
