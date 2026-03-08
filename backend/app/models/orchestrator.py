from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserContext(BaseModel):
    sub: str
    email: str | None = None
    email_verified: bool = False
    verification_tier: str = "authenticated"


class ProfilePreferences(BaseModel):
    name: str | None = None
    user_type: str | None = None
    city: str | None = None
    term: str | None = None
    budget: int | None = None
    university: str | None = None
    company: str | None = None
    commute_tolerance_minutes: int | None = None
    roommate_vibe: str | None = None
    lifestyle_tags: list[str] = Field(default_factory=list)
    bio: str | None = None


class ProfileRecord(BaseModel):
    user: UserContext
    profile: ProfilePreferences
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ProfileUpsertRequest(BaseModel):
    user: UserContext
    profile: ProfilePreferences


class ProfileUpsertResponse(BaseModel):
    status: str
    profile: ProfileRecord


class OrchestratorTurnRequest(BaseModel):
    user: UserContext
    message: str = Field(min_length=1)
    session_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class OrchestratorTurnResponse(BaseModel):
    session_id: str
    assistant_message: str
    next_action: str
    confidence: float
    listings: list["ListingRecommendation"] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=utc_now)


class ListingRecommendation(BaseModel):
    id: str
    title: str
    url: str | None = None
    address: str
    city: str
    price: int
    dates: str
    image: str
    type: str
    beds: int
    host_name: str
    host_university: str
    host_avatar: str
    match: int
    reasons: list[str] = Field(default_factory=list)


class RoommateRecommendation(BaseModel):
    id: str
    name: str
    university: str
    compatibility: int
    reasons: list[str] = Field(default_factory=list)


class MatchQueryRequest(BaseModel):
    user: UserContext
    limit: int = Field(default=8, ge=1, le=20)


class MatchQueryResponse(BaseModel):
    profile: ProfilePreferences
    listings: list[ListingRecommendation] = Field(default_factory=list)
    roommates: list[RoommateRecommendation] = Field(default_factory=list)
    confidence: float
    next_action: str
    reasons: list[str] = Field(default_factory=list)


class TurnMessage(BaseModel):
    role: str
    message: str
    timestamp: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class OrchestratorHistoryResponse(BaseModel):
    session_id: str | None = None
    turns: list[TurnMessage] = Field(default_factory=list)
