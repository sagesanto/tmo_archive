from db.models import BlobRef, AnalysisRun, ResultsDB, Observation, DetectedObject
from db.database import get_record_db, reset_db
from core.utils import to_naive_utc, write_out as _write_out
from core.sqlite_db import SQLiteDB
from core.syntrack_enums import Status, ObjectType, Classification
from core.keys import results_db_key, obs_key, run_key, object_key, blob_key
from core.blob_utils import SOURCE_TABLE_KEYS, blob_to_arr
from core.paths import to_host_path

import os
from os.path import dirname, exists, getmtime, getsize, join, abspath
from datetime import datetime, timezone as dt_tz
from pytz import timezone
from typing import Optional, Any
import logging
import uuid
from pathlib import Path

import numpy as np
from sqlalchemy.orm import Session

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from astropy.visualization import ZScaleInterval


OBJ_TYPES_TO_INGEST = (ObjectType.MovingFinal.value,)
OBJ_CLASSIFICATION_TO_INGEST = (Classification.FastMoving.value, Classification.SlowMoving.value)

THUMBNAIL_DIR = os.environ.get("THUMBNAIL_DIR", abspath(join(dirname(__file__), 'thumbnails')))
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

global local_logger
local_logger: Optional[logging.Logger] = None


def write_out(*msg, level=logging.INFO):
    _write_out(*msg, level=level, logger=local_logger)


def make_thumbnail(arr: np.ndarray, outpath: str, p1, p99, vmin, vmax, zscale: bool = False,
                   longest_side_px: int = 512, cmap: str = "gray") -> str:
    h, w = arr.shape

    if not zscale:
        vmin, vmax = p1, p99
    finite = arr[np.isfinite(arr)]
    if finite.size == 0:
        vmin, vmax = 0.0, 1.0
    if vmin == vmax:
        vmax = vmin + 1.0

    # output dimensions
    scale = min(longest_side_px / max(h, w), 1.0)
    out_w, out_h = max(1, round(w * scale)), max(1, round(h * scale))

    # print(f'Scaling img ({w},{h}) to ({out_w},{out_h})')

    dpi = 100
    fig = plt.figure(figsize=(out_w / dpi, out_h / dpi), dpi=dpi)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.axis("off")
    # ax.imshow(arr, cmap=cmap, origin="lower")
    ax.imshow(arr, cmap=cmap, vmin=vmin, vmax=vmax, origin="lower")

    fig.savefig(outpath, dpi=dpi)
    plt.close(fig)
    return outpath


def norm_np(o):
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, np.generic):
        return o.item()
    return o


def img_stats(arr):
    finite_mask = np.isfinite(arr)
    if not np.any(finite_mask):
        raise ValueError("Image is completely NaN or inf")
    has_nans = np.sum(~finite_mask) > 0

    clean_arr = arr[finite_mask]
    vmin, vmax = ZScaleInterval().get_limits(clean_arr)

    q = [0.5, 1, 2, 5, 95, 98, 99, 99.5]
    percentiles = np.percentile(clean_arr, q)

    hist_vals, hist_bin_edges = np.histogram(clean_arr, 256)
    return (vmin, vmax, bool(has_nans),
            dict(zip(q, percentiles.tolist())),
            {"vals": hist_vals.tolist(), "edges": hist_bin_edges.tolist()})


def create_source_key(row, table_name):
    return {k: norm_np(row[k]) for k in SOURCE_TABLE_KEYS[table_name]}


