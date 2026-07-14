# Universe Software Architecture Document

**Status:** Draft  
**Version:** 1.0  
**Stack:** React 19, Vite, Tailwind CSS v4, Supabase, React Router, TanStack Query

---

## 1. High-Level System Architecture
**Overview:** Universe utilizes a modern, serverless architecture centered around a Backend-as-a-Service (BaaS) paradigm using Supabase, paired with a React Single Page Application (SPA). This removes the need to maintain custom backend infrastructure (Node/Express servers) for the MVP, vastly accelerating development while relying on PostgreSQL's proven scalability for the long term.

**Request Flow & Data Flow:**
1. **Client (Browser/Mobile):** Renders UI via React. Dispatches async data fetching using TanStack Query.
2. **Edge (Authentication):** Supabase Auth validates magic links or sessions at the network edge.
3. **API Layer (PostgREST):** The client communicates directly with PostgreSQL via Supabase's auto-generated REST/GraphQL APIs (PostgREST).
4. **Data Security (RLS):** All data access is gated by PostgreSQL Row Level Security (RLS). Users can only read/write data permitted by their verified identity.
5. **Background Tasks (Edge Functions):** Heavy tasks (e.g., dispatching transactional emails via Resend) are offloaded to Supabase Edge Functions triggered by Database Webhooks.

**Reasoning:** This architecture minimizes operational overhead. By pushing authorization to the database layer (RLS) and business logic to the client or Edge Functions, we avoid monolithic backend scaling bottlenecks.

---

## 2. Architectural Principles
* **Feature-First Architecture:** Code is organized by domain (e.g., `features/waitlist`, `features/referrals`) rather than strictly by technical type (e.g., all components in one folder, all hooks in another).
* **Single Responsibility & Modular Development:** Modules should do one thing well. The Marketplace feature should not be entangled with the Waitlist feature.
* **Composition Over Duplication:** Small, single-purpose UI components are combined to create complex layouts.
* **Predictable State Management:** Server state (database data) and client state (UI toggles) are strictly separated. 
* **Type Safety:** 100% TypeScript coverage from the database schema up to the UI components.
* **Accessibility & Performance First:** Strict adherence to ARIA standards and Core Web Vitals.

---

## 3. Monorepo Strategy
**Recommendation: Monorepo (using Turborepo or npm/yarn workspaces).**

**Reasoning:** Universe plans to launch a Landing site, an Admin dashboard, a Student Dashboard (MVP), and eventually a Mobile App. Without a monorepo, sharing the Tailwind config, Supabase TS types, UI components, and utility functions across these platforms requires publishing private npm packages, which creates massive developer friction. A monorepo ensures that a change in the database schema instantly updates types across all apps simultaneously.

**Structure:**
* `apps/web`: (Landing + Student Dashboard)
* `apps/admin`: (Internal Admin Dashboard)
* `apps/mobile`: (Future React Native App)
* `packages/ui`: (Shared Tailwind components)
* `packages/database`: (Supabase migrations, generated types)
* `packages/emails`: (React Email + Resend configs)

---

## 4. Folder Structure (Inside `apps/web`)
```text
apps/web/
├── src/
│   ├── assets/       # Static assets (images, fonts, icons)
│   ├── components/   # Globally shared UI (buttons, inputs) - imported from packages/ui ideally
│   ├── config/       # Global env vars and constants
│   ├── contexts/     # Global React Contexts (e.g., AuthProvider, ThemeProvider)
│   ├── features/     # Feature-based modules (see Section 5)
│   ├── hooks/        # Global custom hooks (e.g., useWindowSize, useDebounce)
│   ├── layouts/      # Page layouts (e.g., AuthLayout, DashboardLayout)
│   ├── routes/       # React Router definitions (AppRouter.tsx)
│   ├── services/     # API/Supabase clients (e.g., supabaseClient.ts)
│   ├── types/        # Global TS definitions
│   └── utils/        # Helper functions (e.g., formatDate, parseUrl)
```
**Reasoning:** This structure enforces a separation between global elements (components/hooks) and domain-specific logic (features), preventing the codebase from turning into an unnavigable web as new modules are added.

