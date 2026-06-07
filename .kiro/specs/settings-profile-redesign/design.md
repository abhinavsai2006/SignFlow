# Settings & Profile Redesign — Bugfix Design

## Overview

Six bugs affect the Settings and Profile areas of SignFlow, plus a UI redesign requirement
applying the Meta design system (DESIGN-meta.md) across both pages.

The bugs fall into three categories:

1. **Navigation bugs** — `UserMenu.tsx` Profile and Settings buttons have no `onClick` handlers,
   so clicking them does nothing. Fix: add `useNavigate` calls and close the dropdown.

2. **Stub content bugs** — `Settings.tsx` renders a single `"Section Coming Soon"` branch for
   five tabs (`notifications`, `workspace`, `billing`, `api`, `audit`). The Notifications tab
   also has a text-overflow bug caused by `max-w-sm` on a paragraph inside a narrow flex column.
   Fix: replace the stub branch with real content for each tab. `Workspace` and `Billing` tabs
   will embed the logic from the existing standalone components. `Audit Logs` will get a new
   functional section backed by `GET /api/audit/:docId`. `API Keys` stub can remain as
   Coming Soon but with the layout bug fixed.

3. **Performance bug** — `Layout.tsx` performs two blocking API calls (`/auth/me` and
   `/workspaces`) synchronously before setting `isValidating = false`, which delays every
   protected page render. Fix: defer the workspace fetch with `Promise.resolve().then()`
   or move it to a separate non-blocking effect.

The Meta design system tokens (Optimistic VF, cobalt `#0064E0`, pill buttons at `rounded-full`,
`rounded-xxxl`/`rounded-xl` cards, `surface-soft` backgrounds) are already applied to most
components via Tailwind custom classes. The redesign pass will audit and align any remaining
mismatches in `Settings.tsx`, `UserMenu.tsx`, and the new embedded tab content.

---

## Glossary

- **Bug_Condition (C)**: A predicate that identifies inputs or UI state that trigger defective behavior.
- **Property (P)**: The correct behavior that must hold for any input where C is true.
- **Preservation**: Behaviors that must remain byte-for-byte identical after the fix — General tab,
  Security tab, direct `/workspaces` and `/billing` routes, logout flow, protected route redirects.
- **`UserMenu`**: `frontend/src/components/layout/UserMenu.tsx` — dropdown showing user name/email,
  Profile, Settings, and Log Out buttons.
- **`Settings`**: `frontend/src/components/dashboard/Settings.tsx` — tabbed settings page with
  General, Security, Notifications, Workspace, Billing, API Keys, and Audit Logs tabs.
- **`Layout`**: `frontend/src/components/layout/Layout.tsx` — wrapper that validates auth and
  provides `user`, `handleLogout`, `workspaces`, and `activeWorkspace` via Outlet context.
- **`activeTab`**: The `useState` value in `Settings.tsx` that controls which tab content is rendered.
- **Coming Soon stub**: The single JSX branch at the bottom of `Settings.tsx` that renders an
  `AlertTriangle` card for `notifications | workspace | billing | api | audit`.
- **`isBugCondition_Navigation(X)`**: Returns true when X is a click on Profile or Settings in
  the UserMenu and no navigation occurs.
- **`isBugCondition_Stub(X)`**: Returns true when X is a tab selection for workspace, billing,
  audit, or notifications and the rendered content is the Coming Soon stub.

---

## Bug Details

### Bug 1 — UserMenu Navigation (bugs 1.1, 1.2)

The Profile and Settings `<button>` elements in `UserMenu.tsx` have no `onClick` prop. The
component receives no `navigate` prop and does not import `useNavigate`. Clicking either button
fires no handler; the dropdown stays open and the route does not change.

**Formal Specification:**
```
FUNCTION isBugCondition_Navigation(X)
  INPUT: X of type { element: string, component: string }
  OUTPUT: boolean

  RETURN X.element IN ["Profile button", "Settings button"]
    AND X.component = "UserMenu"
    AND X.hasOnClickHandler = false
END FUNCTION
```

