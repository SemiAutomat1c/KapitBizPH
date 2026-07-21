# Specced Design: Remove Requests and Relay Logistics Flow

Removes the legacy Relay logistics flow (the Requests page, Active Rescue stepper, Rider QR handoffs, and related home actions) to keep the app focused entirely on the Sagip Center B2B marketplace and Bayanihan forum.

---

## 1. Proposed Changes

### [UI Components]

#### [DELETE] [RequestsScreen.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/RequestsScreen.tsx)
Removes the entire requests tracking dashboard.

#### [MODIFY] [HomeScreen.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/HomeScreen.tsx)
- Remove "Start inventory rescue" buttons, "Prepared for relay" metric cards, and "View Custody Record" buttons.
- Add a new primary button `"Tingnan ang Sagip Center"` linking to the Sagip Center.
- Remove metrics for "At risk", "Active request", "Eligible hosts", "Protected value" to clean up the dashboard.

#### [MODIFY] [AppChrome.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/AppChrome.tsx)
- Remove the "Requests" navigation item from `navItems`.
- Set bottomNav columns back to `repeat(3, 1fr)`.

#### [MODIFY] [KapitBizDemoApp.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/KapitBizDemoApp.tsx)
- Remove `"requests"` active tab check and routing.

#### [MODIFY] [MerchantShell.tsx](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/components/kapitbiz/MerchantShell.tsx)
- Remove `"requests"` label mapping.

#### [MODIFY] [kapitbiz-demo.ts](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/lib/kapitbiz-demo.ts)
- Remove `"requests"` from the `MerchantTab` union type.
- Remove `"requests"` validations.

---

## 2. Verification Plan

### Automated Tests
- Delete `tests/kapitbiz-flow.test.tsx`.
- Update `tests/kapitbiz-navigation.test.tsx` and `tests/kapitbiz-sagip-ui.test.tsx` to align with the 3-tab layout.
- Run `npm test` to verify all tests pass.
