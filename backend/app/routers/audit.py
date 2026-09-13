# history of what happened to an entity
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from db.database import get_session
from db.models import AuditEvent
from app.schemas import AuditEventOut
from core.flag_inherit import ancestor_keys
from core.flag_ops import USER_ACTOR

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[AuditEventOut])
def list_events(
    target_type: str = Query(),
    target_key: str = Query(),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_session),
):
    targets = [(target_type, target_key)]
    if target_type == "object":
        # an object whose only flags are inherited would otherwise have an empty history. each row
        # carries its own target, so the caller can tell where the event happened
        targets += ancestor_keys(db, target_key)

    stmt = (
        select(AuditEvent)
        .where(or_(*[and_(AuditEvent.target_type == t, AuditEvent.target_key == k) for t, k in targets]))
        .order_by(AuditEvent.created_at.desc(), AuditEvent.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return db.execute(stmt).scalars().all()


class NoteUpdate(BaseModel):
    note: str | None = None


@router.patch("/{event_id}", response_model=AuditEventOut)
def update_note(event_id: int, body: NoteUpdate, db: Session = Depends(get_session)):
    # only notes on a person's own actions are editable. what a classifier recorded is its
    # evidence for the decision, so it stays as written
    event = db.get(AuditEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.actor != USER_ACTOR:
        raise HTTPException(status_code=400, detail=f"This event was recorded by {event.actor} and its note cannot be edited")

    event.note = (body.note or "").strip() or None
    db.flush()
    return event
