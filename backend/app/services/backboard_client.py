from __future__ import annotations

import os
from typing import Any

import httpx


class BackboardClient:
    def __init__(self, api_key: str, base_url: str) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.headers = {"X-API-Key": api_key}

    @classmethod
    def from_env(cls) -> "BackboardClient | None":
        api_key = os.getenv("BACKBOARD_API_KEY")
        if not api_key:
            return None
        base_url = os.getenv("BACKBOARD_BASE_URL", "https://app.backboard.io/api")
        return cls(api_key=api_key, base_url=base_url)

    def create_assistant(self, name: str, system_prompt: str) -> str:
        payload = {"name": name, "system_prompt": system_prompt}
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                f"{self.base_url}/assistants",
                json=payload,
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
        assistant_id = data.get("assistant_id")
        if not assistant_id:
            raise RuntimeError("Backboard response missing assistant_id")
        return str(assistant_id)

    def create_thread(self, assistant_id: str) -> str:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                f"{self.base_url}/assistants/{assistant_id}/threads",
                json={},
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
        thread_id = data.get("thread_id")
        if not thread_id:
            raise RuntimeError("Backboard response missing thread_id")
        return str(thread_id)

    def add_message(
        self,
        thread_id: str,
        content: str,
        memory_mode: str = "Auto",
    ) -> dict[str, Any]:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{self.base_url}/threads/{thread_id}/messages",
                headers=self.headers,
                data={"content": content, "stream": "false", "memory": memory_mode},
            )
            response.raise_for_status()
            data = response.json()
        return data if isinstance(data, dict) else {"content": str(data)}

    @staticmethod
    def extract_message_content(payload: dict[str, Any]) -> str | None:
        content = payload.get("content")
        if isinstance(content, str) and content.strip():
            return content.strip()

        # Defensive fallback for alternate response shapes.
        choices = payload.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message")
                if isinstance(message, dict):
                    text = message.get("content")
                    if isinstance(text, str) and text.strip():
                        return text.strip()
        return None
