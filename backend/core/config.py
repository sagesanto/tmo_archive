from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from db.models import AppConfig


def get_config(db: Session, key: str, default=None):
    row = db.get(AppConfig, key)
    return row.value if row is not None else default


def set_config(db: Session, key: str, value):
    stmt = insert(AppConfig).values(key=key, value=value).on_conflict_do_update(
        index_elements=["key"], set_={"value": value, "updated_at": func.now()}
    )
    db.execute(stmt)
    db.flush()
