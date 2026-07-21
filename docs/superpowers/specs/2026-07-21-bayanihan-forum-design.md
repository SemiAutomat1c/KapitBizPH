# Specced Design: Bayanihan Forum

A public community forum (Bayanihan Feed) where registered MSMEs can share business continuity planning (BCP) tips, local hazard alerts, and general Q&A under their registered business names.

---

## 1. User Review Required

> [!NOTE]
> The bottom navigation layout is updating from 3 columns to 4 columns to accommodate the new "Bayanihan" forum tab. The column configuration will be updated in CSS grid rules to ensure a perfect fit on mobile viewports.

---

## 2. Proposed Changes

### [Core State]

#### [NEW] [kapitbiz-bayanihan.ts](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/lib/kapitbiz-bayanihan.ts)
Contains the state structures, reducer logic, action types, and initial seeded data for the Bayanihan Forum.

### [UI Components]

#### [NEW] [BayanihanScreen.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/BayanihanScreen.tsx)
Displays the forum feed, tag filters, the "Mag-post sa Bayanihan" creator form, and handles rendering individual post threads.

#### [MODIFY] [AppChrome.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/AppChrome.tsx)
Adds the "Bayanihan" navigation tab, routing logic, and updates the responsive mobile grid layouts.

#### [MODIFY] [KapitBizDemoApp.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/KapitBizDemoApp.tsx)
Wires up the Bayanihan state loading, persistence in local storage, and rendering routing.

#### [MODIFY] [KapitBizRelay.module.css](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/KapitBizRelay.module.css)
Introduces CSS classes for the forum cards, comment threads, stepper items, tag filters, and updates the navigation column count.

---

## 3. Data Model

### BayanihanPost
```typescript
export interface BayanihanPost {
  id: string;
  authorName: string;
  authorIndustry: string;
  title: string;
  body: string;
  tag: "BCP Tips" | "Disaster Alert" | "General Q&A";
  createdAt: number;
  salamatCount: number;
  comments: BayanihanComment[];
}
```

### BayanihanComment
```typescript
export interface BayanihanComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: number;
}
```

---

## 4. Verification Plan

### Automated Tests
- Build test suites in `tests/kapitbiz-bayanihan.test.ts` and `tests/kapitbiz-bayanihan-ui.test.tsx` checking state transitions (add post, comment, salamat clicks) and UI render/filtering actions.

### Manual Verification
- Test interactive mobile bottom sheets, form input constraints, and ensure no layout overflow exists on S20 Samsung devices.