---

## 5. Feature-Based Architecture
Each feature inside `src/features/` acts as an independent mini-application.

**Example: `features/waitlist/`**
```text
features/waitlist/
├── api/              # TanStack Query hooks for this feature (useJoinWaitlist.ts)
├── components/       # UI specific ONLY to waitlist (WaitlistForm.tsx)
├── types/            # Types specific to waitlist
├── utils/            # Waitlist-specific helpers (e.g., validateStudentId.ts)
└── index.ts          # Public API for this feature (Exports what other features can use)
```
**Reasoning:** Feature isolation ensures that if we delete the Waitlist feature later, we simply delete the folder. It prevents "spaghetti code" where components are inextricably linked across domains.

---

## 6. Routing Strategy
**Recommendation: React Router v7 (or standard v6 if preferred) configured via declarative route objects.**

* **Public Routes:** `/`, `/about`, `/faq` (Wrapped in `PublicLayout`).
* **Auth Routes:** `/login`, `/magic-link` (Wrapped in `AuthLayout`).
* **Protected Routes:** `/dashboard`, `/leaderboard` (Wrapped in `DashboardLayout` + `AuthGuard`).
* **Admin Routes (in `apps/admin`):** `/users`, `/settings` (Wrapped in `AdminLayout` + `RoleGuard`).

**Reasoning:** Centralizing route definitions in a route object array allows for easy route-level code splitting, lazy loading, and predictable nested layouts.

---

## 7. Component Architecture
* **UI Components (Dumb):** Pure presentation. No data fetching. Receives data via props. (e.g., `Button`, `Card`). Uses `cva` (Class Variance Authority) for Tailwind variants.
* **Feature Components (Smart):** Contains domain logic. Uses TanStack Query to fetch data. Orchestrates UI components. (e.g., `LeaderboardTable`).
* **Layout Components:** Defines page structure (Headers, Footers, Sidebars) and uses `{children}` to render nested routes.

**Reasoning:** Separating "smart" and "dumb" components maximizes reusability. A "dumb" `Table` component can be used in both the Marketplace and the Leaderboard, populated by different "smart" feature components.

---

## 8. State Management Strategy
* **Server State:** **TanStack Query.** Handles fetching, caching, deduplication, and optimistic updates of Supabase data.
* **Client State (Local):** **React `useState` / `useReducer`.** For UI toggles (modals, dropdowns).
* **Client State (Global):** **Zustand or React Context.** For global client state (e.g., dark mode preference). Context is preferred for Auth state.
* **Form State:** **React Hook Form + Zod.** For high-performance, strictly validated form handling.

**Reasoning:** Redux is unnecessary and bloated for this architecture. TanStack Query eliminates 90% of global state needs by caching server data efficiently.

---

## 9. API Layer
Instead of calling Supabase SDK methods directly inside components, we wrap them in services and TanStack Query hooks.

**Example Flow:**
1. `services/referral.service.ts`: Contains the raw Supabase call `supabase.from('referrals').select('*')`.
2. `features/referrals/api/useReferrals.ts`: A custom hook wrapping `useQuery` that calls the service.
3. `ReferralList.tsx`: Calls `const { data } = useReferrals();`.

**Reasoning:** This abstractions allows us to easily implement retries, handle global errors, and swap out the backend (e.g., moving from Supabase to a custom Node server) in the future without touching a single UI component.

---

## 10. Database Interaction Layer
* **Type Generation:** Supabase CLI is used to auto-generate TypeScript definitions (`Database` type) from the Postgres schema.
* **Data Access:** Performed via `supabase-js` SDK utilizing PostgREST.
* **Migrations:** Managed entirely via Supabase CLI (`supabase migration new`). Local development uses Supabase Local Studio.

**Reasoning:** End-to-end type safety. If a database column `first_name` changes to `given_name`, TypeScript will immediately throw compilation errors across the frontend codebase.

