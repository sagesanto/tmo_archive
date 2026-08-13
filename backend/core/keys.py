# natural keys that will survive re-ingestion, safe to attach comments to 

from datetime import datetime, timezone
from pathlib import Path
import hashlib
from typing import Tuple

HASH_LEN = 4 
KEY_SEP = '-'

def results_db_key(path: str) -> Tuple[str,str]:
    h = hashlib.sha256(str(Path(path).resolve()).encode()).hexdigest()[:12]
    key = f"db{KEY_SEP}{h}"

    name = h[:HASH_LEN]
    return key,name

def obs_key(acq_system_id: int, acq_timestamp: int, acq_num_1: int, acq_num_2: int) -> Tuple[str,str]:
    key = f"obs{KEY_SEP}{acq_system_id}:{acq_timestamp}:{acq_num_1}:{acq_num_2}"
    date = datetime.fromtimestamp(acq_timestamp,timezone.utc).strftime("%Y%m%d")
    h = hashlib.sha256(key.encode()).hexdigest()[:HASH_LEN]
    name = f"{date}-{h}"
    return key, name

def run_key(db_key: str, analysis_id: int, analysis_time: datetime) -> Tuple[str,str]:
    key = f"run{KEY_SEP}{db_key}{KEY_SEP}{analysis_id}:{int(analysis_time.timestamp())}"
    date = analysis_time.strftime("%Y%m%d")
    h = hashlib.sha256(key.encode()).hexdigest()[:HASH_LEN]
    name = f"{date}-{analysis_id}-{h}"
    return key, name

def object_key(run_key_: str, run_name:str, object_index: int) -> Tuple[str,str]:
    key = f"obj{KEY_SEP}{run_key_}{KEY_SEP}{object_index}"
    name = f"{run_name}:{object_index}"
    return key, name

def blob_key(run_key_: str, source_table: str, *parts: int) -> str:
    key = f"blob{KEY_SEP}{run_key_}{KEY_SEP}{source_table}:" + ":".join(str(p) for p in parts)
    return key

def derive(key:str, target:str):
    # each key wraps its parent as prefix-parent-suffix, adding exactly one
    # piece on each side, so stripping as many trailing pieces as the target's
    # index recovers exactly the target's own segment
    pieces = key.split(KEY_SEP)
    if target not in pieces:
        return None
    targ_idx = pieces.index(target)
    relevant_pieces = pieces[targ_idx:-targ_idx] if targ_idx else pieces
    return KEY_SEP.join(relevant_pieces)