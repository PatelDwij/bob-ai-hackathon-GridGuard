# Solution Overview

## What We Built

GridGuard AI is a power-grid decision-support platform designed to help utility teams identify equipment that may be at risk of failure before it contributes to a major outage.

The platform combines simulated grid asset sensor data, weather conditions, and historical incident information to calculate equipment risk, identify the main risk drivers, rank assets by grid impact, and help teams plan preventive maintenance and field crew actions.

Instead of only showing raw sensor readings, GridGuard AI converts them into clear operational decisions: **which asset is at risk, why it is risky, how important it is to the grid, and what action should be taken next.**

## How It Works

1. **Collect Grid Data** — GridGuard AI uses asset information, simulated sensor telemetry, weather conditions, and historical incident records.

2. **Analyze Equipment Health** — The explainable multi-factor risk engine evaluates indicators such as temperature, vibration, partial discharge, oil quality, moisture, electrical load, and environmental exposure where applicable.

3. **Calculate Risk** — Each asset receives a 0–100 risk score and is classified into a Stable, Elevated, or Critical risk level.

4. **Prioritize by Grid Impact** — Failure risk is combined with the operational importance of the asset so that teams can identify which equipment requires attention first.

5. **Visualize Risk** — Assets and their risk levels are displayed through dashboards, prediction views, and an interactive geographic risk map.

6. **Plan Preventive Maintenance** — Operators can convert identified risks into maintenance work orders.

7. **Coordinate Field Crews** — Available crews can be assigned to maintenance work based on operational requirements.

8. **Track Incidents** — Grid incidents can be reported and managed within the same platform, creating a connected workflow from prediction to action.

## Architecture Diagram

> See [`architecture.md`](architecture.md) for the detailed architecture.

```text
Asset Data + Sensor Telemetry + Weather + Historical Incidents
                              │
                              ▼
              Explainable Risk Intelligence
                              │
                  Risk Score + Risk Drivers
                              │
                              ▼
                   Grid Impact Analysis
                              │
                              ▼
        Prioritized Assets / Outage-Risk Insights
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
         Risk Map        Maintenance       Incidents
                              │
                              ▼
                       Crew Assignment
                              │
                              ▼
                     Preventive Action

Frontend: HTML5 + CSS3 + JavaScript + Vite
Cloud: Firebase Authentication + Cloud Firestore
Maps: Leaflet + OpenStreetMap
Deployment: Firebase Hosting
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Explainable multi-factor risk scoring | Makes the reason behind each risk score visible instead of presenting an unexplained prediction. |
| Combine failure risk with grid impact | A high-risk asset is not always the most operationally important asset, so prioritization considers both risk and consequence. |
| Interactive geographic risk map | Helps operators quickly understand where Critical and Elevated assets are located. |
| Role-based operational workflows | Different utility roles require different permissions for asset management, maintenance, crew assignment, and incident handling. |
| Firebase Authentication and Cloud Firestore | Provides authentication, persistent cloud data, and security-rule-based access control within the hackathon prototype. |
| Simulated correlated telemetry | Enables demonstration of realistic risk patterns without requiring access to private utility SCADA or IoT infrastructure. |
| Demo fallback mode | Keeps the core application demonstrable if Firebase quota, connectivity, or service availability becomes an issue during judging. |

## IBM Technologies Used

- **IBM Bob:** IBM Bob was used throughout the development process to assist with understanding and reasoning across the codebase, planning and refining application workflows, debugging implementation issues, validating functionality, supporting terminal-based testing and iteration, and improving project documentation.

The engineering decisions, application architecture, risk methodology, Firebase integration, workflows, testing, and final implementation were reviewed and controlled by the team.

## Demo

- **Live Application:** https://gridguard-ai-32b1b.web.app/
- **Demo Video:** https://youtu.be/svjrF0pkQ4k
- **Screenshots:** [`../demo/screenshots/`](../demo/screenshots/)
- **Presentation:** [`../presentation/slides.pdf`](../presentation/slides.pdf)

---

**GridGuard AI — Predict. Prioritize. Prevent.**