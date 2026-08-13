from typing import Optional, Any
from datetime import datetime

from sqlalchemy.sql import func
from sqlalchemy import ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, relationship, mapped_column as col
from sqlalchemy.dialects.postgresql import JSONB, JSON
from sqlalchemy import UniqueConstraint, Index, String, Integer, Float, Boolean, ForeignKey

class Base(DeclarativeBase):
    pass

class ResultsDB(Base):
    __tablename__ = "results_dbs"

    id: Mapped[int] = col(primary_key=True, autoincrement=True)  # used internally for joins
    natural_key: Mapped[str] = col(String, unique=True, nullable=False, index=True)  # persists across reingestion. used most other places
    display_name: Mapped[str] = col(String,nullable=False)

    filename: Mapped[Optional[str]] = col(nullable=True)
    filesize: Mapped[Optional[int]] = col(nullable=True)
    last_file_update: Mapped[Optional[datetime]] = col(nullable=True)
    date_ingested: Mapped[datetime] = col(server_default=func.now())
    date_updated: Mapped[datetime] = col(server_default=func.now(), onupdate=func.now())

    analysis_runs: Mapped[list["AnalysisRun"]] = relationship(back_populates="results_db", cascade="all, delete-orphan")

    @property
    def n_runs(self) -> int:
        return len(self.analysis_runs)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"
    __table_args__ = (
        UniqueConstraint("results_db_id", "analysis_id", name="uq_run_natural"),
    )

    id: Mapped[int] = col(primary_key=True, autoincrement=True)
    natural_key: Mapped[str] = col(String, unique=True, nullable=False, index=True)
    display_name: Mapped[str] = col(String,nullable=False)

    analysis_id: Mapped[int] = col(nullable=False)
    status: Mapped[str] = col(nullable=False)
    status_description: Mapped[Optional[str]] = col(nullable=True)
    analysis_time: Mapped[datetime] = col(nullable=False)
    obs_time: Mapped[datetime] = col(nullable=False)
    
    metrics: Mapped[dict] = col(JSONB,nullable=True)
    
    results_db_id: Mapped[int] = col(ForeignKey("results_dbs.id"), nullable=False)
    observation_id: Mapped[int] = col(ForeignKey("observations.id"), nullable=False)
    n_objects: Mapped[int] = col(default=0,nullable=False)

    results_db: Mapped["ResultsDB"] = relationship(back_populates="analysis_runs")
    observation: Mapped["Observation"] = relationship(back_populates="analysis_runs")
    blob_refs: Mapped[list["BlobRef"]] = relationship(back_populates="analysis_run", cascade="all, delete-orphan")
    detected_objects: Mapped[list['DetectedObject']] = relationship(back_populates="analysis_run", cascade="all, delete-orphan")

    @property
    def observation_key(self) -> str:
        return self.observation.natural_key

class BlobRef(Base):
    __tablename__ = "blob_ref"
    __table_args__ = (
        UniqueConstraint("analysis_run_id", "source_table", "image_type", "image_index",
                         name="uq_blob_natural"),
    )
    # reference to an image stored in the sqlite results db 
    # does not actually store the blob here. will use this to find and send blob direct to browser
    # also, room to store thumbnails     

    id: Mapped[int] = col(primary_key=True)
    natural_key: Mapped[str] = col(String, unique=True, nullable=False, index=True)

    analysis_run_id: Mapped[int] = col(ForeignKey("analysis_runs.id"))
    analysis_run: Mapped["AnalysisRun"] = relationship(back_populates="blob_refs")

    source_table: Mapped[str] = col(String)   # which sqlite table
        # promoted from source_key for the unique constraint:
    image_type: Mapped[Optional[int]] = col(Integer, nullable=True)   # Images.ImageType
    image_index: Mapped[Optional[int]] = col(Integer, nullable=True)  # Images.ImageIndex / Objects.ObjectIndex

    source_key: Mapped[dict] = col(JSONB)
    
    width: Mapped[int] = col(Integer)
    height: Mapped[int] = col(Integer)
    dtype: Mapped[str] = col(String)
    size_class: Mapped[str] = col(String)     # 'small' | 'large'
    
    vmin: Mapped[float | None] = col(Float, nullable=True)
    vmax: Mapped[float | None] = col(Float, nullable=True)
    percentiles: Mapped[dict | None] = col(JSONB, nullable=True)
    histogram: Mapped[dict | None] = col(JSONB, nullable=True)
    
    thumbnail_png_path: Mapped[str | None] = col(String, nullable=True)
    
    nan_present: Mapped[bool] = col(Boolean, nullable=True)
    associated_object: Mapped["DetectedObject"] = relationship(back_populates="blob_ref")
    
    
