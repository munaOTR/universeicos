# Universe Design System & UI/UX Specification

This document serves as the permanent UI/UX foundation and master reference for the Universe platform. It defines the visual language, design principles, and technical tokens required to build a cohesive, scalable, and accessible ecosystem across web, admin, and future mobile applications.

---

## 1. Brand Identity

**Brand Personality:**
Universe is the ultimate digital companion for Nigerian university students. It is modern, premium, intelligent, and deeply attuned to the fast-paced nature of student life. It does not feel like a typical "school portal" (which are often clunky and outdated); instead, it feels like a top-tier consumer product (akin to Apple, Stripe, or Vercel).

**Emotional Goals:**
- **Empowered:** Students should feel they have control over their academic and social lives.
- **Relieved:** The interface should reduce cognitive load, making tasks feel effortless.
- **Delighted:** Micro-interactions and premium aesthetics should spark joy and trust.

**Brand Voice (Visual):**
Confident, clean, fast, and structured. We use purposeful whitespace, crisp typography, and deliberate splashes of color rather than overwhelming the user with noise.

---

## 2. Visual Language

**Minimalism with Depth:**
The UI relies on a clean, minimalistic base (whites and off-whites in light mode, deep zincs/blacks in dark mode) punctuated by our primary brand color. 

- **Border Radius:** `0.5rem` (8px) for buttons and inputs (slightly rounded but professional). `0.75rem` (12px) to `1rem` (16px) for cards and modals to create soft, approachable containers.
- **Shadows & Elevation:** Avoid harsh, dark shadows. Use soft, diffused, multi-layered shadows to establish elevation. The higher the element (modals, dropdowns), the wider and softer the shadow.
- **Borders:** Use subtle, low-opacity borders (e.g., `border-zinc-200` in light, `border-zinc-800` in dark) to define sections rather than relying solely on background colors.
- **Glassmorphism:** Used sparingly for sticky navigation bars or floating action buttons to maintain context without cluttering the screen. Background blur should be strong (`blur-md`).
- **Gradients:** Restricted to marketing pages, hero sections, or premium features (e.g., leveling up on a leaderboard). Dashboards should remain flat and functional.

---

## 3. Color System

The system is anchored by a rich, dark green, symbolizing growth, prosperity, and Nigerian identity, balanced with neutral zincs.

**Primary (Green)**
- `primary-50`: `#ecfdf5`
- `primary-100`: `#d1fae5`
- `primary-500`: `#10b981` (Base accent)
- `primary-600`: `#059669` (Hover)
- `primary-700`: `#047857` (Brand/Dark Mode Base)
- `primary-900`: `#064e3b`

**Semantic Colors**
- **Secondary:** Deep Indigo/Blur (for contrast and specific interactive elements).
- **Success:** Emerald green (aligns with primary, but explicitly for validation).
- **Warning:** Amber (`#f59e0b`) - For pending states or caution.
- **Danger:** Rose (`#e11d48`) - For destructive actions.
- **Info:** Blue (`#3b82f6`) - For informational tooltips or links.

**Neutrals (Zinc - Professional & Sleek)**
- `zinc-50` to `zinc-900`. 

**Theme Mapping (Light/Dark)**
- **Background:** `zinc-50` (Light) / `zinc-950` (Dark)
- **Surface (Cards):** `white` (Light) / `zinc-900` (Dark)
- **Border:** `zinc-200` (Light) / `zinc-800` (Dark)
- **Text:** `zinc-900` (Light) / `zinc-50` (Dark)
- **Muted Text:** `zinc-500` (Light) / `zinc-400` (Dark)

---

## 4. Typography System

**Font Family:** `Inter` (sans-serif) for all UI elements. It is highly legible, scales perfectly across screen sizes, and feels natively modern on both iOS and Android.

**Scale:**
- **Display:** `48px/60px` (Marketing/Hero) - Bold
- **H1:** `36px/40px` (Page Titles) - SemiBold
- **H2:** `24px/32px` (Section Titles) - SemiBold
- **H3:** `20px/28px` (Card Titles) - Medium
- **Body Large:** `16px/24px` (Main text/Inputs) - Regular
- **Body Small:** `14px/20px` (Secondary text/Metadata) - Regular
- **Caption:** `12px/16px` (Badges/Tooltips) - Medium

**Why Inter?**
University students consume massive amounts of information. Inter's tall x-height and clean tracking reduce eye strain, making dashboards highly readable even in dense data views.

---

## 5. Spacing System

Universe uses a strict `4px` baseline grid.

