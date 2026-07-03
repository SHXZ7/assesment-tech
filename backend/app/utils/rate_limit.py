import os
import time
from collections import defaultdict, deque

from fastapi.responses import JSONResponse


RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))
WINDOW_SECONDS = 60
request_log = defaultdict(deque)


async def rate_limit_middleware(request, call_next):
    client_host = request.client.host if request.client else "unknown"
    now = time.time()
    timestamps = request_log[client_host]

    while timestamps and now - timestamps[0] > WINDOW_SECONDS:
        timestamps.popleft()

    if len(timestamps) >= RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again shortly."},
        )

    timestamps.append(now)

    return await call_next(request)
