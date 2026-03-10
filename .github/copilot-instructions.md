# Copilot Instructions — Tirta SaaS

**Tirta SaaS** is a multi-tenant SaaS platform for water utility (PDAM) billing management, built with a Go backend and React TypeScript frontend. UI and documentation are in **Bahasa Indonesia**.

---

## Development Commands

### Backend (`tirta-saas-backend/`)
```bash
go run main.go          # Start API server on :8081
go build                # Compile binary
go mod tidy             # Sync dependencies
swag init               # Regenerate Swagger docs
```

### Frontend (`tirta-saas-frontend/`)
```bash
npm run dev             # Dev server on :5174
npm run build           # tsc -b && vite build
npm run lint            # ESLint check
npm run preview         # Preview production build
```

> **No automated test suite exists** in either backend or frontend.

### First-time setup
1. Copy `.env.example` → `.env` in both backend and frontend.
2. Start MySQL and create the `tirta_saas` database.
3. Run backend — auto-migrations and auto-seed admin run on startup (`AUTO_SEED_ADMIN=true`).
4. Run the subscription plan seeder: `cd tirta-saas-backend/scripts && ./seed-subscription-plans.sh`
5. Default admin: `admin@tirtasaas.com / admin123`

---

## Architecture

```
Frontend (React + Redux Toolkit)  :5174
   │  Axios + JWT Bearer Token
   │  X-Tenant-ID header (multi-tenancy)
   ▼
Backend (Go + Gin)                :8081
   │  GORM ORM
   ▼
MySQL 8+  (database: tirta_saas)
```

**Multi-tenancy:** Every customer-facing entity has a `tenant_id` FK. All queries must be scoped to the authenticated user's tenant. The `X-Tenant-ID` HTTP header carries the tenant context from frontend to backend.

**Auth:** JWT Bearer tokens. Five roles: `platform_owner`, `tenant_admin`, `meter_reader`, `finance`, `customer`. Role-specific route groups are protected by middleware in `tirta-saas-backend/middleware/`.

**Scheduled jobs:** `robfig/cron` handles automatic monthly invoice generation and trial subscription expiry checks — see `services/invoice_generation_service.go` and `main.go`.

**State persistence:** Redux Toolkit + Redux Persist; the Redux store survives page reload.

---

## Backend Conventions (Go)

- **All primary keys are UUIDs** (`google/uuid`), never auto-increment integers.
- **Every model embeds `BaseModel`**, which provides `ID uuid.UUID`, `CreatedAt`, `UpdatedAt`, `DeletedAt` (soft deletes).
- Foreign keys use pointer types: `TenantID *uuid.UUID` with GORM `foreignKey` tags.
- **Layers:** `routes/` → `controllers/` → `services/` → `models/`. Keep business logic in `services/`.
- Request DTOs live in `requests/`, standardized JSON responses via `pkg/response` helpers.
- New routes: add a file in `routes/`, register it in `main.go`.
- JSON tags are `snake_case`; Go struct fields are `PascalCase`.

## Frontend Conventions (React/TypeScript)

- **API endpoints are centralized** in `src/constants/api.ts`. Add new endpoints there; use its helper functions for parameterized URLs.
- **One service file per domain** in `src/services/` (e.g., `customerService.ts`). All Axios calls go through services, never directly in components.
- **TypeScript interfaces** in `src/types/` mirror backend models. Add types there when adding new entities.
- Redux slices are in `src/store/slices/`. Use Redux Toolkit `createAsyncThunk` for async operations.
- Styling: **Tailwind CSS utility classes only** — no CSS-in-JS, no custom CSS files except `index.css` globals.
- Forms: **React Hook Form + Yup** schema validation throughout. Don't add other form libraries.
- Components: reusable UI in `src/components/`, full pages in `src/pages/`, shared layouts in `src/layouts/`.
- File naming: `PascalCase` for components/pages, `camelCase` for utilities/hooks/services.

## Key Domain Entities

| Entity | Notes |
|---|---|
| `Tenant` | A PDAM organization (SaaS customer); statuses: `pending / active / rejected / expired` |
| `Customer` | A water consumer belonging to a tenant; linked to a `SubscriptionType` |
| `Invoice` | Monthly water bill; statuses: `unpaid / paid / overdue / void` |
| `Payment` / `PaymentProof` | Payment record + uploaded proof photo (proof statuses: `pending / verified / rejected`) |
| `WaterUsage` | Monthly meter reading (m³) per customer |
| `WaterRate` | Tiered price-per-m³ config per `SubscriptionType` |
| `TenantSubscription` | Platform plan for the tenant; statuses: `trial / pending / active / expired` |

## Environment Variables

**Backend (`.env`):**
```
DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME=tirta_saas
JWT_SECRET
PORT=8081
ENV=development
AUTO_SEED_ADMIN=true
```

**Frontend (`.env`):**
```
VITE_API_BASE_URL=http://localhost:8081/api
VITE_APP_NAME=Tirta SaaS
```
