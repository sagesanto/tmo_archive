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
    dataset_id: Mapped[int] = col(ForeignKey("datasets.id"), nullable=False)
    n_objects: Mapped[int] = col(default=0,nullable=False)

    results_db: Mapped["ResultsDB"] = relationship(back_populates="analysis_runs")
    dataset: Mapped["Dataset"] = relationship(back_populates="analysis_runs")
    blob_refs: Mapped[list["BlobRef"]] = relationship(back_populates="analysis_run", cascade="all, delete-orphan")
    detected_objects: Mapped[list['DetectedObject']] = relationship(back_populates="analysis_run", cascade="all, delete-orphan")

    @property
    def dataset_key(self) -> str:
        return self.dataset.natural_key

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
    
class Dataset(Base):
    __tablename__ = "datasets"
    __table_args__ = (
        UniqueConstraint("acq_system_id", "acq_timestamp", "acq_num_1", "acq_num_2",
                         name="uq_dataset_natural"),
    )
    
    id: Mapped[int] = col(primary_key=True)
    natural_key: Mapped[str] = col(String, unique=True, nullable=False, index=True)
    display_name: Mapped[str] = col(String,nullable=False)
    acq_system_id: Mapped[int] = col(Integer)
    acq_timestamp: Mapped[int] = col(Integer)
    acq_num_1: Mapped[int] = col(Integer)
    acq_num_2: Mapped[int] = col(Integer)
    analysis_runs: Mapped[list["AnalysisRun"]] = relationship(back_populates="dataset")

    @property
    def n_runs(self) -> int:
        return len(self.analysis_runs)

    bin_path: Mapped[Optional[str]] = col(nullable=True)
    fits_path: Mapped[Optional[str]] = col(nullable=True)
    obs_name: Mapped[Optional[str]] = col(nullable=True)
    metadata_db_path: Mapped[Optional[str]] = col(nullable=True)
    
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
    def dataset_key(self) -> str:
        return self.analysis_run.dataset.natural_key


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