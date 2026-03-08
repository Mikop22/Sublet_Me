# Sublet-Me Frontend

Next.js App Router frontend for the Sublet-Me prototype.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Fill in your Auth0 values in `.env.local`.

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth0 Setup

This project uses `@auth0/nextjs-auth0`.

Required environment variables:

```env
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_SECRET=
APP_BASE_URL=http://localhost:3000
SUBLETOPS_BACKEND_URL=http://localhost:8000
```

Generate `AUTH0_SECRET` with:

```bash
openssl rand -hex 32
```

In the Auth0 Dashboard, create a **Regular Web Application** and configure:

- Allowed Callback URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/api/auth/callback`
  - `https://<your-production-domain>/auth/callback`
  - `https://<your-production-domain>/api/auth/callback`
- Allowed Logout URLs:
  - `http://localhost:3000`
  - `https://<your-production-domain>`
- Allowed Web Origins:
  - `http://localhost:3000`
  - `https://<your-production-domain>`

## Auth Routes

User-facing routes in this app:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/callback`
- `/api/auth/profile`

The SDK still mounts internal routes at `/auth/*`, and `/api/auth/[auth0]` forwards to those SDK routes.

## SubletOps Orchestrator (MVP)

Frontend uses Next.js BFF routes for orchestrator calls:

- `POST /api/subletops/profile`
- `POST /api/subletops/turn`
- `GET /api/subletops/turn` (history hydration)
- `POST /api/subletops/matches`

These routes read Auth0 session context server-side and forward requests to the
FastAPI backend at `SUBLETOPS_BACKEND_URL`.

Chatbot UI route:

- `/assistant` (Auth0-gated in middleware)

For local development, you can register both callback URLs:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/api/auth/callback`
