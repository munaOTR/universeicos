# Universe UX Specification & Blueprint

This document serves as the definitive User Experience (UX) blueprint for the Universe platform. It defines how students and administrators navigate, interact, and experience the product. This specification acts as the source of truth for all future UI implementation, ensuring consistency, reduced friction, and long-term scalability.

---

## 1. Product Navigation Architecture

The navigation architecture is designed to progressively disclose complexity. As new modules are added, they slot naturally into the existing structure without requiring a redesign.

### Public Navigation (Landing Page)
- **Header:** Logo (Left) | Waitlist, About, Features (Center) | Join Waitlist CTA (Right)
- **Footer:** Links to Socials, Legal (Privacy, Terms), Contact.
- **Reasoning:** Keeps the focus entirely on conversion (joining the waitlist).

### Authenticated Student Navigation (Mobile First)
- **Bottom Tab Bar:** Home, Leaderboard, Referrals, Menu (Hamburger).
- **Menu (Drawer):** Contains Profile, Settings, and Future Modules.
- **Reasoning:** Since the vast majority of students will access Universe via their phones, thumb-friendly navigation is the absolute priority. Less frequently used modules go into the Menu drawer to avoid tab bar clutter.

### Authenticated Student Navigation (Desktop)
- **Left Sidebar (Persistent):** Home, Leaderboard, Referrals, Profile. (Future: Marketplace, Study Hub, Jobs).
- **Top App Bar:** Global Search, Notifications (Bell icon), User Avatar (Dropdown for Settings/Logout).
- **Reasoning:** A persistent sidebar accommodates infinite vertical growth as new modules are released for the minority of users on larger screens.

### Admin Navigation
- **Left Sidebar:** Dashboard, Users, Referrals, Surveys, Announcements, Settings, Logs.
- **Top App Bar:** Environment Toggle (Staging/Prod), Admin Profile.
- **Reasoning:** Standard enterprise dashboard layout. Admins need high information density on wide screens.

---

## 2. Information Architecture (IA)

Universe is divided into three distinct spaces:

1.  **Public Sphere:** Marketing, SEO, and Acquisition (Landing Page, Waitlist Form).
2.  **Student Sphere:** The core operating system.
    *   *Core Hub:* Dashboard Home, Notifications.
    *   *Growth Engine:* Referrals, Leaderboard.
    *   *Feedback Loop:* Surveys, Feature Suggestions.
    *   *Identity:* Profile, Settings.
3.  **Admin Sphere:** Moderation, Analytics, and Control.

**Future Module Integration:**
New features act as "Apps" within the OS. A new "Marketplace" simply becomes a new node under the *Student Sphere* and a new management tab in the *Admin Sphere*.

---

## 3. Sitemap

```text
Universe
├── Public
│   ├── Landing Page
│   ├── Join Waitlist
│   └── Legal (Terms, Privacy)
├── Authentication
│   ├── Magic Link Login (Future)
│   └── Verify Email
├── Student Dashboard
│   ├── Home (Overview & Activity)
│   ├── Referrals
│   │   ├── My Code
│   │   └── My Network
│   ├── Leaderboard
│   ├── Profile
│   ├── Notifications
│   ├── Feature Suggestions
│   └── Surveys
└── Admin Dashboard
    ├── Overview Analytics
    ├── Users Management
    ├── Referral Management
    ├── Announcement Creator
    ├── Survey Manager
    └── System Settings
```

---

## 4. User Personas

1.  **The Hustler (First-Year / Entrepreneur):** Highly motivated by the Leaderboard and rewards. Needs a seamless way to copy and share referral links across WhatsApp and Twitter. *UX Focus: Zero-friction sharing.*
2.  **The Casual User (Mid-Year Student):** Signs up out of curiosity. Rarely visits unless notified. *UX Focus: Compelling push/email notifications to bring them back.*
3.  **The Administrator (System Moderator):** Needs to manage thousands of users and catch referral abuse. *UX Focus: Dense data tables, bulk actions, and clear audit logs.*

---

## 5. User Journey Maps

### Scenario: Joining the Waitlist & First Referral
- **Goal:** Get a student on the waitlist and immediately incentivize them to invite others.
- **Entry Point:** Marketing Landing Page.
- **Actions:** 
  1. Enters email and university name. 
  2. Submits form. 
  3. Receives "Verify Email" link.
  4. Clicks link, lands on Authenticated Dashboard.
  5. Sees massive "Share your code" modal.