class Observation(Base):
    __tablename__ = "observations"
    __table_args__ = (
        UniqueConstraint("acq_system_id", "acq_timestamp", "acq_num_1", "acq_num_2",
                         name="uq_dataset_natural"),
    )
    
    id: Mapped[int] = col(primary_key=True, autoincrement=True)
    metadata_db_id: Mapped[int] = col(ForeignKey("metadata_dbs.id"), nullable=True)
    schedule_id: Mapped[Optional[int]] = col(ForeignKey("schedules.id"), nullable=True)
    
    natural_key: Mapped[str] = col(String, unique=True, nullable=False, index=True)
    display_name: Mapped[str] = col(String,nullable=False)
    
    acq_system_id: Mapped[int] = col(Integer,nullable=False)
    acq_timestamp: Mapped[int] = col(Integer,nullable=False)
    acq_num_1: Mapped[int] = col(Integer,nullable=False)
    acq_num_2: Mapped[int] = col(Integer,nullable=False)
        
    name: Mapped[str] = col(nullable=True)
    sequence_len: Mapped[int] = col(Integer,default=1)
    obstime: Mapped[datetime] = col(nullable=True)
    rowid: Mapped[int] = col(nullable=True)
    description: Mapped[str] = col(nullable=True)
    is_calib: Mapped[bool] = col(nullable=True)
    is_science: Mapped[bool] = col(nullable=True)
    is_bias: Mapped[bool] = col(nullable=True)
    is_dark: Mapped[bool] = col(nullable=True)
    is_flat: Mapped[bool] = col(nullable=True)
    
    exptime: Mapped[float] = col(nullable=True)
    frames: Mapped[int] = col(nullable=True)
    filter: Mapped[Optional[str]] = col(nullable=True)
    
    tele_ra: Mapped[float] = col(nullable=True)
    tele_dec: Mapped[float] = col(nullable=True)
    
    camera_name: Mapped[str] = col(nullable=True)
    gain: Mapped[float] = col(nullable=True)
    binning_mode: Mapped[str] = col(nullable=True)
    operation_mode: Mapped[str] = col(nullable=True)
    
    binning_size: Mapped[int] = col(nullable=True)
    roi_start_x: Mapped[int] = col(nullable=True)
    roi_start_y: Mapped[int] = col(nullable=True)
    roi_width: Mapped[int] = col(nullable=True)
    roi_height: Mapped[int] = col(nullable=True)

    cooler_on: Mapped[bool] = col(nullable=True)
    target_temp: Mapped[float] = col(nullable=True)
    front_housing_temp: Mapped[float] = col(nullable=True)
    rear_housing_temp: Mapped[float] = col(nullable=True)
    camera_temp: Mapped[float] = col(nullable=True)

    analysis_runs: Mapped[list["AnalysisRun"]] = relationship(back_populates="observation")
    metadata_db: Mapped["MetadataDBRecord"] = relationship(back_populates="observations")
    schedule: Mapped[Optional["Schedule"]] = relationship(back_populates="observations")
    fits_files: Mapped[list["FitsFile"]] = relationship(back_populates="observation", cascade="all, delete-orphan")
    mpc_encounter: Mapped["MPCEncounter"] = relationship(back_populates="observation")

    @property
    def n_runs(self) -> int:
        return len(self.analysis_runs)
    

class DetectedObject(Base):
    __tablename__ = "detected_objects"
    __table_args__ = (
        UniqueConstraint("analysis_run_id", "object_index", name="uq_object_natural"),
    )
    
    id: Mapped[int] = col(primary_key=True)
    natural_key: Mapped[str] = col(String, unique=True, nullable=False, index=True)
    display_name: Mapped[str] = col(String,nullable=False)
    object_index: Mapped[int] = col(Integer, nullable=False)

    analysis_run_id: Mapped[int] = col(ForeignKey("analysis_runs.id"))
    analysis_run: Mapped["AnalysisRun"] = relationship(back_populates="detected_objects")
    
    blob_ref_id: Mapped[Optional[int]] = col(ForeignKey("blob_ref.id"),nullable=True)
    blob_ref: Mapped["BlobRef"] = relationship(back_populates="associated_object")
    
    snr: Mapped[float] = col(nullable=False)
    type: Mapped[str] = col(nullable=False)
    classification: Mapped[str] = col(nullable=False)
    num_frames: Mapped[int] = col(nullable=False)
    cluster_children: Mapped[int] = col(nullable=False)
    
    magnitude: Mapped[float] = col(nullable=True)
    v_ra: Mapped[float] = col(nullable=True)
    v_dec: Mapped[float] = col(nullable=True)
    
    x: Mapped[float] = col(nullable=True)
    y: Mapped[float] = col(nullable=True)
    
    vx: Mapped[float] = col(nullable=True)
    vy: Mapped[float] = col(nullable=True)
    
    ra: Mapped[float] = col(nullable=True)
    dec: Mapped[float] = col(nullable=True)
    
    source_key: Mapped[dict] = col(JSONB,nullable=False)
    analysis_time: Mapped[datetime] = col(nullable=False)
    obs_time: Mapped[datetime] = col(nullable=False)
    

    @property
    def observation_key(self) -> str:
        return self.analysis_run.observation.natural_key

