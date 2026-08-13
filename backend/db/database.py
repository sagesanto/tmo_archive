import os
from os.path import join, dirname
from typing import Optional, Iterator
from contextlib import contextmanager
import json
from dotenv import load_dotenv

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import insert

from .models import Base, Flag


load_dotenv(join(dirname(dirname(__file__)),'.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
print(DATABASE_URL)
engine = None
session_maker: Optional[sessionmaker] = None
initialized = False

with open(join(dirname(__file__),"flags.json"),'r') as f:
    STARTER_FLAGS = json.load(f) 

# create set of flags if not exist
def create_starter_flags(engine):
    stmt = insert(Flag).values(STARTER_FLAGS).on_conflict_do_nothing(index_elements=["name"])
    with engine.begin() as conn:
        conn.execute(stmt)
    
def initialize(engine):
    Base.metadata.create_all(engine)
    create_starter_flags(engine)
    

def get_engine():
    global engine, session_maker, initialized
    if engine is None:
        engine = create_engine(DATABASE_URL)
        session_maker = sessionmaker(bind=engine)
    if not initialized:
        initialize(engine)
        initialized = True
    return engine

def init_db():
    get_engine()

def full_db_reset():
    global engine, session_maker, initialized
    if engine is None:
        engine = create_engine(DATABASE_URL)
        session_maker = sessionmaker(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    initialize(engine)
    initialized = True

def reset_db():
    global engine, session_maker, initialized
    if engine is None:
        engine = create_engine(DATABASE_URL)
        session_maker = sessionmaker(bind=engine)
        
    # drop everything except the user-created stuff
    preserve = ['annotations', 'flags', 'object_flag']
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