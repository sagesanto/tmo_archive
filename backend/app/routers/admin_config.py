# endpoints for viewing and editing app_config, the admin-editable settings table
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from db.database import get_session
from db.models import AppConfig
from core.config import set_config
from app.schemas import AppConfigOut, AppConfigUpdate

router = APIRouter(prefix="/admin/config", tags=["admin"])


@router.get("", response_model=list[AppConfigOut])
def list_config(db: Session = Depends(get_session)):
    return db.execute(select(AppConfig).order_by(AppConfig.key)).scalars().all()


@router.put("", response_model=AppConfigOut)
def update_config(body: AppConfigUpdate, db: Session = Depends(get_session)):
    set_config(db, body.key, body.value)
    return db.get(AppConfig, body.key)