**Examples:**
- User clicks "Profile" → nothing happens, route stays at `/dashboard` ← BUG
- User clicks "Settings" → nothing happens, route stays at `/dashboard` ← BUG
- User clicks "Log Out" → session cleared, navigates to `/login` ← CORRECT (not affected)

### Bug 2 — Notifications Text Overflow (bug 1.3)

In the Coming Soon card, the description paragraph has class `max-w-sm` while the card itself
uses `flex flex-col items-center justify-center`. The `max-w-sm` (384px) constraint applied
inside a narrow centered flex column causes the text to reflow word-by-word rather than
spanning the full paragraph width.

**Formal Specification:**
```
FUNCTION isBugCondition_Overflow(X)
  INPUT: X of type { tab: string, element: string }
  OUTPUT: boolean

  RETURN X.tab IN ["notifications", "workspace", "billing", "api", "audit"]
    AND X.element = "description paragraph"
    AND X.hasMaxWidthConstraint = true
    AND X.parentLayout = "narrow-flex-column"
END FUNCTION
```

**Example:** At 800px viewport, the text "We are currently rolling out the completely redesigned
notifications section…" wraps on every single word instead of filling ~300px of available width.

### Bug 3 — Stub Content (bugs 1.4, 1.5, 1.6)

The condition `(activeTab === 'notifications' || activeTab === 'workspace' || activeTab === 'billing' || activeTab === 'api' || activeTab === 'audit')` maps five tabs to a single Coming Soon card with no real content.

**Formal Specification:**
```
FUNCTION isBugCondition_Stub(X)
  INPUT: X of type { activeTab: string }
  OUTPUT: boolean

  RETURN X.activeTab IN ["workspace", "billing", "audit"]
    AND renderedContent(X) = "Section Coming Soon"
    AND realComponentExists(X.activeTab) = true
END FUNCTION
```

**Examples:**
- `activeTab = "workspace"` → renders "Section Coming Soon" ← BUG (Workspace component exists)
- `activeTab = "billing"` → renders "Section Coming Soon" ← BUG (Billing component exists)
- `activeTab = "audit"` → renders "Section Coming Soon" ← BUG (AuditLog backend route exists)
- `activeTab = "api"` → renders "Section Coming Soon" ← acceptable stub (no API key infra yet)

### Bug 4 — Performance: Blocking Workspace Fetch (bug 1.7)

In `Layout.tsx`, `checkAuth` awaits both `/auth/me` and `/workspaces` before setting
`isValidating = false`. The workspace fetch is not critical for initial render but blocks it.
The "Verifying session…" spinner stays visible until both fetches resolve.

**Formal Specification:**
```
FUNCTION isBugCondition_Performance(X)
  INPUT: X of type { layoutMount: boolean }
  OUTPUT: boolean

  RETURN X.layoutMount = true
    AND workspaceFetchIsBlocking(X) = true
    AND isValidatingBlockedUntilWorkspaceFetched(X) = true
END FUNCTION
```

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors (must be identical before and after the fix):**
- General tab renders Profile Information form with name/email fields and Save Changes button
- Security tab renders Change Password form and Active Sessions card with Logout All Devices button
- `PUT /auth/me` call on profile save and `POST /auth/change-password` call on password update
- Navigating directly to `/workspaces` renders the standalone `Workspace` page
- Navigating directly to `/billing` renders the standalone `Billing` page
- Log Out button in UserMenu clears localStorage and navigates to `/login`
- Unauthenticated access to any protected route redirects to `/login`
- All API-level behavior: no backend changes required for bugs 1–4

**Scope of Non-Affected Inputs:**
Any interaction that does NOT involve clicking Profile/Settings in the dropdown, OR selecting
workspace/billing/audit tabs, OR the initial layout mount performance path is completely
unaffected. This includes:
- All document management flows
- Editor, Dashboard, public share routes
- All backend API endpoints

---

## Hypothesized Root Cause

