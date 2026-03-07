# Landlord Dashboard Design

**Date:** 2026-03-07
**Status:** Approved

## Overview

The landlord dashboard serves anyone listing a place to sublet — students going on co-op, or anyone with a unit available. Backboard.io's agentic AI matches co-op students to listings based on collected form data, listing photos, and lifestyle compatibility. Landlords set requirements per listing; the AI surfaces matched students ranked by compatibility score.

---

## User Type

- Any person with a place to sublet (student or otherwise)
- Can have **multiple active listings** simultaneously
- Cannot browse students freely — they only see students the AI matched to their listing
- Can set requirements per listing to influence AI matching

---

## Layout Approach: Overview-First with Drill-Down

**Overview page** — high-level dashboard showing all listings + stats at a glance.
**Listing detail page** — drills into a specific listing to show matches, messages, and tour schedule.

---

## Section 1: Dashboard Overview (Landing Page)

### Nav Bar
- Sticky, frosted glass (consistent with subletter nav)
- Logo left
- Notification bell with unread badge (new matches, messages) right
- Profile avatar right

### Greeting + Stats Row
- "Good morning, [Name]" heading (DM Serif, same as subletter dashboard)
- 4 stat cards in a row:
  - Active listings
  - Total matches (across all listings)
  - Unread messages
  - Upcoming tours

### Listings Grid
One card per listing, grid layout (3 columns on desktop, 2 on tablet, 1 on mobile).

Each card shows:
- Listing photo + title + address
- Status badge: `Active` / `Paused` / `Filled`
- 3 quick stats: `X matches · Y views · Z inquiries`
- Availability dates
- 3-dot menu: Edit · Pause · Delete
- "View matches" CTA — drills into listing detail

### Add Listing Card
- Last card in grid
- Dashed border, centered "+" icon
- Navigates to listing creation flow

---

## Section 2: Listing Detail View

Accessed by clicking "View matches" on a listing card.

### Header
- Back arrow + listing title + status badge
- Edit button top right

### Two-Column Layout

**Left column (narrower) — Listing summary + Requirements**
- Thumbnail photo, price, dates, address
- Collapsible "Requirements" panel:
  - Budget range expected
  - Lifestyle tags (e.g. Non-smoker, Quiet, Fitness lover)
  - Co-op term preference
  - Pet policy
  - Gender preference
  - Number of occupants
  - References required (toggle)
- "Edit requirements" link — opens a modal (styled like create-profile form)

**Right column (wider) — Matched students**
- Section header: "X students matched to this listing"
- Student cards ranked by AI match score:
  - Avatar, name, university, co-op term
  - Match % badge (same style as subletter match score)
  - Shared lifestyle tags highlighted
  - Two action buttons: `Message` · `Schedule Tour`
- `Message` → opens slide-in chat panel (listing stays visible)
- `Schedule Tour` → opens tour scheduling modal

---

## Section 3: Messaging & Tour Scheduling

### Slide-In Chat Panel
- Slides in from the right; listing detail remains visible behind it
- Header: student avatar + name + match % + listing title
- Message thread with timestamps (landlord bubbles on right)
- Input bar: text field + photo attach + "Propose a tour" button
- If a tour is scheduled: pinned banner at top of chat showing date/time + "Join Google Meet" link

### Tour Scheduling Modal
**Step 1 — Propose slots**
- Landlord picks 3 time slots (date + time picker, 3 rows)

**Step 2 — Confirmation**
- Preview of 3 proposed slots
- "Send to [Student name]" confirm button

**On confirm:**
- Slots appear as a special message bubble in chat with 3 tappable time options
- Student selects a time → confirmation message sent to both + Google Meet link generated + calendar invite sent to both emails

### Inbox (Messages overview)
- Accessible from notification bell or stats card shortcut
- Full-page list of all conversations across all listings
- Each row: student avatar, name, listing they're matched to, last message preview, timestamp, unread dot
- Clicking a row opens the slide-in chat panel

---

## Requirements Fields (per listing)

| Field | Type |
|---|---|
| Budget range expected | Min/max number inputs |
| Lifestyle tags | Multi-select (same tags as subletter profile) |
| Co-op term preference | Dropdown (Summer/Fall/Winter + year) |
| Pet policy | Toggle (No pets / Pets OK) |
| Gender preference | Dropdown (No preference / Male / Female / Non-binary) |
| Number of occupants | Number input |
| References required | Toggle |

---

## Design Consistency

- Same font stack: DM Serif for headings, Inter for body
- Same color tokens: `bg-surface`, `text-foreground`, `text-muted`, `text-accent`
- Same card style: `rounded-2xl`, `border border-warm-gray/10`, `bg-surface`
- Same motion: Framer Motion reveals, `whileHover={{ y: -4 }}`
- Same nav pattern: sticky frosted glass
