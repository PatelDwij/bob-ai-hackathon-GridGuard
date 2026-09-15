# 🚀 GridGuard AI — Power Outage Prediction & Grid Equipment Failure Advisor

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | GridGuard |
| **Track** | AI |
| **Team Lead** | Patel Prince Ashvinkumar — 25ce086@charusat.edu.in |
| **Members** | Patel Dwij Riteshkumar, Patel Heer Vijaykumar, Patel Pal Pankajkumar |

---

## 🎯 Problem Statement

Power transformer and substation failures can cause major blackouts, while traditional calendar-based maintenance often fails to identify equipment degradation early. Grid sensors already capture indicators such as temperature, vibration, partial discharge, and oil quality, but this data is often not combined with weather forecasts and historical incident records in time to take preventive action.

The challenge is to combine asset health sensor data, weather forecasts, and historical incident records to predict outage-prone areas and at-risk equipment, rank assets by grid impact severity, and generate a prioritized maintenance and crew pre-positioning plan.

---

## 💡 Solution

GridGuard AI is an AI-powered decision-support platform that combines simulated asset health sensor data, weather conditions, and historical incident information to identify equipment with elevated failure and outage risk.

Its explainable multi-factor weighted risk engine evaluates equipment condition and environmental factors, identifies major risk drivers, combines failure risk with grid impact, and helps operators prioritize maintenance and coordinate field crews before failures escalate into major outages.

---

## ✨ Key Features

- **Explainable Risk Prediction:** Generates a 0–100 equipment risk score and classifies grid assets as Stable, Elevated, or Critical using multiple health and environmental indicators.
- **Grid Impact Prioritization:** Combines equipment failure risk with grid consequence to identify which assets require attention first.
- **Interactive Risk Map:** Visualizes geographically distributed grid assets and their risk levels using Leaflet and OpenStreetMap.
- **Prioritized Maintenance Planning:** Converts risk insights into maintenance work orders and helps teams track maintenance activities.
- **Crew Planning & Incident Management:** Supports crew assignment, field coordination, and operational incident tracking through role-based workflows.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | HTML5, CSS3, JavaScript (ES Modules) |
| **Frameworks** | Vite, Leaflet |
| **IBM Technologies** | IBM Bob |
| **Databases** | Cloud Firestore |
| **Other** | Firebase Authentication, Firestore Security Rules, Role-Based Access Control (RBAC), OpenStreetMap, Node.js Test Runner, Playwright, Firebase Hosting, Git, GitHub Actions |

---

## 📁 Repository Structure

```text
├── src/                  # All source code
├── docs/                 # Written documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   ├── demo-video-link.txt  # Link to demo video
│   └── live-demo-url.txt    # Link to deployed application
├── presentation/         # Slide deck
│   └── slides.pdf
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

```bash
# 1. Clone the repository
git clone https://github.com/PatelDwij/bob-ai-hackathon-GridGuard.git
cd bob-ai-hackathon-GridGuard/src

# 2. Install dependencies
npm install

# 3. Configure environment
# Create a .env.local file inside src and add the required
# Firebase web application configuration values.

# 4. Run the project
npm run dev
```

For complete Firebase configuration and setup instructions, see [`docs/setup-guide.md`](docs/setup-guide.md).

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/slides.pdf) |

---

## ⚠️ Known Limitations

- The current hackathon prototype operates on simulated utility assets, sensor telemetry, weather conditions, and historical incident data rather than live utility SCADA or IoT feeds.
- The risk intelligence uses a transparent multi-factor weighted scoring model. A real utility deployment would require calibration and validation using utility-specific historical failure data.
- Production deployment would require integration with live utility infrastructure, weather services, asset-management systems, and field workforce platforms.

---

## 🏅 What We're Most Proud Of

GridGuard AI goes beyond simply displaying a failure-risk score. The platform connects **prediction → explanation → prioritization → maintenance → crew action**, helping transform fragmented grid data into a practical preventive decision-support workflow.

We are especially proud of combining explainable risk intelligence, grid-impact prioritization, geographic risk visualization, role-based operational workflows, and cloud-backed data management into one complete working prototype.
