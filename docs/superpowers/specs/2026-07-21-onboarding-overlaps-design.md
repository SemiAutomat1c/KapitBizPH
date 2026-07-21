# Onboarding Flow Layout Overlaps Fix Design Spec

## Goal
Resolve the layout overlaps present in the onboarding carousel screens of the KapitBiz Relay application. Specifically:
- Prevent the illustration images from overflowing the `.onboardingHero` gradient cards and overlapping text contents.
- Prevent button overlaps/truncations in slides that render only 2 action buttons instead of 3.

## Proposed Changes

### Stylesheet Modifications
In `web/components/kapitbiz/KapitBizRelay.module.css`:
- Update `.onboardingActions` to use `display: flex` and `width: 100%`.
- Add a nested rule `.onboardingActions .primaryButton` with `flex: 1` and `min-width: 0`.
- Update `.onboardingHero img` and `.onboardingHero svg` to have `max-width: 90%`, `max-height: 90%`, `width: auto`, `height: auto`.

### Illustration Modifications
In `web/components/kapitbiz/illustrations.tsx`:
- Remove inline `style` props with hardcoded `width: 100%`, `height: 100%` on the onboarding illustrations (`ProtectIllustration`, `RelayIllustration`, `VerifyIllustration`, `BusinessIllustration`).

## Verification Plan
- Run standard Next.js building, linting, and testing pipelines.
- Verify that buttons and illustrations align correctly and do not overlap.
