# Universe

> **The operating system for Nigerian university students.**

Universe is a monorepo-based web platform providing a unified student experience — waitlists, referrals, student dashboards, campus communities, marketplace, and more.

---

## Repository Structure

```
universe1.0/
├── apps/
│   ├── web/          # Student-facing app (Vite + React, port 5173)
│   └── admin/        # Admin dashboard (Vite + React, port 5174)
├── packages/
│   ├── ui/           # Shared component library (Button, Input, etc.)
│   ├── hooks/        # Shared React hooks (useCurrentUser, useDebounce, etc.)
│   ├── types/        # Supabase database types (auto-generated)
│   ├── constants/    # Shared routes, config values
│   ├── database/     # Supabase client factory
│   ├── utils/        # Shared utility functions
│   ├── validation/   # Zod validation schemas
│   └── email/        # Email template infrastructure (Resend + React Email)
├── supabase/
│   ├── migrations/   # PostgreSQL schema migrations
│   ├── seed.sql      # Seed data (universities, departments, etc.)
│   └── functions/    # Supabase Edge Functions (Deno)
├── e2e/              # Playwright end-to-end tests
└── docs/             # Architecture documents, PRD, design system
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0 (`npm install -g pnpm`)
- **Supabase CLI** (installed via `pnpm` devDependency at the root)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/universe1.0.git
cd universe1.0
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment files and fill in your Supabase credentials:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

Edit each `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start Development Servers

```bash
pnpm dev
```

This starts both `apps/web` on **http://localhost:5173** and `apps/admin` on **http://localhost:5174** in parallel.

To start a single app:

```bash
pnpm --filter web dev
pnpm --filter admin dev
```

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start all apps in parallel |
| `pnpm build` | Build all apps and packages |
| `pnpm typecheck` | Run TypeScript checking across entire monorepo |
| `pnpm lint` | Lint all apps and packages |
| `pnpm test` | Run all unit tests (Vitest) |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm db:types` | Generate TypeScript types from Supabase schema |
| `pnpm db:reset` | Reset the local Supabase database |
| `pnpm db:seed` | Reset and seed the database |

---

## Database Type Generation

Types in `packages/types/src/database.types.ts` are **auto-generated** from the Supabase schema.

**Do not manually edit this file.**

To regenerate:

```bash
SUPABASE_PROJECT_ID=your-project-id pnpm db:types
```

In CI/CD, set `SUPABASE_PROJECT_ID` as an environment secret.

---

## Running Tests

### Unit Tests (Vitest)

```bash
pnpm test
```

Tests live alongside source files (e.g., `Button.test.tsx`) or in `src/__tests__/`.

### End-to-End Tests (Playwright)

```bash
pnpm test:e2e
```

E2E tests live in `e2e/tests/`. The dev server must be running, or Playwright will start it automatically.

---

## Architecture

See the full architecture documentation in [`docs/Universe_Architecture.md`](./docs/Universe_Architecture.md).

Key design decisions:
- **Identity:** Supabase Auth (`auth.users`) with a 1:1 `public.profiles` table
- **RBAC:** Table-based role & permission system, enforced via Postgres RLS
- **State:** React Query for all async server state; React context for local session
- **Monorepo:** pnpm workspaces with strict package boundaries

---

## Supabase Edge Functions

Edge functions live in `supabase/functions/`:

| Function | Description |
| :--- | :--- |
| `email-webhook` | Triggers transactional emails via Resend |
| `process-referral` | Validates and processes referral conversions |
| `send-notification` | Pushes in-app notifications to users |

Deploy with:

```bash
supabase functions deploy email-webhook
```

---

## Contributing

1. Create a new branch from `main`
2. Make your changes
3. Run `pnpm typecheck && pnpm lint && pnpm test`
4. Open a pull request

Husky pre-commit hooks will automatically lint and typecheck staged files.

---

## Documentation

| Document | Description |
| :--- | :--- |
| [`Universe_PRD.md`](./docs/Universe_PRD.md) | Product Requirements |
| [`Universe_Architecture.md`](./docs/Universe_Architecture.md) | Software Architecture |
| [`Universe_Database_Architecture.md`](./docs/Universe_Database_Architecture.md) | Database Design |
| [`Universe_Design_System.md`](./Universe_Design_System.md) | UI/UX Design System |
| [`Universe_Enterprise_Audit_Report.md`](./docs/Universe_Enterprise_Audit_Report.md) | Engineering Audit |
