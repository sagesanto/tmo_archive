from db.models import MPCEncounter, MPCCandidate, Observation
from sqlalchemy.orm import Session
from datetime import datetime

from .mpc_identifier import MPCIdentifier, MPCStatus

def parse_obs_description(description:str):
    text = description.removeprefix("MPC Asteroid ")
    desig, _, rest = text.partition(",")
    d = {"desig": desig.strip()}
    for part in rest.split(", "):
        sep = min((part.find(":"), part.find("=")), key=lambda i: (i < 0, i))
        d[part[:sep].strip()] = part[sep+1:].strip()
    return d

def make_encounter(obs_descr_dict:dict, obs:Observation, candidate_id:int) -> MPCEncounter:
    desig = obs_descr_dict['desig']    
    d_ra = float(obs_descr_dict['dRA'])    
    d_dec = float(obs_descr_dict['dDEC'])    
    vmag = float(obs_descr_dict['vMag']) if "vMag" in obs_descr_dict else None

    MAGIC_DATE = datetime(2026,3,20)
    if obs.obstime < MAGIC_DATE:  # units changed from arcsec/minute to arcsec/sec on 3/20/2026
        d_ra = d_ra / 60
        d_dec = d_dec / 60
    
    encounter = MPCEncounter(
        designation=desig,
        observation_id = obs.id,
        mpc_candidate_id = candidate_id,
        d_ra=d_ra,
        d_dec=d_dec,
        v_mag=vmag
    )
    return encounter