class MetadataDBRecord(Base):
    __tablename__ = "metadata_dbs"

    id: Mapped[int] = col(primary_key=True, autoincrement=True)
    filename: Mapped[Optional[str]] = col(nullable=True)
    filesize: Mapped[Optional[str]] = col(nullable=True)
    last_file_update: Mapped[Optional[datetime]] = col(nullable=True)
    date_ingested: Mapped[datetime] = col(default=datetime.utcnow)
    date_updated: Mapped[datetime] = col(default=datetime.utcnow, onupdate=datetime.utcnow)

    observations: Mapped[list["Observation"]] = relationship(back_populates="metadata_db", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = col(primary_key=True, autoincrement=True)
    path: Mapped[str] = col(nullable=False, unique=True)

    observations: Mapped[list["Observation"]] = relationship(back_populates="schedule")
class FitsFile(Base):
    __tablename__ = "fits_files"

    id: Mapped[int] = col(primary_key=True, autoincrement=True)
    observation_id: Mapped[int] = col(ForeignKey("observations.id"), nullable=False)
    filepath: Mapped[str] = col(nullable=False)

    observation: Mapped["Observation"] = relationship(back_populates="fits_files")

class MPCCandidate(Base):
    # will populate more MPC information here
    __tablename__ = "mpc_candidates"
    id: Mapped[int] = col(primary_key=True, autoincrement=True)
    designation: Mapped[str] = col(nullable=False,unique=True)
    
    mpc_encounters: Mapped[list["MPCEncounter"]] = relationship(back_populates="mpc_candidate")
    
class MPCEncounter(Base):
    __tablename__ = "mpc_encounters"
    
    id: Mapped[int] = col(primary_key=True, autoincrement=True)
    designation: Mapped[str] = col(nullable=False)
    observation_id: Mapped[int] = col(ForeignKey("observations.id"), nullable=False)
    mpc_candidate_id: Mapped[int] = col(ForeignKey("mpc_candidates.id"), nullable=False)
    
    d_ra: Mapped[float] = col(nullable=False)
    d_dec: Mapped[float] = col(nullable=False)
    
    observation: Mapped["Observation"] = relationship(back_populates="mpc_encounter")
    mpc_candidate: Mapped["MPCCandidate"] = relationship(back_populates="mpc_encounters")

class Flag(Base):
    __tablename__ = "flags"
    id: Mapped[int] = col(primary_key=True)
    name: Mapped[str] = col(nullable=False, unique=True)
    description: Mapped[str] = col(nullable=False)
    category: Mapped[str] = col(nullable=False)  # bad, warning, interesting, good
    color: Mapped[str] = col(String, nullable=False)
    
    object_flags: Mapped[list["ObjectFlag"]] = relationship(back_populates="flag", cascade="all, delete-orphan")

class ObjectFlag(Base):
    __tablename__ = "object_flag"
    __table_args__ = (
        UniqueConstraint("object_key", "flag_id", name="uq_obj_flag"),
    )
    id: Mapped[int] = col(primary_key=True)
    
    # leaving out a foreign key for obj, will be attached by natural key to survive reingest
    object_key: Mapped[str] = col(String, index=True, nullable=False)
    flag_id: Mapped[int] = col(ForeignKey("flags.id"), nullable=False)
    attached: Mapped[datetime] = col(server_default=func.now())
        
    flag: Mapped["Flag"] = relationship(back_populates="object_flags")

class Annotation(Base):
    __tablename__ = "annotations"
    __table_args__ = (
        Index("ix_annotation_target", "target_type", "target_key"),
    )

    id: Mapped[int] = col(primary_key=True)

    # leaving out a foreign key, will be attached by natural key
    target_type: Mapped[str] = col(String, nullable=False)   # 'run' | 'object' | 'database'
    target_key: Mapped[str] = col(String, nullable=False)  # attached by natural key

    status: Mapped[Optional[str]] = col(String, nullable=True)
    comment: Mapped[Optional[str]] = col(String, nullable=True)
    created_at: Mapped[datetime] = col(server_default=func.now())
    updated_at: Mapped[datetime] = col(server_default=func.now(), onupdate=func.now())