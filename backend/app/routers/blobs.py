# send thumbnails and images
import time
from os.path import exists
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import FileResponse, Response

from sqlalchemy.orm import Session
from sqlalchemy import select

from db.database import get_session
from db.models import AnalysisRun, BlobRef, DetectedObject

from app.schemas import BlobRefOverview, BlobRefDetail
from core.sqlite_db import SQLiteDB
from core.blob_utils import blob_to_arr, locate_row_from_blob_record
from core.paths import to_container_path

router = APIRouter(prefix='/blobs',tags=['blobs'])


@router.get("", response_model=list[BlobRefOverview])
def list_blobs(
    natural_key: str | None = Query(default=None),
    analysis_key: str | None = Query(default=None),
    object_key: str | None = Query(default=None),
    source_table: str | None = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session),
):
    t0 = time.perf_counter()
    stmt = select(BlobRef)
    if natural_key is not None:
        stmt = stmt.where(BlobRef.natural_key == natural_key)
    if analysis_key is not None:
        stmt = stmt.join(AnalysisRun).where(AnalysisRun.natural_key == analysis_key)
    if object_key is not None:
        stmt = stmt.join(DetectedObject).where(DetectedObject.natural_key == object_key)
    if source_table is not None:
        stmt = stmt.where(BlobRef.source_table == source_table)

    stmt = stmt.limit(limit).offset(offset)
    result = db.execute(stmt).scalars().all()
    print(f"[list_blobs] query: {time.perf_counter() - t0:.3f}s ({len(result)} records)")
    return result

@router.get("/detail", response_model=BlobRefDetail)
def blob_detail(natural_key: str = Query(), db: Session = Depends(get_session)):
    blob = db.execute(select(BlobRef).where(BlobRef.natural_key == natural_key)).scalars().one_or_none()
    if blob is None:
        raise HTTPException(status_code=404, detail="Blob not found")
    return blob


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


@router.get("/data")
def blob_data(natural_key: str = Query(), db: Session = Depends(get_session)):
    t0 = time.perf_counter()
    blob = db.execute(select(BlobRef).where(BlobRef.natural_key == natural_key)).scalars().one_or_none()
    if blob is None:
        raise HTTPException(status_code=404, detail="Blob not found")
    t1 = time.perf_counter()
    print(f"[blob_data] lookup blob record: {t1 - t0:.3f}s")

    results_path = to_container_path(blob.analysis_run.results_db.filename)  # host -> container path
    with SQLiteDB(results_path) as res_db:
        t2 = time.perf_counter()
        print(f"[blob_data] open sqlite db: {t2 - t1:.3f}s")
        row = locate_row_from_blob_record(blob, res_db)
        t3 = time.perf_counter()
        print(f"[blob_data] query row ({blob.width}x{blob.height}): {t3 - t2:.3f}s")
        if row is None or row.get("Data") is None:
            raise HTTPException(status_code=500, detail=f"Could not locate source data for blob {natural_key}")
        arr = blob_to_arr(row["Data"], blob.width, blob.height, blob.dtype)
        t4 = time.perf_counter()
        print(f"[blob_data] convert to array: {t4 - t3:.3f}s")

    buf = arr.astype("float32").tobytes()
    t5 = time.perf_counter()
    print(f"[blob_data] serialize to bytes: {t5 - t4:.3f}s | total: {t5 - t0:.3f}s")
    return Response(content=buf, media_type="application/octet-stream")


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