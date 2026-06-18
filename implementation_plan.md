# CiviCore — Migration to ASP.NET Core 8 + Supabase

## Overview

CiviCore is a **private residential community management system** (app name: "Dwipapuri") for multi-block housing. The current stack is **Laravel 12 + MySQL + React/Vite (frontend)**. The migration target is **ASP.NET Core 8 + Supabase (PostgreSQL) + same React/Vite frontend unchanged**.

This plan covers the full backend rewrite — preserving all existing business logic, data models, and API contracts so the frontend requires **zero changes**.

---

## Key Findings from Code Analysis

> [!IMPORTANT]
> The existing migration doc (`CIVICORE_DOTNET_MIGRATION.md`) has several **naming discrepancies** vs. the actual codebase that must be corrected:

| Migration Doc Says | Actual Codebase | Action |
|--------------------|-----------------|--------|
| `Resident.cs` | Model is `Householder.php` (table: `householders`) | Use **`Householder`** entity name |
| `resident_id` FK | Actual FK is `householder_id` | Use **`householder_id`** |
| `FamilyMember.cs` | This is `Resident.php` (table: `residents`) | Use **`Resident`** as the family-member entity |
| 18 tables mentioned | Actual: **52 migrations**, more complex schema | Migrate ALL tables |

> [!NOTE]
> **Naming clarification:** In CiviCore's domain:
> - A **Householder** = the unit/property occupant (head entity, `householders` table)
> - A **Resident** = a person living in the household (family member, `residents` table)
> - This is the inverse of what the migration doc implies — the doc calls the family-member entity "FamilyMember" but the real code calls it "Resident"

### Other Notable Findings:
- **52 database migrations** exist — far more tables than the doc's "18" estimate
- **`Householder` model** handles encrypted `family_card_number` via Laravel's `encrypted` cast (AES-256-CBC)
- **PaymentRecord** uses `householder_id` (not `resident_id`) as the FK
- **Frontend**: React SPA (6 public pages only) + full admin panel in Blade views (to be served by .NET)
- **Google OAuth** already configured (`GOOGLE_CLIENT_ID` in `.env`)
- **CIVICORE_API_KEY** used for internal SPA-to-API authentication header
- **`block_user` pivot table** exists (many-to-many blocks ↔ users)
- **Multiple enum values** for `house_status`: `owner_occupied`, `rented`, `vacant`, `public_facility`, `developer`
- **Organization, Finance, Meeting, PropertyListing** modules exist and need full migration
- **`PosyanduController`** exists in Laravel — a community health module not mentioned in the migration doc

---

## Finalized Decisions

> **Decision 1: Frontend & Admin UI Strategy**
> We will extract the existing React application from the Laravel `resources/js` folder and set it up as a standalone Vite application in `civicore_net/CiviCore.Frontend`.
> Since you requested to keep the flow and design identical, we will **reuse your existing TailwindCSS v4 components** rather than introducing a new UI library (like Material UI). This ensures 100% design fidelity and is the best practice for migrations like this.

> [!NOTE]
> **Decision 2: Supabase Connection & Secrets**
> We will use secure placeholders in the .NET configuration files (`appsettings.json` / user secrets) for both the database password and the Supabase Service Role Key. You will manually insert your actual secrets later to keep them secure.

> [!NOTE]
> **Decision 3: Data Migration & Other Modules**
> We will include a one-time data migration script to move your MySQL data to Supabase (including re-encrypting the Family Card Numbers). We will also migrate the `PosyanduController` (community health module) to ensure no features are left behind.

---

## Proposed Changes

