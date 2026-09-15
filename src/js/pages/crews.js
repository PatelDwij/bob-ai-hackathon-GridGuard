import { clearInspector } from '../utils.js';
import { renderProfile } from '../auth.js';
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

    const stateFilter =
      document.getElementById("stateFilter");

    let selectedCrew = null;


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

    function stateClass(
      state
    ) {

      if (
        state === "Deployed"
      ) {
        return "deployed";
      }

      if (
        state === "Assigned"
      ) {
        return "responding";
      }

      return "ready";

    }


    function filteredCrews() {

      const data =
        regionData[
          regionSelect.value
        ];


      if (
        stateFilter.value === "All"
      ) {
        return data.crews;
      }


      return data.crews.filter(
        crew =>
          crew.state === stateFilter.value
      );

    }


    /* ================= CREW LIST ================= */

    function renderCrewList() {

      const crews =
        filteredCrews();


      const list =
        document.getElementById("crewList");


      if (
        crews.length === 0
      ) {

        list.innerHTML = `
          <div style="
            padding:28px;
            text-align:center;
            color:#748487;
            font-size:8px;
          ">
            No crews match this filter.
          </div>
        `;

        clearInspector();
        return;

      }


      if (
        !crews.some(
          crew =>
            crew.name === selectedCrew
        )
      ) {

        selectedCrew =
          crews[0].name;

      }


      list.innerHTML =
        crews.map(
          crew => `

            <button
              class="
                crew-card
                ${
                  crew.name === selectedCrew
                    ? "active"
                    : ""
                }
              "
              data-crew="${crew.name}"
              style="display: flex; align-items: flex-start; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(191,212,204,0.4); text-align: left; width: 100%; gap: 16px; box-sizing: border-box; cursor: pointer; background: transparent; border-top: none; border-left: none; border-right: none;"
            >

              <div style="display: flex; gap: 16px; align-items: flex-start;">
                <div class="crew-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: #00765d; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0;">
                  ${crew.code}
                </div>

                <div class="crew-main" style="display: flex; flex-direction: column; gap: 4px;">

                  <strong style="font-size: 14px; font-weight: 700; color: #10262c; letter-spacing: -0.2px;">
                    ${crew.name}
                  </strong>

                  <span style="font-size: 13px; color: #5b7175;">
                    ${crew.area}
                  </span>

                  <small style="font-size: 11px; color: #819599; font-family: monospace;">
                    ${crew.id || `CREW-${crew.code}`}
                  </small>

                </div>
              </div>

              <span
                class="
                  state-pill
                  ${stateClass(crew.state)}
                "
                style="padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; align-self: center;"
              >
                ${crew.state}
              </span>

            </button>

          `
        ).join("");


      document
        .querySelectorAll(".crew-card")
        .forEach(
          card => {

            card.addEventListener(
              "click",
              () => {

                selectedCrew =
                  card.dataset.crew;

                renderCrewList();
                renderInspector();

              }
            );

          }
        );


      renderInspector();

    }


    /* ================= INSPECTOR ================= */

    function renderInspector() {

      const data =
        regionData[
          regionSelect.value
        ];


      const crew =
        data.crews.find(
          item =>
            item.name === selectedCrew
        )
        ||
        data.crews[0] || {name:"No crews",assignment:"—",area:"—",eta:"—"};


      if (!crew) {
 for (const el of document.querySelectorAll('[id^="detail"]')) if (!el.children.length) el.textContent = '—';
 for (const id of ['evidenceList','checklist','skillList','memberList','eventTimeline','reasonBox','rootCause','assignmentTitle','assignmentDescription']) { const el=document.getElementById(id); if(el) el.textContent='No matching records'; }
 return;
 }


      selectedCrew =
        crew.name;


      document.getElementById(
        "detailCrew"
      ).textContent =
        crew.name;


      document.getElementById(
        "detailLocation"
      ).textContent =
        `${crew.area} · ${regionSelect.value}`;


      document.getElementById(
        "detailState"
      ).textContent =
        crew.state;


      document.getElementById(
        "assignmentTitle"
      ).textContent =
        crew.assignment === "Standby"
          ? "Regional Standby"
          : `Assigned to ${crew.assignment}`;


      document.getElementById(
        "assignmentDescription"
      ).textContent =
        crew.description;


      document.getElementById(
        "detailEta"
      ).textContent =
        crew.eta;


      document.getElementById(
        "detailSize"
      ).textContent =
        crew.size;


      document.getElementById(
        "detailLoad"
      ).textContent =
        crew.load;


      document.getElementById(
        "detailPriority"
      ).textContent =
        crew.priority;


      const badge =
        document.getElementById(
          "detailState"
        );


      if (
        crew.state === "Ready"
      ) {

        badge.style.color =
          "#326455";

        badge.style.background =
          "#dcece6";

      } else if (
        crew.state === "Assigned"
      ) {

        badge.style.color =
          "#496b79";

        badge.style.background =
          "#dde8ed";

      } else {

        badge.style.color =
          "#826021";

        badge.style.background =
          "#f2e8d4";

      }


      document.getElementById(
        "skillList"
      ).innerHTML =
        crew.skills
          .map(
            skill => `
              <span class="skill">
                ${skill}
              </span>
            `
          )
          .join("");


      document.getElementById(
        "memberList"
      ).innerHTML =
        crew.members
          .map(
            member => `

              <div class="member">

                <div class="member-avatar">
                  ${member[0]}
                </div>

                <div>

                  <strong>
                    ${member[1]}
                  </strong>

                  <span>
                    ${member[2]}
                  </span>

                </div>

                <div class="member-status">
                  Active
                </div>

              </div>

            `
          )
          .join("");

    }


    /* ================= COVERAGE ================= */

    function renderCoverage(
      zones
    ) {

      document.getElementById(
        "coverageGrid"
      ).innerHTML =
        zones.map(
          zone => {

            let state = "";

            if (
              zone[1] === "Critical"
            ) {
              state = "critical";
            } else if (
              zone[1] === "Elevated"
            ) {
              state = "warning";
            }


            return `

              <div class="zone-card ${state}">

                <div class="zone-top">

                  <strong>
                    ${zone[0]}
                  </strong>

                  <span class="zone-score">
                    ${zone[2]}
                  </span>

                </div>

                <p>
                  ${zone[1]} equipment-risk zone with active crew coverage.
                </p>

                <div class="zone-footer">

                  <span>
                    ${zone[3]}
                  </span>

                  <strong>
                    ${zone[4]}
                  </strong>

                </div>

              </div>

            `;

          }
        ).join("");

    }


    /* ================= DISPATCH QUEUE ================= */

    function renderQueue(
      queue
    ) {

      document.getElementById(
        "dispatchQueue"
      ).innerHTML =
        queue.map(
          item => `

            <div class="dispatch-row">

              <div class="dispatch-icon">
                ${item[0]}
              </div>

              <div class="dispatch-copy">

                <strong>
                  ${item[1]}
                </strong>

                <span>
                  ${item[2]}
                </span>

              </div>

              <div class="dispatch-time">
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


      selectedCrew =
        (data.crews[0]?.name || "");


      stateFilter.value =
        "All";


      document.getElementById(
        "pageSubtitle"
      ).textContent =
        `Crew readiness, deployment coverage and maintenance assignments across ${region}.`;


      document.getElementById(
        "weatherChip"
      ).textContent =
        data.weather;


      document.getElementById(
        "crewCountTop"
      ).textContent =
        data.crews.length;


      const emergency =
        data.crews.find(
          crew =>
            crew.priority === "Critical"
        )
        ||
        data.crews[0] || {name:"No crews",assignment:"—",area:"—",eta:"—"};


      document.getElementById(
        "emergencyCrew"
      ).textContent =
        emergency.name;


      document.getElementById(
        "emergencyNote"
      ).textContent =
        `${emergency.assignment} · ${emergency.area} · ETA ${emergency.eta}`;


      document.getElementById(
        "availableCrews"
      ).textContent =
        data.stats.available;


      document.getElementById(
        "activeDeployments"
      ).textContent =
        data.stats.deployed;


      document.getElementById(
        "avgEta"
      ).textContent =
        data.stats.eta;


      document.getElementById(
        "techAvailable"
      ).textContent =
        data.stats.technicians;


      document.getElementById(
        "capacityCrews"
      ).textContent =
        data.stats.capacity;


      document.getElementById(
        "coverageScore"
      ).textContent =
        data.stats.coverage;


      document.getElementById(
        "dispatchTime"
      ).textContent =
        data.stats.dispatch;


      document.getElementById(
        "tasksClosed"
      ).textContent =
        data.stats.closed;


      document.getElementById(
        "slaScore"
      ).textContent =
        data.stats.sla;


      document.getElementById(
        "coverageSubtitle"
      ).textContent =
        `Crew availability versus asset-risk concentration in ${region}`;


      document.getElementById(
        "riskBadge"
      ).textContent =
        data.coverage.filter(
          zone =>
            zone[1] === "Critical"
        ).length;


      renderCrewList();
      renderCoverage(data.coverage);
      renderQueue(data.queue);


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


    stateFilter.addEventListener(
      "change",
      () => {

        renderCrewList();

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
    const previousRegion = regionSelect.value; const previousSelection = selectedCrew;
    const filters = [...document.querySelectorAll('#riskFilter,#typeFilter,#statusFilter,#stateFilter')].map(el=>[el,el.value]);
    regionData[region] = view;
    regionSelect.value = region;
    updateRegion(region);
    if(previousRegion === region) selectedCrew = previousSelection;
    for (const [el,value] of filters) {el.value=value;el.dispatchEvent(new Event('change'));}
  }};

}