def process_img_data(data, w, h, dtype: str, thumbnail_dir: str, blob_record: BlobRef,
                     zscale: bool = True, cmap: str = 'gray'):
    write_out("Converting to array", level=logging.DEBUG)
    arr = blob_to_arr(data, w, h, dtype)

    write_out("Calculating stats", level=logging.DEBUG)
    (blob_record.vmin, blob_record.vmax, blob_record.nan_present,
     blob_record.percentiles, blob_record.histogram) = img_stats(arr)
    p1, p99 = blob_record.percentiles[1], blob_record.percentiles[99]

    write_out("Rendering thumbnail", level=logging.DEBUG)
    thumb_outpath = join(thumbnail_dir, str(uuid.uuid4()) + ".png")
    make_thumbnail(arr, thumb_outpath, zscale=zscale, cmap=cmap,
                   p1=p1, p99=p99, vmin=blob_record.vmin, vmax=blob_record.vmax)
    blob_record.thumbnail_png_path = thumb_outpath
    write_out("Rendered.", level=logging.DEBUG)
    return blob_record


def ingest_blob(blob, w, h, table, dtype, run_record: AnalysisRun, source_key,
                image_type, image_index, thumbnail_dir, zscale=True, cmap='gray') -> BlobRef:
    ref = BlobRef(
        natural_key=blob_key(run_record.natural_key, table, image_type, image_index),
        analysis_run_id=run_record.id,
        source_table=table,
        source_key=source_key,
        image_type=image_type,
        image_index=image_index,
        width=w,
        height=h,
        size_class='large' if max(w, h) > 512 else 'small',
        dtype=dtype,
    )
    try:
        ref = process_img_data(blob, w, h, dtype, thumbnail_dir, ref, zscale=zscale, cmap=cmap)
    except Exception as e:
        write_out(f'Error manipulating array: {e}', level=logging.ERROR)
        raise e
    return ref


def ingest_images(res_db: SQLiteDB, run_record: AnalysisRun, thumbnail_dir: str) -> list[BlobRef]:
    img_rows = res_db.query(
        'SELECT * FROM Images WHERE Data IS NOT NULL AND AnalysisID=?',
        (run_record.analysis_id,),
    )
    N = len(img_rows)
    write_out(f"Ingesting {N} images.", level=logging.INFO)
    blob_refs = []
    str_w = len(str(N))
    for i, row in enumerate(img_rows):
        write_out(f"[{i+1:{str_w}}/{N}] Ingesting image {row.get('Name')}", level=logging.INFO)
        w, h = row['Width'], row['Height']
        dtype = row['DataType']
        key = create_source_key(row, 'Images')
        blob_refs.append(
            ingest_blob(row['Data'], w, h, 'Images', dtype, run_record, key,
                        image_type=norm_np(row['ImageType']),
                        image_index=norm_np(row['ImageIndex']),
                        thumbnail_dir=thumbnail_dir)
        )
    return blob_refs


def build_object(row, run_record: AnalysisRun) -> DetectedObject:
    object_index = norm_np(row['ObjectIndex'])
    key, name = object_key(run_record.natural_key, run_record.display_name, object_index)
    return DetectedObject(
        natural_key=key,
        display_name=name,
        analysis_run_id=run_record.id,
        object_index=object_index,
        snr=row['SNR'],
        type=ObjectType(row['ObjectType']).name,
        classification=Classification(row['Classification']).name,
        num_frames=row['NumGoodFrames'],
        cluster_children=row['ClusterChildren'],
        magnitude=row.get('Magnitude'),
        v_ra=row.get('Vra'),
        v_dec=row.get('Vdec'),
        x=row.get('X'),
        y=row.get('Y'),
        vx=row.get('Vx'),
        vy=row.get('Vy'),
        ra=row.get('RA'),
        dec=row.get('DEC'),
        source_key=create_source_key(row, "Objects"),
        analysis_time=run_record.analysis_time,
        obs_time=run_record.obs_time,
    )


