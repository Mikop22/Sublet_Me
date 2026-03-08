from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

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


@app.get("/meet-link")
def create_meet_link() -> dict[str, str]:
    return {"meet_link": random.choice([
        "https://meet.google.com/dop-rdnt-aoh",
        "https://meet.google.com/enc-knqy-nuy",
        "https://meet.google.com/gpe-xfwd-uyk",
    ])}