---

## 11. Authentication Architecture
* **Mechanism:** Supabase Auth (GoTrue).
* **Primary Flow (MVP):** Passwordless Magic Links to eliminate friction and verify email ownership instantly.
* **Session Management:** Handled automatically by Supabase Auth (secure HttpOnly cookies or LocalStorage depending on SSR vs SPA setup). Token refresh is automatic.
* **Future:** OAuth (Google) and `.edu.ng` specific SSO.

**Reasoning:** Magic links ensure the email is valid (preventing bot fraud) without the friction of creating and remembering passwords.

---

## 12. Authorization (RBAC)
* **Strategy:** PostgreSQL Row Level Security (RLS) augmented by a custom `user_roles` table or Supabase Custom Claims.
* **Roles:** `student` (default), `moderator`, `admin`, `superadmin`.
* **Example RLS Policy:** "Users can only update the `profiles` table if `auth.uid() = id`". "Admins can read all tables".

**Reasoning:** RLS ensures that even if a malicious user bypasses the frontend UI or if an API key is leaked, the database itself rejects unauthorized queries.

---

## 13. Email Architecture
* **Tools:** React Email (for templating) + Resend (for delivery).
* **Execution:** Emails are sent via Supabase Edge Functions. A Postgres Database Webhook triggers the Edge Function when a new row is inserted into `users` (sending a Welcome email).
* **Templates:** Stored in `packages/emails`.

**Reasoning:** React Email allows developers to build emails using the same component paradigms and Tailwind classes as the main app. Resend provides top-tier deliverability. Edge functions decouple email sending from the frontend, ensuring UI responsiveness.

---

## 14. Notification Architecture
* **In-App:** A `notifications` table in Postgres. Realtime updates are streamed to the client via Supabase Realtime (WebSockets) to update a notification bell.
* **Push (Future):** Integrated via web push API / Firebase Cloud Messaging (FCM) when the mobile app launches.

**Reasoning:** Supabase Realtime allows instant in-app notifications without complex polling logic.

---

## 15. Error Handling Strategy
* **Global:** React Error Boundaries (`<ErrorBoundary>`) wrap major route layouts to catch rendering crashes and display a fallback UI.
* **API Errors:** Handled centrally in TanStack Query's `QueryClient` defaults (e.g., triggering a global toast notification on 500 errors).
* **Validation Errors:** Handled gracefully by Zod, displaying inline text below form fields.

**Reasoning:** Prevents white-screen-of-death (WSOD) and provides actionable feedback to the user without writing `try/catch` blocks in every component.

---

## 16. Logging Strategy
* **Client Logs:** Sentry (or LogRocket) for frontend exception tracking and crash reporting.
* **Server/DB Logs:** Supabase native logs (Postgres, Auth, Edge Functions).
* **Audit Logs:** A dedicated `audit_logs` table (trigger-based) to track sensitive Admin actions (e.g., CSV exports, user deletions).

**Reasoning:** Ensures compliance, aids debugging, and monitors malicious activity.

---

## 17. Security Architecture
* **RLS:** Gated data access at the database level.
* **Rate Limiting:** Managed at the network edge via Cloudflare/Vercel rules and Supabase Auth rate limits to prevent SMS/Email pumping.
* **XSS:** React DOM automatically escapes inputs. Markdown/HTML (if ever rendered) will use `DOMPurify`.
* **CSRF:** Mitigated by modern SameSite cookie policies and custom headers.
* **Environment Variables:** Strictly typed using `t3-env` or Zod to prevent the app from booting if a secret is missing.

---

## 18. Performance Strategy
* **Code Splitting:** React `lazy()` and Router-level lazy loading ensure users only download JS for the route they are visiting.
* **Image Optimization:** Vite plugins or Vercel Image Optimization for WebP serving.
* **Caching:** TanStack query aggressively caches server responses (`staleTime: 5 mins` for non-volatile data like leaderboard ranks).

