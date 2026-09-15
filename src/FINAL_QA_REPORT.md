# GRIDGUARD AI — Final QA report

Date: 14 September 2026. Final continuation of the Firebase integration. Emulator-based QA is complete and green. No live Firebase project exists; the app has never been deployed to a real Firebase project.

## Completed functionality

- Firebase modular web SDK backed app: `js/firebase-config.js` (isolated `YOUR_…` public placeholders, optional env overrides, emulator mode), `js/auth.js` (email/password register/login/logout, protected-page redirects, authenticated-user redirects, own-profile ownership, role fixed to operator), `js/app.js` (protected entrypoint, region-scoped 8-collection `onSnapshot` subscriptions, cross-tab/keyboard region switching, stale-callback guards, loading/error/empty feedback, weather preference hooks).
- `/js/pages/*` renderers on all operational pages (dashboard, assets, risk-map, predictions, maintenance, crews, incidents, settings) with all original HTML/CSS/sidebar/drawers/maps retained. Local Leaflet 1.9.4 + OpenStreetMap.
- `/js/view-model.js` single canonical adapter derives every page's stats/objects from persisted Firestore records; no per-page regional mock datasets remain.
- `/js/risk-engine.js` transparent weighted heuristic (`weighted-demo-v1`), expressed as an uncalibrated probability proxy and completeness confidence, disclosed as simulated.
- `/js/firestore.js` transactional work-order creation (`WO-{assetId}`), atomic crew assignment with reciprocal crew/order links, order status transitions releasing crews, demo incident creation and status/resolution writes.
- `/js/operations.js` functional in-page controls (create order, assign crew, start/complete order, create/monitor/resolve incident) inside existing style classes; dedicated `#operationStatus` feedback.
- `/js/settings.js` real profile/preferences persistence to `users/{uid}`; unsupported prototype claims disabled.
- `/js/sensors.js` 72-hour temperature trend from historical sensor readings; `/js/maps.js` bundled Leaflet; `/js/weather.js` seeded-demo-with-optional-Open-Meteo fallback (display only).
- `scripts/demo-data.mjs` + `scripts/seed.mjs` deterministic, correlated simulated data: 48 assets, 1,200 sensor readings, 48 predictions, 8 pending orders, 16 crews, 52 incidents, 4 region docs, 4 weather snapshots = **1,380 records**. Create-only seed.
- `firestore.rules` denies anonymous access, protects profile ownership and role, read-only telemetry/risk/weather to browsers, validates complete/reciprocal crew-order writes via `getAfter`, and enforces incident shape/status transitions with server `resolvedAt`.
- Responsive pass across all requested widths with **no horizontal page overflow** on any operational page, including long Firestore-generated incident IDs.

## Exact tests executed (all passed)

| Command | Result |
|---|---|
| `npm run build` (Vite multi-page, bundled Leaflet) | **PASS** (chunk-size warning only) |
| `npm test` — 6 model/data unit tests | **PASS (6/6)** |
| `npm run test:e2e` — full emulator journey + renderers | **PASS (2/2)** |
| `npm run test:rules` — 5 Firestore security emulator tests | **PASS (5/5)** |
| `npm audit` | 7 moderate dev-only advisories; no high/critical |

### E2E journey (`tests/browser/journey.spec.js`) — full pass
Register → Dashboard → `gridguard-region` change to Vadodara → every operational page → Assets → asset detail drawer → create work order `WO-CB-502` → Assign crew → refresh persistence check → Start → Complete order → Create demo incident → Resolve incident → Settings (rename + region, reload persistence) → responsive loop at 1440/1280/1024/768/430/390 on all 8 pages with zero page-overflow → Logout → protected `/assets.html` redirect to login → Login again → Dashboard regains region → no console/page errors.

### Renderer tests (`tests/browser/renderers.spec.js`) — full pass
Seeded projections for all four regions, empty datasets, every operational page, widths 1440/1280/1024/768/430/390, no page errors, no horizontal overflow.

### Unit tests
1. seed size/correlated history/risk mix
2. cross-page canonical risk scores
3. empty projections for every page
4. deterministic bounded scoring, inapplicable oil exclusion
5. weather failure fallback
6. busy/unavailable crew exclusion

### Security rules tests
1. anonymous access and cross-profile edits denied
2. profile role escalation denied, own-name update allowed
3. operational reads allowed, score tampering denied
4. atomic assignment allowed; duplicate/incomplete assignment rejected
5. malformed incident writes rejected