def ingest_objects(db: Session, res_db: SQLiteDB, run_record: AnalysisRun, thumbnail_dir: str):
    analysis_id = run_record.analysis_id
    obj_rows = res_db.query(
        ('SELECT * FROM Objects '
         'WHERE SubFrame IS NOT NULL AND AnalysisID=? '
         f'AND ObjectType IN ({", ".join("?" for _ in OBJ_TYPES_TO_INGEST)}) '
         f'AND Classification IN ({", ".join("?" for _ in OBJ_CLASSIFICATION_TO_INGEST)})'),
        (analysis_id, *OBJ_TYPES_TO_INGEST, *OBJ_CLASSIFICATION_TO_INGEST),
    )
    N = len(obj_rows)
    write_out(f"Ingesting {N} object subframes.", level=logging.INFO)

    blob_refs = []
    objects = []
    str_w = len(str(N))

    for i, row in enumerate(obj_rows):
        write_out(f"[{i+1:{str_w}}/{N}] ingesting subframe "
                  f"({row['ObjectIndex'], row['ObjectType'], row['Classification']})",
                  level=logging.INFO)

        det_obj = build_object(row, run_record)
        objects.append(det_obj)

        if row.get("SubFrame") is not None:
            w, h = row['SubFrameWidth'], row['SubFrameHeight']
            dtype = 'Single'  # all cutouts are single i think
            key = create_source_key(row, 'Objects')
            ref = ingest_blob(row['SubFrame'], w, h, 'Objects', dtype, run_record, key,
                              image_type=None,
                              image_index=norm_np(row['ObjectIndex']),
                              thumbnail_dir=thumbnail_dir, zscale=True, cmap='viridis')
            db.add(ref)
            db.flush()
            det_obj.blob_ref_id = ref.id
            blob_refs.append(ref)
    return objects, blob_refs


def get_db_file_stats(path: str) -> tuple[int, datetime]:
    filesize = getsize(path)
    last_file_update = to_naive_utc(datetime.fromtimestamp(getmtime(path), tz=dt_tz.utc))
    return filesize, last_file_update


def find_existing_results_db(db: Session, nat_key: str) -> Optional[ResultsDB]:
    return db.query(ResultsDB).filter_by(natural_key=nat_key).one_or_none()


def find_existing_obs_record(db: Session, nat_key: str) -> Optional[Observation]:
    return db.query(Observation).filter_by(natural_key=nat_key).one_or_none()


def build_run_record(row: dict[str, Any], res_db_record: ResultsDB, observation: Observation) -> AnalysisRun:
    a_ts = row['AnalysisTime_s'] + row['AnalysisTime_ns'] * 1e-9
    analysis_dt = datetime.fromtimestamp(a_ts, tz=timezone('US/Pacific')).astimezone(timezone('UTC'))

    o_ts = row['ObservationTime_s'] + row['ObservationTime_ns'] * 1e-9
    obs_dt = datetime.fromtimestamp(o_ts, tz=timezone('US/Pacific')).astimezone(timezone('UTC'))
    analysis_id = row['AnalysisID']
    key, name = run_key(res_db_record.natural_key, analysis_id, analysis_dt)
    return AnalysisRun(
        natural_key=key,
        display_name=name,
        analysis_id=analysis_id,
        status=Status(row['Status']).name,
        status_description=row.get('StatusDescription'),
        analysis_time=analysis_dt,
        obs_time=obs_dt,
        results_db_id=res_db_record.id,
        observation_id=observation.id,
        sky_mag=row.get('SkyMeanFlux_MAG'),
        detection_limit_mag=row.get('DetectionThreshold_MAG')
    )


def delete_analysis_run(db, analysis_run):
    # delete thumbnails and analysis runs
    paths = [ref.thumbnail_png_path for ref in analysis_run.blob_refs if ref.thumbnail_png_path]
    db.delete(analysis_run)
    db.flush()
    for p in paths:
        Path(p).unlink(missing_ok=True)


