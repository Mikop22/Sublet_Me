from __future__ import annotations

from datetime import datetime, timezone
import json
import os
import re
from typing import Any

from app.models.orchestrator import (
    TurnMessage,
    OrchestratorHistoryResponse,
    ListingRecommendation,
    MatchQueryRequest,
    MatchQueryResponse,
    OrchestratorTurnRequest,
    OrchestratorTurnResponse,
    ProfilePreferences,
    ProfileRecord,
    ProfileUpsertRequest,
    ProfileUpsertResponse,
    RoommateRecommendation,
)
from app.services.backboard_client import BackboardClient
from app.services.listings_repository import ListingsRepository
from app.services.memory_store import MemoryStore


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class OrchestratorService:
    def __init__(self, store: MemoryStore) -> None:
        self.store = store
        self.backboard_client = BackboardClient.from_env()
        self.listings_repository = ListingsRepository()
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
        search_constraints = self._extract_search_constraints(payload.message, profile)
        profile = self._apply_message_preference_updates(
            user=payload.user,
            profile=profile,
            original_profile_record=profile_record,
            message=payload.message,
            constraints=search_constraints,
        )
        listings_from_mongo: list[ListingRecommendation] = []
        search_requested = self._is_search_intent(payload.message)
        mongo_available = self.listings_repository.available

        assistant_message, next_action, reasons = self._build_turn_response(
            payload.message, profile
        )
        assistant_source = "deterministic_fallback"
        backboard_message: str | None = None

        if search_requested:
            agentic_result = self._run_agentic_search_turn(
                user_sub=payload.user.sub,
                user_message=payload.message,
                default_constraints=search_constraints,
                default_limit=8,
            )
            if agentic_result:
                assistant_message = agentic_result.get("assistant_message") or assistant_message
                listings_from_mongo = agentic_result.get("listings", [])
                next_action = "review_matches"
                reasons = [
                    "Backboard selected and executed read-only search tool calls.",
                    "Response generated from retrieved listing context.",
                ]
                assistant_source = "backboard_agentic"
            else:
                listings_from_mongo = self._query_listings_with_constraints(search_constraints, limit=8)
                if self.backboard_client:
                    backboard_prompt = self._build_tool_result_prompt(
                        user_message=payload.message,
                        constraints=search_constraints,
                        listings=listings_from_mongo,
                    )
                    backboard_message = self._generate_backboard_response(
                        payload.user.sub, backboard_prompt
                    )
                    if backboard_message:
                        assistant_message = backboard_message
                        assistant_source = "backboard"
        else:
            backboard_message = self._generate_backboard_response(payload.user.sub, payload.message)
            if backboard_message:
                assistant_message = backboard_message
                next_action = "continue_conversation"
                reasons = [
                    "Generated with Backboard thread context and persistent memory mode.",
                    "Fallback logic remains available if Backboard is unavailable.",
                ]
                assistant_source = "backboard"

        if search_requested:
            next_action = "review_matches"
            if listings_from_mongo:
                reasons = [
                    "Matched your request against currently available listings.",
                    "Applied your constraints and saved profile context for follow-ups.",
                ]
            else:
                if mongo_available:
                    reasons = [
                        "Search intent detected, but no listings matched current constraints.",
                        "Try widening city, budget, or term constraints.",
                    ]
                else:
                    reasons = [
                        "Mongo listings source is unavailable right now.",
                        "Please try again shortly.",
                    ]

        self.store.append_turn(
            user_sub=payload.user.sub,
            session_id=session_id,
            role="assistant",
            message=assistant_message,
            metadata={
                "next_action": next_action,
                "source": assistant_source,
                "search_requested": search_requested,
                "result_count": len(listings_from_mongo),
            },
        )

        confidence = 0.88 if profile.city and profile.budget else 0.64
        return OrchestratorTurnResponse(
            session_id=session_id,
            assistant_message=assistant_message,
            next_action=next_action,
            confidence=confidence,
            listings=listings_from_mongo,
            reasons=reasons,
            updated_at=utc_now(),
        )

    def _run_agentic_search_turn(
        self,
        *,
        user_sub: str,
        user_message: str,
        default_constraints: dict[str, Any],
        default_limit: int,
    ) -> dict[str, Any] | None:
        if not self.backboard_client:
            return None
        try:
            assistant_id = self._ensure_assistant()
            thread_id = self._get_or_create_thread(user_sub, assistant_id)

            tool_prompt = self._build_tool_selection_prompt(
                user_message=user_message,
                default_constraints=default_constraints,
                default_limit=default_limit,
            )
            decision_payload = self.backboard_client.add_message(
                thread_id=thread_id,
                content=tool_prompt,
                memory_mode="Auto",
            )
            decision_text = BackboardClient.extract_message_content(decision_payload) or ""
            decision = self._parse_tool_decision(decision_text)
            if not decision:
                return None

            if decision["action"] == "respond":
                return {"assistant_message": decision.get("message") or "", "listings": []}

            if decision["action"] != "search_listings":
                return None

            args = decision.get("arguments", {})
            city = args.get("city") or default_constraints.get("city")
            budget = args.get("budget")
            if budget is None:
                budget = default_constraints.get("budget")
            term = args.get("term") or default_constraints.get("term")
            limit = args.get("limit")
            if not isinstance(limit, int):
                limit = default_limit
            limit = max(1, min(limit, 20))

            listings = self._query_listings_with_constraints(
                {"city": city, "budget": budget, "term": term},
                limit=limit,
            )

            tool_result_prompt = self._build_tool_result_prompt(
                user_message=user_message,
                constraints={"city": city, "budget": budget, "term": term},
                listings=listings,
            )
            final_payload = self.backboard_client.add_message(
                thread_id=thread_id,
                content=tool_result_prompt,
                memory_mode="Auto",
            )
            final_text = BackboardClient.extract_message_content(final_payload)
            if not final_text:
                return None

            return {"assistant_message": final_text, "listings": listings}
        except Exception:
            return None

    def query_matches(self, payload: MatchQueryRequest) -> MatchQueryResponse:
        profile_record = self.store.get_profile(payload.user.sub)
        profile = profile_record.profile if profile_record else ProfilePreferences()

        listings = self._query_listings_with_constraints(
            {"city": profile.city, "budget": profile.budget, "term": profile.term},
            limit=payload.limit,
        )
        if not listings:
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

    def get_history(
        self, *, user_sub: str, session_id: str | None = None
    ) -> OrchestratorHistoryResponse:
        resolved_session_id = session_id or self.store.get_latest_session_id(user_sub)
        if not resolved_session_id:
            return OrchestratorHistoryResponse(session_id=None, turns=[])

        turns = self.store.get_session_turns(user_sub, resolved_session_id)
        mapped_turns = [
            TurnMessage(
                role=str(turn.get("role", "")),
                message=str(turn.get("message", "")),
                timestamp=str(turn.get("timestamp", "")),
                metadata=turn.get("metadata", {}) if isinstance(turn.get("metadata"), dict) else {},
            )
            for turn in turns
        ]
        return OrchestratorHistoryResponse(session_id=resolved_session_id, turns=mapped_turns)

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

    def _is_search_intent(self, message: str) -> bool:
        lowered = message.lower()
        tokens = (
            "find",
            "search",
            "show",
            "listing",
            "listings",
            "sublet",
            "room",
            "rooms",
            "lease",
            "leases",
            "studio",
            "studios",
            "apartment",
            "apartments",
        )
        return any(token in lowered for token in tokens)

    def _extract_search_constraints(
        self, message: str, profile: ProfilePreferences
    ) -> dict[str, Any]:
        lowered = message.lower()
        budget = profile.budget
        budget_k_match = re.search(r"(\d+(?:\.\d+)?)\s*k\b", lowered)
        if budget_k_match:
            budget = int(float(budget_k_match.group(1)) * 1000)
        else:
            budget_match = re.search(r"(?:under|within|below|max|budget)?\s*\$?\s?(\d{3,4})", lowered)
            if budget_match:
                budget = int(budget_match.group(1))

        city = profile.city
        common_cities = [
            "toronto",
            "waterloo",
            "kitchener",
            "cambridge",
            "vancouver",
            "ottawa",
            "montreal",
            "calgary",
            "edmonton",
            "halifax",
            "victoria",
            "london",
        ]
        for candidate in common_cities:
            if candidate in lowered:
                city = candidate.title()
                break

        term = profile.term
        term_match = re.search(r"(summer|fall|winter)\s+20\d{2}", lowered)
        if term_match:
            term = term_match.group(0).title()
        else:
            year_match = re.search(r"\b(20\d{2})\b", lowered)
            if year_match:
                term = year_match.group(1)

        return {"city": city, "budget": budget, "term": term}

    def _apply_message_preference_updates(
        self,
        *,
        user: Any,
        profile: ProfilePreferences,
        original_profile_record: ProfileRecord | None,
        message: str,
        constraints: dict[str, Any],
    ) -> ProfilePreferences:
        updated = profile.model_copy(deep=True)
        changed = False

        city = constraints.get("city")
        budget = constraints.get("budget")
        term = constraints.get("term")
        if city and city != updated.city:
            updated.city = city
            changed = True
        if budget and budget != updated.budget:
            updated.budget = int(budget)
            changed = True
        if term and term != updated.term:
            updated.term = term
            changed = True

        lowered = message.lower()
        if any(tag in lowered for tag in ("quiet", "social", "clean", "early", "night")):
            vibe = "quiet" if "quiet" in lowered else "social" if "social" in lowered else updated.roommate_vibe
            if vibe and vibe != updated.roommate_vibe:
                updated.roommate_vibe = vibe
                changed = True

        if not changed:
            return updated

        record = ProfileRecord(user=user, profile=updated)
        if original_profile_record:
            record.created_at = original_profile_record.created_at
        saved = self.store.upsert_profile(record)
        return saved.profile

    def _query_listings_with_constraints(
        self, constraints: dict[str, Any], *, limit: int
    ) -> list[ListingRecommendation]:
        records = self.listings_repository.query_listings(
            city=constraints.get("city"),
            budget=constraints.get("budget"),
            term=constraints.get("term"),
            limit=limit,
        )
        return [self._map_listing_record(record, idx) for idx, record in enumerate(records, start=1)]

    def _map_listing_record(self, record: dict[str, Any], idx: int) -> ListingRecommendation:
        host = record.get("host") if isinstance(record.get("host"), dict) else {}
        listing_id = str(record.get("_id") or record.get("id") or f"listing-{idx}")
        listing_url = record.get("url")
        if not isinstance(listing_url, str) or not listing_url.strip():
            base_url = os.getenv("LISTING_PUBLIC_BASE_URL", "http://localhost:3000/listings").rstrip("/")
            slug = record.get("slug")
            if isinstance(slug, str) and slug.strip():
                listing_url = f"{base_url}/{slug.strip()}"
            else:
                listing_url = f"{base_url}/{listing_id}"

        city = (
            record.get("city")
            or (record.get("location") or {}).get("city")
            or "Toronto"
        )
        price = (
            record.get("price")
            or record.get("rent")
            or record.get("monthly_rent")
            or 900
        )
        termish = self._format_listing_dates(record)
        image = record.get("image")
        if not image and isinstance(record.get("images"), list) and record.get("images"):
            image = record["images"][0]
        if not isinstance(image, str) or not image:
            image = f"https://picsum.photos/seed/mongo-listing-{idx}/800/600"

        listing_type = record.get("type") or record.get("property_type") or "Room"
        beds = record.get("beds") or record.get("bedrooms") or 1
        host_name = record.get("host_name") or host.get("name") or "Host"
        host_university = (
            record.get("host_university")
            or host.get("university")
            or record.get("university")
            or "University Network"
        )
        host_avatar = (
            record.get("host_avatar")
            or host.get("avatar")
            or f"https://i.pravatar.cc/100?img={idx + 20}"
        )

        tags = record.get("tags") or record.get("lifestyle_tags") or []
        if not tags and isinstance(record.get("requirements"), dict):
            tags = record["requirements"].get("lifestyleTags", [])
        primary_tag = tags[0] if isinstance(tags, list) and tags else "Preference match"

        return ListingRecommendation(
            id=listing_id,
            title=str(record.get("title") or "Available Listing"),
            url=str(listing_url),
            address=str(record.get("address") or "Address not provided"),
            city=str(city),
            price=int(price),
            dates=str(termish),
            image=str(image),
            type=str(listing_type),
            beds=int(beds),
            host_name=str(host_name),
            host_university=str(host_university),
            host_avatar=str(host_avatar),
            match=max(70, 95 - (idx * 2)),
            reasons=[
                "Matched your request constraints.",
                f"Lifestyle/context match: {primary_tag}",
            ],
        )

    def _format_listing_dates(self, record: dict[str, Any]) -> str:
        raw_dates = record.get("dates")
        if isinstance(raw_dates, dict):
            start = self._coerce_to_datetime(raw_dates.get("start"))
            end = self._coerce_to_datetime(raw_dates.get("end"))
            if start or end:
                start_txt = start.strftime("%b %-d, %Y") if start else "Start TBD"
                end_txt = end.strftime("%b %-d, %Y") if end else "End TBD"
                return f"{start_txt} - {end_txt}"

        if isinstance(raw_dates, str) and raw_dates.strip():
            return raw_dates.strip()

        raw_term = record.get("term")
        if isinstance(raw_term, str) and raw_term.strip():
            return raw_term.strip()

        requirements = record.get("requirements")
        if isinstance(requirements, dict):
            pref = requirements.get("termPreference")
            if isinstance(pref, str) and pref.strip():
                return pref.strip()

        return "Flexible term"

    def _coerce_to_datetime(self, value: Any) -> datetime | None:
        if isinstance(value, datetime):
            return value
        if isinstance(value, dict):
            nested = value.get("$date")
            if isinstance(nested, str):
                try:
                    return datetime.fromisoformat(nested.replace("Z", "+00:00"))
                except ValueError:
                    return None
            return None
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None

    def _build_tool_selection_prompt(
        self,
        *,
        user_message: str,
        default_constraints: dict[str, Any],
        default_limit: int,
    ) -> str:
        return (
            "You are selecting a read-only tool call.\n"
            "Available tools:\n"
            "- search_listings(city?: string, budget?: number, term?: string, limit?: number)\n"
            "- respond(message: string)\n\n"
            "Rules:\n"
            "1) Use search_listings for any rental/lease/find/search request.\n"
            "2) Never request write/update/delete operations.\n"
            "3) Return STRICT JSON only, no markdown.\n"
            "4) JSON schema:\n"
            '{"action":"search_listings","arguments":{"city":"...","budget":900,"term":"Summer 2025","limit":8}}\n'
            'or {"action":"respond","message":"..."}\n\n'
            f"User message: {user_message}\n"
            f"Fallback city: {default_constraints.get('city')}\n"
            f"Fallback budget: {default_constraints.get('budget')}\n"
            f"Fallback term: {default_constraints.get('term')}\n"
            f"Fallback limit: {default_limit}"
        )

    def _parse_tool_decision(self, text: str) -> dict[str, Any] | None:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()
        try:
            payload = json.loads(cleaned)
        except json.JSONDecodeError:
            return None
        if not isinstance(payload, dict):
            return None
        action = payload.get("action")
        if action not in {"search_listings", "respond"}:
            return None
        return payload

    def _build_tool_result_prompt(
        self,
        *,
        user_message: str,
        constraints: dict[str, Any],
        listings: list[ListingRecommendation],
    ) -> str:
        lines = []
        for idx, listing in enumerate(listings[:8], start=1):
            lines.append(
                f"{idx}. {listing.title} | {listing.city} | ${listing.price}/mo | "
                f"{listing.dates} | {listing.type} | {listing.url or ''}"
            )
        listings_block = "\n".join(lines) if lines else "(no matches)"

        return (
            f"User request: {user_message}\n\n"
            "Tool used: search_listings (read-only)\n"
            f"Resolved constraints: city={constraints.get('city')}, "
            f"budget={constraints.get('budget')}, term={constraints.get('term')}\n"
            f"Tool results:\n{listings_block}\n\n"
            "Now respond to the user naturally and helpfully.\n"
            "Do not mention databases, Mongo, tools, or internal system behavior.\n"
            "If matches exist, suggest the best options and include links."
        )

    def _build_backboard_search_prompt(
        self,
        user_message: str,
        constraints: dict[str, Any],
        listings: list[ListingRecommendation],
    ) -> str:
        lines = []
        for idx, listing in enumerate(listings[:8], start=1):
            lines.append(
                f"{idx}. {listing.title} | {listing.city} | ${listing.price}/mo | "
                f"{listing.dates} | {listing.type} | {listing.url or ''}"
            )

        city = constraints.get("city") or "unspecified city"
        budget = constraints.get("budget")
        term = constraints.get("term") or "flexible term"
        budget_text = f"${budget}" if budget else "unspecified budget"

        return (
            "User request: "
            f"{user_message}\n\n"
            "Retrieved listing context:\n"
            f"- City: {city}\n"
            f"- Budget cap: {budget_text}\n"
            f"- Term: {term}\n"
            f"- Matches:\n" + "\n".join(lines) + "\n\n"
            "Respond as a rental assistant. Give concise recommendations from these matches, "
            "mention listing links when useful, and do not mention databases, Mongo, queries, "
            "or internal system details."
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
