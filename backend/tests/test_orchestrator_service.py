import pytest
from app.models.orchestrator import OrchestratorTurnRequest, UserContext, ProfilePreferences
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
            sub="test-user",
            email="test@example.com",
            email_verified=True,
            verification_tier="verified_email",
        ),
        message="Looking for apartments in Boston under $2000",
        session_id=None,
        metadata={},
    )


def test_process_turn_returns_session_and_message(service, payload):
    response = service.process_turn(payload)
    assert response.session_id
    assert response.assistant_message
    assert response.confidence > 0


def test_process_turn_returns_listings(service, payload):
    response = service.process_turn(payload)
    assert len(response.listings) > 0


def test_process_turn_persists_history(service, payload):
    response = service.process_turn(payload)
    history = service.get_history(user_sub="test-user", session_id=response.session_id)
    assert len(history.turns) == 2
    assert history.turns[0].role == "user"
    assert history.turns[1].role == "assistant"


def test_get_history_returns_empty_for_new_user(service):
    history = service.get_history(user_sub="nonexistent")
    assert history.session_id is None
    assert history.turns == []


def test_get_history_resolves_latest_session(service, payload):
    service.process_turn(payload)
    payload.session_id = None
    r2 = service.process_turn(payload)
    history = service.get_history(user_sub="test-user")
    assert history.session_id == r2.session_id