The .NET solution will be created in **`c:\xampp\htdocs\civicore_net\`**.

### Phase 2: Frontend Migration & React Admin Panel

#### Proposed Architecture
- **Framework:** Standalone Vite + React 18.
- **Styling:** TailwindCSS v4 (matching the exact version from the Laravel `package.json`).
- **UI Library:** Sticking to your existing Tailwind UI to guarantee pixel-perfect matches.
- **Theme:** Light mode by default (carried over from Laravel).

#### Proposed Changes
1. **Frontend Setup**
   - Run `npm create vite@latest CiviCore.Frontend -- --template react` in the `civicore_net` directory.
   - Install `react-router-dom`, `axios`, and `@tailwindcss/vite` v4.
   - Configure `vite.config.js` to run on a specific port.
2. **Code Migration**
   - Copy `Router.jsx`, `components/`, `pages/`, and `assets/` from `civicore/resources/js` to `civicore_net/CiviCore.Frontend/src`.
   - Update `app.jsx` -> `main.jsx`.
3. **API Integration (Auth Scaffold)**
   - Update your `axios` base configuration in the frontend to point to `http://localhost:<PORT>/api` (the new .NET backend) instead of the Laravel routes.
   - Create the Authentication Controllers in the .NET API (`AuthController.cs`) with `/login`, `/register`, and `/me` endpoints using ASP.NET Core Identity.
   - Connect the frontend Login page to the .NET API and store the resulting JWT or Cookie.

## User Review Required

> [!IMPORTANT]
> Because you requested the design remain identical to the original Laravel version, I will physically copy your existing React components exactly as they are instead of rebuilding them from scratch. I will just wire them up to the new .NET API.
> 
> Are you ready to proceed with Phase 2 (setting up the frontend application and migrating the React components)?

> [!NOTE]
> **Decision 2: Supabase Connection & Secrets**
> We will use secure placeholders in the .NET configuration files (`appsettings.json` / user secrets) for both the database password and the Supabase Service Role Key. You will manually insert your actual secrets later to keep them secure.

> [!NOTE]
> **Decision 3: Data Migration & Other Modules**
> We will include a one-time data migration script to move your MySQL data to Supabase (including re-encrypting the Family Card Numbers). We will also migrate the `PosyanduController` (community health module) to ensure no features are left behind.

---

## Proposed Changes

The .NET solution will be created in **`c:\xampp\htdocs\civicore_net\`**.

---

### Solution Structure

```
CiviCore.sln
├── CiviCore.Api/              ← ASP.NET Core 8 Web API
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── BlockController.cs
│   │   ├── UnitController.cs
│   │   ├── HouseholderController.cs
│   │   ├── ResidentController.cs        ← (family members)
│   │   ├── PaymentController.cs
│   │   ├── FeeHistoryController.cs
│   │   ├── ReportController.cs
│   │   ├── FinanceController.cs
│   │   ├── UserController.cs
│   │   ├── RoleController.cs
│   │   ├── SettingController.cs
│   │   ├── MediaController.cs
│   │   ├── DashboardController.cs
│   │   ├── HomepageController.cs
│   │   ├── MeetingController.cs
│   │   ├── OrganizationController.cs
│   │   ├── PropertyListingController.cs
│   │   └── PosyanduController.cs
│   ├── DTOs/
│   ├── Middleware/
│   │   ├── SessionConflictMiddleware.cs
│   │   ├── RequirePermissionMiddleware.cs
│   │   ├── UpdateLastActiveMiddleware.cs
│   │   ├── EnsureUserIsApprovedMiddleware.cs
│   │   ├── RequireTwoFactorMiddleware.cs
│   │   └── VerifyApiKeyMiddleware.cs
│   ├── Services/
│   ├── Repositories/
│   ├── Models/
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Migrations/
│   ├── Policies/
│   ├── Filters/
│   ├── Extensions/
│   └── Program.cs
│
├── CiviCore.Core/             ← Domain interfaces & helpers
│   ├── Interfaces/
│   ├── Enums/
│   │   ├── PaymentStatus.cs
│   │   ├── HouseStatus.cs
│   │   ├── FinanceReportStatus.cs
│   │   └── FinanceTransactionType.cs
│   └── Helpers/
│       ├── EncryptionHelper.cs
│       └── UuidHelper.cs
│
└── CiviCore.Tests/            ← xUnit tests
```

---

### Phase 1 — Base Architecture & Database Setup

#### [NEW] `CiviCore.sln` + project files
- Initialize solution with `dotnet new sln`
- Three projects: `CiviCore.Api` (webapi), `CiviCore.Core` (classlib), `CiviCore.Tests` (xunit)

#### [NEW] NuGet Packages for `CiviCore.Api`
| Package | Purpose |
|---------|---------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | PostgreSQL provider for EF Core |
| `Microsoft.EntityFrameworkCore.Design` | EF Core migrations tooling |
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore` | Identity framework with EF Core |
| `supabase-csharp` | Supabase Storage client |
| `AutoMapper.Extensions.Microsoft.DependencyInjection` | DTO mapping |
| `Serilog.AspNetCore` + `Serilog.Sinks.PostgreSQL` | Structured logging to Supabase |
| `ClosedXML` | Excel report generation |
| `Swashbuckle.AspNetCore` | Swagger/OpenAPI |
| `Otp.NET` + `QRCoder` | TOTP 2FA |
| `Microsoft.AspNetCore.Authentication.Google` | Google OAuth |
| `MailKit` | SMTP email (replaces Laravel Mail) |