### Bug 1 — UserMenu Navigation
`UserMenu.tsx` was written with placeholder buttons. The `Navbar` component that renders
`UserMenu` passes only `user` and `onLogout` props — no navigate callback. `UserMenu` does not
import `useNavigate` itself. The fix is to import `useNavigate` inside `UserMenu` (it is inside
the Router tree via `Layout`) and call `navigate('/settings')` with `setIsOpen(false)` in each
button's `onClick`.

### Bug 2 — Text Overflow
The `max-w-sm` class was added to the paragraph to visually limit line length in a centered
layout, but it over-constrains the text in the context of the narrow content column. Removing
`max-w-sm` (or replacing with `max-w-prose` or no max-width) fixes the overflow.

### Bug 3 — Stub Content
The five tabs were placeholders during development. The Workspace and Billing standalone
components exist but were never imported or referenced in `Settings.tsx`. The fix is to:
- Import and inline-embed `WorkspaceContent` and `BillingContent` as extracted sub-components
  (or render the full components directly) within their respective tab branches
- Build a new `AuditLogsContent` section that calls `GET /api/audit/:docId` for user documents
- Keep API Keys as a styled (but layout-fixed) Coming Soon card

### Bug 4 — Performance
The workspace fetch inside `checkAuth` in `Layout.tsx` uses a sequential `await`, blocking
`setIsValidating(false)`. Moving the workspace fetch to a separate `useEffect` (or using
`Promise.resolve().then()` to defer it) unblocks the initial render after auth validation.

---

## Correctness Properties

Property 1: Bug Condition — UserMenu Navigation Triggers Route Change

_For any_ user interaction where the Profile or Settings button in UserMenu is clicked
(isBugCondition_Navigation returns true), the fixed component SHALL call `navigate('/settings')`,
close the dropdown (setIsOpen(false)), and result in the browser route changing to `/settings`.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition — Stub Tabs Render Functional Content

_For any_ tab selection where the activeTab is "workspace", "billing", or "audit"
(isBugCondition_Stub returns true), the fixed Settings component SHALL render the corresponding
functional content — Workspace management UI, Billing/Plans UI, or Audit Logs list — and SHALL
NOT render the "Section Coming Soon" card.

**Validates: Requirements 2.4, 2.5, 2.6**

Property 3: Bug Condition — Notifications Content Has No Overflow Constraint

_For any_ render of the Notifications tab content, the fixed component SHALL render the
description text without a `max-w-sm` class (or equivalent narrow constraint) that causes
word-by-word wrapping in a flex column layout, and the paragraph SHALL span the full
available content width.

**Validates: Requirements 2.3**

Property 4: Preservation — Non-Buggy Tabs Render Identically

_For any_ tab selection where activeTab is "general" or "security" (isBugCondition_Stub
returns false), the fixed Settings component SHALL produce exactly the same rendered output
as the original component — same form fields, same labels, same action handlers, no regressions.

**Validates: Requirements 3.1, 3.2**

Property 5: Preservation — Standalone Routes Unaffected

_For any_ navigation to `/workspaces` or `/billing` as a direct route, the fixed application
SHALL render the same standalone Workspace and Billing pages as before, with no change in
behavior, data fetching, or visual output.

**Validates: Requirements 3.3, 3.4**

---

## Fix Implementation

### Changes Required

**File 1: `frontend/src/components/layout/UserMenu.tsx`**

**Function:** `UserMenu` component

**Specific Changes:**
1. **Import `useNavigate`** from `react-router-dom`
2. **Instantiate `navigate`** inside the component: `const navigate = useNavigate();`
3. **Add `onClick` to Profile button:**
   ```tsx
   onClick={() => { navigate('/settings'); setIsOpen(false); }}
   ```
4. **Add `onClick` to Settings button:**
   ```tsx
   onClick={() => { navigate('/settings'); setIsOpen(false); }}
   ```
   (Both navigate to `/settings`; the General tab is the default active tab, which
   serves as the profile page per requirement 2.1.)

---

**File 2: `frontend/src/components/dashboard/Settings.tsx`**

**Function:** `Settings` component — tab rendering branch

