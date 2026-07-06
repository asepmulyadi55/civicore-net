# 🏗️ CiviCore

Welcome to the **CiviCore** project! This document serves as the high-level architecture and setup guide so that anyone cloning this repository can quickly understand how the pieces fit together and how to run it locally.

---

## 🏛️ System Architecture & Data Flow

CiviCore is built as a **Micro-Frontend / Unified Backend** architecture. The application is split into three main components:

1. **`CiviCore.Api` (.NET 8 Web API)**
   - **Role:** The central nervous system and backend.
   - **Flow:** This API handles all business logic, authentication, and talks directly to the database (**Supabase**). It exposes REST API endpoints that the frontends consume.
   - *(Note: CiviCore is being migrated from Laravel/MySQL to this .NET/Supabase architecture).*

2. **`CiviCore.Web` (Next.js)**
   - **Role:** The public-facing website.
   - **Flow:** This application is server-side rendered (SSR) for SEO and performance. It communicates with `CiviCore.Api` via HTTP requests (using fetch/axios) to retrieve public data and display it to standard users.

3. **`CiviCore.Frontend` (React + Vite)**
   - **Role:** The Admin Dashboard / Portal.
   - **Flow:** This is a Single Page Application (SPA). It runs entirely in the browser and connects directly to `CiviCore.Api` for authenticated, administrative actions (managing users, content, etc.).

### Visual Flow
```mermaid
graph TD
    A[Public User] --> B[CiviCore.Web (Next.js)]
    C[Admin User] --> D[CiviCore.Frontend (React/Vite)]
    B -->|HTTP / REST| E[CiviCore.Api (.NET 8)]
    D -->|HTTP / REST| E
    E -->|Entity Framework| F[(Supabase Database)]
```

---

## 📂 Project Structure

- `/CiviCore.Api` - The .NET 8 Backend API.
- `/CiviCore.Application` - Business logic and Use Cases (Clean Architecture).
- `/CiviCore.Domain` - Core entities and domain logic.
- `/CiviCore.Infrastructure` - Database connections, Repositories, and Supabase integrations.
- `/CiviCore.Web` - The Next.js public web app.
- `/CiviCore.Frontend` - The React/Vite admin dashboard.
- `docker-compose.yml` - Setup file for deploying the entire stack using Docker.

---

## 🚀 How to Run Locally (Manual)

To run the project locally on your laptop, you will need **.NET 8 SDK** and **Node.js (v20+)** installed.

### 1. Start the Backend API
The API needs to be running first so the frontends have something to talk to.
```bash
cd CiviCore.Api
dotnet run
```
*The API will typically start on `http://localhost:5000` or `https://localhost:5001`. Ensure your `appsettings.json` has the correct Supabase connection string.*

### 2. Start the Public Website (Next.js)
Open a new terminal window:
```bash
cd CiviCore.Web
npm install
npm run dev
```
*The Next.js site will be accessible at `http://localhost:3000`.*

### 3. Start the Admin Dashboard (React/Vite)
Open another terminal window:
```bash
cd CiviCore.Frontend
npm install
npm run dev
```
*The Admin portal will usually start on `http://localhost:5173` (or similar).*

---

## 🐳 How to Run Locally (using Docker)

If you have **Docker Desktop** installed on your laptop, you can spin up the entire application architecture with a single command without needing to install .NET or Node.js manually.

Run this from the root of the project:
```bash
docker compose up --build
```

**Services created:**
- **Web App:** Available at `http://localhost:3000`
- **Admin App:** Available at `http://localhost:8080`
- **API:** Available at `http://localhost:5000`

---

## 🗄️ Database Management (Migrations & Seeding)

CiviCore uses **Entity Framework Core (EF Core)** to manage the database schema (Code-First approach).

### 1. Running Migrations (Apply to Database)
If you just cloned the project or pulled new code, you need to apply the latest database structure to your Supabase instance.
Ensure you are in the API directory:
```bash
cd CiviCore.Api
dotnet ef database update
```
*(Note: You must have the EF Core CLI tools installed globally: `dotnet tool install --global dotnet-ef`)*

### 2. Creating a New Migration
If you change any Domain models and need to update the database schema:
```bash
cd CiviCore.Api
dotnet ef migrations add NameOfYourChange
dotnet ef database update
```

### 3. Database Seeding
Typically in .NET, database seeding is configured to run automatically during application startup if the tables are empty, or through the `OnModelCreating` method in the `DbContext`. 
When you run `dotnet ef database update`, any seeded data defined in the DbContext will be inserted automatically. 

---

## 📝 Configuration (appsettings.json)

For the backend, you'll configure your database inside `/CiviCore.Api/appsettings.json`. 

You do **not** need an `appsettings.Production.json` file on your local machine. If that file is missing, .NET will gracefully fallback and use standard `appsettings.json`. In production (like AWS Lightsail), we set the environment variable `ASPNETCORE_ENVIRONMENT=Production` to tell it to look for production keys.
