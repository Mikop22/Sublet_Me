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
            "sub": "demo-smoke-user",
            "email": "smoke@example.com",
            "email_verified": True,
            "verification_tier": "verified_email",
        },
        "message": "Find apartments in Toronto",
        "session_id": None,
        "metadata": {},
    }


def test_turn_and_history_share_session(client, turn_payload):
    """Turn response and subsequent history lookup must share the same session_id."""
    turn = client.post("/v1/orchestrator/turn", json=turn_payload).json()
    assert "session_id" in turn
    assert "assistant_message" in turn
    assert "listings" in turn

    history = client.get(f"/v1/orchestrator/history?user_sub=demo-smoke-user").json()
    assert history["session_id"] == turn["session_id"]
    assert len(history["turns"]) == 2


def test_turn_response_has_metadata(client, turn_payload):
    """Turn response must include runtime metadata for degraded mode detection."""
    turn = client.post("/v1/orchestrator/turn", json=turn_payload).json()
    assert "metadata" in turn
    assert "source" in turn["metadata"]


def test_match_query_returns_listings(client):
    """Match query must return at least one listing recommendation."""
    payload = {
        "user": {
            "sub": "demo-smoke-user",
            "email": "smoke@example.com",
            "email_verified": True,
            "verification_tier": "verified_email",
        },
        "limit": 5,
    }
    response = client.post("/v1/matches/query", json=payload).json()
    assert "listings" in response
    assert len(response["listings"]) > 0
    assert "title" in response["listings"][0]
