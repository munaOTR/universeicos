# Universe Product Requirements Document (PRD) - Version 1.1

## 1. Executive Summary
**Universe** is an ambitious ecosystem envisioned as the definitive "operating system" for university students in Nigeria. It addresses the fragmented, inefficient, and often stressful daily experience of students by unifying essential services—from housing and jobs to marketplaces and campus events—under a single, cohesive platform. 
This document defines the requirements for the **Initial Release (MVP)**, which serves as a strategic wedge to validate demand, build a robust waitlist, gather deep product insights, and foster early community engagement before the full platform rollout. The MVP focuses on a high-converting landing page, an intelligent and frictionless waitlist system, a gamified student dashboard with "Campus Unlocks", and a comprehensive admin backend equipped with strict anti-fraud measures.

## 2. Product Vision
To become the omnipresent digital operating system for university students in Nigeria (and eventually Africa), seamlessly integrating every aspect of campus life into one unified, intelligent, and community-driven ecosystem.

## 3. Mission Statement
To empower Nigerian students by simplifying their campus experience, saving them time and money, and creating opportunities for connection and growth through accessible technology.

## 4. Problem Statement
Nigerian university students face immense friction in their daily lives. Navigating campus services, finding reliable housing, buying/selling used textbooks, securing student-friendly jobs, and staying informed about campus events require juggling multiple disjointed WhatsApp groups, physical notice boards, and unreliable offline channels. This fragmentation leads to wasted time, lost opportunities, and high stress, exacerbating an already challenging academic environment.

## 5. Opportunity Analysis
Nigeria has one of the largest student populations in Africa. The transition to digital-first solutions is rapidly accelerating, but a dominant, student-centric super-app does not exist. Existing solutions are either hyper-local (confined to a single university) or too generic. By building a centralized, trust-verified network restricted to verified students, Universe can capture a highly engaged demographic that is notoriously early adopting and viral in its growth patterns.

## 6. Target Audience
* **Primary:** Current undergraduate and postgraduate students enrolled in Nigerian universities, polytechnics, and colleges of education.
* **Secondary:** Incoming freshmen seeking guidance, housing, and integration into campus life.

## 7. User Personas
* **Tunde (The Hustler):** 3rd-year student. Always looking for side gigs, selling items, and finding cheap deals. *Needs:* Marketplace, Jobs, Errands.
* **Chioma (The Academic):** 2nd-year student. Focused on grades, needs quiet study spaces, past questions, and study groups. *Needs:* Study Hub.
* **Emeka (The Socialite):** 4th-year student. President of a campus club, heavily involved in events and networking. *Needs:* Campus Events, Communities.
* **Aisha (The Freshman):** 1st-year student. Overwhelmed, needs housing, campus directions, and new friends. *Needs:* Housing, AI Assistant, Messaging.

## 8. Market Research
The Nigerian student market represents millions of active internet users with significant collective purchasing power. Current student activities rely heavily on informal networks (WhatsApp, Telegram) which lack searchability, safety guarantees, and structural organization. A targeted platform that introduces accountability (e.g., verified student emails) solves the trust deficit inherent in current solutions.

## 9. Competitive Analysis
* **WhatsApp/Telegram Groups:** High engagement but disorganized, hard to search, and rampant with scams.
* **Jiji/Facebook Marketplace:** Broad focus, lack of student-specific context, lower trust factor on campus.
* **University Portals:** Strictly academic/administrative, universally disliked for poor UX, completely lack social/lifestyle utility.
* **Universe Advantage:** Unified experience, high trust (verified domains/IDs), hyper-localized to specific campuses, and inherently viral.

## 10. Why Existing Solutions Fail
* **Lack of Trust:** Scams are common on generic marketplaces.
* **Fragmentation:** Students must check 10 different apps/groups to get a complete picture of campus life.
* **Poor User Experience:** Administrative portals are notoriously slow and unintuitive.
* **No Exclusivity:** Generic social networks lack the intimacy and relevance of a closed campus network.

## 11. Product Positioning
Universe is not just another app; it is the *central hub* of student life. It is positioned as a premium, secure, and indispensable tool designed explicitly by and for Nigerian students.

## 12. Value Proposition
"Everything you need to survive and thrive on campus, in one secure app."

