# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **`artifacts/portfolio`** — React+Vite portfolio site (wouter, TanStack Query, shadcn/ui, framer-motion). Public routes: `/`, `/contact`. Admin route: `/admin`.
- **`artifacts/api-server`** — Express API. Routes: `/api/health`, `/api/contact`, `/api/images` (public GET), `/api/images/:slot` (POST/DELETE, admin-protected), `/api/admin/ping` (auth check), `/api/storage/*` (object storage proxy).

## Cloud Image Management (Task #9)

The site supports owner-swappable images via a password-protected `/admin` page.

- **Slots**: `hero-bg`, `project-deck-restoration`, `project-exterior-paint`, `project-driveway-cleaning`, `project-custom-trim`
- **Admin auth**: `X-Admin-Password` header checked against `ADMIN_PASSWORD` secret. Password stored in browser `sessionStorage`.
- **Upload flow**: Client requests presigned URL (`POST /api/storage/uploads/request-url`), PUTs file directly to storage, then saves objectPath via `POST /api/images/:slot`.
- **Public display**: `GET /api/images` returns current slot→objectPath map. Hero and Portfolio components fetch this and fall back to `/images/*.png` static files if no custom image is set.
- **DB schema**: `lib/db/src/schema/site-images.ts` — `siteImagesTable` (slot unique, objectPath, uploadedAt).
- **Env var**: `ADMIN_PASSWORD` (secret) — required for admin write operations.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
