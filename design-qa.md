# KapitBiz Relay Design QA

## Reference

- Source: `/Users/ryandeniega/Downloads/stitch_kapitbiz_relay_mobile_app`
- Design system: `kapitbiz_relay_design_system/DESIGN.md`
- Compared screens: active disruption, inventory triage, available capacity, reservation and transport, QR handoff, and rescue completion.

## Viewports

- Mobile browser canvas: 390 x 844. The in-app browser captured 375 x 812 after its own scrollbar and chrome were removed from the image.
- Tablet browser canvas: 768 x 1024.
- Desktop browser canvas: 1440 x 900.

## Functional Pass

- Incident continues to inventory triage.
- Approved inventory totals remain 42 kg and PHP16,500.
- Capacity list and offline map fallback both work.
- Northline reservation and PHP150 rider dispatch produce the PHP450 rescue cost.
- Refresh resumes the current rescue step and persisted transaction state.
- QR handoff, evidence preview, receiver confirmation, record sharing fallback, and reset all work.
- Reset Demo is the only action that starts a fresh incident.

## Responsive Pass

- Mobile has no horizontal overflow. A DOM layout assertion measured the recommended capacity action at one text line with no content overflow.
- Step changes return the document to the top so the active task is immediately visible.
- Tablet uses the compact progress header without showing the desktop rail.
- Desktop uses the 320 px incident rail, a constrained 920 px workspace, and the full map presentation.
- Reservation and handoff hide bottom navigation; completion restores it.
- Transport dialog fits the mobile viewport and receives initial focus.

## Visual Comparison

- Preserved the Stitch typography, teal utility palette, compact information density, squared controls, and operational tone.
- Replaced reference-only values with the approved Tagum-Panabo scenario and retained the supplied hierarchy.
- Capacity, QR handoff, and completion screenshots were compared directly with their matching Stitch references.
- No incoherent overlaps, clipped labels, blank maps, or layout shifts were found in the final pass.

## Evidence

The committed evidence is reproducible from a clean checkout:

- `docs/qa/kapitbiz/mobile-incident.jpg`
- `docs/qa/kapitbiz/mobile-triage.jpg`
- `docs/qa/kapitbiz/mobile-capacity-list-final.jpg`
- `docs/qa/kapitbiz/mobile-capacity-map-fallback.jpg`
- `docs/qa/kapitbiz/mobile-reservation.jpg`
- `docs/qa/kapitbiz/mobile-transport-sheet.jpg`
- `docs/qa/kapitbiz/mobile-qr-handoff.jpg`
- `docs/qa/kapitbiz/mobile-completion.jpg`
- `docs/qa/kapitbiz/tablet-capacity-final.jpg`
- `docs/qa/kapitbiz/desktop-capacity-final.jpg`
- `docs/qa/kapitbiz/viewport-results.json`

Result: passed.
