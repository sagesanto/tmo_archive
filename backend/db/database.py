import os
from os.path import join, dirname
from typing import Optional, Iterator
from contextlib import contextmanager
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .models import Base


load_dotenv(join(dirname(dirname(__file__)),'.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
print(DATABASE_URL)
engine = None
session_maker: Optional[sessionmaker] = None
initialized = False

def get_engine():
    global engine, session_maker, initialized
    if engine is None:
        engine = create_engine(DATABASE_URL)
        session_maker = sessionmaker(bind=engine)
    if not initialized:
        Base.metadata.create_all(engine)
        initialized = True
    return engine

def init_db():
    get_engine()

def reset_db():
    eng = get_engine()
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)

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