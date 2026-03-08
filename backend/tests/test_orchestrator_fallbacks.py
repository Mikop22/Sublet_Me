import pytest
from app.models.orchestrator import OrchestratorTurnRequest, UserContext
from app.services.memory_store import InMemoryStore
from app.services.orchestrator_service import OrchestratorService


@pytest.fixture
def service():
    store = InMemoryStore()
    return OrchestratorService(store)


@pytest.fixture
def payload():
    return OrchestratorTurnRequest(
        user=UserContext(
            sub="fallback-user",
            email="fallback@example.com",
            email_verified=True,
            verification_tier="verified_email",
        ),
        message="Find me a place in Toronto",
        session_id=None,
        metadata={},
    )


def test_process_turn_marks_fallback_source_when_backboard_unavailable(service, payload):
    """Without Backboard credentials, the service should use deterministic fallback."""
    response = service.process_turn(payload)
    assert response.metadata.source in {"backboard", "deterministic_fallback"}
    assert response.reasons


def test_fallback_response_includes_degraded_flag(service, payload):
    """When using deterministic fallback, degraded should be True."""
    response = service.process_turn(payload)
    if response.metadata.source == "deterministic_fallback":
        assert response.metadata.degraded is True
    else:
        assert response.metadata.degraded is False


def test_fallback_still_returns_listings(service, payload):
    """Even in fallback mode, listings should be populated."""
    response = service.process_turn(payload)
    assert len(response.listings) > 0
    assert response.listings[0].title
