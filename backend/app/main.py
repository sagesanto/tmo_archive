from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from db.database import init_db
from app.routers import objects, analyses, blobs, results_db, flags, observations, mpcs, tags, admin_config, admin_ingest

app = FastAPI()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
    

app = FastAPI(lifespan=lifespan)
app.include_router(analyses.router, prefix="/api")
app.include_router(objects.router, prefix="/api")
app.include_router(blobs.router, prefix="/api")
app.include_router(results_db.router, prefix="/api")
app.include_router(observations.router, prefix="/api")
app.include_router(mpcs.router, prefix="/api")
app.include_router(flags.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(admin_config.router, prefix="/api")
app.include_router(admin_ingest.router, prefix="/api")

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"message": f"Internal server error: {exc}"})