# GridGuard AI

### Power Outage Prediction & Grid Equipment Failure Advisor

GridGuard AI is a predictive grid-maintenance and outage-risk platform designed to help utility teams identify vulnerable grid equipment earlier, understand the factors contributing to risk, and coordinate preventive maintenance and field response.

> **Hackathon Track:** AI  
> **Team:** Gridguard

---

## Team

| Role | Member | Email |
|---|---|---|
| Team Lead | Patel Prince Ashwinkumar | 25ce086@charusat.edu.in |
| Member | Patel Dwij Riteshkumar | 25ce077@charusat.edu.in |
| Member | Patel Heer Vijaykumar | 25dit051@charusat.edu.in |
| Member | Patel Pal Pankajkumar | 25ce084@charusat.edu.in |

---

## Problem Statement

Power utilities depend on critical infrastructure such as transformers, substations, circuit breakers, and distribution equipment. Failures in these assets can interrupt electricity supply, affect customers, increase maintenance costs, and require urgent field response.

Grid operators receive operational information from equipment telemetry, asset condition, weather exposure, and incident history, but converting these signals into clear maintenance priorities can be difficult.

GridGuard AI helps move this workflow from reactive response toward preventive and risk-based maintenance.

For the detailed problem statement, see:

[`docs/problem-statement.md`](docs/problem-statement.md)

---

## Solution

GridGuard AI combines simulated equipment telemetry, weather exposure, asset condition, historical incidents, and operational context through an explainable multi-factor risk scoring engine.

The platform converts these signals into actionable equipment-risk information and connects the result with:

- Asset monitoring
- Risk prioritization
- Geographic visualization
- Maintenance recommendations
- Work-order management
- Crew assignment
- Incident management

This creates an end-to-end workflow from identifying a vulnerable asset to coordinating preventive field action.

For the complete solution description, see:

[`docs/solution-overview.md`](docs/solution-overview.md)

---

## Key Features

### Explainable Equipment Risk Scoring

GridGuard evaluates multiple operational factors including temperature, oil temperature, vibration, partial discharge, oil quality, equipment load, historical incidents, and weather exposure.

Assets are classified into three risk levels:

- Stable
- Elevated
- Critical

The system exposes supporting evidence and recommended actions rather than presenting only an unexplained score.

### Interactive Grid Risk Map

Leaflet and OpenStreetMap are used to visualize grid assets geographically and help operators understand the location and distribution of equipment risk.

### Predictive Maintenance Workflow

High-risk assets can be connected to maintenance recommendations and work orders, allowing risk information to become an operational action.

### Crew Coordination

Field supervisors can assign available crews to pending maintenance work orders. Maintenance engineers can then progress assigned work through execution and completion.

### Incident Management

Grid operators can report and manage incidents while viewing related asset and risk information.

### Role-Based Authorization

GridGuard implements five operational roles:

| Role | Main Responsibility |
|---|---|
| `admin` | Utility administration and management |
| `operator` | Grid operations, telemetry workflows, work-order creation and incidents |
| `field_supervisor` | Crew assignment |
| `maintenance` | Maintenance execution |
| `reliability` | Read-only reliability monitoring |

Firebase Authentication handles user authentication, while Firestore Security Rules enforce backend authorization.

### Demo Resilience

Firebase and Cloud Firestore are the primary backend services.

A clearly identified simulated-data fallback is included for hackathon demonstration resilience when Firebase cannot be reached because of network or service-quota limitations.

Fallback data is not presented as Firestore persistence.

---

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript ES Modules |
| Build Tool | Vite |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Authorization | Firestore Security Rules |
| Mapping | Leaflet, OpenStreetMap |
| Risk Assessment | Explainable JavaScript multi-factor weighted scoring |
| Testing | Automated tests, Playwright |
| CI | GitHub Actions |
| Development Assistance | IBM Bob |

---

## IBM Bob Usage

IBM Bob was used as a development assistant throughout the GridGuard AI implementation process.

It supported activities including:

- Inspecting and understanding the existing codebase
- Planning implementation work
- Assisting with feature development
- Reviewing application architecture and data flow
- Debugging frontend and Firebase integration issues
- Supporting validation and testing
- Improving project documentation

The final application logic, architecture, Firebase configuration, security rules, tests, and submission artifacts are included in this repository for evaluation.

---

## Architecture

GridGuard uses a browser-based multi-page frontend connected to Firebase Authentication and Cloud Firestore.

A simplified flow is:

```text
Grid Assets + Sensor Data + Weather + History
                    ↓
         Explainable Risk Engine
                    ↓
          Risk Classification
                    ↓
       Dashboard + Geographic Map
                    ↓
        Maintenance Work Order
                    ↓
          Crew Assignment
                    ↓
       Maintenance Execution
                    ↓
      Continued Grid Monitoring
```

For the detailed architecture:

[`docs/architecture.md`](docs/architecture.md)

---

## Repository Structure

```text
.
├── src/                    # Complete GridGuard application source
├── docs/                   # Problem, solution, architecture and setup
├── demo/                   # Demo video, live demo and screenshots
├── presentation/           # Hackathon presentation
├── submission.yaml         # Submission metadata
├── CONTRIBUTING.md
└── README.md
```

The complete runnable application is located inside `src/`.

---

## Run Locally

### 1. Enter the application directory

```bash
cd src
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create `src/.env.local` using `src/.env.example` as the reference and provide the Firebase Web App configuration.

Do not commit `.env.local` or private service-account credentials.

### 4. Start the application

```bash
npm start
```

Open the local URL displayed by Vite.

For complete Firebase configuration and testing instructions, see:

[`docs/setup-guide.md`](docs/setup-guide.md)

---

## Testing

From the `src/` directory:

```bash
npm test
```

Firestore Security Rules can be tested with:

```bash
npm run test:rules
```

The repository also contains Playwright-based browser validation and a live Firebase journey test.

The live administrative journey requires an appropriately configured Firebase test account with the `admin` role and can be affected by Firebase service quotas or network availability.

---

## Prototype Scope and Limitations

GridGuard AI is a hackathon prototype.

The current implementation uses simulated grid telemetry and operational records rather than a live utility SCADA or IoT feed.

The risk engine is a transparent multi-factor weighted decision-support model. It is not presented as a production-trained machine-learning model, and its probability proxy should not be interpreted as a calibrated real-world equipment failure probability.

The prototype is intended to demonstrate how grid telemetry, explainable risk assessment, geographic awareness, maintenance workflows, crew coordination, and role-based access can be integrated into one operational platform.

---

## Submission Artifacts

- Source Code: [`src/`](src/)
- Problem Statement: [`docs/problem-statement.md`](docs/problem-statement.md)
- Solution Overview: [`docs/solution-overview.md`](docs/solution-overview.md)
- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Setup Guide: [`docs/setup-guide.md`](docs/setup-guide.md)
- Demo Video: [`demo/demo-video-link.txt`](demo/demo-video-link.txt)
- Live Demo: [`demo/live-demo-url.txt`](demo/live-demo-url.txt)
- Screenshots: [`demo/screenshots/`](demo/screenshots/)
- Presentation: [`presentation/`](presentation/)

---

## Project

**GridGuard AI — Power Outage Prediction & Grid Equipment Failure Advisor**

Built by **Team Gridguard** for the **AI Track**.
