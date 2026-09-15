# GridGuard AI — Setup Guide

## Prerequisites

Install:

- Node.js 22+
- npm
- Git
- A Firebase project for live Firebase mode

The complete application source is inside the repository's `src/` directory.

## 1. Install the Project

From the repository root:

```bash
cd src
npm install
```

## 2. Firebase Configuration

Create a `.env.local` file inside `src/`.

Use `src/.env.example` as the reference and provide your Firebase Web App configuration:

```ini
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

Do not commit `.env.local` or service-account credentials.

Firebase Web App configuration identifies the Firebase project. Access to operational data is controlled through Firebase Authentication and Firestore Security Rules.

## 3. Firebase Services

### Authentication

Enable:

**Authentication → Sign-in method → Email/Password**

Add the required local and deployed domains to Firebase Authentication authorized domains.

### Cloud Firestore

Create a Firestore Standard database using the `(default)` database ID.

GridGuard uses these collections:

- `users`
- `regions`
- `assets`
- `sensorReadings`
- `predictions`
- `maintenanceOrders`
- `crews`
- `incidents`
- `weatherSnapshots`

## 4. Firestore Security Rules

The security rules are located at:

```text
src/firestore.rules
```

From `src/`, deploy them with Firebase CLI:

```bash
npx firebase login
npx firebase use YOUR_PROJECT_ID
npx firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Firestore Security Rules provide the authoritative server-side role-based authorization layer.

## 5. User Roles

GridGuard implements five operational roles:

| Role | Responsibility |
|---|---|
| `admin` | Utility Administrator — administrative and management access |
| `operator` | Grid Operator — telemetry workflows, work-order creation and incident management |
| `field_supervisor` | Field Supervisor — assigns Ready crews to Pending work orders |
| `maintenance` | Maintenance Engineer — starts and completes assigned maintenance work |
| `reliability` | Reliability Engineer — read-only monitoring and analysis |

User roles are stored in `users/{uid}` profiles.

Changing or hiding frontend controls does not grant permissions. Firestore Security Rules enforce permitted backend operations.

## 6. Simulated Data

GridGuard is a hackathon prototype and uses simulated grid assets, telemetry, predictions, crews, maintenance orders, incidents, and weather snapshots.

Data-generation and seeding utilities are available under:

```text
src/scripts/
```

Never place a Firebase service-account private key inside the frontend or commit one to Git.

## 7. Start the Application

From `src/`:

```bash
npm start
```

Open the local URL shown by Vite.

Do not open the HTML files directly using `file://`.

## 8. Production Build

From `src/`:

```bash
npm run build
```

The production build is generated in `src/dist/`.

Generated build artifacts should not be committed unless specifically required by the deployment platform.

## 9. Automated Tests

From `src/`:

```bash
npm test
```

For Firestore Security Rules:

```bash
npm run test:rules
```

The project also contains Playwright-based browser validation.

## 10. Live Firebase Journey Test

A live Firebase journey test is included for validating the real backend workflow.

It requires Firebase test credentials and an account with the required permissions.

The complete administrative journey expects the test user's Firestore profile to have:

```text
role: admin
```

Run:

```bash
npm run test:real
```

If the account has another role, the test intentionally stops with an `admin-role-required` message.

Live validation can also be affected by Firebase network availability or service quotas.

## 11. Simulated-Data Fallback

Firebase and Cloud Firestore are the primary backend services.

For hackathon demonstration resilience, GridGuard includes a clearly identified simulated-data fallback for situations such as network failure or Firebase service-quota limitations.

When fallback mode is active, the application identifies the data as simulated. Fallback operations should not be interpreted as Firestore persistence.

## 12. Maps

GridGuard uses:

- Leaflet
- OpenStreetMap

No proprietary map API key is required for the current prototype.

## 13. Technology Stack

- HTML5
- CSS3
- JavaScript ES Modules
- Vite
- Leaflet
- OpenStreetMap
- Firebase Authentication
- Cloud Firestore
- Firestore Security Rules
- Playwright
- GitHub Actions
- IBM Bob

## 14. Prototype Limitations

GridGuard currently uses simulated telemetry instead of a live utility SCADA or IoT feed.

The risk engine is a transparent multi-factor weighted decision-support model. It is not a production-trained machine-learning model, and its probability proxy should not be interpreted as a calibrated real-world equipment failure probability.
