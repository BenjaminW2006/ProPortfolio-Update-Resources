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

- **`artifacts/portfolio`** — React+Vite portfolio site (wouter, TanStack Query, shadcn/ui, framer-motion). Public routes: `/`, `/contact`, `/gallery`, `/gallery/project/:id`. Admin route: `/admin`.
- **`artifacts/api-server`** — Express API. Routes: `/api/health`, `/api/contact`, `/api/images/*`, `/api/projects/*`, `/api/admin/*`, `/api/storage/*` (object storage proxy).

## Project-Based Gallery System (Task #15)

The gallery is built around project records. Each project has a name, date, location, description, cover photo, and gallery photos.

### DB Schema
- **`lib/db/src/schema/projects.ts`** — `projectsTable` (id, name, date, location, description, coverObjectPath nullable, createdAt)
- **`lib/db/src/schema/site-images.ts`** — `siteImagesTable` (id, slot nullable, objectPath, uploadedAt, projectId nullable FK → projects)

### API Routes (all under `/api`)
- `GET /projects` — list all projects (public)
- `GET /projects/:id` — single project with images (public)
- `POST /projects` — create project (admin)
- `PATCH /projects/:id` — update project metadata (admin)
- `DELETE /projects/:id` — delete project + cascade images (admin)
- `PATCH /projects/:id/cover` — set/remove cover photo (admin)
- `POST /projects/:id/images` — add gallery image (admin)
- `DELETE /projects/:id/images/:imageId` — remove gallery image (admin)

### Zod Schemas (`lib/api-zod/src/projects.ts`)
`ProjectResponse`, `ProjectWithImagesResponse`, `ListProjectsResponse`, `ProjectImageItem`, `CreateProjectBody`, `UpdateProjectBody`, `AddProjectImageBody`, `ProjectIdParam`, `ProjectImageIdParam`

### Admin Panel (`/admin`)
- Project list view with "New Project" button
- Create project form (name, date, location, description)
- Per-project manage view: edit metadata, upload cover photo, add/remove gallery photos

### Public Pages
- `/gallery` — project card grid (cover photo, name, date, location)
- `/gallery/project/:id` — detail page with description and lightbox photo grid
- `/` — home page "Our Work" section shows up to 4 most recent projects

### Upload Flow
Client requests presigned URL (`POST /api/storage/uploads/request-url`), PUTs file directly to GCS, then calls cover or images endpoint.

### Auth
- `ADMIN_PASSWORD` env var required for all admin write operations
- Session-based auth with `x-csrf-protection: 1` header required

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