**Specific Changes:**
1. **Fix Notifications layout** — remove `max-w-sm` from the description paragraph in the
   Coming Soon card, or replace the entire Notifications stub with a real Notifications
   preference section (toggle cards for email/in-app notifications).

2. **Replace Workspace stub** — extract the content of the standalone `Workspace` component
   into an embeddable form. Since `Workspace` manages its own state and API calls, the
   simplest and least-risky approach is to lazy-import it and render it directly inside the
   `activeTab === 'workspace'` branch. The outer `Settings` page header/h1 can be hidden
   for this tab to avoid duplicate headings.

3. **Replace Billing stub** — same approach as Workspace: render the `Billing` component
   directly inside the `activeTab === 'billing'` branch.

4. **Replace Audit Logs stub** — build a new `AuditLogsTab` component inline in `Settings.tsx`
   that:
   - On mount, fetches the user's documents via `GET /api/docs`
   - For each document, fetches `GET /api/audit/:docId`
   - Renders a chronological list of log entries (timestamp, action, actor, document name)
   - Shows a loading skeleton and empty state

5. **Fix API Keys stub layout** — keep the Coming Soon card but remove `max-w-sm` from the
   paragraph so the text flows correctly.

---

**File 3: `frontend/src/components/layout/Layout.tsx`**

**Function:** `checkAuth` inside `useEffect`

**Specific Changes:**
1. **Decouple workspace fetch from auth validation** — after `setIsValidating(false)` is called
   (auth is confirmed), trigger the workspace fetch in a separate non-blocking `useEffect` or
   via `Promise.resolve().then(fetchWorkspaces)`.
2. **Split into two effects**: one for auth validation (sets `user`, then `setIsValidating(false)`),
   one for workspace loading (runs after `user` is set, does not block render).

---

## Testing Strategy

### Validation Approach

Two-phase approach: first run tests on unfixed code to surface counterexamples and confirm root
cause analysis; then verify the fixes are correct and preserving.

---

### Exploratory Bug Condition Checking

**Goal:** Surface counterexamples on unfixed code. Confirm or refute root cause hypotheses.

**Test Plan:** Mount components in a test environment with a mocked router and auth context.
Simulate the exact user interactions that trigger each bug and observe the actual behavior.

**Test Cases:**

1. **Profile button click — no navigation (Bug 1.1)**
   Mount `UserMenu` with a mock user. Simulate a click on the Profile button.
   Assert that `navigate` was called — this will FAIL on unfixed code because there is no onClick.

2. **Settings button click — no navigation (Bug 1.2)**
   Same setup. Simulate click on Settings button.
   Assert `navigate('/settings')` was called — FAIL on unfixed code.

3. **Workspace tab — renders Coming Soon (Bug 1.4)**
   Mount `Settings` with `activeTab` initialized to `"workspace"`.
   Assert the text "Section Coming Soon" is NOT present — FAIL on unfixed code.
   Assert workspace team member table IS present — FAIL on unfixed code.

4. **Billing tab — renders Coming Soon (Bug 1.5)**
   Mount `Settings` with `activeTab = "billing"`.
   Assert "Section Coming Soon" is NOT present — FAIL on unfixed code.

5. **Audit tab — renders Coming Soon (Bug 1.6)**
   Mount `Settings` with `activeTab = "audit"`.
   Assert "Section Coming Soon" is NOT present — FAIL on unfixed code.

6. **Notifications overflow (Bug 1.3)**
   Mount `Settings` with `activeTab = "notifications"`.
   Assert the description paragraph does NOT have class `max-w-sm` — FAIL on unfixed code.

**Expected Counterexamples:**
- `navigate` mock is never called after Profile/Settings clicks → confirms missing onClick
- "Section Coming Soon" text found in workspace/billing/audit branches → confirms stub rendering
- `max-w-sm` class found on paragraph → confirms layout bug

---

### Fix Checking

**Goal:** Verify that for all inputs where the bug condition holds, the fixed code produces
the expected correct behavior.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition_Navigation(X) DO
  result := UserMenu_fixed.handleClick(X)
  ASSERT result.navigated = true
  ASSERT result.route = "/settings"
  ASSERT result.dropdownClosed = true
