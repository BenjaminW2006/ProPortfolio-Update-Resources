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

- **`artifacts/portfolio`** — React+Vite portfolio site (wouter, TanStack Query, shadcn/ui, framer-motion, @clerk/react). Public routes: `/`, `/contact`, `/gallery`, `/gallery/:key`, `/gallery/project/:id`. Admin route: `/manager` (Clerk-protected), sign-in at `/manager/sign-in`.
- **`artifacts/api-server`** — Express 5 API. Routes: `/api/health`, `/api/contact`, `/api/images/*`, `/api/projects/*`, `/api/settings`, `/api/storage/*`. Clerk proxy at `/api/__clerk` (FAPI proxy + npm bundle route via unpkg.com).

## Authentication (Clerk)

- Replit-managed Clerk (`managed` status). Test key (`pk_test_`) used in dev — connects directly to Clerk FAPI without a proxy.
- `publishableKeyFromHost` is intentionally NOT used on the frontend — it resolves the Replit dev domain to a live key which requires a registered proxy URL not set up in dev. `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` is used directly instead.
- In production, Replit auto-swaps `VITE_CLERK_PUBLISHABLE_KEY` to the live key and sets `VITE_CLERK_PROXY_URL`.
- **Clerk npm bundle proxy** (`/api/__clerk/npm`): `npm.clerk.dev` is blocked in Replit sandbox. A dedicated Express route fetches the bundle from `unpkg.com` instead and serves it. This is wired in `app.ts` BEFORE the FAPI proxy middleware.
- **Clerk FAPI proxy** (`/api/__clerk`): `clerkProxyMiddleware.ts` proxies to `frontend-api.clerk.dev` with `Clerk-Proxy-Url` and `Clerk-Secret-Key` headers. Used in production when `VITE_CLERK_PROXY_URL` is set.
- All admin API routes use `getAuth()` from `@clerk/express` via a `requireAuth` middleware.
- CSRF protection: `x-csrf-protection: 1` header required on all mutation endpoints.

## Project-Based Gallery System

The gallery is built around project records. Each project has a name, date, location, description, cover photo, and gallery photos.

### DB Schema
- **`lib/db/src/schema/projects.ts`** — `projectsTable` (id, name, date, location, description, coverObjectPath nullable, category nullable, createdAt)
- **`lib/db/src/schema/site-images.ts`** — `siteImagesTable` (id, slot nullable, label nullable, objectPath, uploadedAt, projectId nullable FK → projects)
- **`lib/db/src/schema/settings.ts`** — `settingsTable` (siteName, tagline, aboutText, phone, email, galleries JSON, heroImage)

### API Routes (all under `/api`)
- `GET /settings` — site settings (public)
- `PATCH /settings` — update settings (admin)
- `GET /projects` — list all projects (public)
- `GET /projects/:id` — single project with images (public)
- `POST /projects` — create project (admin)
- `PATCH /projects/:id` — update project metadata (admin)
- `DELETE /projects/:id` — delete project + cascade images (admin)
- `PATCH /projects/:id/cover` — set/remove cover photo (admin)
- `POST /projects/:id/images` — add gallery image (admin)
- `PATCH /projects/:id/images/:imageId` — update image label (admin)
- `DELETE /projects/:id/images/:imageId` — remove gallery image (admin)

### Admin Panel (`/manager`)
- Clerk sign-in at `/manager/sign-in` with custom branding (dark slate theme, Google SSO + email/password)
- Project list view, create/edit project forms
- Per-project: cover photo, gallery photos with before/after labels
- Site settings: name, tagline, about text, contact info, gallery configuration

### Public Pages
- `/` — home page with hero, about section, recent projects grid
- `/gallery` — all projects card grid
- `/gallery/:key` — filtered gallery by category
- `/gallery/project/:id` — detail page with description and lightbox photo grid
- `/contact` — contact form (Resend integration)

### Upload Flow
Client requests presigned URL (`POST /api/storage/uploads/request-url`), PUTs file directly to GCS, then calls cover or images endpoint.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
