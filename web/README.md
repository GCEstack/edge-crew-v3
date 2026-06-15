# Edge Crew — Frontend

The Edge Crew web frontend is a Vite + React + TypeScript SPA. It also hosts the Vercel Edge API routes that proxy requests to Supabase.

---

## Tech Stack

- **Vite 5** — build tooling and dev server
- **React 18** — UI library
- **TypeScript** — type safety
- **Tailwind CSS** — utility-first styling
- **Zustand** — global state (`useAppStore`)
- **Supabase JS** — Auth and database client
- **PWA** — installable progressive web app via `vite-plugin-pwa`

---

## Project Structure

```
web/
├── api/                    # Vercel Edge API routes
│   ├── _shared.ts          # Server Supabase client + helpers
│   ├── analyze.ts          # Enqueue AI analysis job
│   ├── games.ts            # List / get games with latest grade
│   ├── jobs.ts             # Job status endpoint
│   ├── top-picks.ts        # Highest-confidence picks
│   ├── parlay.ts           # Parlay builder data
│   ├── betslip.ts          # Bet-slip generation
│   └── calibration.ts      # Grade calibration stats
├── public/                 # Static assets
├── src/
│   ├── App.tsx             # Root router
│   ├── main.tsx            # Entry point
│   ├── components/
│   │   ├── Layout.tsx      # Shell, nav, auth-aware header
│   │   ├── TwoLaneCard.tsx # OUR PROCESS vs AI PROCESS card
│   │   └── ErrorBoundary.tsx
│   ├── pages/
│   │   ├── HomePage.tsx       # Sport slate dashboard
│   │   ├── GameDetailPage.tsx # Single game + model breakdown
│   │   ├── PicksPage.tsx      # Locked picks / bet slip
│   │   ├── ParlayPage.tsx     # Parlay builder
│   │   ├── TopPicksPage.tsx   # Top picks across sports
│   │   └── ProfilePage.tsx    # Profile selector / PIN login
│   ├── services/
│   │   └── api.ts          # Frontend API client
│   ├── hooks/
│   │   ├── useAuth.tsx     # Supabase Auth session + profile login
│   │   └── useAnalysisJob.ts# Poll analysis job status
│   ├── store/
│   │   └── useAppStore.ts  # Global UI state
│   ├── lib/
│   │   ├── supabase.ts     # Browser Supabase client
│   │   ├── supabase-server.ts # Server-side client helper
│   │   ├── database.types.ts  # Generated Supabase types
│   │   └── vite-env.d.ts
│   └── types/
│       └── index.ts        # Shared TS types (Game, Grade, etc.)
├── .env.example            # Frontend + API env vars
├── vercel.json             # SPA fallback + API route rules
├── vite.config.ts
└── tsconfig.api.json       # Type check for Edge routes
```

---

## Authentication

- Users log in with a 4-digit PIN on the profile page.
- Each profile maps to a Supabase Auth user: `<username>@edgecrew.local`.
- The PIN is padded to 6 characters to satisfy Supabase's minimum password length.
- `useAuth.tsx` manages session, login, and logout.

---

## Data Flow

1. The SPA calls Vercel Edge routes in `web/api/*`.
2. Edge routes use a server-side Supabase client (`web/api/_shared.ts`) with the service role key.
3. Supabase RLS still applies where configured; the service role is used for read-heavy aggregation routes.
4. Analysis jobs are enqueued by `POST /api/analyze`; the SPA polls `GET /api/jobs/:id` for completion.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Used by | Description |
|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Browser client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser client | Supabase anon key |
| `SUPABASE_URL` | Edge routes | Server Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge routes | Service role key for API routes |
| `VITE_API_URL` | Dev proxy | API base in development |

Model-provider keys are **not** needed in the frontend; they live on the AI worker.

---

## Local Development

```bash
cd web
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` by default.

---

## Build

```bash
cd web
npm run build
```

This runs TypeScript checks and Vite production build. The Edge routes are built by Vercel at deploy time.

To type-check the Edge routes only:

```bash
npx tsc -p tsconfig.api.json --noEmit
```

---

## Deployment

The frontend and Edge routes are deployed to Vercel:

```bash
vercel --prod
```

Make sure the Vercel project has the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables set.

---

## Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Sport selector and slate cards |
| Game Detail | `/game/:id` | Full model breakdown for one game |
| Top Picks | `/top-picks` | Highest-confidence plays |
| Parlay | `/parlay` | Parlay builder |
| Picks | `/picks` | Locked picks and bet slip |
| Profile | `/profile` | Login / profile switcher |

---

## License

MIT
