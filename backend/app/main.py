import logging
import time

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import client, create_indexes, is_database_connected
from app.routes import auth, employee, manager
from app.utils.rate_limit import rate_limit_middleware


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("darexai.api")

app = FastAPI(
    title="DareX AI API",
    description="Backend API for the DareX AI application.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employee.router)
app.include_router(manager.router)


app.middleware("http")(rate_limit_middleware)


@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "%s %s completed with %s in %.2fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )

    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors()},
    )


@app.on_event("startup")
async def startup_event():
    await create_indexes()
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    logger.info("MongoDB client closed")


@app.get("/")
def read_root():
    return {"message": "DareX AI API is running"}


@app.get("/health")
async def health_check():
    database_connected = await is_database_connected()

    return {"status": "ok", "databaseConnected": database_connected}