- `xs`: 4px (`p-1`)
- `sm`: 8px (`p-2`)
- `md`: 16px (`p-4`) - Standard component padding
- `lg`: 24px (`p-6`) - Standard card padding
- `xl`: 32px (`p-8`) - Standard section gap
- `2xl`: 48px (`p-12`)
- `3xl`: 64px (`p-16`) - Page margins

All components, gaps, and margins must snap to these values. No arbitrary spacing (e.g., `17px` or `21px`).

---

## 6. Layout System

**Containers:**
- **Dashboard Max Width:** `1440px` to prevent ultra-wide screens from stretching tables indefinitely.
- **Marketing Max Width:** `1280px`.
- **Form/Auth Max Width:** `480px` (Keep inputs narrow for readability).

**Structure:**
- **Student Dashboard:** Bottom navigation for mobile, collapsible left sidebar for desktop. Top app bar for global search and notifications.
- **Admin Dashboard:** Persistent left sidebar. Top bar for user profile and environment toggles.

---

## 7. Grid System (Mobile-First)

- **Mobile (<768px):** 4-column grid, 16px gutters, 16px page margins. (Baseline)
- **Tablet (768px - 1023px):** 8-column grid, 16px gutters.
- **Desktop (1024px+):** 12-column grid, 24px gutters.

Cards should span 4 columns on mobile (1 up), 4 columns on tablet (2 up), and 4 columns on desktop (3 up).

---

## 8. Iconography

**System:** Hugeicons.
- **Style:** Stroke (Outline) for default states, Solid (Filled) for active/selected states (e.g., active navigation items).
- **Stroke Weight:** `1.5px` for consistency with Inter's regular weight.
- **Sizing:**
  - `16x16`: Inline text icons, buttons.
  - `20x20`: Standard UI icons, inputs.
  - `24x24`: Navigation, empty states.
  - `48x48`: Hero empty states, marketing.

---

## 9. Component Library Standards

All components must be headless-compatible (e.g., Radix UI) for accessibility, styled with Tailwind.

- **Button:** 
  - *Variants:* Primary (Green bg), Secondary (Zinc outline), Ghost (Transparent), Destructive (Red bg).
  - *Sizes:* sm (32px), md (40px - default), lg (48px).
- **Input:** 
  - 40px height, 16px text (prevents iOS zoom). Subtle zinc border, primary ring on focus.
- **Card:**
  - Surface background, 1px border, shadow-sm. No background colors inside cards unless highlighting a specific metric.
- **Badge:**
  - Soft backgrounds (e.g., `bg-primary-50` with `text-primary-700`). Highly rounded (`rounded-full`).
- **Modal:**
  - Centered, backdrop blur, max-width `500px`. Must have an explicit 'X' close button.
- **Skeleton:**
  - Subtle pulse animation. Match the exact dimensions of the content it replaces.

---

## 10. Dashboard Design Standards

- **Hierarchy:** 
  1. Breadcrumbs or Page Title.
  2. Quick actions (Primary buttons top right).
  3. Metric cards (Top row).
  4. Data tables or complex lists (Below metrics).
- **Filters/Search:** Always placed directly above the data they manipulate, not at the top of the page.
- **Responsiveness:** Tables must scroll horizontally on mobile. Do not stack table rows unless specifically designing a mobile card-list view.

---

## 11. Form Design Standards

- **Layout:** Top-aligned labels. 8px gap between label and input. 24px gap between form groups.
- **Validation:** Inline real-time validation. Do not wait for submit to show basic format errors.
- **Errors:** Red border, red helper text below input with a warning icon.
- **Loading:** Submit buttons must show a spinner and disable themselves upon submission to prevent double-charging or duplicate entries.

---

## 12. Interaction Design

- **Hover:** All clickable elements must have a hover state (usually slightly darker/lighter background).
- **Focus:** Keyboard focus must be visible. Use a `2px` offset ring in the primary color (`ring-2 ring-primary-500 ring-offset-2`).
- **Pressed:** Buttons should scale down slightly (`scale-[0.98]`) for tactile feedback.
- **Feedback:** Every creation, deletion, or modification must result in a Toast notification confirming success or explaining failure.

---

## 13. Motion System

**Philosophy:** Motion should guide the eye, not distract it.
- **Durations:** 
  - Micro-interactions (hover, toggle): `150ms`.
  - Layout shifts (modals, drawers): `300ms`.
- **Easing:** Use Tailwind's default `ease-out` for entering elements, `ease-in` for exiting.
- **Transitions:** Fade and slight translate (e.g., slide up 4px) for dropdowns and modals to feel natural.

---

## 14. Accessibility Standards (WCAG 2.1 AA)

