from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# import Base explicitly -- db.models.MPCStatus is a table while mpc.MPCStatus is an enum
from db.database import DATABASE_URL
from db.models import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# resolved by db.database so host and container deployments share one path
config.set_main_option("sqlalchemy.url", DATABASE_URL)

target_metadata = Base.metadata

# both verified to produce no false positives against the current schema
COMPARE_OPTS = dict(compare_type=True, compare_server_default=True)


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        **COMPARE_OPTS,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, **COMPARE_OPTS)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
