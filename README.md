# Hospitality Resource Exchange

A B2B marketplace where hospitality businesses (hotels, restaurants, caterers, banquet
venues, resorts, event organizers) list underused resources — banquet space, parking,
vehicles, kitchen capacity, furniture, AV equipment — and other businesses discover,
request, negotiate and book them.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma ORM + PostgreSQL (tested against [Neon](https://neon.tech))
- NextAuth (Credentials) + bcrypt for auth
- Tailwind CSS

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a Postgres connection string
   (Neon/Supabase free tier, or a local Postgres instance) and `AUTH_SECRET` to a random
   string. A `docker-compose.yml` is included if you'd rather run Postgres locally via
   Docker (`docker compose up -d`, then point `DATABASE_URL` at it).
2. Install dependencies and set up the database:
   ```
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```
3. Run the dev server:
   ```
   npm run dev
   ```
4. Open http://localhost:3000. Demo accounts (password `password123` for all):
   - `provider1@demo.com` — Grand Horizon Hotel (Mumbai)
   - `provider2@demo.com` — Seaside Resort & Spa (Mumbai)
   - `provider3@demo.com` — City Banquets Pune (Pune)
   - `seeker1@demo.com` — Tasty Bites Catering (Mumbai)
   - `seeker2@demo.com` — EventCraft Organizers (Mumbai)

## Feature map

| Feature | Where |
|---|---|
| Urgent priority boost | `Request.urgent`, provider inbox sorts urgent-first (`src/app/api/requests/route.ts`) |
| Smart compatibility check | `checkCompatibility()` in `src/lib/matching.ts` |
| Minimum rental period auto-filter | `checkMinRentalPeriod()` in `src/lib/matching.ts` |
| Bundled resource requests | `Bundle` / `BundleItem` models, `src/app/bundles/*`, matching in `src/app/api/bundles/[id]/match/route.ts` |
| Price transparency benchmark | `src/lib/pricing.ts`, shown live on `src/app/resources/new/page.tsx` |
| Utilization analytics + idle-asset alerts | `src/lib/utilization.ts`, surfaced on `/dashboard` and `/my-resources` |
| Two-way trust score | `Review` model (bidirectional), `computeTrustScore()` in `src/lib/matching.ts` |
| Auto-suggested alternatives on rejection | `src/app/api/requests/[id]/route.ts` (REJECT branch) |
| Transparent negotiation timeline | `NegotiationMessage` model, `src/app/requests/[id]/page.tsx` |
| Seasonal demand insight | `src/lib/seasonal.ts` (rule-based, no ML) |
| Matching / ranking algorithm | `rankResources()` in `src/lib/matching.ts` — weights price fit, distance, capacity fit, provider trust |

## Notes

- A business account is both a provider and a seeker — list resources and send requests
  from the same login.
- The dev DB connection is a pooled Neon endpoint; expect a couple of seconds of latency
  per request in local dev (cold pooled connections), much faster once warmed up or on a
  direct/production connection.