(Expected `PERMISSION_DENIED` logs during rules tests are deliberate assertions, not failures.)

## Issue resolved this session

**Incidents horizontal overflow at 390px.** A demo-created incident uses a Firestore auto-generated 20-char ID (e.g. `knqB2qpYBwDWn6YRT1Hq`) instead of short seeded labels like `INC-CB-502-0`. The unbreakable ID stretched the `Highest Severity` stat value, the detail `h2`, and the queue card text, widening the page on narrow viewports. Also audited sibling IDs: work orders are deterministic `WO-{assetId}` and crews are `CREW-{region}-{k}`, both short; assets use short codes — incidents were the only long-ID source.

Narrow, design-preserving fix in `incidents.html` (the three ID display sites):
```css
#highestIncident, #detailId, .incident-main {
  min-width: 0;
  overflow-wrap: anywhere;
}
```
No layout change; long IDs now wrap instead of overflowing, and the full E2E (including the 390px incidents visit) and renderer suites pass. The interrupted edit concern was checked: no partial Python edits exist; `incidents.html`, `js/pages/incidents.js`, `js/operations.js`, `js/firestore.js` are internally consistent and pass `node --check`.

## Deliverable state

- Playwright now starts its own Vite server (no manual `npm start` needed) via the configured `webServer` block, and the full suite passes in one command.
- A stale, unrelated Vite process was found occupying port 5173 and stopped; the port is now free for test-managed startup.
- Dependency audit: `npm audit fix` (non-breaking) removed 1 of 8 moderate advisories (re2). Remaining 7 moderate advisories are transitive dev-only tooling dependencies of `firebase-tools` (stream-json, csv-parse, uuid/gaxios). All require a breaking `firebase-tools@10.1.1` downgrade, which was **not** applied per instruction. No high/critical advisories remain.

## Known limitations (documented, unchanged by design)

- All operational data is simulated; synthetic telemetry is labeled throughout. Risk is a documented weighted heuristic, not a trained ML model or measured accuracy.
- Authenticated demo operators share one operational dataset (demo tenancy, not a multi-utility permission model).
- Live weather display is never persisted into prediction records by design; persisted predictions retain the seed weather snapshot.
- Work-order IDs are one deterministic `WO-{assetId}` per asset; a second lifecycle for a completed asset is not supported, intentionally, to keep assignment constraints consistent.
- Demo incident creation uses a fixed title/description; no editable incident form.
- Several preference toggles are persisted but not all wired to behavior; mapZoom, risk-map weather overlay, show-evidence, critical alert threshold, default region and display name are applied. Private preferences never mutate shared canonical risk values.
- Browser bundle is ~558 kB for Firebase auth/firestore (build warning, not an error).
- Seed/create is additive only; it never resets a live demo.

## Is real Firebase configuration still required?

Yes, before any real deployment. The application is fully validated against local Auth/Firestore emulators. A live Firebase project does not exist yet. All six `YOUR_…` placeholders in `js/firebase-config.js` (or the `.env.example` → `.env.local` values) must be populated with a real Web App config before use outside the emulator. No service-account credentials are needed or included.

## Exact remaining manual steps for the project owner

Follow `FIREBASE_SETUP.md`; the essentials are:

1. `npx firebase login` and create/use a real Firebase project (e.g. `firebase use --add`).
2. Create the Web App and paste its six public config values into `js/firebase-config.js` (or `.env.local` via `VITE_FIREBASE_*`).
3. Authentication → Sign-in method → enable Email/Password; add the serving hostname to Authorized domains (Firestore must be created in Standard mode).
4. Deploy rules: `npx firebase deploy --only firestore --project YOUR_PROJECT_ID` (from `firestore.rules`).
5. Options for data: (a) create a demo project and run `gcloud auth application-default login && GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID npm run seed`, or (b) let real usage generate records; empty regions are handled. Seed is create-only.
6. Verify manually: register → settings → ops pages → create/assign/start/complete order → create/resolve incident → refresh → confirm Firestore documents and `resolvedAt` on resolution.
7. `npm run build`, then `npx firebase deploy --only hosting --project YOUR_PROJECT_ID`.
8. Re-run `npm run test:e2e` if you want the journey verified against the live project; note the suite targets emulator mode and requires `VITE_USE_EMULATORS` handling for local runs.
9. Cleanup: no service-account key should ever be committed; `.env.local` is git-ignored.

Nothing in the remaining steps blocks local demonstration; the app currently runs entirely against local emulators.