from datetime import datetime, timezone
from pathlib import Path
import hashlib

HASH_LEN = 4 

def results_db_key(natural_key: str) -> str:
    h = hashlib.sha256(str(Path(path).resolve()).encode()).hexdigest()[:12]
    return f"db{KEY_SEP}{h}"

def dataset_name(natural_key:str,acq_timestamp:int) -> str:
    date = datetime.fromtimestamp(acq_timestamp,timezone.utc).strftime("%Y%m%d")
    h = hashlib.sha256(natural_key.encode()).hexdigest()[:HASH_LEN]
    return f"{date}-{h}"

def run_name(natural_key:str,analysis_id:int,analysis_time: datetime) -> str:
    date = analysis_time.strftime("%Y%m%d")
    h = hashlib.sha256(natural_key.encode()).hexdigest()[:HASH_LEN]
    return f"{date}-{analysis_id}-{h}"

def object_name(run_name: str, object_index: int) -> str:
    return f"{run_name}:{object_index}"