#### [NEW] All EF Core Entity Models (corrected names)

| C# Entity | Laravel Model | DB Table |
|-----------|--------------|----------|
| `ApplicationUser` | `User.php` | `users` |
| `ApplicationRole` | `Role.php` | `roles` |
| `Permission` | (permissions array in Role) | `permissions` |
| `Block` | `Block.php` | `blocks` |
| `BlockUser` | (pivot) | `block_user` |
| `Unit` | `Unit.php` | `units` |
| `Householder` | `Householder.php` | `householders` |
| `Resident` | `Resident.php` | `residents` (family members) |
| `PaymentMethod` | `PaymentMethod.php` | `payment_methods` |
| `PaymentRecord` | `PaymentRecord.php` | `payment_records` |
| `FeeHistory` | `FeeHistory.php` | `fee_histories` |
| `Setting` | `Setting.php` | `settings` |
| `MediaFile` | `MediaFile.php` | `media_files` |
| `FinanceTransaction` | `FinanceTransaction.php` | `finance_transactions` |
| `FinanceReport` | `FinanceReport.php` | `finance_reports` |
| `OrganizationPeriod` | `OrganizationPeriod.php` | `organization_periods` |
| `OrganizationPosition` | `OrganizationPosition.php` | `organization_positions` |
| `Meeting` | `Meeting.php` | `meetings` |
| `MeetingAttendance` | `MeetingAttendance.php` | `meeting_attendances` |
| `MeetingImage` | `MeetingImage.php` | `meeting_images` |
| `PropertyListing` | `PropertyListing.php` | `property_listings` |

#### [NEW] `Data/AppDbContext.cs`
- Extends `IdentityDbContext<ApplicationUser, ApplicationRole, Guid>`
- `OnModelCreating`: all relationships, indexes, enum conversions

#### [NEW] `Data/DataSeeder.cs`
- Seeds: 4 roles, permissions per role, default admin user, payment methods (Cash, Bank Transfer), settings (pagination, max accounts per unit)

---

### Phase 2 — Authentication & User Management

#### [NEW] `Controllers/AuthController.cs`
Ports all Laravel Auth routes:

| Endpoint | Laravel Equivalent | Notes |
|----------|-------------------|-------|
| `POST /api/auth/login` | `POST /login` | Email+password, returns session cookie |
| `POST /api/auth/logout` | `POST /logout` | Clear cookie + session token |
| `POST /api/auth/register` | `POST /register` | Self-register → inactive user |
| `POST /api/auth/forgot-password` | `POST /forgot-password` | Send reset email via MailKit |
| `POST /api/auth/reset-password` | `POST /reset-password` | Validate token, set new password |
| `POST /api/auth/2fa/setup` | (Laravel google2fa) | Generate TOTP secret + QR code |
| `POST /api/auth/2fa/verify` | | Verify TOTP, mark 2FA enabled |
| `POST /api/auth/2fa/disable` | | Admin only |
| `GET /api/auth/google` | `GET /auth/google` | Redirect to Google |
| `GET /api/auth/google/callback` | `GET /auth/google/callback` | Handle callback |

