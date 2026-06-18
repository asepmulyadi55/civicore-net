---
trigger: glob
globs: civicore-net/**/*.cs
---

# CiviCore Backend Rules (.NET 8)

## 1. Stack & Architecture
- **Framework:** Always use .NET 8 (LTS) and C# 12 features.
- **Architecture:** Follow Clean Architecture / Layered Architecture (API, Application, Domain, Infrastructure).
- **Principles:** Strictly adhere to OOP and SOLID principles. 
- **Dependency Injection:** Use constructor injection. Prefer Primary Constructors for classes where applicable to keep code clean.

## 2. Code Style & Convention
- Use file-scoped namespaces (`namespace CiviCore.Backend.Services;`).
- Use strongly-typed variables; avoid `var` unless the type is explicitly clear on the right side of the assignment (e.g., `var user = new User();`).
- All asynchronous methods must append the `Async` suffix and return `Task` or `Task<T>`. Always pass `CancellationToken` to async operations where supported.

## 3. Memory & Performance Optimization (Crucial for $5 Lightsail - 512MB RAM)
- Avoid heavy in-memory caching. Lean on efficient database indexing instead.
- Use `AsNoTracking()` in EF Core queries for read-only operations to save RAM.
- For file processing or downloads, always use Streaming (`Stream` or `IAsyncEnumerable`) instead of loading entire files into byte arrays in memory.

## 4. Business Logic Guardrails
- **User Roles:** Ensure system logic strictly respects the 4 roles: Admin, Treasurer (Bendahara), Block Coordinator (Koordinator Blok/Ketua RT), and Resident (Warga).

## 5. EF Core & Security Guardrails
- **No Lazy Loading:** Explicitly disable lazy loading proxies. Always use `.Include()` for eager loading to prevent N+1 query issues that drain database connections and memory.
- **Secret Management:** Never hardcode any keys. Use `IConfiguration` or Environment Variables to inject the Supabase URL and Service Role Key.
- **Role-Based Access (RBAC):** Map Supabase JWT claims directly to ASP.NET Core Authorization Policies to enforce the 4 system roles at the API controller level.
