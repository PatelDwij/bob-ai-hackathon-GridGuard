# QA checkpoint — 14 September 2026 (FINAL)

Emulator-based QA is complete and green. See `../FINAL_QA_REPORT.md` for the full report.

Passed:
- 6 model/data unit tests (`npm test`).
- 5 Firestore security emulator tests (`npm run test:rules`).
- Multi-page production build (`npm run build`).
- Full E2E journey + renderer tests (`npm run test:e2e`): registration, login/logout/relogin, protected-page redirects, region change, every operational page, asset drawer, work-order creation, atomic crew assignment persistence, order start/completion, incident creation/resolution, settings save/reload, responsive loop at 1440/1280/1024/768/430/390 with **no horizontal page overflow** on any page, no console errors.
- Emulator seed of 1,380 records (create-only, deterministic).

Resolved this session: Incidents horizontal overflow at 390px caused by a long Firestore-generated incident ID. Fixed narrowly in `incidents.html` (`#highestIncident, #detailId, .incident-main { min-width: 0; overflow-wrap: anywhere; }`); sibling IDs (work orders `WO-…`, crews `CREW-…`) are short by construction. Playwright now starts its own Vite server; a stale unrelated process on port 5173 was stopped.

Dependency status: `npm audit` reports 7 moderate advisories, all transitive dev-only `firebase-tools` deps; no high/critical. `npm audit fix` (non-breaking) was applied; `--force` was not, per instruction.

Live Firebase is not configured and has not been deployed. Six public `YOUR_…` placeholders remain isolated; the app is fully validated against local emulators. No live credentials are needed for local demonstration. See `FIREBASE_SETUP.md` and `FINAL_QA_REPORT.md` for the exact remaining manual steps.