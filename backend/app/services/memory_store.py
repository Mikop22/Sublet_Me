from __future__ import annotations

from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import datetime, timezone
import os
from typing import Any
from uuid import uuid4

from app.models.orchestrator import ProfileRecord


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MemoryStore(ABC):
    """Storage contract for orchestrator state.

    This interface is intentionally backend-agnostic so we can swap in
    a Mongo implementation later without changing API/service contracts.
    """

    @abstractmethod
    def upsert_profile(self, record: ProfileRecord) -> ProfileRecord:
        raise NotImplementedError

    @abstractmethod
    def get_profile(self, user_sub: str) -> ProfileRecord | None:
        raise NotImplementedError

    @abstractmethod
    def create_or_get_session(self, user_sub: str, session_id: str | None) -> str:
        raise NotImplementedError

    @abstractmethod
    def append_turn(
        self,
        user_sub: str,
        session_id: str,
        role: str,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_session_turns(self, user_sub: str, session_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError


class InMemoryStore(MemoryStore):
    def __init__(self) -> None:
        self._profiles: dict[str, ProfileRecord] = {}
        self._sessions: dict[str, dict[str, list[dict[str, Any]]]] = defaultdict(dict)

    def upsert_profile(self, record: ProfileRecord) -> ProfileRecord:
        existing = self._profiles.get(record.user.sub)
        if existing:
            record.created_at = existing.created_at
        record.updated_at = utc_now()
        self._profiles[record.user.sub] = record
        return record

    def get_profile(self, user_sub: str) -> ProfileRecord | None:
        return self._profiles.get(user_sub)

    def create_or_get_session(self, user_sub: str, session_id: str | None) -> str:
        if session_id and session_id in self._sessions[user_sub]:
            return session_id

        generated = session_id or str(uuid4())
        self._sessions[user_sub].setdefault(generated, [])
        return generated

    def append_turn(
        self,
        user_sub: str,
        session_id: str,
        role: str,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        session = self._sessions[user_sub].setdefault(session_id, [])
        session.append(
            {
                "role": role,
                "message": message,
                "metadata": metadata or {},
                "timestamp": utc_now().isoformat(),
            }
        )

    def get_session_turns(self, user_sub: str, session_id: str) -> list[dict[str, Any]]:
        return list(self._sessions[user_sub].get(session_id, []))


class MongoMemoryStore(MemoryStore):
    """Placeholder adapter for future migration.

    Intentionally unimplemented in MVP to avoid coupling hackathon progress
    to DB readiness while preserving a stable contract.
    """

    def upsert_profile(self, record: ProfileRecord) -> ProfileRecord:
        raise NotImplementedError("MongoMemoryStore will be added post-MVP.")

    def get_profile(self, user_sub: str) -> ProfileRecord | None:
        raise NotImplementedError("MongoMemoryStore will be added post-MVP.")

    def create_or_get_session(self, user_sub: str, session_id: str | None) -> str:
        raise NotImplementedError("MongoMemoryStore will be added post-MVP.")

    def append_turn(
        self,
        user_sub: str,
        session_id: str,
        role: str,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        raise NotImplementedError("MongoMemoryStore will be added post-MVP.")

    def get_session_turns(self, user_sub: str, session_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError("MongoMemoryStore will be added post-MVP.")


def create_memory_store() -> MemoryStore:
    store_kind = os.getenv("SUBLETOPS_STORE", "inmemory").lower()
    if store_kind == "mongo":
        # TODO(post-mvp): swap to concrete Mongo implementation once infra is ready.
        return InMemoryStore()
    return InMemoryStore()
