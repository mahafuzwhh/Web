# Mobile Nest BD

Mobile-first Bangladesh e-commerce for mobile accessories, with guest checkout, order tracking, and a Clerk-protected shop admin.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile-nest-bd/` — public storefront, checkout, order tracking, and admin UI
- `artifacts/api-server/src/routes/` — Express API routes for storefront, orders, and admin
- `lib/api-spec/openapi.yaml` — source of truth for API contracts and generated hooks
- `lib/db/src/schema/` — Drizzle schema for categories, products, and orders

## Architecture decisions

- Customer browsing, checkout, confirmation, and tracking are public; only admin routes require Clerk.
- Online payment choices are recorded as pending setup until a verified provider flow exists.
- Order line items are snapshotted in the order record so confirmations and tracking remain stable after product edits.
- The first catalog is seeded on API startup only when the database is empty.

## Product

Customers can browse and filter demo accessories, add items to a persistent cart, check out without creating an account, receive a unique `MNX-*` order ID, and track an order with the ID plus mobile number. Shop staff can review order metrics, update status, manage products, and manage categories after signing in with Clerk.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
