# Ravenna Kanban

A full-stack Kanban board product built for the Ravenna coding challenge.

## Screenshots

![Kanban board with active drag and drop](demo-images/image.png)

![generic example](demo-images/image2.png)

![dark mode](demo-images/image3.png)

---

## Quick Start

**Prerequisites**: Node 20+, Docker Desktop running.

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install all dependencies (monorepo workspaces)
npm install

# 3. Generate Prisma client + run migrations
npm run db:migrate

# 4. Seed the database with sample data
npm run db:seed

# 5. Start both servers concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Prisma Studio: `npm run db:studio` (in `backend/`)

### Environment variables

Both workspaces ship `.env.example`. The defaults work out-of-the-box with `docker compose up`.

| File | Variable | Default |
|---|---|---|
| `backend/.env` | `DATABASE_URL` | `postgresql://ravenna:ravenna@localhost:5432/ravenna` |
| `backend/.env` | `PORT` | `3001` |
| `backend/.env` | `RATE_LIMIT_MAX` | `300` (requests per IP per window) |
| `backend/.env` | `RATE_LIMIT_WINDOW_MS` | `60000` (1 minute) |
| `frontend/.env` | `VITE_API_URL` | _(empty — proxied via Vite)_ |

---

## Architecture Overview

```
ravenna/
  docker-compose.yml        Postgres service
  package.json              npm workspaces root
  backend/                  Fastify + Prisma + Postgres
  frontend/                 Vite + React + Tailwind
```

The frontend is proxied through Vite's dev server (`/api` → `localhost:3001`), so no CORS config is needed in dev. In production, point `VITE_API_URL` at the deployed API URL.

---

## State Management

**React Query for server state, Zustand for UI state.**

- `useBoard(boardId)` — hydrates the full board (columns + cards) in one request and caches it under `['board', id]`. All card mutations (create, update, move, delete) apply optimistic updates against this cache before the API call resolves, so drag-and-drop feels instant. On error the cache rolls back and a toast is shown.
- `useBoardView` (Zustand) — holds purely client-side state: `filter` (search query, priority, tag, assignee) and `groupBy` (column / priority / assignee). No server round-trips needed when the user changes a filter or switches grouping — the display columns are re-derived synchronously from the cached board data.

**Why this split?**  
Server state has its own caching, invalidation, and optimistic-update semantics best handled by React Query. UI state (filters/groupBy) is ephemeral and local — Zustand is the lightest way to share it across sibling components without prop drilling.

---

## Database Schema

```prisma
model Board   { id, name, columns[], createdAt, updatedAt }
model Column  { id, boardId, name, position Float, cards[], ... }
model Card    { id, columnId, title, description, priority, tags String[],
                assignee?, position Float, createdAt, updatedAt }
enum Priority { LOW | MEDIUM | HIGH | URGENT }
```

### Ordering strategy — Fractional Ranking

Cards and columns use a `position: Float` field. When inserting or moving:

| Situation | New position |
|---|---|
| No neighbors | `1.0` |
| Prepend (only `afterId`) | `after.position / 2` |
| Append (only `beforeId`) | `before.position + 1` |
| Between two cards | `(before.position + after.position) / 2` |

This avoids rewriting every sibling row on each reorder. A rebalance pass (evenly spaces positions back to integers × 1000) runs automatically inside the same transaction if the computed position underflows `1e-10`.

---

## API Reference

All endpoints are prefixed with `/api`. Errors always return `{ error: { code, message, details? } }`.

**Rate limiting:** The API applies a global per-IP limit (`RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS`, defaults 300/min). Exceeding it returns HTTP `429` with `{ error: { code: "RATE_LIMIT_EXCEEDED", message } }`. `GET /health` is excluded so load balancers can probe without counting toward the limit.

