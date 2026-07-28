# send thumbnails and images
from os.path import exists
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import FileResponse

from sqlalchemy.orm import Session
from sqlalchemy import select

from db.database import get_session
from db.models import AnalysisRun, BlobRef, DetectedObject

from app.schemas import BlobRefOverview

router = APIRouter(prefix='/blobs',tags=['blobs'])


@router.get("", response_model=list[BlobRefOverview])
def list_blobs(
    natural_key: str | None = Query(default=None),
    analysis_key: str | None = Query(default=None),
    object_key: str | None = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session),
):
    stmt = select(BlobRef)
    if natural_key is not None:
        stmt = stmt.where(BlobRef.natural_key == natural_key)
    if analysis_key is not None:
        stmt = stmt.join(AnalysisRun).where(AnalysisRun.natural_key == analysis_key)
    if object_key is not None:
        stmt = stmt.join(DetectedObject).where(DetectedObject.natural_key == object_key)

    stmt = stmt.limit(limit).offset(offset)
    return db.execute(stmt).scalars().all()

@router.get("/thumbnail")
def thumbnails(natural_key: str = Query(), db: Session = Depends(get_session)):
    stmt = select(BlobRef).where(BlobRef.natural_key == natural_key)

    blob = db.execute(stmt).scalars().one_or_none()
    if blob is None:
        raise HTTPException(status_code=404, detail="Blob not found") 
    thumb_path = blob.thumbnail_png_path  
    if not exists(thumb_path):
        raise HTTPException(status_code=500, detail=f"Internal: File {thumb_path} (Blob {blob.natural_key}) should exist but was not found!")
    return FileResponse(thumb_path)
    


# @router.get("", response_model=list[RunOverview])
# def list_runs(
#     status: str | None = Query(default=None),
#     results_db_id: int | None = Query(default=None),
#     limit: int = Query(default=100, le=1000),
#     offset: int = Query(default=0, ge=0),
#     db: Session = Depends(get_session)
# ):
#     stmt = select(AnalysisRun).order_by(AnalysisRun.analysis_time.desc())

#     if status is not None:
#         stmt = stmt.where(AnalysisRun.status == status)
#     if results_db_id is not None:
#         stmt = stmt.where(AnalysisRun.results_db_id == results_db_id)

#     stmt = stmt.limit(limit).offset(offset)
#     runs = db.execute(stmt).scalars().all()
#     return runs