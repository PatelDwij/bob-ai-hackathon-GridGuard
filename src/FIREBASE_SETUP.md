# GridGuard AI Firebase setup

## 1. Create a Firebase project
Open https://console.firebase.google.com/ and choose **Add project**. Name it GridGuard AI (e.g. `gridguard-ai-32b1b`). Analytics is optional. Use a dedicated project: every registered operator can view or modify simulated operations according to their role.

## 2. Register a Web App
Project overview → Web (`</>`) → register `GridGuard Web`. Copy the public `firebaseConfig` object. Do not create or download a service-account key for the frontend.

## 3. Enable Authentication
Build → Authentication → Get started → Sign-in method → Email/Password → Enable (not email-link).
Under Settings → Authorized domains add `localhost` and `127.0.0.1` for local testing and your deployed hosting domain. New Firebase projects do not include `127.0.0.1` automatically.

## 4. Create Firestore Database
Build → Firestore Database → Create database → Standard edition, database ID `(default)`. Choose a suitable location (e.g. `asia-south1` Mumbai). Start in production mode.
The application uses collections: `regions`, `assets`, `sensorReadings`, `predictions`, `maintenanceOrders`, `crews`, `incidents`, `weatherSnapshots`, and `users`.

## 5. Install Modular Web SDK and Tooling
Install Node.js 22+ and run in the project folder:

```sh
npm install
```

Vite bundles the Firebase SDK from npm; do not open HTML with `file://` or use a plain static server against the source tree.

## 6. Environment & Transport Configuration
Create or update `.env.local` with your public Web App credentials:

```ini
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="gridguard-ai-32b1b.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="gridguard-ai-32b1b"
VITE_FIREBASE_STORAGE_BUCKET="gridguard-ai-32b1b.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

### Safari (WebKit) & Chrome Infinite Loading Fix
In `js/firebase-config.js`, browser Firestore uses:
```javascript
export const db = (isBrowser && !isEmulator)
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);
```
- **Why**: WebKit/Safari enforces strict CORS / access-control preflights on Firestore's persistent HTTP/2 WebChannel streams (`/Listen/channel` and `/Write/channel`), which causes silent request drops or infinite loading states. Enforcing long-polling eliminates streaming drops while maintaining real-time listener updates.
- **Non-Destructive Loading**: In `js/app.js`, loading states do not blank out or hide DOM nodes. A 10-second timeout guard with a manual "Retry" action ensures pages remain fully responsive and never hang indefinitely.

## 7. Role-Based Access Control (RBAC) Matrix
GridGuard AI enforces 4 distinct roles across both UI controls and Firestore Security Rules:

| Role | Description | Permissions |
| :--- | :--- | :--- |
| **admin** | Utility Administrator / Grid Director | Full administrative access: Add/Edit Assets, Manage Crews, Ingest Telemetry, Create Work Orders, Report Incidents, Assign Crews. |
| **operator** | Grid Dispatcher / Control Room Operator | Operational control: Ingest Telemetry (triggers model risk re-evaluation), Create Work Orders, Report Incidents, Monitor Incidents. Cannot create new asset infrastructure. |
| **maintenance** | Field Supervisor / Maintenance Tech | Field execution: Accept Work Orders, Assign Crews, Transition Order Status (`Pending` → `In Progress` → `Completed`), Update Crew status. Cannot alter asset registry. |
| **viewer** | Reliability Auditor / Regulatory Inspector | Read-only access: View dashboard telemetry, risk heatmaps, predictive analysis, and incident logs. All write actions and operational buttons are disabled. |

### Role Normalization & Security Rules
- User profiles in `users/{uid}` store the user's role. Profile writes cannot elevate roles (`request.resource.data.role == resource.data.role`).
- `firestore.rules` verifies user roles via helper functions (`isAdmin()`, `isOperator()`, `isMaintenance()`, `isViewer()`).
- Atomic reciprocal linking is enforced when assigning crews to work orders (`getAfter()` verification).

## 8. Deploy Security Rules

```sh
npx firebase login
npx firebase use gridguard-ai-32b1b
npx firebase deploy --only firestore:rules --project gridguard-ai-32b1b
```

To test security rules against the emulator:
```sh
npm run test:rules
```

## 9. Seed Simulated Data (If needed)
With Google Cloud CLI authenticated for project `gridguard-ai-32b1b`:

```sh
gcloud auth application-default login
gcloud auth application-default set-quota-project gridguard-ai-32b1b
GOOGLE_CLOUD_PROJECT=gridguard-ai-32b1b npm run seed
```

This inserts 48 monitored assets, historical sensor telemetry, risk predictions, active crews, work orders, incidents, and weather snapshots across Ahmedabad East, Ahmedabad West, Gandhinagar, and Vadodara.

## 10. Start the Application & Development Server

```sh
npm start
```
Runs Vite on `http://127.0.0.1:5173`.

For production deployment:
```sh
npm run build
npx firebase deploy --only hosting --project gridguard-ai-32b1b
```

## 11. In-Page Operational Workflows
In-page interactive workflows replace fake alerts and mock dialogs:
1. **+ Add Asset**: Available to Administrators on `assets.html`. Opens a dark glassmorphism modal to register assets (Transformers, Substations, Circuit Breakers) with coordinate geocoding, voltage specifications, and installation records directly in Firestore.
2. **⚡ Ingest Telemetry**: Available to Operators and Admins via the Asset Drawer on `assets.html`. Submits live sensor readings (temperature, oil temp, vibration, load current) and automatically triggers heuristic risk recalculation.
3. **📋 Create Work Order & Assign Crew**: Available on `maintenance.html` and `assets.html`. Operators create work orders; Maintenance supervisors atomically assign available crews and transition orders from `Pending` → `In Progress` → `Completed`.
4. **⚠️ Report Incident**: Available to Operators and Admins on `incidents.html`. Files operational incident logs with severity levels and operator descriptions.
5. **👷 Register Response Crew**: Available to Administrators on `crews.html`. Registers field response teams with assigned territory and team leads.

## 12. Automated Verification & Testing

### Unit & Security Test Suites
```sh
npm test          # Verifies risk calculation, feature extraction, and empty data handling
npm run test:rules # 7 security rules unit tests verifying RBAC permissions and atomic links
```

### Dual-Engine Real Firebase End-to-End Suite
Runs a complete operator and viewer journey on the live Firebase project in both Chromium and WebKit (Safari engine):
```sh
npm run test:real
```

Verified journeys:
- Admin registration & profile onboarding in real Firestore.
- Dashboard connection and region switching (Ahmedabad East ↔ Vadodara).
- In-page modal workflows: Add Asset, Ingest Telemetry, Register Crew, Report Incident.
- Leaflet interactive map rendering with default `scrollWheelZoom: false`.
- Account settings persistence.
- Protected route redirection on logout.
- Viewer registration and read-only permission enforcement.
