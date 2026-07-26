# CiviCore Monorepo & Architectural Rules

This repository follows a **Monorepo architecture** (`apps/` + `packages/` + `.NET Backend`):

1. **Apps (`apps/`):**
   - `apps/public`: Next.js 15 App Router (`dwipapuri.amsite.click`).
   - `apps/admin`: React + Vite SPA (`admin.dwipapuri.amsite.click`).
   - `apps/security`: React + Vite SPA (`security.dwipapuri.amsite.click`).

2. **Packages (`packages/`):**
   - `packages/ui`: Shared React components (Sidebar, TopNav, Tables, Modals, Forms).
   - `packages/auth`: Shared AuthContext, JWT decoders, Axios API client.
   - `packages/config`: Shared TypeScript & ESLint configurations.

3. **Backend & EF Core Multi-DbContext:**
   - Multiple DbContext isolation: `ApplicationDbContext` (Main) vs `SecurityDbContext` (Security/Guest Logs).
   - CLI Migrations must specify `--context` (e.g. `dotnet ef migrations add <Name> --context SecurityDbContext`).
   - Connection strings are injected via `ConnectionStrings__*` environment variables.

For detailed rules per layer, refer to `.agents/rules/frontend.md`, `.agents/rules/backend.md`, and `.agents/rules/database.md`.
