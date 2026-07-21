# Specced Design: Skip Onboarding Role Selection

Bypasses the "Choose your demo role" slide during onboarding, routing the user directly from the introductory slides to the business setup form, and defaulting their role to Merchant.

---

## 1. Proposed Changes

### [Onboarding Flow]

#### [MODIFY] [OnboardingFlow.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/OnboardingFlow.tsx)
- Remove `"role"` step from `onboardingSteps` array (leaving `protect`, `relay`, `verify`, `business`).
- Update `nextStep` and `previousStep` maps to link `"verify"` step directly to `"business"`.
- Remove the step === `"role"` view helper logic completely.
- Set default role previewing in the state reducer.

#### [MODIFY] [kapitbiz-demo.ts](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/lib/kapitbiz-demo.ts)
- Update `OnboardingStep` type: `protect` | `relay` | `verify` | `business` (remove `role`).
- In `isKapitBizDemoSession`, verify the step value aligns with the updated array.

---

## 2. Verification Plan

### Automated Tests
- Update `tests/kapitbiz-role-preview.test.tsx` and `tests/kapitbiz-navigation.test.tsx` to reflect the 4-step onboarding sequence instead of 5, bypassing any clicks on "Choose your role" buttons.
- Run `npm test` to verify all suites pass.
