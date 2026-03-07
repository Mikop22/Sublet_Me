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
```

Generate `AUTH0_SECRET` with:

```bash
openssl rand -hex 32
```

In the Auth0 Dashboard, create a **Regular Web Application** and configure:

- Allowed Callback URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-production-domain>/auth/callback`
- Allowed Logout URLs:
  - `http://localhost:3000`
  - `https://<your-production-domain>`
- Allowed Web Origins:
  - `http://localhost:3000`
  - `https://<your-production-domain>`

## Auth Routes

Auth0 SDK routes are mounted at:

- `/auth/login`
- `/auth/logout`
- `/auth/callback`
- `/auth/profile`

Legacy-compatible redirect routes are also available under `/api/auth/[auth0]`.
