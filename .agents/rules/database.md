---
trigger: glob
globs: civicore-net/**/*.cs
---

# CiviCore Database & Storage Rules (Supabase)

## 1. ORM & Migrations (EF Core)
- Use Entity Framework Core with `Npgsql` for database operations.
- Do not write raw SQL inside the application unless strictly required for optimization.
- Schema changes must always be generated via EF Core Migrations (`dotnet ef migrations add`). Never alter database tables manually via Supabase Dashboard in production.

## 2. Storage & Private Buckets Security
- **Credentials:** The Supabase `service_role` secret key must STRICTLY reside in the .NET `appsettings.json` (environment variables). It must NEVER be exposed to the frontend or pushed to git repository.
- **Bucket Configuration:** 
  - General assets (e.g., profile pictures) can use Public Buckets.
  - Financial records, transaction receipts, and citizen documents must use **Private Buckets**.
- **Access Protocol:** Private files must only be accessed via Backend Signed URLs (with short expiration times, max 60s) or API File Streaming.

## 3. Optimization
- Design tables with appropriate foreign keys and cascading deletes.
- Ensure proper indexes on frequently searched columns (e.g., `ResidentId`, `TransactionDate`, `BlockNumber`).