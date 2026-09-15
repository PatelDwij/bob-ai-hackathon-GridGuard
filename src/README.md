# GRIDGUARD AI

**Power Outage Prediction & Grid Equipment Failure Advisor**

GridGuard AI is a predictive grid-maintenance and outage-risk platform designed to help utility teams identify vulnerable equipment, understand the factors contributing to risk, prioritize preventive maintenance, and coordinate field response.

The hackathon prototype uses **simulated utility data and an explainable multi-factor weighted risk model**. It does not claim to use live utility telemetry or a production-calibrated machine-learning failure model.

## Features

- Explainable 0–100 equipment risk scoring
- Stable, Elevated, and Critical risk classification
- Asset health and sensor telemetry monitoring
- Equipment risk predictions and supporting evidence
- Interactive Leaflet/OpenStreetMap risk visualization
- Grid-impact-based asset prioritization
- Predictive maintenance recommendations
- Maintenance work-order lifecycle management
- Crew planning and assignment
- Incident reporting and resolution tracking
- Firebase Authentication
- Cloud Firestore operational persistence
- Role-based authorization
- Transparent simulated-data fallback for demo continuity

## User Roles

GridGuard AI separates operational responsibilities across five roles:

- **Utility Administrator (`admin`)** — full administrative access, including asset and crew management.
- **Grid Operator (`operator`)** — monitors grid operations, works with telemetry, creates maintenance work orders, and reports/manages incidents.
- **Maintenance Engineer (`maintenance`)** — starts and completes assigned maintenance work and updates related crew status.
- **Field Supervisor (`field_supervisor`)** — assigns available crews to pending maintenance work orders.
- **Reliability Engineer (`reliability`)** — read-only access for monitoring and reliability analysis.

## How GridGuard Works

```text
Asset & Sensor Data
        ↓
Weather + Historical Incidents
        ↓
Explainable Risk Engine
        ↓
Risk Score + Risk Classification
        ↓
Grid Impact Prioritization
        ↓
Dashboard / Risk Map / Predictions
        ↓
Maintenance Recommendation
        ↓
Work Order
        ↓
Crew Assignment
        ↓
Maintenance Execution
        ↓
Incident & Grid Monitoring
```

GridGuard evaluates equipment health indicators such as temperature, oil temperature, vibration, partial discharge, oil quality, load, historical incidents, and weather exposure where applicable.

The risk engine produces an explainable score from **0–100** and classifies assets as:

- **Critical:** score ≥ 75
- **Elevated:** score ≥ 45 and < 75
- **Stable:** score < 45

The model is a transparent deterministic weighted model developed for the hackathon prototype. Its scores support prioritization and demonstration and should not be interpreted as calibrated production failure probabilities.

## Technology Stack

| Category | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript ES Modules |
| **Build Tool** | Vite |
| **Cloud Backend** | Firebase |
| **Database** | Cloud Firestore |
| **Authentication** | Firebase Authentication |
| **Authorization** | Firestore Security Rules + Role-Based Access Control |
| **Maps** | Leaflet + OpenStreetMap |
| **Risk Intelligence** | Explainable Multi-Factor Weighted Risk Engine |
| **Testing** | Node.js Test Runner + Playwright |
| **Deployment** | Firebase Hosting |
| **AI Development Assistance** | IBM Bob |
| **Version Control** | Git + GitHub |

## Source Structure

```text
src/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── assets.html
├── risk-map.html
├── predictions.html
├── maintenance.html
├── crews.html
├── incidents.html
├── settings.html
├── privacy.html
├── terms.html
│
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── firebase-config.js
│   ├── firestore.js
│   ├── operations.js
│   ├── data-client.js
│   ├── demo-session.js
│   ├── risk-engine.js
│   ├── sensors.js
│   ├── weather.js
│   ├── maps.js
│   ├── map-picker.js
│   ├── view-model.js
│   └── pages/
│
├── scripts/
│   ├── seed.mjs
│   ├── demo-data.mjs
│   └── cleanup-test-data.mjs
│
├── tests/
├── docs/
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── vite.config.js
├── playwright.config.js
├── package.json
└── .env.example
```

## Run Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Create a `.env.local` file using `.env.example` as the reference and provide the required Firebase web application configuration.

Never commit `.env.local` or files containing private credentials.

For detailed Firebase configuration, see [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md).

### 3. Start Development Server

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

## Testing

Run the core automated test suite:

```bash
npm test
```

The test suite validates core risk scoring, asset projections, empty-data handling, weather fallback behavior, and crew pre-positioning logic.

Additional validation commands are available for Firestore Security Rules and browser-based workflows.

## Production Build

```bash
npm run build
```

The production-ready files are generated in the `dist/` directory.

## Firebase Services

GridGuard AI uses:

- **Firebase Authentication** for user authentication
- **Cloud Firestore** for grid assets, telemetry, predictions, maintenance, crews, incidents, and operational data
- **Firestore Security Rules** for role-based authorization
- **Firebase Hosting** for deployment

## Simulated Data & Demo Fallback

The hackathon prototype uses simulated grid assets, correlated sensor history, weather conditions, historical incidents, predictions, maintenance workflows, and crew information.

A transparent demo fallback is included so the core application remains demonstrable if Firebase connectivity, quota, or service availability becomes temporarily unavailable.

When fallback data is active, the application clearly identifies it as simulated demo data.

## Prototype Scope

GridGuard AI is currently a hackathon prototype.

A production utility deployment would require:

- Integration with live SCADA/IoT telemetry
- Utility-specific historical failure datasets
- Integration with production weather services
- Calibration and validation of risk thresholds using real operational data
- Integration with enterprise asset-management and workforce systems
- Production-scale security, monitoring, and governance

## IBM Bob

IBM Bob was used throughout development to assist with codebase understanding, implementation planning, workflow refinement, debugging, validation, terminal-based testing and iteration, and project documentation.

The team retained control over the project architecture, engineering decisions, risk methodology, Firebase integration, operational workflows, testing, and final implementation.

## Live Demo

**Application:** https://gridguard-ai-32b1b.web.app/

**Demo Video:** https://youtu.be/svjrF0pkQ4k

---

**GridGuard AI — Predict. Prioritize. Prevent.**