# the only way flags get attached or detached, so every change lands in the audit log.
# each helper reports whether it actually changed anything and logs only then - the classification
# steps re-run the same statements every pass, and logging those would bury the real events.
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from db.models import AuditEvent, EntityFlag, Flag, ObjectFlag

USER_ACTOR = "user"


def record_event(db: Session, target_type: str, target_key: str, action: str, actor: str,
                 flag_name: Optional[str] = None, note: Optional[str] = None) -> AuditEvent:
    event = AuditEvent(target_type=target_type, target_key=target_key, action=action,
                       actor=actor, flag_name=flag_name, note=note)
    db.add(event)
    db.flush()
    return event


def add_object_flag(db: Session, object_key: str, flag: Flag, actor: str, note: Optional[str] = None) -> bool:
    # returns whether the flag was newly attached. on_conflict returns nothing when it already was
    stmt = (
        insert(ObjectFlag)
        .values(object_key=object_key, flag_id=flag.id)
        .on_conflict_do_nothing(index_elements=["object_key", "flag_id"])
        .returning(ObjectFlag.id)
    )
    if db.execute(stmt).scalar_one_or_none() is None:
        return False
    record_event(db, "object", object_key, "flag_added", actor, flag.name, note)
    return True


def remove_object_flag(db: Session, object_key: str, flag: Flag, actor: str, note: Optional[str] = None) -> bool:
    stmt = (
        delete(ObjectFlag)
        .where(ObjectFlag.object_key == object_key, ObjectFlag.flag_id == flag.id)
        .returning(ObjectFlag.id)
    )
    if db.execute(stmt).scalar_one_or_none() is None:
        return False
    record_event(db, "object", object_key, "flag_removed", actor, flag.name, note)
    return True


def add_entity_flag(db: Session, target_type: str, target_key: str, flag: Flag, actor: str,
                    note: Optional[str] = None) -> bool:
    stmt = (
        insert(EntityFlag)
        .values(target_type=target_type, target_key=target_key, flag_id=flag.id)
        .on_conflict_do_nothing(index_elements=["target_type", "target_key", "flag_id"])
        .returning(EntityFlag.id)
    )
    if db.execute(stmt).scalar_one_or_none() is None:
        return False
    record_event(db, target_type, target_key, "flag_added", actor, flag.name, note)
    return True


def remove_entity_flag(db: Session, target_type: str, target_key: str, flag: Flag, actor: str,
                       note: Optional[str] = None) -> bool:
    stmt = (
        delete(EntityFlag)
        .where(EntityFlag.target_type == target_type, EntityFlag.target_key == target_key,
               EntityFlag.flag_id == flag.id)
        .returning(EntityFlag.id)
    )
    if db.execute(stmt).scalar_one_or_none() is None:
        return False
    record_event(db, target_type, target_key, "flag_removed", actor, flag.name, note)
    return True


def purge_object_flag(db: Session, flag: Flag, actor: str, note: Optional[str] = None) -> int:
    # drops every object-level attachment of a flag, logging one event per row that was really
    # there. used once when a flag becomes inherited and its old per-object rows go unreachable
    keys = db.execute(
        delete(ObjectFlag).where(ObjectFlag.flag_id == flag.id).returning(ObjectFlag.object_key)
    ).scalars().all()
    for object_key in keys:
        record_event(db, "object", object_key, "flag_removed", actor, flag.name, note)
    return len(keys)


def attached_flag(db: Session, target_type: str, target_key: str, flag_id: int):
    # the attach time for a flag already on a target, or None
    if target_type == "object":
        stmt = select(ObjectFlag.attached).where(ObjectFlag.object_key == target_key, ObjectFlag.flag_id == flag_id)
    else:
        stmt = select(EntityFlag.attached).where(
            EntityFlag.target_type == target_type, EntityFlag.target_key == target_key,
            EntityFlag.flag_id == flag_id,
        )
    return db.execute(stmt).scalar_one_or_none()
