import logging
from datetime import datetime, timezone
import pytz

DATE_OBS_FORMAT = '%Y-%m-%dT%X.%f'

def to_naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)

def write_out(*args, level=logging.INFO, logger=None):
    """ Writes out a message to the console and optionally to a logger."""
    msg = " ".join(str(arg) for arg in args)
    if logger is not None:
        logger.log(level, msg)
    else:
        print(msg)
        
def parse_date_obs(t_str,tz=pytz.UTC) -> datetime:
    return datetime.strptime(t_str,DATE_OBS_FORMAT).replace(tzinfo=tz)

def write_date_obs(dt:datetime, as_tz=pytz.UTC) -> str:
    if dt.tzinfo is not None:
        dt = dt.astimezone(as_tz)
    else:
        dt = dt.replace(tzinfo=as_tz)
    return dt.strftime(DATE_OBS_FORMAT)

def acq_bin_filename(obs_row):
    return f"{obs_row['AcqSystemID']}_{obs_row['AcqTimestamp']}_{obs_row['AcqNum1']}_{obs_row['AcqNum2']}.bin"

def utc_obs_timestamp(obs_row) -> float:
    ts = obs_row['AcquisitionTime'] + obs_row['AcquisitionTimeNs'] * 1e-9
    return datetime.fromtimestamp(ts, tz=timezone('US/Pacific')).astimezone(timezone('UTC')).timestamp()

def utc_obs_datetime(obs_row) -> datetime:
    return datetime.fromtimestamp(utc_obs_timestamp(obs_row),tz=timezone('UTC'))

def utc_obs_time(obs_row) -> str:
    return write_date_obs(utc_obs_datetime(obs_row))