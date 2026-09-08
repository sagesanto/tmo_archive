# endpoints for listing flags and attaching them to objects
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel

from db.database import get_session
from db.models import Flag, ObjectFlag, EntityFlag, DetectedObject, Observation, AnalysisRun, MPCCandidate
from app.schemas import FlagReturn
from core.flag_inherit import MANAGED_SCOPES, flag_payload
from core.flag_ops import USER_ACTOR, add_entity_flag, add_object_flag, attached_flag, remove_entity_flag, remove_object_flag

router = APIRouter(prefix="/flags", tags=["flags"])

# what a target_key refers to, per entity scope. used to reject flags on things that don't exist
ENTITY_TARGETS = {
    "observation": (Observation, Observation.natural_key),
    "run": (AnalysisRun, AnalysisRun.natural_key),
    "mpc": (MPCCandidate, MPCCandidate.designation),
}


@router.get("", response_model=list[FlagReturn])
def list_flags(
    category: str | None = Query(default=None),
    scope: str | None = Query(default=None),
    db: Session = Depends(get_session),
):
    stmt = select(Flag).order_by(Flag.category, Flag.name)
    if category is not None:
        stmt = stmt.where(Flag.category == category)
    if scope is not None:
        stmt = stmt.where(Flag.scope == scope)
    return db.execute(stmt).scalars().all()


class AttachFlagBody(BaseModel):
    object_key: str
    flag_id: int
    note: str | None = None


@router.post("/attach", response_model=FlagReturn)
def attach_flag(body: AttachFlagBody, db: Session = Depends(get_session)):
    flag = db.get(Flag, body.flag_id)
    if flag is None:
        raise HTTPException(status_code=404, detail="Flag not found")
    if flag.scope != "object":
        raise HTTPException(status_code=400, detail=f"Flag '{flag.name}' is set on a {flag.scope}, not on individual objects")

    obj = db.execute(
        select(DetectedObject).where(DetectedObject.natural_key == body.object_key)
    ).scalar_one_or_none()
    if obj is None:
        raise HTTPException(status_code=404, detail="Object not found")

    add_object_flag(db, body.object_key, flag, USER_ACTOR, body.note)
    return flag_payload(flag, attached_flag(db, "object", body.object_key, flag.id))


class EntityFlagBody(BaseModel):
    target_type: str
    target_key: str
    flag_id: int
    note: str | None = None


def check_entity_target(target_type: str, target_key: str, db: Session):
    if target_type not in ENTITY_TARGETS:
        raise HTTPException(status_code=400, detail=f"Unknown target type: {target_type}")
    if target_type in MANAGED_SCOPES:
        raise HTTPException(status_code=400, detail=f"{target_type} flags are set automatically and cannot be changed by hand")
    model, key_col = ENTITY_TARGETS[target_type]
    if db.execute(select(model.id).where(key_col == target_key)).scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"No {target_type} with key {target_key}")


@router.get("/entity", response_model=list[FlagReturn])
def list_entity_flags(target_type: str, target_key: str, db: Session = Depends(get_session)):
    rows = db.execute(
        select(EntityFlag.attached, Flag)
        .join(Flag, Flag.id == EntityFlag.flag_id)
        .where(EntityFlag.target_type == target_type, EntityFlag.target_key == target_key)
    ).all()
    return [flag_payload(flag, attached) for attached, flag in rows]


@router.post("/entity", response_model=FlagReturn)
def attach_entity_flag(body: EntityFlagBody, db: Session = Depends(get_session)):
    flag = db.get(Flag, body.flag_id)
    if flag is None:
        raise HTTPException(status_code=404, detail="Flag not found")
    if flag.scope != body.target_type:
        raise HTTPException(status_code=400, detail=f"Flag '{flag.name}' is scoped to {flag.scope}, not {body.target_type}")
    check_entity_target(body.target_type, body.target_key, db)

    add_entity_flag(db, body.target_type, body.target_key, flag, USER_ACTOR, body.note)
    return flag_payload(flag, attached_flag(db, body.target_type, body.target_key, flag.id))


@router.delete("/entity")
def detach_entity_flag(target_type: str, target_key: str, flag_id: int, note: str | None = None,
                       db: Session = Depends(get_session)):
    if target_type in MANAGED_SCOPES:
        raise HTTPException(status_code=400, detail=f"{target_type} flags are set automatically and cannot be changed by hand")
    flag = db.get(Flag, flag_id)
    if flag is None:
        raise HTTPException(status_code=404, detail="Flag not found")
    if not remove_entity_flag(db, target_type, target_key, flag, USER_ACTOR, note):
        raise HTTPException(status_code=404, detail="Flag not attached")
    return {"detail": "removed"}


@router.delete("/attach")
def remove_flag(object_key: str, flag_id: int, note: str | None = None, db: Session = Depends(get_session)):
    flag = db.get(Flag, flag_id)
    if flag is None:
        raise HTTPException(status_code=404, detail="Flag not found")
    if not remove_object_flag(db, object_key, flag, USER_ACTOR, note):
        raise HTTPException(status_code=404, detail="Flag not attached to object")
    return {"detail": "removed"}