## 13. Goals
* **MVP Goal 1:** Validate market demand by acquiring 10,000+ waitlist signups across at least 5 major Nigerian universities within 3 months.
* **MVP Goal 2:** Achieve a high viral coefficient (>1.2) through the referral system and "Campus Unlock" gamification.
* **MVP Goal 3:** Gather concrete product validation data via "Fake Door" testing in the dashboard to inform V1 module prioritization.

## 14. Non-Goals (MVP)
* Building out the core ecosystem (Marketplace, Study Hub, etc.) in the first release.
* Generating revenue.
* Launching native mobile applications (iOS/Android); MVP will be a responsive web app.
* Fulfillment of physical merchandise rewards (all rewards will be digital).
* Complex data visualization in the Admin panel (CSV exports will suffice for MVP).

## 15. Success Metrics (KPIs)
* **Total Waitlist Signups:** Target: 10,000
* **Referral Rate:** % of users who join via a referral link. Target: 40%
* **Conversion Rate (Landing Page):** Target: 15%
* **Profile Completion Rate:** % of users who fill out all optional demographic data post-signup. Target: 70%
* **Dashboard Re-engagement (DAU/MAU):** % of users who log back into the dashboard daily/weekly to check polls/Campus Unlocks. Target: 25%
* **Cost Per Acquisition (CPA):** Ensure marketing spend and SMS/Email transactional costs remain under $0.50 per verified user.

## 16. User Stories
* As a prospective user, I want to clearly understand what Universe is so that I can decide if I should join.
* As a student, I want to join the waitlist with zero friction (just Name/Email) so I can secure early access quickly.
* As a student, I want to unlock my referral link by completing my profile demographics in the dashboard.
* As a student, I want to share my unique referral link so I can climb the leaderboard and unlock campus-wide features.
* As a student, I want to vote on daily campus polls so I can see what other students think and stay engaged.
* As a student, I want to click on "Fake Door" icons for future modules to express my interest in them.
* As an admin, I want to track which universities have the highest signups to manage the "Campus Unlocks".
* As an admin, I want strict anti-fraud measures so the waitlist isn't polluted with bots.

## 17. Functional Requirements
* **Landing Page:** Static content, FAQ, ultra-low friction Waitlist form (Name + Email + CAPTCHA).
* **Authentication:** Magic link (expires in 15 mins) with global error boundary handling. Email verification is strictly required to access the dashboard.
* **Referral Engine:** Generates unguessable alphanumeric codes, tracks clicks/conversions via 30-day cookie, applies strict anti-fraud checks.
* **Student Dashboard:** 
  * "Complete Profile" module (University, Faculty, Department, Level, Biggest Challenge).
  * "Campus Unlock" progress bar for their specific university.
  * "Fake Door" module area showing greyed-out future features (Marketplace, Errands) with "Notify Me" buttons.
  * Daily poll/community engagement widget to drive DAU.
* **Admin Dashboard:** Role-Based Access Control (RBAC). `SuperAdmin` can delete users/manage settings. `MarketingAdmin` can export CSVs. All destructive/export actions require audit logging.

## 18. Non-Functional Requirements
* **Performance:** Landing page must load in under 2 seconds on 3G networks. System must support 5,000 concurrent connections and 100 signups/second.
* **Security:** Data encryption at rest/transit. Cloudflare Turnstile/reCAPTCHA on signup. Rate limit to max 3 signups per IP per day. Block disposable emails (e.g., Mailinator).
* **Availability:** 99.9% uptime target.
* **Browser Support:** Chrome, Safari, Firefox (last 3 versions), and Opera Mini (crucial for Nigeria).
* **Telemetry:** Explicit event tracking (`Waitlist_Submit`, `Email_Verified`, `Profile_Completed`, `Referral_Copied`, `FakeDoor_Clicked`, `Poll_Answered`).

## 19. Product Scope
The full product scope encompasses a multi-module super-app. However, this is strictly phased to manage risk and validate assumptions.

## 20. MVP Scope
* Landing Page.
* Smart, frictionless Waitlist Collection (Name/Email only).
* User Dashboard (Profile completion, "Fake Doors", Daily Polls, Gamified "Campus Unlocks").
* Secure Admin Dashboard (Audit logs, RBAC, CSV exports).