### Boards
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/boards` | List all boards |
| `POST` | `/api/boards` | Create board (auto-creates 3 default columns) |
| `GET` | `/api/boards/:id` | Get board with columns + cards |
| `PATCH` | `/api/boards/:id` | Rename board |
| `DELETE` | `/api/boards/:id` | Delete board (cascades) |

### Columns
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/columns` | Add column to a board |
| `PATCH` | `/api/columns/:id` | Rename column |
| `DELETE` | `/api/columns/:id` | Delete column (cascades cards) |

### Cards
| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/cards` | — | List cards (query: `columnId`, `priority`, `tag`, `assignee`, `q`) |
| `POST` | `/api/cards` | `{ columnId, title, description?, priority?, tags?, assignee? }` | Create card |
| `PATCH` | `/api/cards/:id` | partial card fields | Edit card |
| `DELETE` | `/api/cards/:id` | — | Delete card |
| `POST` | `/api/cards/:id/move` | `{ columnId, beforeId?, afterId? }` | Move to another column |
| `POST` | `/api/cards/:id/reorder` | `{ beforeId?, afterId? }` | Reorder within column |

---

## Key UX Decisions

### Optimistic drag-and-drop
Move and reorder mutations apply immediately to the cached board in React Query before the network call completes. The board never "jumps back" on success, and rolls back with a toast on failure. This makes the board feel like a native app.

### Grouping vs. filtering
**Filtering** narrows which cards are *visible* without changing the board structure. **Grouping** *reorganizes* the board into virtual columns derived from a card attribute (priority or assignee). Dragging a card between virtual columns updates that attribute (e.g., dragging to the "HIGH" priority group changes the card's priority to HIGH).

### Keyboard shortcuts
- `N` — open "New Card" dialog in the first column
- `/` — focus the search bar
- `Esc` — close dialog / clear search focus
- Tab/Enter/Space — all dialogs and interactive elements are keyboard accessible via Radix primitives (which provide focus trap, initial focus, and `Esc` close by default)

### Empty states
Every column shows a contextual empty state with a quick-add CTA. The board shows a skeleton loading state while fetching.

### Theme
All colors are expressed as CSS custom properties using HSL component triples in `src/index.css`. To retheme the entire app, change the `--brand-*` values (currently violet/purple). Dark mode is toggled via a `<html class="dark">` switch and the `.dark {}` overrides in the same file.

---

## Running Tests

```bash
# All tests
npm test

# Backend only
npm run test -w backend

# Frontend only
npm run test -w frontend
```

**Backend** (Vitest, no DB required): 8 unit tests for the fractional rank algorithm.

**Frontend** (Vitest + React Testing Library, jsdom): 23 tests across:
- `filter.test.ts` — 11 tests for `filterCards` and `isFilterActive`
- `group.test.ts` — 6 tests for `buildDisplayColumns` (column / priority / assignee grouping)
- `Card.test.tsx` — 6 tests for `CardDialog` (create, validate, edit, cancel)

---

## Trade-offs & Future Improvements

| Trade-off | Decision | Alternative |
|---|---|---|
| Fractional rank | Simple, low write-amplification; rare rebalance | Linked-list (prev/next pointers) — more complex but O(1) guaranteed |
| Single-user | No auth, no multi-tenancy | Add JWT auth + userId FK on boards |
| Client-side filter | Instant UX, works offline after first load | Server-side pagination + filter for very large boards |
| Flat card model | No subtasks/comments in v1 | Add `parentCardId` and `Comment` model for nesting |
| No realtime | Simple architecture | WebSocket or SSE to push board diffs on multi-user boards |
| Soft delete | Not implemented | Add `deletedAt DateTime?` + filter `WHERE deletedAt IS NULL` |

### Possible next steps
- Deploy: Render (backend) + Vercel (frontend) + Render Postgres
- Card detail panel: subtasks, comments, attachments, due dates
- Keyboard shortcut to move focused card between columns
- Column drag-and-drop reordering
- Pagination / virtual scroll for large boards
- Deeper rate-limit tuning (Redis store, per-route limits)
- Integration tests with a test Postgres database using `vitest-environment-prisma`