- **Contrast:** All text must have a minimum contrast ratio of 4.5:1 against its background.
- **Keyboard:** Every interactive element must be reachable via `Tab` and executable via `Enter/Space`.
- **Screen Readers:** Use semantic HTML (`<nav>`, `<main>`, `<button>` vs `<div onClick>`). Use `aria-label` for icon-only buttons.
- **Reduced Motion:** Respect `prefers-reduced-motion` by disabling layout transitions via Tailwind's `motion-safe:` utility.

---

## 15. Responsive Design Standards (Mobile-First)

- **Mobile First is Absolute:** The vast majority of the student base will access Universe via mobile phones. All components MUST be built for `<768px` first, then scaled up. Do not build desktop first and attempt to shrink it.
- **Navigation:** Sidebars on desktop convert to bottom tabs (or hamburger menus for secondary items) on mobile.
- **Touch Targets:** Minimum `44x44px` clickable area for all icons, buttons, and links on mobile to prevent fat-finger errors.
- **Data Tables:** Dense horizontal tables on desktop must convert into vertically stacked summary cards on mobile.

---

## 16. Empty States

An empty state is an onboarding opportunity.
- **Layout:** Center aligned, 48px Hugeicon (muted), H3 Title, Body text explaining what goes here.
- **Action:** ALWAYS include a primary Call-to-Action (e.g., "Refer your first friend", "Create a listing"). Do not leave the user at a dead end.

---

## 17. Loading States

- **Initial Load:** Full page skeleton layouts matching the UI structure. Avoid generic centered spinners for main page loads.
- **Data Mutation:** Spinners inside buttons or inline loaders next to the specific data being updated.
- **Optimistic Updates:** For actions like "liking" a post or checking a task, update the UI instantly before the server responds to make the app feel blazingly fast.

---

## 18. Error States

- **404 (Not Found):** Friendly illustration, clear explanation, button to return to Dashboard.
- **500 (Server Error):** Apologetic tone, "Retry" button, and a contact support link.
- **Validation:** Clear, plain English errors. (e.g., "Password must be at least 8 characters", not "ERR_PWD_LEN").
- **Offline:** Subtle banner at the top of the app indicating "You are currently offline. Some features may be unavailable."

---

## 19. Future Module Consistency

As Universe expands (Marketplace, Study Hub, Housing):
- **Layouts remain consistent:** The sidebar and top bar never change. Modules render inside the main `<main>` container.
- **Components are reused:** A product card in the Marketplace uses the same base `<Card>` and `<Badge>` components as a task in the Study Hub.
- **Color inheritance:** New modules can introduce a subtle accent color (e.g., Blue for Study Hub, Purple for Marketplace) applied ONLY to icons or specific active states, while the global architecture remains Green/Zinc.

---

## 20. Design Tokens

These tokens should be mapped directly into Tailwind config:
- `colors.universe.primary`: `#047857`
- `colors.universe.surface`: `var(--surface)`
- `colors.universe.background`: `var(--background)`
- `spacing.base`: `4px`
- `borderRadius.card`: `12px`
- `boxShadow.soft`: `0 4px 20px -2px rgba(0,0,0,0.05)`

---

## 21. Tailwind CSS Strategy

- **Utility Classes:** Use them directly on components. Avoid extracting to `@apply` in CSS files unless absolutely necessary for third-party overrides.
- **Class Merging:** Use `clsx` and `tailwind-merge` (e.g., a `cn()` utility function) in React components to allow safe overriding of default styles.
- **Dark Mode:** Use Tailwind's `dark:` modifier class strategy controlled by a React Theme Provider.

---

## 22. Accessibility Checklist (Definition of Done)

Before any PR is merged for a UI feature, it must pass:
- [ ] Can I navigate the entire feature using only the `Tab` key?
- [ ] Do all buttons/links have visible focus rings?
- [ ] Is contrast sufficient in BOTH light and dark mode?
- [ ] Are there empty states for arrays/lists with 0 items?
- [ ] Are buttons disabled while a form is submitting?
- [ ] Do icon-only buttons have `aria-label`s?

---

## 23. UI Documentation Standards

- **Storybook:** Future scalable documentation will live in Storybook inside `packages/ui`.
- **Component Comments:** Every shared component must have a JSDoc block explaining its props, intended usage, and any accessibility notes.

---

## 24. Future Mobile Adaptation

By strictly separating `packages/ui` and using design tokens, the future React Native/Expo app will:
- Re-implement the UI package using Native components (e.g., replacing `<div className="p-4">` with `<View style={styles.p4}>` using tools like NativeWind).
- Maintain exact visual consistency because the color hexes, typography scales, spacing units (multiples of 4), and iconography (Hugeicons) will be identically imported from the core design token definitions. 
- Mobile navigation patterns (bottom tabs) are already accounted for in our responsive web design standards, making the native transition seamless for the user.