**Reasoning:** In low-bandwidth regions like Nigeria, minimizing initial bundle size is critical for conversion rates.

---

## 19. Scalability Strategy
When expanding to Marketplace, Study Hub, etc.:
1. We create a new feature folder (`features/marketplace`).
2. We create new Postgres tables (`items`, `transactions`) and link them via Foreign Keys to the central `users` table.
3. We define strict RLS policies for the new tables.
4. The existing Auth, UI components, and routing infrastructure remains entirely untouched.

**Reasoning:** The feature-based architecture ensures horizontal scalability of the codebase. The app scales by adding parallel modules, not by making existing files larger.

---

## 20. Coding Standards
* **Casing:** `camelCase` for variables/functions. `PascalCase` for Components/Interfaces. `kebab-case` for file/folder names (e.g., `user-profile.tsx`).
* **Imports:** Absolute imports configured via `tsconfig.json` (`import { Button } from '@/components/ui/button'`).
* **Prop Types:** Exclusively use TypeScript `interface` or `type`. No `PropTypes`.

---

## 21. Development Standards
* **Branching:** Trunk-based development or GitHub Flow (`feature/waitlist-ui`, `fix/login-bug`).
* **Commits:** Conventional Commits (`feat: add magic link`, `fix: leaderboard sorting`). Enforced via Husky + Commitlint.
* **CI/CD:** GitHub Actions to run ESLint, Prettier, TypeScript compilation, and tests before allowing merges to `main`. Vercel automatically deploys preview environments for every PR.

---

## 22. Reusable Architecture
By extracting generic UI components (Buttons, Inputs, Modals) and Tailwind configurations into `packages/ui`, both the Main Web App and the Admin Dashboard can consume them. When the brand color changes, we update `packages/ui/tailwind.config.ts`, and all applications reflect the change instantly.

---

## 23. Future Mobile App Strategy
By enforcing strict separation between business logic (in `services/` and `hooks/`) and presentation (`components/`), migrating to React Native (Expo) becomes a UI-only task. The mobile app will import the same API services, TanStack hooks, and Zod schemas from a shared package, ensuring identical data behavior across Web and Mobile.

---

## 24. Technical Risks & Mitigation
* **Risk:** Supabase vendor lock-in. 
  * **Mitigation:** Wrap all Supabase calls in abstract service classes. If we migrate to AWS/Node later, we only rewrite the service layer, not the React components.
* **Risk:** Monorepo complexity slows down junior developers.
  * **Mitigation:** Provide excellent `README.md` documentation, use Turborepo for ultra-fast builds, and define clear npm scripts (`yarn dev` boots everything seamlessly).
* **Risk:** Complex RLS policies cause performance degradation.
  * **Mitigation:** Keep RLS policies simple. Use database functions/views for complex authorization checks rather than inline RLS logic.

---

## 25. Architectural Decision Records (ADR)

**ADR 1: Use Supabase over Custom Node.js Backend**
* **Decision:** Rely on Supabase for Auth, DB, and APIs.
* **Reason:** Speed to market for the MVP. Writing CRUD endpoints in Node.js is boilerplate-heavy and delays launch.
* **Trade-offs:** Reliance on PostgREST syntax on the client; vendor lock-in to the Supabase ecosystem.

**ADR 2: Feature-Sliced Design vs. Classic Structure**
* **Decision:** Organize code by feature (`features/waitlist`) rather than strictly by type (`hooks/`, `components/`).
* **Reason:** Classic structure becomes unmaintainable past 50+ components. Feature slicing scales infinitely.
* **Trade-offs:** Slight learning curve for developers used to classic structures; occasionally difficult to decide if a component is "global" or "feature-specific."

**ADR 3: Magic Links over Passwords**
* **Decision:** Use Passwordless Magic Links for MVP Auth.
* **Reason:** Eliminates password resets, guarantees email validity, blocks fake email bots, and reduces UI friction.
* **Trade-offs:** Relies heavily on high email deliverability. Can be slightly confusing for users unused to passwordless flows.
