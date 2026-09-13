import os
import time
from os.path import join, dirname
from typing import Optional, Iterator
from contextlib import contextmanager
import json
from dotenv import load_dotenv

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import insert

from .models import Base, Flag, Tag, AppConfig


REPO_ROOT = dirname(dirname(dirname(__file__)))  # repo root, not backend/
BACKEND_ROOT = dirname(dirname(__file__))
load_dotenv(join(REPO_ROOT, '.env'))
load_dotenv(join(REPO_ROOT, 'dev.env'))  # local-only; resolves to a no-op path in a container

DATABASE_URL = os.getenv("DATABASE_URL")
engine = None
session_maker: Optional[sessionmaker] = None
initialized = False

with open(join(dirname(__file__),"flags.json"),'r') as f:
    STARTER_FLAGS = json.load(f) 
    
with open(join(dirname(__file__),"obs_tags.json"),'r') as f:
    OBS_TAGS = json.load(f) 

# create set of flags if not exist. definitions in flags.json stay authoritative, so edits
# there (notably scope) reach rows that already exist
def create_starter_flags(engine):
    stmt = insert(Flag).values(STARTER_FLAGS)
    stmt = stmt.on_conflict_do_update(
        index_elements=["name"],
        set_={k: stmt.excluded[k] for k in ("description", "category", "color", "scope")},
    )
    with engine.begin() as conn:
        conn.execute(stmt)
        
def create_obs_tags(engine):
    stmt = insert(Tag).values(OBS_TAGS).on_conflict_do_nothing(index_elements=["name"])
    with engine.begin() as conn:
        conn.execute(stmt)

# one-time seed; DB is authoritative once rows exist
def seed_app_config(engine):
    with open(join(dirname(dirname(__file__)), "ingest.json")) as f:
        search_paths = json.load(f)
    defaults = {
        "ingest_search_paths": search_paths,
        "mpc_ra_deviation_tolerance": 0.25,
        "mpc_dec_deviation_tolerance": 0.25,
        "detection_mag_excess_tolerance": 0,
        "ingest_interval_minutes": 60,
    }
    stmt = insert(AppConfig).values([{"key": k, "value": v} for k, v in defaults.items()]) \
        .on_conflict_do_nothing(index_elements=["key"])
    with engine.begin() as conn:
        conn.execute(stmt)

def seed_defaults(engine):
    create_starter_flags(engine)
    create_obs_tags(engine)
    seed_app_config(engine)


class NotMigrated(RuntimeError):
    pass


def alembic_config():
    from alembic.config import Config
    return Config(join(BACKEND_ROOT, "alembic.ini"))  # script_location is %(here)s-relative, cwd doesn't matter


def run_migrations():
    from alembic import command
    command.upgrade(alembic_config(), "head")


# fail loudly at startup rather than surfacing a missing column mid-query
def require_migrated(engine):
    from alembic.script import ScriptDirectory
    head = ScriptDirectory.from_config(alembic_config()).get_current_head()
    if not inspect(engine).has_table("alembic_version"):
        raise NotMigrated(f"database has no alembic_version table. run 'alembic upgrade head' (head is {head})")
    with engine.connect() as conn:
        current = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
    if current != head:
        raise NotMigrated(f"database is at {current}, head is {head}. run 'alembic upgrade head'")


def get_engine():
    global engine, session_maker, initialized
    if engine is None:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        session_maker = sessionmaker(bind=engine)
    if not initialized:
        for attempt in range(8):
            try:
                require_migrated(engine)
                seed_defaults(engine)
                break
            except (OperationalError, ProgrammingError, NotMigrated):
                if attempt == 7:
                    raise
                time.sleep(2)
        initialized = True
    return engine

def init_db():
    get_engine()

def full_db_reset():
    global engine, session_maker, initialized
    if engine is None:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        session_maker = sessionmaker(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    run_migrations()
    seed_defaults(engine)
    initialized = True

def reset_db(full=False):
    global engine, session_maker, initialized
    if full:
        return full_db_reset()
    if engine is None:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        session_maker = sessionmaker(bind=engine)

    # empty everything except the user-created stuff. no preserved table has an fk into a
    # derived one, so cascade can't reach them
    preserve = ['annotations', 'flags', 'object_flag', 'entity_flag', 'audit_events', 'tags', 'observation_tag', "app_config"]
    to_clear = [t.name for t in Base.metadata.sorted_tables if t.name not in preserve]
    quoted = ", ".join(f'"{t}"' for t in to_clear)

    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {quoted} RESTART IDENTITY CASCADE"))

    seed_defaults(engine)
    initialized = True

# for ingest use
@contextmanager
def get_record_db():
    get_engine()
    session: Session = session_maker()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# for fastapi injection
def get_session() -> Iterator[Session]:
    get_engine()
    session = session_maker()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()