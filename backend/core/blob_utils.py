from typing import Optional
import numpy as np

from db.models import BlobRef
from core.sqlite_db import SQLiteDB

SOURCE_TABLE_KEYS = {
    "Images": ("AnalysisID", "ImageType", "ImageIndex"),
    "Objects": ("AnalysisID", "ObjectIndex"),
}


def blob_to_arr(blob: bytes, width: int, height: int, dtype: str = 'Single') -> np.ndarray:
    if dtype == "Single":
        data_type = '<f4'  # little-endian float32
    elif dtype == "uint8":
        data_type = '|u1'
    else:
        raise ValueError(f'dtype not recognized: {dtype}')
    arr = np.frombuffer(blob, dtype=data_type)
    return arr.reshape(height, width)


def locate_row_from_blob_record(blob_ref: BlobRef, res_db: SQLiteDB) -> Optional[dict]:
    table = blob_ref.source_table
    if table not in SOURCE_TABLE_KEYS:
        raise ValueError(f"disallowed source_table: {table!r}")
    key_cols = SOURCE_TABLE_KEYS[table]
    where = " AND ".join(f"{c} = ?" for c in key_cols)
    params = [blob_ref.source_key[c] for c in key_cols]
    rows = res_db.query(f"SELECT * FROM {table} WHERE {where}", params)
    return rows[0] if rows else None