#### [NEW] Middleware (8 files — exact ports of Laravel middleware)

| .NET Middleware | Laravel Middleware |
|----------------|-------------------|
| `SessionConflictMiddleware` | `CheckSingleSession` — compare session token in cookie vs DB, 8h expiry auto-takeover |
| `RequirePermissionMiddleware` | `RequirePermission` — check `permissions` table |
| `UpdateLastActiveMiddleware` | `UpdateLastActive` — update `last_active_at` on each request |
| `EnsureUserIsApprovedMiddleware` | `EnsureUserIsApproved` — block inactive users |
| `RequireTwoFactorMiddleware` | `RequireTwoFactorAuthentication` — redirect to 2FA challenge |
| `VerifyApiKeyMiddleware` | `VerifyApiKey` — validate `CIVICORE_API_KEY` header |
| `SetLocaleMiddleware` | `SetLocale` — set culture from user preference |
| `TrustProxiesMiddleware` | `TrustProxies` — for Nginx reverse proxy |

---

### Phase 3 — Master Data Management

#### [NEW] All CRUD Controllers
- `BlockController` — CRUD, list units, assign coordinators
- `UnitController` — CRUD, unit status management
- `HouseholderController` — CRUD with block/unit scope filtering, photo upload, encrypted family card
- `ResidentController` (family members) — CRUD, mark head-of-household
- `RoleController` — List roles, update permissions

#### [NEW] `Services/EncryptionService.cs`
- `IEncryptionService` interface with `Encrypt(string)` / `Decrypt(string)`
- Implementation using `AesGcm` (System.Security.Cryptography)
- **Important:** Laravel uses AES-256-CBC with base64 + JSON wrapper. The data migration script must re-encrypt existing data in the new AES-256-GCM format

---

### Phase 4 — Financial Module (CiviPay)

#### [NEW] `Controllers/PaymentController.cs`
Full payment lifecycle matching Laravel's `PaymentController.php` (largest file: 31KB):

**Business Rules to preserve:**
- `status = Approved` records → cannot be deleted by non-Admin
- Coordinator edits to `Pending`/`Rejected` → reset status to `Pending`
- Treasurer auto-approve on submission
- Store `householder_name` + `block_name` + `unit_number` snapshots at creation time (for historical display after householder deletion)
- Payment batch support (`batch_id`)

#### [NEW] `Controllers/FeeHistoryController.cs`
- `GetFeeForMonth(householderId, month)` — lookup effective fee by date

#### [NEW] `Controllers/FinanceController.cs`
Ports `FinanceController.php` (25KB) — Finance reports and transactions

#### [NEW] `Services/ExcelExportService.cs`
Using `ClosedXML`, ports existing Excel export logic from `ReportController.php`

---

### Phase 5 — Supporting Modules & Supabase Storage

#### [NEW] `Controllers/DashboardController.cs`
- Role-specific aggregated stats
- `IMemoryCache` with 5-minute TTL

#### [NEW] `Controllers/HomepageController.cs`
Ports `HomepageController.php` (29KB) — Public GET endpoints + Admin POST/PUT/DELETE:
- Hero section
- About section
- Events (with photos)
- Memorable moments gallery
- Featured events

#### [NEW] `Services/SupabaseStorageService.cs`
Implements `IFileStorageService`:
- Upload to `civicore-media` private bucket
- Download via signed URLs
- Replaces Laravel's `storage/app/private/` local disk

