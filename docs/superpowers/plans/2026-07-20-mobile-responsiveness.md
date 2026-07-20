# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mobile responsiveness across multiple screens, introducing a native bottom sheet layout for modals on mobile, wrapping headers to prevent overflows, and stacking column-based layouts.

**Architecture:** Update CSS definitions in `KapitBizRelay.module.css` inside the mobile media query (`max-width: 620px`) to handle stacking, rotation, and bottom-sheet formatting.

**Tech Stack:** CSS modules, Next.js, React

## Global Constraints

- Preserve all existing styles and formatting for desktop viewports.
- No changes to functional business logic or data structures.
- All styles must be compatible with mobile browsers down to 320px width.

---

### Task 1: Bottom Sheet Presentation on Mobile

**Files:**
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`

- [ ] **Step 1: Update .dialogBackdrop layout on desktop**
  Set `dialogBackdrop` to use flexbox centering horizontally and aligning vertically to the bottom on desktop:
  ```css
  .dialogBackdrop {
    position: fixed;
    z-index: 40;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: rgba(24, 28, 29, 0.42);
    padding: 16px;
  }
  ```

- [ ] **Step 2: Add bottom sheet styles to the mobile media query**
  Inside the `@media (max-width: 620px)` query (around line 273), add styling overrides to eliminate padding and round only the top corners of the dialog:
  ```css
    .dialogBackdrop {
      padding: 0;
    }
    .hazardDialog {
      width: 100%;
      max-height: calc(100dvh - 24px);
      border-radius: 16px 16px 0 0;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom: 0;
    }
  ```

- [ ] **Step 3: Run Vitest tests**
  Run: `npm test` inside `web/` to verify tests pass.
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add web/components/kapitbiz/KapitBizRelay.module.css
  git commit -m "style: implement mobile-native bottom sheet modal layout"
  ```

---

### Task 2: Sagip Details Header Wrap Fix

**Files:**
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`

- [ ] **Step 1: Allow sagipDetailHeader to wrap**
  Add `flex-wrap: wrap;` and a min-width boundary for the info block in `KapitBizRelay.module.css`:
  ```css
  .sagipDetailHeader {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #bec8ca;
    padding-bottom: 14px;
  }

  .sagipDetailHeaderInfo {
    flex-grow: 1;
    min-width: 140px;
  }
  ```

- [ ] **Step 2: Run Vitest tests**
  Run: `npm test` inside `web/`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add web/components/kapitbiz/KapitBizRelay.module.css
  git commit -m "style: allow details header to wrap on mobile viewports"
  ```

---

### Task 3: Handoff Screen Ticket Layout

**Files:**
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`

- [ ] **Step 1: Add stacked handoff overrides to mobile media query**
  Inside the `@media (max-width: 620px)` query, add style rules to stack handoff party labels vertically and rotate the tracking arrow:
  ```css
    .handoffIntro {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
    .handoffParties {
      grid-template-columns: 1fr;
      justify-items: center;
      text-align: center;
      gap: 12px;
    }
    .handoffParties div:last-child {
      text-align: center;
    }
    .handoffArrow {
      transform: rotate(90deg);
      margin: 8px 0;
    }
  ```

- [ ] **Step 2: Run Vitest tests**
  Run: `npm test` inside `web/`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add web/components/kapitbiz/KapitBizRelay.module.css
  git commit -m "style: stack handoff parties vertically on mobile"
  ```

---

### Task 4: Reservation Screen Metrics

**Files:**
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`

- [ ] **Step 1: Add stacked destinationMetrics overrides to mobile media query**
  Inside the `@media (max-width: 620px)` query, override the column definitions of the destination card metrics:
  ```css
    .destinationMetrics {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  ```

- [ ] **Step 2: Run Vitest tests**
  Run: `npm test` inside `web/`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add web/components/kapitbiz/KapitBizRelay.module.css
  git commit -m "style: stack destination metrics on mobile screens"
  ```