- **System Response:** Generates unique `ref_code`, creates user in DB, triggers Welcome email.
- **Potential Frustrations:** Email goes to spam.
- **Improvement Opportunity:** Show a "Check your spam folder" tooltip post-submission. Add one-click WhatsApp sharing immediately after verification.

---

## 6. Onboarding Experience

1.  **Welcome State:** Upon first authentication, the dashboard is heavily simplified. 
2.  **The "One Action" Focus:** A celebratory modal welcomes them and presents exactly one CTA: "Copy your referral link to move up the waitlist."
3.  **Progressive Disclosure:** Notifications and Surveys are hidden until the user has actually generated a referral or after 24 hours have passed, preventing cognitive overload.

---

## 7. Referral Experience

- **Generation:** Unique short code automatically generated on signup.
- **Sharing:** One-click copy. Native "Share" API integration for mobile browsers (opens WhatsApp/X directly).
- **Tracking:** Real-time updates on the Dashboard ("3 friends have clicked your link, 1 signed up").
- **Gamification:** The Leaderboard shows their rank climbing dynamically with subtle CSS animations.

---

## 8. Dashboard UX (Student)

- **Homepage:** A unified feed. 
  - *Top:* Current waitlist position / Rank.
  - *Middle:* Active announcements from admins.
  - *Bottom:* Quick actions (Share link, Take a survey for points).
- **Navigation Flow:** Students can click their rank to jump to the Leaderboard, or click a survey banner to jump to the Surveys page.

---

## 9. Admin UX

- **Overview:** High-level metrics (Total Users, Daily Signups, Active Surveys).
- **Workflows:** 
  - *Finding a user:* Global search bar (Cmd+K / Ctrl+K) accessible from anywhere to instantly jump to a user's profile.
  - *Moderation:* Flagged referral loops (same IP) are highlighted in red on the Referral Management table.

---

## 10. Feature Request Workflow

1.  **Student:** Clicks "Suggest Feature" -> Opens a simple Drawer (Title, Description). Submits.
2.  **System:** Displays toast: "Suggestion sent!"
3.  **Admin:** Sees suggestion in Admin Dashboard. Can click "Approve to Roadmap" or "Dismiss".
4.  **Student:** Receives in-app notification: "Your suggestion was added to the roadmap!"

---

## 11. Survey Workflow

1.  **Admin:** Creates survey (Multiple choice/Text) in Admin panel. Clicks "Publish".
2.  **Student:** Sees a notification badge and a banner on the Dashboard Home.
3.  **Student:** Clicks banner -> Opens a focused, distraction-free Survey Modal.
4.  **Student:** Submits -> Modal closes -> Confetti animation -> Waitlist points awarded.

---

## 12. Email Experience

Emails are critical touchpoints for re-engagement.
- **Design:** Clean, text-heavy, highly personal. (Avoid corporate HTML templates that look like marketing spam).
- **Triggers:**
  - *Welcome/Verify:* Immediate.
  - *Referral Success:* "Your friend [Name] just joined Universe!"
  - *Milestone:* "You're in the Top 100!"
  - *Announcement:* Feature updates or new surveys.

---

## 13. Notification Experience

- **In-App:** A dropdown from the top app bar. Unread notifications have a subtle blue dot. Clicking a notification marks it as read and navigates the user to the relevant page (e.g., clicking a survey notification opens the survey).
- **Empty State:** "You're all caught up! Go invite some friends."

---

## 14. Empty State Experience

Empty states must *never* be a dead end.
- **No Referrals:** Illustration of a lonely astronaut. CTA: "Copy Link & Invite Friends".
- **No Notifications:** Illustration of a quiet galaxy. CTA: "Check out the Leaderboard".
- **Empty Leaderboard (New University):** CTA: "Be the first to claim the top spot at [University]!"

---

## 15. Error Recovery

- **Expired Magic Link:** "This link has expired for your security. [Send new link]"
- **Duplicate Email:** "Looks like you're already on the waitlist! [Log in instead]"
- **Offline Mode:** Dashboard caches the last known state. A subtle red banner appears: "You're offline. Reconnecting..." Buttons that require network (Submit Survey) are gracefully disabled.

---

## 16. Edge Cases

- **Self-Referrals (Abuse):** Handled gracefully. If a user tries to sign up with their own link or same IP, allow the signup but *silently* flag the referral as invalid in the backend. Do not show an error to the user to prevent them from reverse-engineering the fraud detection.
- **Abandoned Onboarding:** If a user enters an email but never verifies, send exactly one reminder email 24 hours later.

