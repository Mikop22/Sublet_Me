from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.orchestrator import (
    MatchQueryRequest,
    MatchQueryResponse,
    OrchestratorHistoryResponse,
    OrchestratorTurnRequest,
    OrchestratorTurnResponse,
    ProfileUpsertRequest,
    ProfileUpsertResponse,
)
from app.services.memory_store import create_memory_store
from app.services.orchestrator_service import OrchestratorService

router = APIRouter(prefix="/v1", tags=["subletops"])

_memory_store = create_memory_store()
_service = OrchestratorService(_memory_store)


def get_orchestrator_service() -> OrchestratorService:
    return _service


@router.post("/profiles/upsert", response_model=ProfileUpsertResponse)
def upsert_profile(
    payload: ProfileUpsertRequest,
    service: OrchestratorService = Depends(get_orchestrator_service),
) -> ProfileUpsertResponse:
    return service.upsert_profile(payload)


@router.post("/orchestrator/turn", response_model=OrchestratorTurnResponse)
def orchestrator_turn(
    payload: OrchestratorTurnRequest,
    service: OrchestratorService = Depends(get_orchestrator_service),
) -> OrchestratorTurnResponse:
    return service.process_turn(payload)


@router.post("/matches/query", response_model=MatchQueryResponse)
def query_matches(
    payload: MatchQueryRequest,
    service: OrchestratorService = Depends(get_orchestrator_service),
) -> MatchQueryResponse:
    return service.query_matches(payload)


@router.get("/orchestrator/history", response_model=OrchestratorHistoryResponse)
def orchestrator_history(
    user_sub: str,
    session_id: str | None = None,
    service: OrchestratorService = Depends(get_orchestrator_service),
) -> OrchestratorHistoryResponse:
    return service.get_history(user_sub=user_sub, session_id=session_id)
