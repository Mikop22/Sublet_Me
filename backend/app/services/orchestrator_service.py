from __future__ import annotations

from datetime import datetime, timezone
import os

from app.models.orchestrator import (
    AssistantRuntimeMetadata,
    ChatTurn,
    ListingRecommendation,
    MatchQueryRequest,
    MatchQueryResponse,
    OrchestratorHistoryResponse,
    OrchestratorTurnRequest,
    OrchestratorTurnResponse,
    ProfilePreferences,
    ProfileRecord,
    ProfileUpsertRequest,
    ProfileUpsertResponse,
    RoommateRecommendation,
)
from app.services.backboard_client import BackboardClient
from app.services.memory_store import MemoryStore


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class OrchestratorService:
    def __init__(self, store: MemoryStore) -> None:
        self.store = store
        self.backboard_client = BackboardClient.from_env()
        self._assistant_id = os.getenv("BACKBOARD_ASSISTANT_ID")
        self._thread_by_user: dict[str, str] = {}

    def upsert_profile(self, payload: ProfileUpsertRequest) -> ProfileUpsertResponse:
        record = ProfileRecord(user=payload.user, profile=payload.profile)
        saved = self.store.upsert_profile(record)
        return ProfileUpsertResponse(status="ok", profile=saved)

    def process_turn(self, payload: OrchestratorTurnRequest) -> OrchestratorTurnResponse:
        session_id = self.store.create_or_get_session(payload.user.sub, payload.session_id)
        self.store.append_turn(
            user_sub=payload.user.sub,
            session_id=session_id,
            role="user",
            message=payload.message,
            metadata=payload.metadata,
        )

        profile_record = self.store.get_profile(payload.user.sub)
        profile = profile_record.profile if profile_record else ProfilePreferences()
        assistant_message, next_action, reasons = self._build_turn_response(
            payload.message, profile
        )
        assistant_source = "deterministic_fallback"

        backboard_message = self._generate_backboard_response(payload.user.sub, payload.message)
        if backboard_message:
            assistant_message = backboard_message
            next_action = "continue_conversation"
            reasons = [
                "Generated with Backboard thread context and persistent memory mode.",
                "Fallback logic remains available if Backboard is unavailable.",
            ]
            assistant_source = "backboard"

        self.store.append_turn(
            user_sub=payload.user.sub,
            session_id=session_id,
            role="assistant",
            message=assistant_message,
            metadata={"next_action": next_action, "source": assistant_source},
        )

        confidence = 0.88 if profile.city and profile.budget else 0.64
        listings = self._build_listing_recommendations(profile, limit=5)
        runtime_metadata = AssistantRuntimeMetadata(
            source=assistant_source,
            degraded=(assistant_source == "deterministic_fallback"),
        )
        return OrchestratorTurnResponse(
            session_id=session_id,
            assistant_message=assistant_message,
            next_action=next_action,
            confidence=confidence,
            reasons=reasons,
            metadata=runtime_metadata,
            listings=listings,
            updated_at=utc_now(),
        )

    def get_history(self, user_sub: str, session_id: str | None = None) -> OrchestratorHistoryResponse:
        if session_id is None:
            session_id = self.store.get_latest_session_id(user_sub)
        if session_id is None:
            return OrchestratorHistoryResponse()
        raw_turns = self.store.get_session_turns(user_sub, session_id)
        turns = [
            ChatTurn(
                role=t.get("role", "unknown"),
                message=t.get("message", ""),
                timestamp=t.get("timestamp", utc_now()),
                metadata=t.get("metadata", {}),
            )
            for t in raw_turns
        ]
        return OrchestratorHistoryResponse(session_id=session_id, turns=turns)

    def query_matches(self, payload: MatchQueryRequest) -> MatchQueryResponse:
        profile_record = self.store.get_profile(payload.user.sub)
        profile = profile_record.profile if profile_record else ProfilePreferences()

        listings = self._build_listing_recommendations(profile, payload.limit)
        roommates = self._build_roommate_recommendations(profile, limit=4)

        reasons = [
            "Prioritized preferences saved in your profile memory.",
            "Balanced budget, term alignment, and lifestyle overlap.",
            "Kept recommendations deterministic for demo reliability.",
        ]
        confidence = 0.9 if profile.city and profile.term and profile.budget else 0.7
        next_action = "message_hosts"

        return MatchQueryResponse(
            profile=profile,
            listings=listings,
            roommates=roommates,
            confidence=confidence,
            next_action=next_action,
            reasons=reasons,
        )

    def _generate_backboard_response(self, user_sub: str, user_message: str) -> str | None:
        if not self.backboard_client:
            return None
        try:
            assistant_id = self._ensure_assistant()
            thread_id = self._get_or_create_thread(user_sub, assistant_id)
            payload = self.backboard_client.add_message(
                thread_id=thread_id,
                content=user_message,
                memory_mode="Auto",
            )
            return BackboardClient.extract_message_content(payload)
        except Exception:
            return None

    def _ensure_assistant(self) -> str:
        if self._assistant_id:
            return self._assistant_id
        if not self.backboard_client:
            raise RuntimeError("Backboard client not initialized")

        assistant_name = os.getenv("BACKBOARD_ASSISTANT_NAME", "SubletOps Orchestrator")
        system_prompt = os.getenv(
            "BACKBOARD_SYSTEM_PROMPT",
            (
                "You are SubletOps Orchestrator. Coordinate long-running sublet "
                "searches for Canadian co-op students. Prioritize constraints, "
                "safety, and clear next actions."
            ),
        )
        self._assistant_id = self.backboard_client.create_assistant(
            name=assistant_name,
            system_prompt=system_prompt,
        )
        return self._assistant_id

    def _get_or_create_thread(self, user_sub: str, assistant_id: str) -> str:
        existing_thread = self._thread_by_user.get(user_sub)
        if existing_thread:
            return existing_thread
        if not self.backboard_client:
            raise RuntimeError("Backboard client not initialized")

        created_thread = self.backboard_client.create_thread(assistant_id)
        self._thread_by_user[user_sub] = created_thread
        return created_thread

    def _build_turn_response(
        self, user_message: str, profile: ProfilePreferences
    ) -> tuple[str, str, list[str]]:
        lowered = user_message.lower()
        if "budget" in lowered:
            return (
                "I updated your plan to prioritize listings inside your budget band first.",
                "refine_budget",
                ["Detected explicit budget intent in your request."],
            )
        if "roommate" in lowered or "vibe" in lowered:
            return (
                "I will optimize your next recommendations for roommate compatibility and vibe matching.",
                "refine_roommate_fit",
                ["Detected roommate compatibility intent."],
            )

        city = profile.city or "your target city"
        return (
            f"I have saved your latest preferences and will keep optimizing matches in {city}.",
            "review_matches",
            ["No specific override detected; continuing baseline optimization."],
        )

    def _build_listing_recommendations(
        self, profile: ProfilePreferences, limit: int
    ) -> list[ListingRecommendation]:
        city = profile.city or "Toronto"
        budget = profile.budget or 900
        lifestyles = profile.lifestyle_tags or ["Balanced lifestyle"]

        base = [
            ("Sunny Studio", "45 Liberty St", city, max(650, budget - 50), "May 1 - Aug 31", "Studio", 1, "Alex Chen", "UofT", 94),
            ("Downtown 1BR", "220 King St W", city, min(2200, budget + 25), "May 1 - Aug 31", "Apartment", 1, "Sarah Kim", "TMU", 91),
            ("Shared House Room", "88 Brunswick Ave", city, max(500, budget - 180), "May 1 - Aug 28", "Room", 1, "Marcus Johnson", "York", 88),
            ("Transit-Friendly Loft", "15 Mill St", city, min(2500, budget + 90), "May 5 - Aug 31", "Loft", 1, "Priya Patel", "UofT", 86),
            ("Campus Adjacent Suite", "2200 Yonge St", city, max(600, budget - 120), "May 1 - Aug 31", "Room", 1, "Jordan Lee", "UofT", 84),
            ("Co-op Term Sublet", "34 Kensington Ave", city, budget, "May 1 - Aug 25", "Apartment", 2, "Emma Wilson", "OCAD", 90),
            ("Quiet Annex Room", "10 Navy Wharf Ct", city, max(550, budget - 150), "May 1 - Aug 31", "Studio", 1, "David Park", "TMU", 83),
            ("Flexible Lease Unit", "1050 Queen St E", city, min(2500, budget + 110), "May 3 - Aug 30", "Room", 1, "Maya Singh", "UofT", 82),
        ]

        picks: list[ListingRecommendation] = []
        for idx, item in enumerate(base[:limit], start=1):
            title, address, listing_city, price, dates, listing_type, beds, host_name, host_university, match = item
            picks.append(
                ListingRecommendation(
                    id=f"listing-{idx}",
                    title=title,
                    address=address,
                    city=listing_city,
                    price=price,
                    dates=dates,
                    image=f"https://picsum.photos/seed/subletops-{idx}/800/600",
                    type=listing_type,
                    beds=beds,
                    host_name=host_name,
                    host_university=host_university,
                    host_avatar=f"https://i.pravatar.cc/100?img={idx + 10}",
                    match=match,
                    reasons=[
                        f"Aligned with your {profile.term or 'upcoming'} term window.",
                        f"Lifestyle overlap: {lifestyles[0]}",
                    ],
                )
            )
        return picks

    def _build_roommate_recommendations(
        self, profile: ProfilePreferences, limit: int
    ) -> list[RoommateRecommendation]:
        university = profile.university or "University Network"
        vibe = profile.roommate_vibe or "balanced"
        base_names = ["Alex", "Priya", "Jordan", "Maya", "Chris"]
        scores = [93, 90, 88, 86, 84]

        suggestions: list[RoommateRecommendation] = []
        for idx, (name, score) in enumerate(zip(base_names, scores), start=1):
            if idx > limit:
                break
            suggestions.append(
                RoommateRecommendation(
                    id=f"roommate-{idx}",
                    name=f"{name} Candidate",
                    university=university,
                    compatibility=score,
                    reasons=[
                        f"Compatible with your declared roommate vibe: {vibe}.",
                        "Overlap on term and lifestyle priorities.",
                    ],
                )
            )
        return suggestions