---

## 17. Future Expansion

When "Marketplace" is added:
- It becomes a new item in the Student Sidebar.
- Notifications seamlessly route to Marketplace chats instead of just surveys.
- The UX paradigm (Sidebar navigation, top search) remains 100% intact, preventing user disorientation.

---

## 18. Low-Fidelity Wireframes

**Student Dashboard Home (Mobile Layout - Primary Focus):**
```text
---------------------------------
| [Logo]           [Bell] [Profile]
---------------------------------
|  Welcome back, Tobi!          |
|                               |
|  +-------------------------+  |
|  |  Current Rank: #42      |  |
|  |  Referrals: 12          |  |
|  +-------------------------+  |
|                               |
|  📢 Announcements             |
|  [ New Survey Available! ]    |
|                               |
|  🚀 Quick Share               |
|  [ rutherkingconsult.co.uk/ref/tobi ]     |
|  [    COPY / SHARE URL  ]     |
|                               |
---------------------------------
| [Home] [Rank] [Share] [Menu]  |
---------------------------------
```

**Student Dashboard Home (Desktop Layout):**

```text
---------------------------------------------------------
| [Logo]        [Global Search...]              [Bell] [Profile] |
---------------------------------------------------------
|           |                                           |
| Home      |  Welcome back, Tobi!                      |
| Referrals |                                           |
| Rank      |  +-------------------------------------+  |
| Roadmap   |  |  Current Rank: #42                  |  |
|           |  |  Referrals: 12                      |  |
|           |  +-------------------------------------+  |
|           |                                           |
|           |  📢 Announcements                         |
|           |  [ New Survey Available! Click here ]     |
|           |                                           |
|           |  🚀 Quick Share                           |
|           |  [ rutherkingconsult.co.uk/ref/tobi123 ] [COPY]       |
---------------------------------------------------------
```

---

## 19. Responsive Wireframes (Mobile-First)

- **Mobile (<768px):** The baseline layout. Sidebar disappears entirely. Bottom navigation bar anchors the app. Complex data tables switch to stacked card layouts for vertical scrolling.
- **Tablet (768px - 1024px):** Bottom navigation converts to a left-side icon-only rail to save horizontal space while exposing more content area.
- **Desktop (1024px+):** Sidebar is permanently pinned open with text labels. Content expands but enforces a maximum width of 1440px to prevent infinite stretching.

---

## 20. UX Principles

1.  **The "Two-Tap" Rule:** Any core action (Copying a link, checking rank) must take no more than two taps/clicks from the homepage.
2.  **Progressive Disclosure:** Only show complex information (like settings or full analytics) when explicitly requested.
3.  **Positive Reinforcement:** Every successful action gets visual feedback (Toast, Confetti, Checkmark).
4.  **No Dead Ends:** Every empty state must have a CTA.

---

## 21. Friction Analysis

| Friction Point | Impact | Recommended Solution | Severity |
| :--- | :--- | :--- | :--- |
| **Email Verification** | Users forget to check email, dropping off. | Show a persistent "Waiting for verification" screen with a direct link to Gmail/Yahoo inboxes. | High |
| **Copying Links on Mobile** | Highlighting text is hard on phones. | Dedicated, massive "Copy" button. Use Web Share API for native OS sharing. | High |
| **Survey Fatigue** | Users abandon long surveys. | Keep surveys to 1-3 questions maximum. Show a progress bar. | Medium |

---

## 22. Conversion Optimization

- **Waitlist Sign-ups:** Remove all unnecessary fields. Only ask for Name and Email initially. Ask for University *after* they are verified.
- **Referral Sharing:** Pre-populate Twitter and WhatsApp share intents with compelling copy: *"I just joined the Universe waitlist for [University]. Use my link to jump the queue! 🚀"*
- **Returning Users:** Gamify the experience by sending "You dropped 5 spots in the leaderboard" emails to trigger loss-aversion psychology.

---

## 23. Future UX Strategy

By establishing a robust sidebar/bottom-tab navigation model now, we create a "shell" that can accept any future module. The Dashboard acts as an aggregator (an OS desktop), surfacing the most important information from the sub-modules (Marketplace alerts, Study Hub reminders) into a unified feed, ensuring the platform remains cohesive no matter how large it grows.
