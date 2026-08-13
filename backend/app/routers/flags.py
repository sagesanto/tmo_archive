# endpoints for listing flags and attaching them to objects
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel

from db.database import get_session
from db.models import Flag, ObjectFlag, DetectedObject
from app.schemas import FlagReturn

router = APIRouter(prefix="/flags", tags=["flags"])


@router.get("", response_model=list[FlagReturn])
def list_flags(
    category: str | None = Query(default=None),
    db: Session = Depends(get_session),
):
    stmt = select(Flag).order_by(Flag.category, Flag.name)
    if category is not None:
        stmt = stmt.where(Flag.category == category)
    return db.execute(stmt).scalars().all()


class AttachFlagBody(BaseModel):
    object_key: str
    flag_id: int


@router.post("/attach", response_model=FlagReturn)
def attach_flag(body: AttachFlagBody, db: Session = Depends(get_session)):
    flag = db.get(Flag, body.flag_id)
    if flag is None:
        raise HTTPException(status_code=404, detail="Flag not found")

    obj = db.execute(
        select(DetectedObject).where(DetectedObject.natural_key == body.object_key)
    ).scalar_one_or_none()
    if obj is None:
        raise HTTPException(status_code=404, detail="Object not found")

    existing = db.execute(
        select(ObjectFlag).where(
            ObjectFlag.object_key == body.object_key,
            ObjectFlag.flag_id == body.flag_id,
        )
    ).scalar_one_or_none()
    if existing is not None:
        flag.attached = existing.attached
        return flag

    object_flag = ObjectFlag(object_key=body.object_key, flag_id=body.flag_id)
    db.add(object_flag)
    db.flush()

    flag.attached = object_flag.attached
    return flag


@router.delete("/attach")
def remove_flag(object_key: str, flag_id: int, db: Session = Depends(get_session)):
    object_flag = db.execute(
        select(ObjectFlag).where(
            ObjectFlag.object_key == object_key,
            ObjectFlag.flag_id == flag_id,
        )
    ).scalar_one_or_none()
    if object_flag is None:
        raise HTTPException(status_code=404, detail="Flag not attached to object")

    db.delete(object_flag)
    return {"detail": "removed"}