END FOR

FOR ALL X WHERE isBugCondition_Stub(X) DO
  result := Settings_fixed.render(X)
  ASSERT result.content != "Section Coming Soon"
  ASSERT result.hasFunctionalContent = true
END FOR

FOR ALL X WHERE isBugCondition_Overflow(X) DO
  result := Settings_fixed.render(X)
  ASSERT result.paragraph.className NOT CONTAINS "max-w-sm"
END FOR
```

---

### Preservation Checking

**Goal:** Verify that for all non-buggy inputs, the fixed code produces identical output to
the original.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition_Navigation(X) DO
  ASSERT UserMenu_original(X) = UserMenu_fixed(X)
END FOR

FOR ALL X WHERE activeTab IN ["general", "security"] DO
  ASSERT Settings_original.render(X) = Settings_fixed.render(X)
END FOR
```

**Testing Approach:** Property-based testing is valuable for the tab preservation check
because there are many possible `activeTab` values (7 tabs) and future tabs may be added.
Generating random tab selections from `["general", "security"]` and asserting identical
rendered output guards against accidental regressions.

**Test Cases:**
1. **General tab preservation** — after the fix, mount Settings with `activeTab = "general"`,
   assert the Profile Information form renders with name/email inputs and Save Changes button
   exactly as before.

2. **Security tab preservation** — after the fix, mount Settings with `activeTab = "security"`,
   assert the Change Password form and Active Sessions card render identically.

3. **Log Out preservation** — after UserMenu fix, simulate click on Log Out, assert `onLogout`
   is called (no regression from adding navigate to other buttons).

4. **Direct /workspaces route preservation** — navigate to `/workspaces` directly, assert the
   standalone Workspace page renders with its own full header and KPI cards (not the embedded
   tab version).

5. **Direct /billing route preservation** — navigate to `/billing` directly, assert the
   standalone Billing page renders with Plans & Billing heading.

---

### Unit Tests

- Click Profile in UserMenu → `navigate('/settings')` called, dropdown closed
- Click Settings in UserMenu → `navigate('/settings')` called, dropdown closed
- Click Log Out in UserMenu → `onLogout` prop called (regression check)
- Settings `activeTab = "workspace"` → renders workspace member table, not Coming Soon
- Settings `activeTab = "billing"` → renders plan cards, not Coming Soon
- Settings `activeTab = "audit"` → renders audit log list or loading state, not Coming Soon
- Settings `activeTab = "notifications"` → description paragraph has no `max-w-sm`
- Settings `activeTab = "general"` → Profile Information form unchanged (preservation)
- Settings `activeTab = "security"` → Change Password form unchanged (preservation)
- Layout `checkAuth` → `isValidating` becomes false after `/auth/me` resolves, before
  workspace fetch completes (non-blocking performance fix)

---

### Property-Based Tests

- Generate random tab values from `["general", "security"]` → assert "Section Coming Soon"
  never appears in rendered output for these tabs (preservation across tab set)
- Generate random tab values from `["workspace", "billing", "audit"]` → assert "Section
  Coming Soon" never appears in rendered output after the fix (fix checking across stub tabs)
- For any authenticated user shape (name, email variations) → UserMenu Profile and Settings
  buttons always have an onClick handler that calls navigate

---

### Integration Tests

- Full flow: user logs in → clicks Profile in UserMenu → lands on `/settings` with General
  tab active → edits name → clicks Save Changes → success toast appears
- Full flow: user navigates to Settings → clicks Workspace tab → sees team member table →
  clicks Invite Member → modal opens → sends invite → success message appears
- Full flow: user navigates to Settings → clicks Billing tab → sees current plan and plan
  cards → clicks Upgrade → plan changes (demo mode)
- Regression: user navigates directly to `/workspaces` → sees full standalone Workspace page
  with its own heading (not embedded in Settings layout)
- Regression: user navigates directly to `/billing` → sees full standalone Billing page
