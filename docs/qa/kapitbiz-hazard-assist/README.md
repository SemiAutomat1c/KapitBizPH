# KapitBiz Hazard Assist Browser QA

- Build: production Next.js build
- URL: http://localhost:3017; browser pass used clean http://127.0.0.1:3017 origin
- Viewports: 390x844, 768x1024, 1440x900
- Flow: Safety Check -> fuel decision -> Good Samaritan -> Relay -> QR -> recovery packet
- Result: passed. The Safety Check opens from Home, records the merchant status, shows the generator-vs-Relay decision, opens voluntary Good Samaritan capacity, carries the chosen host into Relay, renders QR handoff, records host confirmation, opens the recovery packet preview, resumes after refresh, and resets back to onboarding.
- Data boundary: hazard, fuel, responders, trust labels, route context, Calamity Mode, and recovery packet are explicitly simulated demo data or previews.
- Accessibility/layout checks: no horizontal overflow or offscreen UI in the checked viewports. The Home neighbor-capacity action was found below 44px in the first pass, fixed, and rechecked at 44px rendered height in `home-after-fix-observation.json`.
- Requests source label: covered by the active-request automated UI test. After the completed demo flow, the Requests active tab correctly shows no active request.
- Screenshots: home-mobile.png, decision-mobile.png, good-samaritan-desktop.png, relay-context-desktop.png, activity-desktop.png, recovery-packet-mobile.png
