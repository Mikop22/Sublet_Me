import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


@pytest.fixture
def turn_payload():
    return {
        "user": {
            "sub": "api-test-user",
            "email": "test@example.com",
            "email_verified": True,
            "verification_tier": "verified_email",
        },
        "message": "Looking for apartments in Boston",
        "session_id": None,
        "metadata": {},
    }


def test_turn_endpoint_returns_session(client, turn_payload):
    response = client.post("/v1/orchestrator/turn", json=turn_payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "assistant_message" in data
    assert "listings" in data


def test_history_endpoint_returns_turns(client, turn_payload):
    turn = client.post("/v1/orchestrator/turn", json=turn_payload).json()
    history = client.get(f"/v1/orchestrator/history?user_sub=api-test-user").json()
    assert history["session_id"] == turn["session_id"]
    assert len(history["turns"]) == 2
