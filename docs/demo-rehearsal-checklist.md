# Demo Rehearsal Checklist

## Pre-Demo Setup

1. **Start MongoDB** — Ensure MongoDB is running locally or the `MONGODB_URI` points to a reachable instance.
2. **Start the backend** — `cd backend && uvicorn main:app --port 8000`
3. **Start the frontend** — `cd frontend && npm run dev`
4. **Seed data** — `cd frontend && npm run seed`

## Smoke Check

Run `cd frontend && npm run demo:smoke` to verify all endpoints respond.

## Demo Login

Use `/demo-login` to authenticate as a demo host without Auth0 credentials.

## Recovery Procedures

### If assistant history fails to load
- Check that the Python backend is running on port 8000
- The assistant will still work for new conversations — history is a convenience feature
- The page will show an empty chat state and remain fully usable

### If video pipeline media is still processing
- The landlord dashboard shows a "Processing" badge on the listing card
- The listing detail page shows an amber banner explaining the state
- The listing is fully functional without generated media

### If Backboard is unavailable
- The assistant automatically falls back to deterministic recommendations
- An amber banner on the assistant page indicates fallback mode
- All other features (dashboard, notifications, tours) are unaffected

### If MongoDB is unreachable
- Landlord pages will show error states with clear messaging
- The assistant still works via the Python backend's in-memory store
- Restart MongoDB and refresh — no data loss for seeded content

## Demo Flow (Suggested Order)

1. Open landlord dashboard — show stats and listings
2. Click into a listing — show matches, messages, tour scheduling
3. Open notifications — show derived activity feed
4. Open AI Studio — show real listing photo transformations
5. Switch to tenant view — open assistant, ask for listings
6. Show assistant recommendations and history persistence