#### [NEW] `Controllers/MediaController.cs`
- `GET /api/media/{id}` — authorize + stream file from Supabase Storage

#### [NEW] Additional Controllers
- `MeetingController` — ports `MeetingController.php` (11KB)
- `OrganizationController` — ports `OrganizationController.php` (14KB)
- `PropertyListingController` — ports `PropertyListingController.php` (6KB)
- `PosyanduController` — ports `PosyanduController.php` (7KB) *(pending confirmation)*
- `SettingController` — ports `SettingController.php` (8KB)
- `OverviewController` — resident's personal dashboard

#### [NEW] `Middleware/AuditMiddleware.cs`
- Log actions to `audit_logs` table via `Serilog.Sinks.PostgreSQL`

---

### Phase 6 — Frontend Decoupling & Production Deployment

#### [MODIFY] `vite.config.js` (in current civicore project)
- Update the Vite proxy to point to the new .NET API URL instead of Laravel
- Or: extract to standalone Vite project *(pending Decision 1)*

#### [NEW] `appsettings.json` + `appsettings.Production.json`
```json
{
  "ConnectionStrings": {
    "SupabaseConnection": "Host=...;Port=6543;Database=postgres;..."
  },
  "Supabase": {
    "Url": "https://xxx.supabase.co",
    "ServiceRoleKey": "..."
  },
  "Google": {
    "ClientId": "...",
    "ClientSecret": "..."
  },
  "CivicoreApiKey": "...",
  "Encryption": {
    "Key": "..."
  }
}
```

#### [NEW] Nginx + systemd config (for AWS Lightsail)
- Kestrel on `localhost:5000`
- Nginx reverse proxy
- Certbot SSL

---

### Data Migration Script

#### [NEW] `tools/MigrateData/` — One-time MySQL → PostgreSQL migration tool
- Reads from MySQL (`laravel_db`)
- Re-encrypts `family_card_number` (Laravel AES-256-CBC → .NET AES-256-GCM)
- Inserts into Supabase PostgreSQL preserving all UUIDs
- Run order respects FK constraints

---

## Verification Plan

### Automated Tests (xUnit)
```bash
dotnet test CiviCore.Tests
```
- Unit tests for `EncryptionService`, `FeeHistoryService.GetFeeForMonth()`
- Integration tests for `Repository<Householder>.GetAllAsync()`
- Controller tests for payment business rules

### API Contract Tests
- Verify every endpoint matches Laravel's response shape (same JSON field names)
- Test pagination response format matches existing frontend expectations

### Manual Verification Steps
1. `GET /swagger` → All endpoints visible
2. Login via email/password → Session cookie set
3. Login via Google OAuth → User created/found
4. Submit payment as Coordinator → status = `Pending`
5. Approve payment as Treasurer → status = `Approved`
6. Upload proof photo → file in Supabase Storage
7. `GET /api/media/{id}` → file streams correctly
8. Excel export → file downloads with correct data
9. Single-session conflict → session conflict behavior matches Laravel
10. 2FA setup → TOTP QR code generates, verify works

---

## Estimated Timeline

| Phase | Content | Estimated Duration |
|-------|---------|-------------------|
| Phase 1 | Solution setup, EF Core, all entity models, migrations, seeders | 3–5 days |
| Phase 2 | Auth (login, Google, 2FA, sessions, permissions), 8 middleware | 1–2 weeks |
| Phase 3 | Master data CRUD (Blocks, Units, Householders, Residents, Roles) | 1 week |
| Phase 4 | CiviPay (payments, fees, finance reports, Excel export) | 2–3 weeks |
| Phase 5 | Dashboard, Homepage CMS, Supabase Storage, Meetings, Org, Property | 1–2 weeks |
| Phase 6 | Frontend decoupling, production deployment, data migration | 3–5 days |
| **Total** | | **~6–9 weeks** |

---

*Analysis based on: 52 migrations, 19 models, 25+ controllers, 8 middleware files — June 2026*
