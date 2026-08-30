import os
import time
from os.path import join, dirname
from typing import Optional, Iterator
from contextlib import contextmanager
import json
from dotenv import load_dotenv

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import insert

from .models import Base, Flag, Tag, AppConfig


REPO_ROOT = dirname(dirname(dirname(__file__)))  # repo root, not backend/
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

# create set of flags if not exist
def create_starter_flags(engine):
    stmt = insert(Flag).values(STARTER_FLAGS).on_conflict_do_nothing(index_elements=["name"])
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

def initialize(engine):
    Base.metadata.create_all(engine)
    create_starter_flags(engine)
    create_obs_tags(engine)
    seed_app_config(engine)


def get_engine():
    global engine, session_maker, initialized
    if engine is None:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        session_maker = sessionmaker(bind=engine)
    if not initialized:
        for attempt in range(8):
            try:
                initialize(engine)
                break
            except (OperationalError, ProgrammingError):
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
    initialize(engine)
    initialized = True

def reset_db(full=False):
    global engine, session_maker, initialized
    if engine is None:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        session_maker = sessionmaker(bind=engine)
        
    # drop everything except the user-created stuff
    preserve = ['annotations', 'flags', 'object_flag', 'tags', 'observation_tag', "app_config"]
    if full:
        preserve = []
    children_first_tables = reversed(Base.metadata.sorted_tables)  # tables sorted to drop children first, avoid conflicts 
    to_drop = [t.name for t in children_first_tables if t.name not in preserve]
     
    with engine.begin() as conn:
        for table in to_drop:
            conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
    
    initialize(engine)  # rebuild
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