def get_astrom_info(res_db, analysis_id):
    rows = res_db.query("SELECT * FROM FieldTransformations WHERE AnalysisID=?", (analysis_id,))
    if not rows:
        return None, None, None
    field_transform = rows[0]
    num_matched = field_transform.get('NumStarMatches')
    ra_err = field_transform.get('FieldCenter_RA_Error')
    dec_err = field_transform.get('FieldCenter_DEC_Error')
    # TODO: figure out how to determine which objects are stars
    # num_stars = res_db.query("SELECT COUNT(ObjectIndex) as n_stars FROM Objects WHERE AnalysisID=? AND ObjectType=? AND Classification=?",(analysis_id,ObjectType.Bright.value, Classification.Static.value))[0]['n_stars']
    # print(num_stars)  
    # match_rate = num_matched / num_stars if num_matched and num_stars else None
    return num_matched, ra_err, dec_err


def gc_thumbnails(db):
    # garbage collect old thumbnail images
    referenced = {p for (p,) in db.query(BlobRef.thumbnail_png_path).all() if p}
    for f in Path(THUMBNAIL_DIR).glob("*.png"):
        if str(f) not in referenced:
            f.unlink()


def ingest_results_db(results_path: str, logger, force_ingest: bool = False):
    global local_logger
    local_logger = logger
    write_out(f'Ingesting {results_path}')
    if not exists(results_path):
        return None

    filesize, last_file_update = get_db_file_stats(results_path)
    host_path = to_host_path(results_path)  # store as host path, see core/paths.py
    db_nat_key, db_name = results_db_key(host_path)

    with get_record_db() as db:
        db_record = find_existing_results_db(db, db_nat_key)

        if db_record is not None and not force_ingest:
            if db_record.filesize == filesize and db_record.last_file_update == last_file_update:
                write_out("Found an existing record and it has not changed. Moving on.")
                return db_record.id

        if db_record is None:
            db_record = ResultsDB(natural_key=db_nat_key, display_name=db_name, filename=host_path)
            db.add(db_record)
            db.flush()
        else:  # we are updating. wipe
            for run in list(db_record.analysis_runs):
                delete_analysis_run(db, run) # cascades

        db_record.filename = host_path
        db_record.filesize = filesize
        db_record.last_file_update = last_file_update
        db.flush()

        with SQLiteDB(results_path) as res_db:
            run_rows = res_db.query("SELECT * FROM AnalysisResults")
            for run_row in run_rows:
                acq = (run_row["AcqSystemID"], run_row["AcqTimestamp"],
                       run_row["AcqNum1"], run_row["AcqNum2"])
                ds_nat_key, ds_name = obs_key(*acq)

                obs = find_existing_obs_record(db, ds_nat_key)
                if obs is None:
                    obs = Observation(
                        natural_key=ds_nat_key,
                        display_name=ds_name,
                        acq_system_id=acq[0], acq_timestamp=acq[1],
                        acq_num_1=acq[2], acq_num_2=acq[3],
                    )
                    db.add(obs)
                    db.flush()

                run_record = build_run_record(run_row, db_record, obs)
                db.add(run_record)
                db.flush()

                if run_record.status == 'Complete':
                    img_refs = ingest_images(res_db, run_record, THUMBNAIL_DIR)
                    db.add_all(img_refs)

                    obj_refs, _ = ingest_objects(db, res_db, run_record, THUMBNAIL_DIR)
                    # blobs have already been added
                    db.add_all(obj_refs)

                    num_matched, ra_err, dec_err = get_astrom_info(res_db, run_record.analysis_id)

                    run_record.n_objects = len(obj_refs)
                    run_record.metrics = {
                        "n_fast": sum(o.classification == "FastMoving" for o in obj_refs),
                        "n_slow": sum(o.classification == "SlowMoving" for o in obj_refs),
                        "mean_fwhm_px": run_row.get('MeanPSFFWHM'),
                        'ra_err': ra_err,
                        'dec_err': dec_err,
                        'num_matched': num_matched,
                    }
                    db.flush()

    with get_record_db() as db:
        gc_thumbnails(db)

def main():
    reset_db()
    ingest_results_db("/home/sage/neo_view/backend/testing/NEO_20260516.db")
    
if __name__=="__main__":
    main()