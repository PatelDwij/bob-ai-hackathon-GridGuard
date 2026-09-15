# Solution Overview

## What We Built

GridGuard AI is a predictive grid-maintenance and outage-risk platform that helps utility teams identify vulnerable equipment, understand the factors contributing to its risk, and coordinate preventive action.

The platform combines simulated equipment telemetry, weather exposure, asset condition, historical incidents, and operational context using a transparent multi-factor risk scoring engine.

## How It Works

1. Grid asset and simulated sensor data are stored in Cloud Firestore.
2. GridGuard evaluates factors such as temperature, oil temperature, vibration, partial discharge, oil quality, load, historical incidents, and weather exposure.
3. The risk engine generates an explainable score and classifies each asset as Stable, Elevated, or Critical.
4. Predictions include supporting evidence, inspection priority, expected failure mode, and recommended action.
5. Operators can inspect assets through dashboards and an interactive geographic risk map.
6. Maintenance work orders can be created for assets requiring attention.
7. Field supervisors can assign available crews to pending work orders.
8. Maintenance engineers can progress assigned work through execution and completion.
9. Operators can report and manage grid incidents.
10. Firebase Authentication and Firestore Security Rules enforce role-based access.

## Core Operational Flow

Asset & Sensor Data
→ Weather + Operational History
→ Explainable Risk Engine
→ Risk Classification & Prediction
→ Dashboard / Risk Map
→ Maintenance Recommendation
→ Work Order
→ Crew Assignment
→ Maintenance Execution
→ Incident & Grid Monitoring

## Key Features

- Explainable multi-factor equipment risk scoring
- Stable, Elevated, and Critical risk classification
- Interactive Leaflet/OpenStreetMap grid-risk visualization
- Asset telemetry and prediction inspection
- Predictive maintenance recommendations
- Work-order lifecycle management
- Crew assignment and operational coordination
- Incident reporting and resolution tracking
- Firebase Authentication
- Firestore-backed operational persistence
- Role-based authorization
- Transparent simulated-data fallback for network or service-quota limitations

## User Roles

GridGuard AI separates responsibilities across five roles:

- Utility Administrator (`admin`) — administrative access and asset/crew management.
- Grid Operator (`operator`) — operational monitoring, telemetry workflows, work-order creation, and incident management.
- Maintenance Engineer (`maintenance`) — executes assigned maintenance work and updates work status.
- Field Supervisor (`field_supervisor`) — assigns available crews to pending work orders.
- Reliability Engineer (`reliability`) — read-only monitoring and reliability analysis.

## Technology

The implementation uses HTML5, CSS3 and JavaScript ES modules with Vite. Leaflet and OpenStreetMap provide geographic visualization. Firebase Authentication provides user authentication, while Cloud Firestore stores operational data and Firestore Security Rules enforce authorization.

IBM Bob was used during development to inspect the codebase, plan implementation work, assist with feature development, debugging, validation, and documentation.

## Prototype Scope

The current prototype uses simulated utility data rather than a live SCADA or IoT integration. The risk engine is an explainable deterministic weighted model designed for the hackathon prototype and should not be interpreted as a calibrated production failure-probability model.# Solution Overview

## What We Built

GridGuard AI is a predictive grid-maintenance and outage-risk platform that helps utility teams identify vulnerable equipment, understand the factors contributing to its risk, and coordinate preventive action.

The platform combines simulated equipment telemetry, weather exposure, asset condition, historical incidents, and operational context using a transparent multi-factor risk scoring engine.

## How It Works

1. Grid asset and simulated sensor data are stored in Cloud Firestore.
2. GridGuard evaluates factors such as temperature, oil temperature, vibration, partial discharge, oil quality, load, historical incidents, and weather exposure.
3. The risk engine generates an explainable score and classifies each asset as Stable, Elevated, or Critical.
4. Predictions include supporting evidence, inspection priority, expected failure mode, and recommended action.
5. Operators can inspect assets through dashboards and an interactive geographic risk map.
6. Maintenance work orders can be created for assets requiring attention.
7. Field supervisors can assign available crews to pending work orders.
8. Maintenance engineers can progress assigned work through execution and completion.
9. Operators can report and manage grid incidents.
10. Firebase Authentication and Firestore Security Rules enforce role-based access.

## Core Operational Flow

```text
Asset & Sensor Data
        ↓
Weather + Operational History
        ↓
Explainable Risk Engine
        ↓
Risk Classification & Prediction
        ↓
Dashboard / Risk Map
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
