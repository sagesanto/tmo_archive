"""compare the live schema to models.py. should report nothing after a successful upgrade"""
import sys

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext

from .database import DATABASE_URL
from .models import Base


def main():
    from sqlalchemy import create_engine
    with create_engine(DATABASE_URL).connect() as conn:
        ctx = MigrationContext.configure(conn, opts={"compare_type": True, "compare_server_default": True})
        diffs = compare_metadata(ctx, Base.metadata)

    for d in diffs:
        print(d)
    print(f"{len(diffs)} difference(s) between models.py and the database")
    sys.exit(1 if diffs else 0)


if __name__ == "__main__":
    main()
