import { clearInspector } from '../utils.js';
import { renderProfile } from '../auth.js';
import { changeIncidentStatus } from '../firestore.js';
export function mount(regionData,user){





    const sidebar =
      document.getElementById("sidebar");

    const overlay =
      document.getElementById("overlay");

    const collapseBtn =
      document.getElementById("collapseBtn");

    const mobileMenu =
      document.getElementById("mobileMenu");

    const regionSelect =
      document.getElementById("regionSelect");

    const statusFilter =
      document.getElementById("statusFilter");

    let selectedIncident = null;


    /* ================= SIDEBAR ================= */

    collapseBtn.addEventListener(
      "click",
      () => {
        sidebar.classList.toggle("collapsed");
      }
    );


    mobileMenu.addEventListener(
      "click",
      () => {

        sidebar.classList.add("mobile-open");
        overlay.classList.add("open");

      }
    );


    overlay.addEventListener(
      "click",
      closeSidebar
    );


    function closeSidebar() {

      sidebar.classList.remove("mobile-open");
      overlay.classList.remove("open");

    }


    /* ================= PROFILE ================= */

    const profileBtn =
      document.getElementById("profileBtn");

    const profileMenu =
      document.getElementById("profileMenu");


    profileBtn.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        profileMenu.classList.toggle("open");

      }
    );


    document.addEventListener(
      "click",
      () => {

        profileMenu.classList.remove("open");

      }
    );


    document
      .getElementById("logoutBtn")
      .addEventListener(
        "click",
        () => {




          window.location.href = "login.html";

        }
      );


    function loadUser() { renderProfile(user); }


    /* ================= HELPERS ================= */

    function severityClass(
      severity
    ) {

      if (
        severity === "Critical"
      ) {
        return "critical";
      }

      if (
        severity === "Major"
      ) {
        return "major";
      }

      return "minor";

    }


    function statusClass(
      status
    ) {

      return status.toLowerCase();

    }


    function filteredIncidents() {

      const data =
        regionData[
          regionSelect.value
        ];


      if (
        statusFilter.value === "All"
      ) {
        return data.incidents;
      }


      return data.incidents.filter(
        incident =>
          incident.status === statusFilter.value
      );

    }


    /* ================= LIST ================= */

    function renderIncidentList() {

      const incidents =
        filteredIncidents();


      const list =
        document.getElementById("incidentList");


      if (
        incidents.length === 0
      ) {

        list.innerHTML = `
          <div style="
            padding:28px;
            text-align:center;
            color:#748487;
            font-size:8px;
          ">
            No incidents match this status.
          </div>
        `;

        clearInspector();
        return;

      }


      if (
        !incidents.some(
          incident =>
            incident.id === selectedIncident
        )
      ) {

        selectedIncident =
          incidents[0].id;

      }


      list.innerHTML =
        incidents.map(
          incident => `

            <button
              class="
                incident-card
                ${
                  incident.id === selectedIncident
                    ? "active"
                    : ""
                }
              "
              data-id="${incident.id}"
            >

              <div
                class="
                  severity-line
                  ${severityClass(incident.severity)}
                "
              ></div>


              <div class="incident-main">

                <strong>
                  ${incident.id}
                  ·
                  ${incident.title}
                </strong>

                <span>
                  ${incident.asset}
                  ·
                  ${incident.area}
                  ·
                  ${incident.severity}
                </span>

                <small>
                  ${incident.summary}
                </small>

              </div>


              <div class="incident-meta time-col">
                <span>Detected</span>
                <strong>${incident.detected}</strong>
              </div>


              <div class="incident-meta asset-col">
                <span>Grid impact</span>
                <strong>${incident.impact}</strong>
              </div>


              <div
                class="
                  status-pill
                  ${statusClass(incident.status)}
                "
              >
                ${incident.status}
              </div>

            </button>

          `
        ).join("");


      document
        .querySelectorAll(".incident-card")
        .forEach(
          card => {

            card.addEventListener(
              "click",
              () => {

                selectedIncident =
                  card.dataset.id;

                renderIncidentList();
                renderIncidentDetail();

              }
            );

          }
        );


      renderIncidentDetail();

    }


    /* ================= DETAIL ================= */

    function renderIncidentDetail() {

      const data =
        regionData[
          regionSelect.value
        ];


      const incident =
        data.incidents.find(
          item =>
            item.id === selectedIncident
        )
        ||
        data.incidents[0];


      if (!incident) {
 for (const el of document.querySelectorAll('[id^="detail"]')) if (!el.children.length) el.textContent = '—';
 for (const id of ['evidenceList','checklist','skillList','memberList','eventTimeline','reasonBox','rootCause','assignmentTitle','assignmentDescription']) { const el=document.getElementById(id); if(el) el.textContent='No matching records'; }
 return;
 }


      selectedIncident =
        incident.id;


      document.getElementById(
        "detailId"
      ).textContent =
        incident.id;


      document.getElementById(
        "detailAsset"
      ).textContent =
        `${incident.asset} · ${incident.area} ${incident.type}`;


      document.getElementById(
        "detailSeverity"
      ).textContent =
        incident.severity;


      document.getElementById(
        "detailSummary"
      ).textContent =
        incident.summary;


      document.getElementById(
        "detailStatus"
      ).textContent =
        incident.status;


      document.getElementById(
        "detailDetected"
      ).textContent =
        incident.detected;


      document.getElementById(
        "detailImpact"
      ).textContent =
        incident.impact;


      document.getElementById(
        "detailCrew"
      ).textContent =
        incident.crew;


      document.getElementById(
        "rootCause"
      ).textContent =
        incident.rootCause;


      const badge =
        document.getElementById(
          "detailSeverity"
        );


      if (
        incident.severity === "Critical"
      ) {

        badge.style.color =
          "#8d4741";

        badge.style.background =
          "#f2dddd";

      } else if (
        incident.severity === "Major"
      ) {

        badge.style.color =
          "#866126";

        badge.style.background =
          "#f2e8d4";

      } else {

        badge.style.color =
          "#2e6756";

        badge.style.background =
          "#dcece6";

      }


      document.getElementById(
        "eventTimeline"
      ).innerHTML =
        incident.timeline.map(
          event => {

            let dotClass = "";

            if (
              event[1] === "Critical"
            ) {
              dotClass = "danger";
            } else if (
              event[1] === "Warning"
            ) {
              dotClass = "warn";
            }


            return `

              <div class="timeline-item">

                <div class="timeline-time">
                  ${event[0]}
                </div>

                <div class="timeline-track">
                  <div
                    class="
                      timeline-dot
                      ${dotClass}
                    "
                  ></div>
                </div>

                <div class="timeline-copy">

                  <strong>
                    ${event[2]}
                  </strong>

                  <span>
                    ${event[3]}
                  </span>

                </div>

              </div>

            `;

          }
        ).join("");

      const authRole = user?.role;
      const isOperator = authRole === 'admin' || authRole === 'operator';
      const isUtilityAdmin = authRole === 'admin';

      const detailActions = document.querySelector('.detail-actions');
      if (detailActions) {
        detailActions.querySelectorAll('.injected-action').forEach(el => el.remove());

        const actionBtn = document.createElement('button');
        actionBtn.className = 'primary-btn injected-action';
        actionBtn.style.cursor = 'pointer';

        if (incident.status === 'Open' && (isOperator || isUtilityAdmin)) {
          actionBtn.textContent = 'Monitor Incident';
          actionBtn.onclick = async () => {
            actionBtn.disabled = true;
            try {
              await changeIncidentStatus(incident.id, 'Monitoring');
            } catch(e) {
              console.error(e);
              actionBtn.disabled = false;
            }
          };
          detailActions.append(actionBtn);
        } else if (incident.status === 'Monitoring' && (isUtilityAdmin || isOperator)) {
          actionBtn.textContent = 'Resolve Incident';
          actionBtn.onclick = async () => {
            actionBtn.disabled = true;
            try {
              await changeIncidentStatus(incident.id, 'Resolved');
            } catch(e) {
              console.error(e);
              actionBtn.disabled = false;
            }
          };
          detailActions.append(actionBtn);
        }
      }

    }


    /* ================= RESPONSE FLOW ================= */

    function renderResponseFlow(
      flow
    ) {

      document.getElementById(
        "responseFlow"
      ).innerHTML =
        flow.map(
          (stage,index) => `

            <div
              class="
                response-stage
                ${index === 2 ? "current" : ""}
              "
            >

              <div class="stage-step">
                ${stage[0]}
              </div>

              <div class="stage-count">
                ${stage[2]}
              </div>

              <strong>
                ${stage[1]}
              </strong>

              <p>
                ${stage[3]}
              </p>

            </div>

          `
        ).join("");

    }


    /* ================= HISTORY ================= */

    function renderHistory(
      history
    ) {

      document.getElementById(
        "historyList"
      ).innerHTML =
        history.map(
          item => `

            <div class="history-row">

              <div
                class="history-dot"
                style="background:${item[0]}"
              ></div>

              <div class="history-copy">

                <strong>
                  ${item[1]}
                </strong>

                <span>
                  ${item[2]}
                </span>

              </div>

              <div class="history-time">
                ${item[3]}
              </div>

            </div>

          `
        ).join("");

    }


    /* ================= REGION ================= */

    function updateRegion(
      region
    ) {

      const data =
        regionData[region];


      selectedIncident =
        (data.incidents[0]?.id || "");


      statusFilter.value =
        "All";


      document.getElementById(
        "pageSubtitle"
      ).textContent =
        `Active grid events, asset failures and response progress across ${region}.`;


      document.getElementById(
        "weatherChip"
      ).textContent =
        data.weather;


      document.getElementById(
        "activeTop"
      ).textContent =
        parseInt(
          data.stats.active,
          10
        );


      document.getElementById(
        "activeIncidents"
      ).textContent =
        data.stats.active;


      document.getElementById(
        "assetsAffected"
      ).textContent =
        data.stats.affected;


      document.getElementById(
        "resolutionTime"
      ).textContent =
        data.stats.resolution;


      document.getElementById(
        "loadAtRisk"
      ).textContent =
        data.stats.load;


      document.getElementById(
        "customersAtRisk"
      ).textContent =
        data.stats.customers;


      document.getElementById(
        "criticalAssetCount"
      ).textContent =
        data.stats.critical;


      document.getElementById(
        "ackTime"
      ).textContent =
        data.stats.ack;


      document.getElementById(
        "closedToday"
      ).textContent =
        data.stats.closed;


      document.getElementById(
        "slaScore"
      ).textContent =
        data.stats.sla;


      const highest =
        data.incidents[0] || {id:"No incidents",asset:"—",title:"—"};


      document.getElementById(
        "highestIncident"
      ).textContent =
        highest.id;


      document.getElementById(
        "highestIncidentNote"
      ).textContent =
        `${highest.asset} · ${highest.title}`;


      document.getElementById(
        "incidentBadge"
      ).textContent =
        data.incidents.filter(
          incident =>
            incident.status !== "Resolved"
        ).length;


      document.getElementById(
        "riskBadge"
      ).textContent =
        data.incidents.filter(
          incident =>
            incident.severity === "Critical"
        ).length;


      renderIncidentList();

      renderResponseFlow(
        data.responseFlow
      );

      renderHistory(
        data.history
      );


      localStorage.setItem(
        "gridguard-region",
        region
      );

    }


    regionSelect.addEventListener(
      "change",
      event => {

        updateRegion(
          event.target.value
        );

      }
    );


    statusFilter.addEventListener(
      "change",
      () => {

        renderIncidentList();

      }
    );


    /* ================= INITIAL ================= */

    const savedRegion =
      localStorage.getItem(
        "gridguard-region"
      );


    if (
      savedRegion
      &&
      regionData[savedRegion]
    ) {

      regionSelect.value =
        savedRegion;

    }


    loadUser();


    updateRegion(
      regionSelect.value
    );


    window.addEventListener(
      "resize",
      () => {

        if (
          window.innerWidth > 720
        ) {

          closeSidebar();

        }

      }
    );


return { refresh(region, view) {
    const previousRegion = regionSelect.value; const previousSelection = selectedIncident;
    const filters = [...document.querySelectorAll('#riskFilter,#typeFilter,#statusFilter,#stateFilter')].map(el=>[el,el.value]);
    regionData[region] = view;
    regionSelect.value = region;
    updateRegion(region);
    if(previousRegion === region) selectedIncident = previousSelection;
    for (const [el,value] of filters) {el.value=value;el.dispatchEvent(new Event('change'));}
  }};

}