## 21. Future Scope (The Core Platform)
* **Marketplace:** P2P buying and selling of textbooks, electronics, furniture.
* **Study Hub:** Past questions repository, study groups, tutor matching.
* **Errands:** Peer-to-peer delivery and task outsourcing (e.g., "submit my assignment").
* **Housing:** Off-campus hostel listings, roommate matching.
* **Jobs:** Freelance gigs, campus ambassador roles, internships.
* **Campus Communities:** Clubs, faculty associations, interest groups.
* **Messaging:** Encrypted P2P and group chat.
* **Payments:** In-app wallet for frictionless P2P transfers and vendor payments.
* **Events:** Ticketing and RSVP for campus parties and seminars.
* **AI Assistant:** AI trained on university handbooks and course catalogs.

## 22. Complete Feature Breakdown (MVP)
### 22.1 Landing Page
* Hero Section (Value prop, Email/Name capture + Turnstile).
* "The Problem" section & "The Universe Solution".
* Interactive Roadmap preview.
* Reward tiers and "Campus Unlock" explanations.
* Social Proof / Testimonials (Placeholders).

### 22.2 Waitlist Onboarding Flow (Optimized)
* **Step 1:** User enters Name & Email on the landing page and submits.
* **Step 2:** User receives a Magic Link email for verification (prevents fake emails).
* **Step 3:** User clicks Magic Link, verified, and lands on the Dashboard.

### 22.3 Student Dashboard
* **Header:** Welcome [Name].
* **Onboarding Widget:** "Complete your profile (University, Level, etc.) to unlock your referral link."
* **Referral Card (Post-Profile):** Unique Link, one-click copy, WhatsApp/Twitter share buttons.
* **Campus Unlock Track:** Visual progress bar (e.g., "Unilag is 40% away from unlocking the Marketplace beta! Invite classmates!").
* **Fake Door Validation:** "Which feature do you want first?" -> Shows Marketplace, Study Hub, Errands. Clicking one records a telemetry event.
* **Daily Poll:** Simple engagement tool (e.g., "Hardest 100-level course?") to bring users back daily.

### 22.4 Admin Dashboard
* **Overview Metrics:** Total users, daily active users, top universities, fake door click stats.
* **User CRM:** Table of all signups. Export to CSV.
* **RBAC & Security:** `SuperAdmin` and `MarketingAdmin` roles. Strict audit logs for any CSV export or user deletion.

## 23. User Flows & Edge Cases
**Flow 1: New User Signup**
Lands on site -> Enters Name/Email -> Receives Magic Link -> Clicks Link -> Lands on Dashboard -> Completes Profile -> Unlocks Referral Link.

**Edge Cases & Error Handling:**
* **Magic Link Expired:** Show user a clear "Link Expired" page with a button to "Resend Link".
* **Email Bounce:** If welcome email hard-bounces, account is flagged as invalid, and any referrer does not get credit.
* **Duplicate Email:** Show inline error: "You're already on the waitlist! Click here to log in."
* **Rate Limit Hit:** "You've requested too many magic links. Please wait 15 minutes."

## 24. Referral System Overview
* Every user gets a unique, unguessable alphanumeric ID (e.g., `universe.app/join/tu9x2p`).
* Cookies track the referrer for 30 days. If User A clicks the link on mobile, then signs up on the same device within 30 days, attribution holds.
* **Anti-Fraud:** No points awarded for unverified emails. Limit of 3 signups per IP address per day. Block disposable email providers.

## 25. Waitlist Growth Strategy
* **Campus Unlocks:** The primary viral loop. By gating early access to specific universities based on their collective signup milestones, students will pressure their peers to join.
* **Campus Ambassadors:** Identify highly connected students to seed the initial waitlist.
* **Micro-Influencers:** Partner with student influencers on Twitter/X and TikTok.

## 26. Database Readiness & Schema Constraints
* **Users Table (`Identity`):** Must use UUIDs to carry over seamlessly into V1. Emails must be globally unique.
* **Profiles Table:** 1:1 relationship with Users. Stores demographic data (University, Level).
* **Indexes:** Create explicit B-Tree indexes on `referral_code` and `email` columns for fast lookups.
* **Soft Deletes:** Include `deleted_at` timestamps for GDPR/NDPR compliance. Do not hard delete records immediately.

