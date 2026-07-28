from enum import Enum

class ObjectType(Enum):
    Unknown = 0
    Bright = 1      # Detected during bright object detection
    MovingSA = 2    # Detected during multi-vector shift & add
    MovingPSF = 4   # MVSA objects refined during PSF fit
    MovingFinal = 5 # MVSA objects refined during PSF fit, photometry, and SNR calculations. This is the final result of the analysis.

class Classification(Enum):
    Unclassified = 0        # The object has not been classified
    Classified = 1 	        # The object has been classified and an additional set bit gives the type of object
    Invalid = 2 	        # This object instance is invalid and does not correspond to an actual object, i.e. this may be a duplicate identification of a star or other type of object.
    Duplicate = 6 	        # This object is a duplicate of another object
    Static = 9 	            # This object is static, likely a star
    Spike = 10              # This object was detected as a spike in intensity in the static object search
    SlowMoving = 17         # This object is slow moving and was detected in the static object search. (This identifier is used internal to the analysis but should not be listed in the results.)
    FastMoving = 33         # This object is fast moving and was detected in the high velocity shift & add.
    SaturatedObject = 65    # This object is saturated and will be removed assuming it's static.
    Streaked = 129          # The object is moving and was detected in the steak search.
    
class PhotometryFlag(Enum):
    OK = 0
    Corrupted = 1
    Unavailable = 2
    
class Status(Enum):
    Idle = 0        # Has not yet done anything
    Waiting = 1     # Waiting for another operation
    Running = 2     # In progress
    Complete = 3    # Successfully completed without errors
    Aborted = 4     # Canceled either by another task's error or manually by the user
    Error = 5       # Stopped automatically due to a detected error
    
class ImageType(Enum):
    ZeroVSum_Normalized = 1                      # Single 	Zero velocity sum of the data cube after flat-field correction
    ZeroVSum_Reregistered = 2                    # Single 	Zero velocity sum of the data cube after reregistration
    ZeroVSum_SkyRemoved = 3                      # Single 	Zero velocity sum of the data cube after removing the sky
    ZeroVSum_Stars_Removed = 4                   # Single 	Zero velocity sum of the data cube after removing the stars
    SkyRemoved_TemporalStDev = 6                 # Single 	The temporal standard deviation of the data cube after removing the sky
    StarRemoved_TemporalStDev = 7                # Single 	The temporal standard deviation of the data cube after removing the stars
    BadPix = 8                                   # uint8 	The bad pixel map after processing.
    SkyEstimate = 9                              # Single 	The estimate of the sky integrated over the entire data cube exposure
    BiasEstimate = 10                            # Single 	Estimate of the camera bias drift relative to the nominal dark image
    PSFEstimate = 12                             # Single 	An image of the PSF estimate
    PSFEstimateNorm = 13                         # Single 	An image of the PSF estimate normalized by the total flux
    GridDetectionThresholds_DN = 14              # Single 	An image of the velocity dependent velocity threshold for each velocity grid in DN
    GridDetectionThresholds_MAG = 15             # Single 	An image of the velocity dependent velocity threshold for each velocity grid in stellar magnitudes
    StarsRemoved_TemporalStDev_DownSampled = 16  # Single 	The temporal standard deviation of the data cube after removing the stars then downsampled and upsampled with interpolation
    PSFEstimateFWHMS = 17                        # Single 	IN DB BUT NOT IN DOCUMENTATION