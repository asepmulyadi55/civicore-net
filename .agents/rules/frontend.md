---
trigger: glob
globs: civicore-net/CiviCore.Frontend/**/*.{ts,tsx,css}
---

# CiviCore Frontend Rules (React SPA)

## 1. Tech Stack & Best Practices
- **Framework:** React with TypeScript.
- **Styling:** Tailwind CSS. Use clean utility classes, avoid bloated or redundant styles.
- **State Management:** Keep it modular. Use Context API for global state (like Theme or Auth) and local state for individual components.

## 2. API Communication & Security
- **Endpoints:** All data fetching must go through the .NET Core API Gateway. NEVER call Supabase services directly from the frontend.
- **Authentication:** Send the JWT/Bearer token from .NET Identity inside the `Authorization` header for every protected request.
- **Handling Storage/Files:** For private assets (like payment proofs), fetch the temporary Signed URL from the .NET backend first, then render it using standard HTML tags.

## 3. UI/UX & Role Guards
- Component routing and UI elements must be dynamically guarded based on the 4 CiviCore roles (Admin, Treasurer, Block Coordinator, Resident).
- Handle loading states and API errors gracefully with intuitive UI feedback (e.g., skeletons or toast notifications).