## 27. Notifications & Email Strategy
* **Transactional (Requires High Deliverability):** Magic links, Password resets. Must bounce-check.
* **Engagement:** "Your campus just hit 50% on the Unlock Track!", "Someone joined using your link!"
* **Strategic:** Weekly digest on Universe's progress.
* **Drip Campaign:** Day 1: Welcome. Day 3: How to climb the leaderboard & unlock your campus. Day 7: Vote on our Fake Doors.

## 28. Gamification Opportunities
* **Milestone 1 (3 referrals):** Guaranteed Day-1 Beta Access.
* **Milestone 2 (10 referrals):** Digital Reward (e.g., 1GB Data or Airtime). Avoid physical merch for the MVP to reduce operational load.
* **University Leaderboard:** Pitting universities against each other to foster tribal competitiveness.

## 29. Risks
* **High Churn:** Users sign up but forget about the product. *(Mitigation: Daily polls, regular high-quality email updates).*
* **Referral Fraud:** Users creating fake emails. *(Mitigation: Email verification, IP limiting, CAPTCHA, disposable email blocking).*
* **Scalability Risk:** The MVP backend is built as a throwaway script and has to be rewritten for V1. *(Mitigation: Build the MVP on the intended V1 tech stack, e.g., proper Postgres schema and UUIDs).*

## 30. Assumptions
* Students are willing to adopt a new platform if it genuinely solves their pain points.
* WhatsApp sharing is the primary vector for virality among Nigerian students.
* Digital rewards (data/airtime) are sufficient motivators for referrals.

## 31. Constraints
* Limited initial engineering resources; the MVP must be built efficiently.
* Must be highly optimized for mobile web and low bandwidth (Opera Mini compatibility).

## 32. Open Questions
* Are we integrating a 3rd party API (e.g., Termii, Africa's Talking) for automated Airtime/Data disbursement, or handling it manually for the MVP?
* What is the exact milestone number for a "Campus Unlock" (e.g., 1,000 students per campus)?

## 33. Product Roadmap
* **Phase 1 (Month 1):** Develop and launch the MVP (Landing Page + Waitlist + Dashboards with Fake Doors).
* **Phase 2 (Months 2-3):** Community building, monitor Fake Door clicks to decide V1 module, marketing push.
* **Phase 3 (Month 4-6):** Build and launch the Core App (V1) featuring the top requested module (Marketplace or Study Hub).
* **Phase 4 (Month 6+):** Iterate, expand modules, scale to more universities.

## 34. Development Milestones
1. **Design Sign-off:** Figma wireframes and high-fidelity designs completed.
2. **Backend Architecture:** Postgres schema with indexes, RBAC, and telemetry endpoints finalized.
3. **Frontend Implementation:** Landing page and dashboard built and integrated.
4. **Internal Testing:** UAT with the founding team. Focus on edge cases and magic link expiry.
5. **Soft Launch:** Release to a small group of friendly beta testers to test the Campus Unlock viral loop.
6. **Public Launch:** Marketing campaign goes live.

## 35. Acceptance Criteria
* Users can sign up with just Name/Email and successfully receive a Magic Link within 5 seconds.
* Dashboard displays empty state for profile demographics, which must be completed to generate the referral code.
* "Fake Door" clicks successfully log to the analytics backend.
* Admins with `MarketingAdmin` roles can export CSVs, and an audit log is generated. Admins cannot export if they lack the role.
* Referral URLs correctly attribute signups ONLY if the invited user verifies their email.
* System rejects disposable email domains and blocks IPs with >3 signups in 24 hours.

## 36. Appendix
* **Glossary of Terms:**
    * *MVP:* Minimum Viable Product.
    * *Viral Coefficient:* The number of new users generated by one existing user.
    * *Fake Door Testing:* Presenting a feature to users before it exists to measure actual interest via click-through rates.
* **Tech Stack Recommendations:** Next.js (Frontend), Node.js/Express or Supabase (Backend), PostgreSQL (Database), Tailwind CSS (Styling).
