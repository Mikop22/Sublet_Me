## SubletOps Backend (MVP)

FastAPI service for orchestrator profile memory, turns, and recommendations.

### Run locally

```bash
python -m uvicorn main:app --reload --port 8000
```

### Endpoints

- `POST /v1/profiles/upsert`
- `POST /v1/orchestrator/turn`
- `GET /v1/orchestrator/history`
- `POST /v1/matches/query`
- `GET /health`

### CLI prompt test (backend only)

Run the agent directly from command line (no frontend required):

```bash
./.venv/bin/python scripts/agent_prompt.py --message "find leases for 2026 within 1k in kitchener"
```

Optionally seed profile context before the turn:

```bash
./.venv/bin/python scripts/agent_prompt.py \
  --message "find waterloo under 500 a month in 2026" \
  --city Waterloo \
  --budget 500 \
  --term 2026
```

### Mongo listings search

Set this for live listings lookup in chatbot search turns:

- `MONGO_URL` (required for live Mongo queries)

When a user asks to find/search listings, the orchestrator queries
`subletme.listings` on every turn and formats results for the chat UI.

Conversation memory and profile persistence are stored in:

- `subletme.conversations`
- `subletme.users`

### Storage adapter switch

- `SUBLETOPS_STORE=auto` (default; uses Mongo when `MONGO_URL` is set)
- `SUBLETOPS_STORE=inmemory` (force in-memory for local testing)
- `SUBLETOPS_STORE=mongo` (force Mongo-backed memory/profile storage)

The API contract stays stable across store implementations.

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
