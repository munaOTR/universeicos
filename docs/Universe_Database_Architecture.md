# Universe Database Architecture

## 1. High-Level Architecture & Strategy

Universe is designed as a modular, scalable "operating system" for Nigerian university students. The database architecture follows these core principles:

1. **Identity Decoupling:** `auth.users` handles pure authentication (Supabase). `public.profiles` extends identity with demographic details. This allows auth providers to change without breaking the application logic.
2. **Modular Extensibility:** Tables are grouped by domain (Demographics, Engagement, Comms). Future domains (Marketplace, Housing, Jobs) will plug into the existing `profiles` table via foreign keys without requiring structural changes to the core.
3. **Strict RBAC:** Permissions are granted via roles (`admin`, `student`, `moderator`). We use a hybrid approach of ENUMs on the user profile paired with strict RLS policies to maximize edge-performance.
4. **Soft Deletes:** Tables where data integrity is historically critical use `deleted_at` timestamps instead of hard deletes (GDPR/NDPR compliant).

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% Core Identity (Current)
    AUTH_USERS ||--o| PROFILES : "1:1 identity"
    PROFILES }|--|| UNIVERSITIES : "belongs to"
    PROFILES }|--|| FACULTIES : "belongs to (optional)"
    PROFILES }|--|| DEPARTMENTS : "belongs to (optional)"

    %% Gamification & Engagement (Current)
    PROFILES ||--o{ REFERRALS : "refers"
    PROFILES ||--o{ WAITLIST : "joins"
    PROFILES ||--o{ USER_BADGES : "earns"
    BADGES ||--o{ USER_BADGES : "awards"
    LEADERBOARD_SNAPSHOTS }|--|| UNIVERSITIES : "tracks"

    %% Comms & Feedback (Current)
    PROFILES ||--o{ NOTIFICATIONS : "receives"
    PROFILES ||--o{ FEATURE_REQUESTS : "requests"
    SURVEYS ||--o{ SURVEY_QUESTIONS : "has"
    SURVEY_QUESTIONS ||--o{ SURVEY_RESPONSES : "receives"
    PROFILES ||--o{ SURVEY_RESPONSES : "submits"

    %% Observability (Current)
    PROFILES ||--o{ AUDIT_LOGS : "performs"
    PROFILES ||--o{ ACTIVITY_LOGS : "generates"

    %% Future Modules (Dashed lines indicate future structure)
    PROFILES |..o{ MARKETPLACE_LISTINGS : "creates"
    PROFILES |..o{ STUDY_GROUPS : "joins"
    PROFILES |..o{ ERRAND_REQUESTS : "requests"
    PROFILES |..o{ HOUSING_LISTINGS : "posts"
    MARKETPLACE_LISTINGS |..o{ ORDERS : "receives"
    ERRAND_REQUESTS |..o{ PAYMENTS : "requires"

    %% Entities
    AUTH_USERS {
        uuid id PK
        string email
    }
    
    PROFILES {
        uuid id PK "FK to auth.users"
        string full_name
        uuid university_id FK
        uuid department_id FK
        enum role "student, admin, moderator"
        string referral_code
        int points
        timestamp deleted_at
    }

    UNIVERSITIES {
        uuid id PK
        string name
        string acronym
        string domain
    }

    BADGES {
        uuid id PK
        string name
        string icon
        int points_required
    }

    REFERRALS {
        uuid id PK
        uuid referrer_id FK
        uuid referred_id FK
        enum status "pending, completed, flagged"
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string title
        string body
        boolean read
    }
    
    SURVEYS {
        uuid id PK
        string title
        timestamp expires_at
    }

    %% Future Entities
    MARKETPLACE_LISTINGS {
        uuid id PK
        uuid seller_id FK
        string title
        numeric price
    }
    
    ERRAND_REQUESTS {
        uuid id PK
        uuid requester_id FK
        uuid runner_id FK
        string task
        numeric bounty
    }
```

---

## 3. Core Tables Summary (MVP)

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user data (name, university, role, points, avatar). 1:1 with `auth.users`. |
| `universities` | Master list of Nigerian universities. Used for validation and leaderboards. |
| `faculties` | Groups of departments within a university. |
| `departments` | Specific course/department associated with a student. |
| `waitlist` | Tracks users waiting for early access, their position, and status. |
| `referrals` | Maps referrer to referred user. Statuses: `pending`, `completed`, `flagged`. |
| `badges` | Achievements that users can earn (e.g., "Early Adopter", "Top Referrer"). |
| `user_badges` | Junction table mapping badges to users. |
| `leaderboard_snapshots` | Daily/weekly materializations of leaderboard states. |
| `notifications` | In-app user notifications. |
| `surveys` | Daily polls or general questionnaires. |
| `survey_questions` | Individual questions tied to a survey. |
| `survey_responses` | User answers to survey questions. |
| `feature_requests` | "Fake Door" tracking (which future modules students vote for). |
| `announcements` | Global platform announcements displayed to all active users. |
| `audit_logs` | Immutable log of administrative actions (e.g., CSV exports, role changes). |
| `activity_logs` | High-volume table for DAU tracking and feature engagement. |

---

## 4. Future Expansion Strategy

The schema is designed to require zero structural changes to the core identity layer when adding future modules:

- **Marketplace:** Will introduce `products`, `categories`, and `orders`. These will link via `seller_id` and `buyer_id` directly back to `profiles.id`. RLS will ensure users can only edit their own listings.
- **Student Errands:** Introduces `errand_requests` and `errand_bids`. The core identity handles the trust layer, while payments will link to a future `wallets` table.
- **Housing:** Introduces `housing_listings` linking to `universities` and `profiles`.
- **Messaging:** Introduces `chat_threads` and `chat_messages` using Supabase Realtime for instant delivery, relying entirely on the existing `profiles` table for avatars and names.

---

## 5. Naming Conventions

- **Tables:** `snake_case`, plural (e.g., `survey_responses`).
- **Columns:** `snake_case`, descriptive (e.g., `referral_code`, not `ref_cd`).
- **Primary Keys:** Always `id` of type `UUID` with `gen_random_uuid()` default.
- **Foreign Keys:** `<entity_singular>_id` (e.g., `university_id`).
- **Timestamps:** Always include `created_at` and `updated_at` (managed via triggers) of type `TIMESTAMP WITH TIME ZONE`.
- **Enums:** `snake_case`, descriptive (e.g., `user_role`, `referral_status`).

---

## 6. Authentication & User Lifecycle

1. **Signup (Waitlist/Magic Link):** User enters email and name. Supabase `auth.users` creates a record.
2. **Profile Generation Trigger:** An auto-trigger fires upon `auth.users` insertion, automatically creating a linked row in `public.profiles`. The trigger generates a unique `referral_code` and assigns the default `student` role.
3. **Onboarding:** The user provides their `university_id` and `department_id`. They unlock their referral dashboard.
4. **Activity:** Engagement events (voting, referring) are captured in `activity_logs`.
5. **Soft Deletion:** If a user requests account deletion, `profiles.deleted_at` is set, preserving referential integrity for financial or audit compliance.

---

## 7. Row Level Security (RLS) Strategy

We enforce the principle of least privilege:
- **Profiles:** Users can `SELECT` and `UPDATE` their own profile. Other students can `SELECT` public profile fields (name, avatar, points) but not email or settings.
- **Admin Access:** A secure PostgreSQL function `is_admin()` checks if `auth.uid()` corresponds to a profile with `role = 'admin'`. Policies using this function grant `ALL` access to admins on almost all tables.
- **Notifications:** Users can only `SELECT` and `UPDATE` (mark as read) their own notifications.
- **Surveys/Announcements:** All active users can `SELECT` global announcements and surveys. Users can only `INSERT` into `survey_responses` if they haven't already answered.
- **Audit Logs:** Strictly `INSERT`-only for system triggers; `SELECT` restricted to `SuperAdmin` roles.

---

## 8. Indexing & Performance Optimization

- **Foreign Keys:** All foreign keys will have a B-Tree index (e.g., `idx_profiles_university_id`).
- **Referrals:** Index on `profiles.referral_code` for O(1) lookup during signups.
- **Leaderboards:** Compound index on `(university_id, points DESC)` to instantly fetch top users per campus.
- **Search:** GIN index on `profiles.full_name` utilizing `pg_trgm` extension for fast "find classmate" functionality in the future.
- **Pagination:** Cursor-based pagination relies on indexed `created_at` columns across all high-volume tables (`notifications`, `activity_logs`).

---

## 9. Storage & Realtime

### Storage Buckets
- `avatars` (Public): For user profile images. Size limit 2MB.
- `documents` (Private): For future ID verification or study notes. Restricted via RLS to owners and admins.
- `marketplace` (Public - Future): For product listings.

### Realtime
- **Enabled:** `notifications`, `announcements`.
- **Reasoning:** Students should see new announcements or point alerts instantly without refreshing the dashboard. High-volume tables like `activity_logs` are excluded to save WebSocket bandwidth.

---

## 10. Backup & Recovery

- **Point-in-Time Recovery (PITR):** Maintained via Supabase (up to 7 days for Pro tier) for disaster recovery.
- **Soft Deletes:** Prevents accidental data loss from cascading `DELETE` statements.
- **Idempotent Migrations:** All SQL migrations use `CREATE TABLE IF NOT EXISTS` and `DO $$ BEGIN ... EXCEPTION` blocks to ensure they can be applied safely.
