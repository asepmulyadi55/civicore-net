# Phase 1: Base Architecture & Database Setup

- `[x]` Initialize .NET Solution and projects
- `[x]` Install NuGet packages
- `[x]` Define Enums in `CiviCore.Core`
- `[x]` Create Models in `CiviCore.Api/Models`
  - `[x]` ApplicationUser, ApplicationRole, Permission
  - `[x]` Block, Unit, Householder, Resident (Family Member)
  - `[x]` PaymentRecord, PaymentMethod, FeeHistory
  - `[x]` Setting, MediaFile, FinanceTransaction, FinanceReport
  - `[x]` OrganizationPeriod, OrganizationPosition
  - `[x]` Meeting, MeetingAttendance, MeetingImage
  - `[x]` PropertyListing
- `[x]` Create `AppDbContext` and configure Postgres / Identity
- `[x]` Add Database Seeder (Roles, Admin user, Settings, Payment Methods)
- `[x]` Generate Initial Migration
- `[x]` Configure `appsettings.json` with placeholders

### Phase 1: Base Architecture & DB (Completed)
- [x] Create `.NET 8` solution and projects
- [x] Configure EF Core with PostgreSQL and Identity
- [x] Port 19 Entity Models from Laravel to C#
- [x] Configure DB Context (`AppDbContext.cs`)
- [x] Build Data Seeder (Roles, Default Admin)
- [x] Configure `appsettings.json` securely
- [x] Run Initial EF Migration against Supabase

### Phase 2: Authentication & User Management (Completed)
- [x] Scaffold Vite React App in `CiviCore.Frontend`
- [x] Install React Router, Axios, and Tailwind v4
- [x] Copy `resources/js` from Laravel project
- [x] Configure `vite.config.js` and Tailwind styles
- [x] Create `AuthController.cs` with Login and Logout endpoints
- [x] Re-wire Axios to use `.NET` backend for Login
- [x] Implement Register, Forgot Password, and Reset Password endpoints
- [x] Implement Google OAuth endpoints
- [x] Implement TOTP 2FA endpoints
- [x] Create missing 8 Middlewares (SessionConflict, RequirePermission, etc.)

### Phase 3: Master Data Management (Completed)
- [x] Create `IEncryptionService` and `EncryptionService` (AES-256-GCM)
- [x] Implement `BlockController` (CRUD, assign coordinators)
- [x] Implement `UnitController` (CRUD, status management)
- [x] Implement `HouseholderController` (CRUD, encryption, block/unit scope filtering)
- [x] Implement `ResidentController` (CRUD for family members, mark head-of-household)
- [x] Implement `RoleController` (List roles, update permissions)
