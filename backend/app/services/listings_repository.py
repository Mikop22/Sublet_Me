from __future__ import annotations

from datetime import datetime, timezone
import os
import re
from typing import Any

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError


class ListingsRepository:
    DEFAULT_DB_NAME = "subletme"
    DEFAULT_COLLECTION_NAME = "listings"

    def __init__(self) -> None:
        mongo_url = os.getenv("MONGO_URL", "").strip()
        self._collection: Collection[Any] | None = None
        if not mongo_url:
            return

        db_name = (
            os.getenv("MONGO_DB_NAME")
            or os.getenv("DB_NAME")
            or self.DEFAULT_DB_NAME
        )
        collection_name = (
            os.getenv("MONGO_LISTINGS_COLLECTION")
            or os.getenv("LISTINGS_COLLECTION")
            or self.DEFAULT_COLLECTION_NAME
        )

        client = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
        self._collection = client[str(db_name)][str(collection_name)]

    @property
    def available(self) -> bool:
        return self._collection is not None

    def query_listings(
        self,
        *,
        city: str | None = None,
        budget: int | None = None,
        term: str | None = None,
        limit: int = 8,
    ) -> list[dict[str, Any]]:
        if self._collection is None:
            return []

        query: dict[str, Any] = {}
        and_conditions: list[dict[str, Any]] = [{"status": "active"}]

        if city:
            city_regex = {"$regex": re.escape(city), "$options": "i"}
            and_conditions.append(
                {
                    "$or": [
                        {"city": city_regex},
                        {"location.city": city_regex},
                        {"address": city_regex},
                    ]
                }
            )

        if budget is not None:
            max_budget = int(budget)
            and_conditions.append(
                {
                    "$or": [
                        {"price": {"$lte": max_budget}},
                        {"rent": {"$lte": max_budget}},
                        {"monthly_rent": {"$lte": max_budget}},
                    ]
                }
            )

        if term:
            term_regex = {"$regex": re.escape(term), "$options": "i"}
            and_conditions.append(
                {
                    "$or": [
                        {"term": term_regex},
                        {"dates": term_regex},
                        {"availability": term_regex},
                        {"requirements.termPreference": term_regex},
                    ]
                }
            )
            year_match = re.search(r"(20\d{2})", term)
            if year_match:
                year = int(year_match.group(1))
                start_of_year = datetime(year, 1, 1, tzinfo=timezone.utc)
                end_of_year = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
                and_conditions.append(
                    {
                        "$or": [
                            {
                                "dates.start": {
                                    "$gte": start_of_year,
                                    "$lt": end_of_year,
                                }
                            },
                            {
                                "dates.end": {
                                    "$gte": start_of_year,
                                    "$lt": end_of_year,
                                }
                            },
                            {
                                "requirements.termPreference": {
                                    "$regex": str(year),
                                    "$options": "i",
                                }
                            },
                        ]
                    }
                )

        if and_conditions:
            query["$and"] = and_conditions

        try:
            cursor = (
                self._collection.find(query, {"_id": 1, "title": 1, "address": 1, "city": 1, "location": 1, "price": 1, "rent": 1, "monthly_rent": 1, "dates": 1, "term": 1, "image": 1, "images": 1, "type": 1, "property_type": 1, "beds": 1, "bedrooms": 1, "host_name": 1, "host_university": 1, "host_avatar": 1, "host": 1, "university": 1, "tags": 1, "lifestyle_tags": 1, "requirements": 1, "status": 1, "description": 1, "url": 1, "slug": 1})
                .limit(max(1, min(limit, 20)))
            )
            return [dict(item) for item in cursor]
        except PyMongoError:
            return []
