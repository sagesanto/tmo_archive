# objects inherit flags attached to their ancestors (observation, analysis run, mpc candidate).
# inheritance is derived on read instead of copied onto each object, so a re-analysis of the same
# dataset picks the flag up for free and detaching from the parent can't leave stale rows behind.
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import Session, aliased

from db.models import DetectedObject, AnalysisRun, Observation, MPCEncounter, Flag, ObjectFlag, EntityFlag

OBJECT_SCOPE = "object"
ENTITY_SCOPES = ("observation", "run", "mpc")
# scopes whose flags are decided by classification.py, not by a person. mpc status is intrinsic
# to the mpc object, so there is nothing to override
MANAGED_SCOPES = ("mpc",)


def entity_match(run, obs, mpc, entity):
    # an entity flag applies to an object if it sits on any of its ancestors
    return or_(
        and_(entity.target_type == "run", entity.target_key == run.natural_key),
        and_(entity.target_type == "observation", entity.target_key == obs.natural_key),
        and_(entity.target_type == "mpc", entity.target_key == mpc.designation),
    )


def direct_flag_exists(flag_ids: list[int] | None = None):
    stmt = select(1).where(ObjectFlag.object_key == DetectedObject.natural_key)
    if flag_ids:
        stmt = stmt.where(ObjectFlag.flag_id.in_(flag_ids))
    return stmt.exists()


def inherited_flag_exists(flag_ids: list[int] | None = None):
    # everything is aliased so this still correlates to the outer DetectedObject when the outer
    # query has joined AnalysisRun/Observation/MPCEncounter for its own filtering
    run, obs, mpc, entity = aliased(AnalysisRun), aliased(Observation), aliased(MPCEncounter), aliased(EntityFlag)
    stmt = (
        select(1)
        .select_from(run)
        .join(obs, obs.id == run.observation_id)
        .outerjoin(mpc, mpc.observation_id == obs.id)
        .join(entity, entity_match(run, obs, mpc, entity))
        .where(run.id == DetectedObject.analysis_run_id)  # correlates to the outer object
    )
    if flag_ids:
        stmt = stmt.where(entity.flag_id.in_(flag_ids))
    return stmt.exists()


def any_flag_exists(flag_ids: list[int] | None = None):
    return or_(direct_flag_exists(flag_ids), inherited_flag_exists(flag_ids))


def ancestor_keys(db: Session, object_key: str) -> list[tuple[str, str]]:
    # (target_type, target_key) for each of an object's ancestors. derive() in core/keys.py gets the
    # run and db keys out of an object key, but the observation isn't in the key chain, so query
    row = db.execute(
        select(AnalysisRun.natural_key, Observation.natural_key, MPCEncounter.designation)
        .select_from(DetectedObject)
        .join(AnalysisRun, AnalysisRun.id == DetectedObject.analysis_run_id)
        .join(Observation, Observation.id == AnalysisRun.observation_id)
        .outerjoin(MPCEncounter, MPCEncounter.observation_id == Observation.id)
        .where(DetectedObject.natural_key == object_key)
    ).first()
    if row is None:
        return []
    run_key, obs_key, designation = row
    ancestors = [("run", run_key), ("observation", obs_key)]
    if designation is not None:
        ancestors.append(("mpc", designation))
    return ancestors


def flag_payload(flag: Flag, attached) -> dict:
    # a plain dict per attachment. the same Flag row is shared by many objects, so the
    # attach time can't be stashed on the orm instance
    return dict(id=flag.id, name=flag.name, description=flag.description,
                color=flag.color, category=flag.category, scope=flag.scope, attached=attached)


def attach_flags(db: Session, objects: list[DetectedObject]) -> None:
    # sets .flags on each object: its own flags plus everything inherited from its ancestors
    keys = [o.natural_key for o in objects]
    if not keys:
        return
    by_key: dict[str, list[dict]] = {k: [] for k in keys}

    direct = db.execute(
        select(ObjectFlag.object_key, ObjectFlag.attached, Flag)
        .join(Flag, Flag.id == ObjectFlag.flag_id)
        .where(ObjectFlag.object_key.in_(keys))
    ).all()
    for object_key, attached, flag in direct:
        by_key[object_key].append(flag_payload(flag, attached))

    run, obs, mpc, entity = aliased(AnalysisRun), aliased(Observation), aliased(MPCEncounter), aliased(EntityFlag)
    inherited = db.execute(
        select(DetectedObject.natural_key, entity.attached, Flag)
        .join(run, run.id == DetectedObject.analysis_run_id)
        .join(obs, obs.id == run.observation_id)
        .outerjoin(mpc, mpc.observation_id == obs.id)
        .join(entity, entity_match(run, obs, mpc, entity))
        .join(Flag, Flag.id == entity.flag_id)
        .where(DetectedObject.natural_key.in_(keys))
    ).all()
    for object_key, attached, flag in inherited:
        by_key[object_key].append(flag_payload(flag, attached))

    for o in objects:
        o.flags = by_key[o.natural_key]
