# GRIDGUARD AI
Power Outage Prediction & Grid Equipment Failure Advisor — Firebase hackathon prototype.

Existing multi-page UI, inline CSS, sidebar, cards, drawer and responsive layout are retained. Leaflet 1.9.4 + OpenStreetMap remain the maps. This project demonstrates utility operations with **simulated data and a transparent weighted risk model**, not a trained ML system or real utility telemetry.

## Start
Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Fill the isolated public placeholders in `js/firebase-config.js`, enable Email/Password Auth, deploy rules and seed Firestore. Run `npm install`, then `npm start`. No Firebase project is required for the documented emulator workflow.

## Architecture and data flow
- Existing HTML/CSS → extracted `js/pages/*` presentation modules.
- `js/auth.js` → Firebase Authentication and private `users/{uid}` profiles.
- `js/firestore.js` → region-scoped real-time subscriptions and transactional operational writes.
- `js/view-model.js` → derived dashboard totals and compatibility projections shared by every page.
- `scripts/demo-data.mjs` → correlated historical telemetry → `js/risk-engine.js` → consistent persisted assets/predictions.
- `js/weather.js` → region coordinates → optional current weather or labeled seeded fallback.
- `js/settings.js` → account preferences in Firestore; sidebar/region device state in localStorage.
- `js/operations.js` → existing-style functional controls for work orders, crews, incidents.

Firestore owns operational records; page renderers contain no regional datasets. Every subscription uses selected `gridguard-region`; stale callbacks are discarded on region changes. All seven required collections load before regional rendering, so cards do not mix old and new regions. Asset detail exposes latest telemetry; 25 readings per asset retain 72-hour history. Predictions expose evidence, heuristic probability, completeness confidence and a cumulative 72-hour inspection outlook.

## Features
Email/password registration/login/logout, persistent auth, protected pages, region synchronization, search/type/risk/status filtering, asset drawers, map markers/layers, prediction inspectors, transactional assignment and release, demo incidents/resolution, account settings, loading/empty/error feedback. Available crew recommendations use regional availability, skill match and straight-line distance; no route ETA is invented.

## Risk formula
Model `weighted-demo-v1`: weighted mean of clamped 0–100 normalized features. Temperature (45–95°C) 12%; oil temperature (55–110°C) 18%; vibration (1–8 mm/s) 15%; partial discharge (10–500 pC) 15%; oil degradation (100 minus quality, 10–70) 12%; load (60–120%) 12%; historical incident count (0–4) 8%; weather exposure 8%. Exclude oil channels for non-transformers and renormalize applicable weights. Critical ≥75; Elevated ≥45; Stable otherwise. Inspection windows: 12/24/72 hours. Probability proxy = round(score × 0.85), **not calibrated likelihood**. Confidence = applicable input completeness, **not predictive accuracy**. Evidence lists raw values, normalized scores and weights.

Weather exposure: 45% hourly rainfall (0–20 mm), 25% wind (10–80 km/h), 20% temperature (30–48°C), 10% humidity (60–100%). These are illustrative hackathon assumptions, not utility-certified limits. Health = 100 − 0.65 × risk for seeded assets. No retraining or fake inference API exists. Private settings alter preferences, not shared model scores; model configuration changes require a controlled regeneration of persisted predictions.

## Security
Anonymous access denied. Profiles are owner-only and cannot escalate roles. Authenticated demo operators share operational access; this is an explicit demo tenancy model, not a production multi-utility authorization design. Browser clients cannot mutate telemetry/risk records. Firestore rules and transactions validate matching crew/order links. Seed uses external ADC; never commit a service-account key. No Firebase Storage is provisioned because current workflows have no file uploads.

## Validation
`npm test` tests data consistency, scoring, empty projections, weather fallback and recommendations. `npm run build` bundles every page. `npm run test:rules` exercises security with Firestore Emulator. `npm run test:e2e` runs the persisted operator journey and requested screen widths. See [docs/QA.md](docs/QA.md) for execution results and limitations, and [docs/ARCHITECTURE_AUDIT.md](docs/ARCHITECTURE_AUDIT.md) for the original inspection.
