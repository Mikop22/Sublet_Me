from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.orchestrator import router as orchestrator_router

app = FastAPI(
    title="SubletOps Backend",
    version="0.1.0",
    description="Hackathon MVP backend for SubletOps Orchestrator.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orchestrator_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
