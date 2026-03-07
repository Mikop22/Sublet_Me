## SubletOps Backend (MVP)

FastAPI service for orchestrator profile memory, turns, and recommendations.

### Run locally

```bash
python -m uvicorn main:app --reload --port 8000
```

### Endpoints

- `POST /v1/profiles/upsert`
- `POST /v1/orchestrator/turn`
- `POST /v1/matches/query`
- `GET /health`

### Storage adapter switch

- `SUBLETOPS_STORE=inmemory` (default)
- `SUBLETOPS_STORE=mongo` (placeholder path; currently falls back to in-memory)

The API contract is stable across store implementations so Mongo can be added
later without changing frontend/BFF endpoint contracts.

### Backboard integration

Set these environment variables in backend runtime:

- `BACKBOARD_API_KEY` (required to enable Backboard calls)
- `BACKBOARD_BASE_URL` (default: `https://app.backboard.io/api`)
- `BACKBOARD_ASSISTANT_ID` (optional, reuse an existing assistant)
- `BACKBOARD_ASSISTANT_NAME` (optional, used when creating assistant)
- `BACKBOARD_SYSTEM_PROMPT` (optional)

Behavior:

- If `BACKBOARD_API_KEY` is present, `POST /v1/orchestrator/turn` uses Backboard
  assistant/thread/message with `memory=Auto`.
- If Backboard is unavailable or not configured, service falls back to deterministic
  local orchestration responses (demo-safe mode).
