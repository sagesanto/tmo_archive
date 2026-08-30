import logging
import threading
from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import select

from core.config import get_config
from core.log import configure_logger
from db.database import init_db, get_record_db
from db.models import IngestJob
from run_ingest import run_full_ingest

SCHEDULED_JOB_ID = "scheduled_ingest"

logger = configure_logger("ingest_service")
logging.getLogger("apscheduler").setLevel(logging.WARNING)  # silence per-job "running/executed" spam
_ingest_lock = threading.Lock()


def run_scheduled_ingest():
    if not _ingest_lock.acquire(blocking=False):
        logger.info("Ingest already in progress, skipping this scheduled tick")
        return
    try:
        with get_record_db() as db:
            job = IngestJob(status="running", trigger="scheduled", started_at=datetime.now())
            db.add(job)
            db.flush()
            job_id = job.id
        _run_job(job_id)
    finally:
        _ingest_lock.release()


def poll_pending_jobs(scheduler: BlockingScheduler):
    with get_record_db() as db:
        interval = get_config(db, "ingest_interval_minutes", 60)
        scheduled_job = scheduler.get_job(SCHEDULED_JOB_ID)
        if scheduled_job is not None and scheduled_job.trigger.interval.total_seconds() != interval * 60:
            scheduler.reschedule_job(SCHEDULED_JOB_ID, trigger="interval", minutes=interval)

        job = db.execute(
            select(IngestJob).where(IngestJob.status == "pending").order_by(IngestJob.requested_at).limit(1)
        ).scalar_one_or_none()
        if job is None:
            return
        job_id = job.id

    if not _ingest_lock.acquire(blocking=False):
        logger.info("Ingest already in progress, leaving triggered job pending for next poll")
        return
    try:
        with get_record_db() as db:
            job = db.get(IngestJob, job_id)
            job.status = "running"
            job.started_at = datetime.now()
        _run_job(job_id)
    finally:
        _ingest_lock.release()


def _run_job(job_id: int):
    try:
        with get_record_db() as db:
            search_paths = get_config(db, "ingest_search_paths", {})
        summary = run_full_ingest(search_paths, logger)
        with get_record_db() as db:
            job = db.get(IngestJob, job_id)
            job.status = "success"
            job.finished_at = datetime.now()
            job.summary = summary
    except Exception as e:
        logger.error(f"Ingest run failed: {e}")
        with get_record_db() as db:
            job = db.get(IngestJob, job_id)
            job.status = "error"
            job.finished_at = datetime.now()
            job.error = str(e)


def main():
    init_db()
    with get_record_db() as db:
        interval = get_config(db, "ingest_interval_minutes", 60)

    scheduler = BlockingScheduler()
    scheduler.add_job(run_scheduled_ingest, "interval", minutes=interval,
                       id=SCHEDULED_JOB_ID, next_run_time=datetime.now())
    scheduler.add_job(poll_pending_jobs, "interval", seconds=10, args=[scheduler])
    logger.info(f"Ingest service starting, scheduled every {interval} minutes")
    scheduler.start()


if __name__ == "__main__":
    main()
