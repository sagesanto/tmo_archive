import os

# read fresh bc db.database's dotenv loading may not have run yet
def _mounts():
    return [
        (os.environ.get("RESULTS_HOST_PATH"), os.environ.get("RESULTS_CONTAINER_PATH", "/data/results")),
        (os.environ.get("OBS_HOST_PATH"), os.environ.get("OBS_CONTAINER_PATH", "/data/obs")),
    ]

def to_container_path(host_path: str) -> str:
    for host_root, container_root in _mounts():
        if host_root and host_path.startswith(host_root):
            return container_root + host_path[len(host_root):]
    return host_path


def to_host_path(container_path: str) -> str:
    for host_root, container_root in _mounts():
        if host_root and container_path.startswith(container_root):
            return host_root + container_path[len(container_root):]
    return container_path
