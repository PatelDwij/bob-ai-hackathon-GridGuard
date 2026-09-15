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

    const riskFilter =
      document.getElementById("riskFilter");

    const typeFilter =
      document.getElementById("typeFilter");

    let selectedId = null;


    /* ================= SIDEBAR ================= */

    collapseBtn.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "collapsed"
        );

      }
    );


    mobileMenu.addEventListener(
      "click",
      () => {

        sidebar.classList.add(
          "mobile-open"
        );

        overlay.classList.add(
          "open"
        );

      }
    );


    overlay.addEventListener(
      "click",
      closeSidebar
    );


    function closeSidebar() {

      sidebar.classList.remove(
        "mobile-open"
      );

      overlay.classList.remove(
        "open"
      );

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

        profileMenu.classList.toggle(
          "open"
        );

      }
    );


    document.addEventListener(
      "click",
      () => {

        profileMenu.classList.remove(
          "open"
        );

      }
    );


    document.getElementById(
      "logoutBtn"
    )
    .addEventListener(
      "click",
      () => {

        

        

        window.location.href =
          "login.html";

      }
    );


    function loadUser() { renderProfile(user); }


    /* ================= HELPERS ================= */

    function filteredPredictions() {

      const data =
        regionData[
          regionSelect.value
        ];


      return data.predictions.filter(
        item => {

          const riskMatch =
            riskFilter.value === "All"
            ||
            item.risk ===
            riskFilter.value;


          const typeMatch =
            typeFilter.value === "All"
            ||
            item.type ===
            typeFilter.value;


          return (
            riskMatch
            &&
            typeMatch
          );

        }
      );

    }


    function riskClass(
      risk
    ) {

      return risk.toLowerCase();

    }


    function assetShort(
      type
    ) {

      if (
        type === "Transformer"
      ) {
        return "TR";
      }

      if (
        type === "Substation"
      ) {
        return "SS";
      }

      return "CB";

    }


    /* ================= LIST ================= */

    function renderPredictionList() {

      const items =
        filteredPredictions();


      const list =
        document.getElementById(
          "predictionList"
        );


      if (
        items.length === 0
      ) {

        list.innerHTML = `
          <div style="
            padding:30px;
            text-align:center;
            color:#748487;
            font-size:8px;
          ">
            No predictions match these filters.
          </div>
        `;

        clearInspector();
        return;

      }


      if (
        !items.some(
          item =>
            item.id === selectedId
        )
      ) {

        selectedId =
          items[0].id;

      }


      list.innerHTML =
        items
          .map(
            item => `

              <button
                class="
                  prediction-row
                  ${
                    item.id === selectedId
                      ? "active"
                      : ""
                  }
                "
                data-id="${item.id}"
              >

                <div class="asset-code">
                  ${assetShort(item.type)}
                </div>


                <div class="prediction-main">

                  <strong>
                    ${item.id} · ${item.area}
                  </strong>

                  <span>
                    ${item.type}
                    ·
                    ${item.risk}
                    ·
                    Score ${item.score}
                  </span>

                  <small>
                    ${item.headline}
                  </small>

                  <div class="risk-bar">

                    <div
                      class="
                        risk-fill
                        ${riskClass(item.risk)}
                      "
                      style="
                        width:${item.probability}%
                      "
                    ></div>

                  </div>

                </div>


                <div class="prob-box">

                  <strong>
                    ${item.probability}%
                  </strong>

                  <span>
                    failure risk
                  </span>

                </div>


                <div class="window-badge">
                  ${item.window}
                </div>

              </button>

            `
          )
          .join("");


      document
        .querySelectorAll(
          ".prediction-row"
        )
        .forEach(
          row => {

            row.addEventListener(
              "click",
              () => {

                selectedId =
                  row.dataset.id;

                renderPredictionList();

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


      const item =
        data.predictions.find(
          p =>
            p.id === selectedId
        )
        ||
        data.predictions[0];


      if (!item) {
 for (const el of document.querySelectorAll('[id^="detail"]')) if (!el.children.length) el.textContent = '—';
 for (const id of ['evidenceList','checklist','skillList','memberList','eventTimeline','reasonBox','rootCause','assignmentTitle','assignmentDescription']) { const el=document.getElementById(id); if(el) el.textContent='No matching records'; }
 return;
 }


      selectedId =
        item.id;


      document.getElementById(
        "detailId"
      ).textContent =
        item.id;


      document.getElementById(
        "detailLocation"
      ).textContent =
        `${item.area} · ${item.type}`;


      document.getElementById(
        "detailScore"
      ).textContent =
        item.score;


      document.getElementById(
        "detailHeadline"
      ).textContent =
        item.headline;


      document.getElementById(
        "detailExplanation"
      ).textContent =
        item.explanation;


      document.getElementById(
        "detailProbability"
      ).textContent =
        `${item.probability}%`;


      document.getElementById(
        "detailWindow"
      ).textContent =
        item.window;


      document.getElementById(
        "detailConfidence"
      ).textContent =
        `${item.confidence}%`;


      document.getElementById(
        "detailImpact"
      ).textContent =
        item.impact;


      document.getElementById(
        "detailAction"
      ).textContent =
        item.action;


      const ring =
        document.getElementById(
          "scoreRing"
        );


      let color =
        "#00765d";


      if (
        item.risk === "Critical"
      ) {

        color =
          "#a64f4f";

      } else if (
        item.risk === "Elevated"
      ) {

        color =
          "#b77b1f";

      }


      ring.style.background =
        `conic-gradient(
          ${color} 0 ${item.score}%,
          #dfe6e3 ${item.score}% 100%
        )`;


      document.getElementById(
        "evidenceList"
      ).innerHTML =
        item.evidence
          .map(
            evidence => `

              <div class="evidence-item">

                <div class="evidence-icon">
                  •
                </div>

                <div class="evidence-copy">

                  <strong>
                    ${evidence[0]}
                  </strong>

                  <span>
                    ${evidence[2]}
                  </span>

                </div>

                <div class="evidence-value">
                  ${evidence[1]}
                </div>

              </div>

            `
          )
          .join("");

    }


    /* ================= TIMELINE ================= */

    function renderTimeline(
      timeline
    ) {

      document.getElementById(
        "timeline"
      ).innerHTML =
        timeline
          .map(
            item => {

              let state = "";

              if (
                item[2] === "Critical"
              ) {
                state = "danger";
              }

              if (
                item[2] === "Elevated"
              ) {
                state = "warn";
              }


              return `

                <div class="timeline-step ${state}">

                  <span>
                    ${item[0]}
                  </span>

                  <div class="timeline-node"></div>

                  <strong>
                    ${item[1]} assets
                  </strong>

                  <small>
                    ${item[2]} risk
                  </small>

                </div>

              `;

            }
          )
          .join("");

    }


    /* ================= DRIVERS ================= */

    function renderDrivers(
      drivers
    ) {

      document.getElementById(
        "driverList"
      ).innerHTML =
        drivers
          .map(
            item => `

              <div class="feature-row">

                <div>

                  <strong>
                    ${item[0]}
                  </strong>

                  <span>
                    ${item[2]}
                  </span>

                </div>

                <div class="feature-weight">
                  ${item[1]}
                </div>

              </div>

            `
          )
          .join("");

    }


    /* ================= REGION ================= */

    function updateRegion(
      region
    ) {

      const data =
        regionData[region];


      if (!data) {
        return;
      }


      selectedId =
        (data.predictions[0]?.id || "");


      document.getElementById(
        "pageSubtitle"
      ).textContent =
        `AI-ranked equipment failure probabilities for ${region} using sensor anomalies, weather exposure and historical incidents.`;


      document.getElementById(
        "streamCount"
      ).textContent =
        data.monitored;


      document.getElementById(
        "assetCount"
      ).textContent =
        data.monitored;


      document.getElementById(
        "highRiskCount"
      ).textContent =
        data.highRisk;


      document.getElementById(
        "avgConfidence"
      ).textContent =
        data.confidence;


      document.getElementById(
        "weatherChip"
      ).textContent =
        data.weather;


      document.getElementById(
        "sensorCoverage"
      ).textContent =
        data.coverage;


      document.getElementById(
        "riskBadge"
      ).textContent =
        String(
          data.predictions.filter(
            item =>
              item.risk === "Critical"
          ).length
        );


      const top =
        data.predictions[0] || {id:"No predictions",probability:0,area:"—",risk:"—",window:"—"};


      document.getElementById(
        "topAsset"
      ).textContent =
        `${top.id} · ${top.probability}%`;


      document.getElementById(
        "topAssetNote"
      ).textContent =
        `${top.area} · ${top.risk} within next ${top.window}`;


      document.getElementById(
        "outlookSubtitle"
      ).textContent =
        `Expected progression for ${region}`;


      riskFilter.value =
        "All";


      typeFilter.value =
        "All";


      renderPredictionList();

      renderTimeline(
        data.timeline
      );

      renderDrivers(
        data.drivers
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


    riskFilter.addEventListener(
      "change",
      renderPredictionList
    );


    typeFilter.addEventListener(
      "change",
      renderPredictionList
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
    const previousRegion = regionSelect.value; const previousSelection = selectedId;
    const filters = [...document.querySelectorAll('#riskFilter,#typeFilter,#statusFilter,#stateFilter')].map(el=>[el,el.value]);
    regionData[region] = view;
    regionSelect.value = region;
    updateRegion(region);
    if(previousRegion === region) selectedId = previousSelection;
    for (const [el,value] of filters) {el.value=value;el.dispatchEvent(new Event('change'));}
  }};

}
