# Design Specification - Mobile Responsiveness Improvements

This design specification details changes to enhance the mobile responsiveness of KapitBizPH. It introduces a native-style bottom sheet layout for modals on mobile, prevents horizontal layout overflows, and improves layout stacking on the handoff and reservation screens.

## Objective
To ensure that all pages and interactive modals fit perfectly on mobile screens (down to 320px width) without horizontal overflow, visual clipping, or squished text columns, while maintaining full aesthetic consistency with the desktop layouts.

## Proposed Design

### 1. Dialog Backdrop & Hazard Dialog (`KapitBizRelay.module.css`)
Convert the generic modal container to a flush, native-style bottom sheet on mobile screens (max-width: 600px).
*   **Backdrop Padding**: Change from `16px` to `0` on mobile to let the dialog touch the screen edges.
*   **Dialog Sizing**: Make width `100%` and round only the top corners (`border-radius: 16px 16px 0 0`), setting the bottom corners to `0`.
*   **Centering on Desktop**: Ensure that on desktop the flex wrapper centers the dialog horizontally at the bottom.

### 2. Sagip Details Header (`KapitBizRelay.module.css` / `SagipCenterScreen.tsx`)
Fix the horizontal overflow of the Sagip details header by allowing the header items to wrap.
*   **Flex-wrap**: Apply `flex-wrap: wrap` to `.sagipDetailHeader`.
*   **Minimum Info Width**: Give `.sagipDetailHeaderInfo` a flex-grow properties and a min-width of `140px` so that when screen width constraints are met, the badges automatically wrap onto a second line cleanly.

### 3. Handoff Screen Ticket Layout (`KapitBizRelay.module.css` / `HandoffScreen.tsx`)
Fix the squishing of sender/receiver names and ID headers on mobile.
*   **Parties Stacking**: Convert `.handoffParties` from a 3-column horizontal grid to a stacked vertical column layout on mobile.
*   **Arrow Rotation**: Rotate the handoff arrow 90 degrees ($\rightarrow$ to $\downarrow$) when stacked, creating a continuous vertical flow.
*   **Header Stacking**: Stack the handoff title and the tracking ID vertically instead of horizontally.

### 4. Reservation Screen Metrics (`KapitBizRelay.module.css` / `ReservationScreen.tsx`)
Fix the travel time/distance metrics layout on mobile.
*   **Metrics Columns**: Change `.destinationMetrics` from 3 columns to 1 column on screens below `460px`, allowing metrics like "Incident ETA" and "Distance" to occupy their own full width.

---

## Verification Plan
1. Check the local Next.js dev server on a mobile layout simulation.
2. Run Vitest tests to ensure no component structure is broken.
