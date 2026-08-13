# schemas.py
from enum import Enum
from datetime import datetime
from typing import Any, Optional
from core.keys import derive
from pydantic import BaseModel, ConfigDict, computed_field

class ObsType(Enum):
    Unclassified = -1
    Science = 0
    Dark = 1
    Flat = 2
    Bias = 3
    Other = 4

class ObservationOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    natural_key: str
    display_name: str
    acq_system_id: int
    acq_timestamp: int
    acq_num_1: int
    acq_num_2: int
    name: Optional[str] = None
    description: Optional[str] = None
    is_science: Optional[bool] = None
    is_calib: Optional[bool] = None
    is_dark: Optional[bool] = None
    is_bias: Optional[bool] = None
    is_flat: Optional[bool] = None
    n_runs: int

    exptime: Optional[float] = None
    frames: Optional[int] = None
    filter: Optional[str] = None

    tele_ra: Optional[float] = None
    tele_dec: Optional[float] = None

    camera_name: Optional[str] = None
    gain: Optional[float] = None
    binning_mode: Optional[str] = None
    operation_mode: Optional[str] = None

    binning_size: Optional[int] = None
    roi_start_x: Optional[int] = None
    roi_start_y: Optional[int] = None
    roi_width: Optional[int] = None
    roi_height: Optional[int] = None

    cooler_on: Optional[bool] = None
    target_temp: Optional[float] = None
    front_housing_temp: Optional[float] = None
    rear_housing_temp: Optional[float] = None
    camera_temp: Optional[float] = None

    @computed_field
    @property
    def obs_type(self) -> str|None:
        if self.is_science is None:
            return str(ObsType.Unclassified.name)
        if self.is_science:
            return str(ObsType.Science.name)
        if self.is_dark:
            return str(ObsType.Dark.name)
        if self.is_flat:
            return str(ObsType.Flat.name)
        if self.is_bias:
            return str(ObsType.Bias.name)
        return str(ObsType.Other.name)

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
    observation_id: int
    observation_key: str

    @computed_field
    @property
    def results_db_key(self) -> str|None:
        return derive(self.natural_key,'db')

# little hybrid of Flag and ObjectFlag that contains Flag detail + attached time
class FlagReturn(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    color: str
    category: str
    attached: Optional[datetime] = None

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
    observation_key: str
    
    flags: list[FlagReturn] = []

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
    
    
class MPCEncounterOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    designation: str
    observation_id: int
    mpc_candidate_id: int
    
    d_ra: float
    d_dec: float
    
class MPCCandidateOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    designation: str
    
    