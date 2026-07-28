# schemas.py
from datetime import datetime
from typing import Any, Optional
from core.keys import derive
from pydantic import BaseModel, ConfigDict, computed_field


class DatasetOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    natural_key: str
    display_name: str
    acq_system_id: int
    acq_timestamp: int
    acq_num_1: int
    acq_num_2: int
    obs_name: Optional[str] = None
    n_runs: int


class ResultsDBOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    natural_key: str
    display_name: str
    filename: Optional[str] = None
    filesize: Optional[int] = None
    last_file_update: Optional[datetime] = None
    date_ingested: datetime
    date_updated: datetime
    n_runs: int


class RunOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    natural_key: str
    display_name: str
    analysis_id: int
    status: str
    status_description: Optional[str] = None
    analysis_time: datetime
    obs_time: datetime
    metrics: Optional[dict[str, Any]] = None
    n_objects: Optional[int] = None

    results_db_id: int
    dataset_id: int
    dataset_key: str

    @computed_field
    @property
    def results_db_key(self) -> str|None:
        return derive(self.natural_key,'db')


class DetectedObjectOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    natural_key: str
    display_name: str
    analysis_run_id: int
    blob_ref_id: Optional[int] = None

    snr: float
    type: str
    classification: str
    magnitude: Optional[float] = None
    num_frames: int
    cluster_children: int

    v_ra: Optional[float] = None
    v_dec: Optional[float] = None
    ra: Optional[float] = None
    dec: Optional[float] = None

    source_key: dict[str, Any]
    obs_time: datetime
    analysis_time: datetime
    dataset_key: str

    @computed_field
    @property
    def analysis_run_key(self) -> str|None:
        return derive(self.natural_key,'run')

    @computed_field
    @property
    def results_db_key(self) -> str|None:
        return derive(self.natural_key,'db')


class BlobRefOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    natural_key: str
    analysis_run_id: int
    source_table: str
    width: int
    height: int
    size_class: str
    
    @computed_field
    @property
    def thumbnail_url(self) -> str:
        return f"/api/blobs/thumbnail?natural_key={self.natural_key}"
    
    @computed_field
    @property
    def analysis_run_key(self) -> str|None:
        return derive(self.natural_key,'run')