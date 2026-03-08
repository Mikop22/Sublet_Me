from __future__ import annotations

from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import datetime, timezone
import os
from typing import Any
from uuid import uuid4

from app.models.orchestrator import ProfileRecord
from pymongo import DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError


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

    @abstractmethod
    def get_latest_session_id(self, user_sub: str) -> str | None:
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

    def get_latest_session_id(self, user_sub: str) -> str | None:
        sessions = self._sessions.get(user_sub, {})
        if not sessions:
            return None

        latest_id: str | None = None
        latest_ts = ""
        for session_id, turns in sessions.items():
            if not turns:
                continue
            ts = str(turns[-1].get("timestamp", ""))
            if ts >= latest_ts:
                latest_ts = ts
                latest_id = session_id
        return latest_id or next(iter(sessions))


class MongoMemoryStore(MemoryStore):
    DB_NAME = "subletme"
    PROFILES_COLLECTION = "users"
    CONVERSATIONS_COLLECTION = "conversations"

    def __init__(self, mongo_url: str) -> None:
        self._client = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
        db = self._client[self.DB_NAME]
        self._profiles: Collection[Any] = db[self.PROFILES_COLLECTION]
        self._conversations: Collection[Any] = db[self.CONVERSATIONS_COLLECTION]

    def upsert_profile(self, record: ProfileRecord) -> ProfileRecord:
        now = utc_now()
        payload = record.model_dump(mode="json")
        try:
            self._profiles.update_one(
                {"user_sub": record.user.sub},
                {
                    "$set": {
                        "user_sub": record.user.sub,
                        "user": payload["user"],
                        "profile": payload["profile"],
                        "updated_at": now,
                    },
                    "$setOnInsert": {"created_at": now},
                },
                upsert=True,
            )
            return self.get_profile(record.user.sub) or record
        except PyMongoError:
            record.updated_at = now
            return record

    def get_profile(self, user_sub: str) -> ProfileRecord | None:
        try:
            doc = self._profiles.find_one({"user_sub": user_sub})
        except PyMongoError:
            return None
        if not doc:
            return None
        return ProfileRecord.model_validate(
            {
                "user": doc.get("user", {"sub": user_sub}),
                "profile": doc.get("profile", {}),
                "created_at": doc.get("created_at", utc_now()),
                "updated_at": doc.get("updated_at", utc_now()),
            }
        )

    def create_or_get_session(self, user_sub: str, session_id: str | None) -> str:
        resolved_session_id = session_id or str(uuid4())
        now = utc_now()
        try:
            self._conversations.update_one(
                {"user_sub": user_sub, "session_id": resolved_session_id},
                {
                    "$setOnInsert": {
                        "user_sub": user_sub,
                        "session_id": resolved_session_id,
                        "turns": [],
                        "created_at": now,
                    },
                    "$set": {"updated_at": now},
                },
                upsert=True,
            )
        except PyMongoError:
            pass
        return resolved_session_id

    def append_turn(
        self,
        user_sub: str,
        session_id: str,
        role: str,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        turn = {
            "role": role,
            "message": message,
            "metadata": metadata or {},
            "timestamp": utc_now().isoformat(),
        }
        now = utc_now()
        try:
            self._conversations.update_one(
                {"user_sub": user_sub, "session_id": session_id},
                {
                    "$setOnInsert": {
                        "user_sub": user_sub,
                        "session_id": session_id,
                        "created_at": now,
                    },
                    "$push": {"turns": turn},
                    "$set": {"updated_at": now},
                },
                upsert=True,
            )
        except PyMongoError:
            pass

    def get_session_turns(self, user_sub: str, session_id: str) -> list[dict[str, Any]]:
        try:
            doc = self._conversations.find_one(
                {"user_sub": user_sub, "session_id": session_id},
                {"turns": 1},
            )
        except PyMongoError:
            return []
        if not doc:
            return []
        turns = doc.get("turns", [])
        return list(turns) if isinstance(turns, list) else []

    def get_latest_session_id(self, user_sub: str) -> str | None:
        try:
            doc = self._conversations.find_one(
                {"user_sub": user_sub},
                {"session_id": 1},
                sort=[("updated_at", DESCENDING)],
            )
        except PyMongoError:
            return None
        if not doc:
            return None
        session_id = doc.get("session_id")
        return str(session_id) if session_id else None


def create_memory_store() -> MemoryStore:
    store_kind = os.getenv("SUBLETOPS_STORE", "auto").lower()
    mongo_url = os.getenv("MONGO_URL", "").strip()

    if store_kind == "mongo":
        if not mongo_url:
            return InMemoryStore()
        return MongoMemoryStore(mongo_url)

    if store_kind == "inmemory":
        return InMemoryStore()

    if mongo_url:
        return MongoMemoryStore(mongo_url)
    return InMemoryStore()
