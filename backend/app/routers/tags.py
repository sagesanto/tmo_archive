# endpoints for listing observation tags
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from db.database import get_session
from db.models import Tag
from app.schemas import TagReturn

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagReturn])
def list_tags(db: Session = Depends(get_session)):
    stmt = select(Tag).order_by(Tag.name)
    return db.execute(stmt).scalars().all()
