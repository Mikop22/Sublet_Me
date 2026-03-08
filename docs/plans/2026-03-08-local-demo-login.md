# Local Demo Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dev-only `/demo-login?user=jordan` path that logs into the seeded host account without using Auth0.

**Architecture:** Reuse the existing host-resolution flow instead of building a second auth system. A dev-only cookie identifies the seeded demo user, middleware treats that cookie as authenticated for protected landlord routes, `requireCurrentHost()` falls back to the demo cookie when Auth0 is absent, and `/api/auth/profile` returns the same synthetic profile so existing pages keep working.

**Tech Stack:** Next.js App Router, TypeScript, Next middleware, cookies, existing Auth0 integration

---
