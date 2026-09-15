import { renderProfile } from '../auth.js';
export function mount(regionData,user){




    const sidebar =
      document.getElementById("sidebar");

    const mobileMenu =
      document.getElementById("mobileMenu");

    const mobileOverlay =
      document.getElementById("mobileOverlay");

    const collapseBtn =
      document.getElementById("collapseBtn");

    const profileBtn =
      document.getElementById("profileBtn");

    const profileMenu =
      document.getElementById("profileMenu");

    const logoutBtn =
      document.getElementById("logoutBtn");

    const regionSelect =
      document.getElementById("regionSelect");

    const searchInput =
      document.getElementById("searchInput");

    const typeFilter =
      document.getElementById("typeFilter");

    const riskFilter =
      document.getElementById("riskFilter");

    const tableBody =
      document.getElementById("assetTableBody");

    const resultCount =
      document.getElementById("resultCount");

    const emptyState =
      document.getElementById("emptyState");

    const tableWrap =
      document.getElementById("tableWrap");

    const drawer =
      document.getElementById("assetDrawer");

    const drawerOverlay =
      document.getElementById("drawerOverlay");

    const drawerClose =
      document.getElementById("drawerClose");


    let currentRegion =
      "Ahmedabad East";


    /* =========================================================
       SIDEBAR
    ========================================================= */

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

        mobileOverlay.classList.add(
          "open"
        );

      }
    );


    mobileOverlay.addEventListener(
      "click",
      () => {

        sidebar.classList.remove(
          "mobile-open"
        );

        mobileOverlay.classList.remove(
          "open"
        );

      }
    );


    /* =========================================================
       PROFILE
    ========================================================= */

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


    logoutBtn.addEventListener(
      "click",
      () => {

        

        

        window.location.href =
          "login.html";

      }
    );


    /* =========================================================
       USER
    ========================================================= */

    function loadUser() { renderProfile(user); }


    /* =========================================================
       REGION
    ========================================================= */

    function updateRegion(
      region
    ) {

      currentRegion =
        region;


      const data =
        regionData[region];


      document.getElementById(
        "pageSubtitle"
      ).textContent =
        `Monitor equipment health, risk and maintenance condition across ${region}.`;


      document.getElementById(
        "streamCount"
      ).textContent =
        data.total;


      document.getElementById(
        "weatherLabel"
      ).textContent =
        data.weather;


      document.getElementById(
        "totalAssets"
      ).textContent =
        data.total;


      document.getElementById(
        "criticalCount"
      ).textContent =
        data.critical;


      document.getElementById(
        "avgHealth"
      ).textContent =
        data.health;


      document.getElementById(
        "telemetryOnline"
      ).textContent =
        data.telemetry;


      localStorage.setItem(
        "gridguard-region",
        region
      );


      filterAssets();

    }


    regionSelect.addEventListener(
      "change",
      event => {

        updateRegion(
          event.target.value
        );

      }
    );


    /* =========================================================
       FILTER
    ========================================================= */

    function riskClass(
      risk
    ) {

      if (risk === "Critical") {
        return "critical";
      }

      if (risk === "Elevated") {
        return "elevated";
      }

      return "stable";
    }


    function typeShort(
      type
    ) {

      if (type === "Transformer") {
        return "TR";
      }

      if (type === "Substation") {
        return "SS";
      }

      return "CB";
    }


    function filterAssets() {

      const data =
        regionData[currentRegion];


      const query =
        searchInput.value
          .trim()
          .toLowerCase();


      const type =
        typeFilter.value;


      const risk =
        riskFilter.value;


      const filtered =
        data.assets.filter(
          asset => {

            const matchesSearch =
              !query
              ||
              asset.id
                .toLowerCase()
                .includes(query)
              ||
              asset.location
                .toLowerCase()
                .includes(query)
              ||
              asset.type
                .toLowerCase()
                .includes(query);


            const matchesType =
              type === "All"
              ||
              asset.type === type;


            const matchesRisk =
              risk === "All"
              ||
              asset.risk === risk;


            return (
              matchesSearch
              &&
              matchesType
              &&
              matchesRisk
            );

          }
        );


      renderTable(
        filtered
      );

    }


    searchInput.addEventListener(
      "input",
      filterAssets
    );


    typeFilter.addEventListener(
      "change",
      filterAssets
    );


    riskFilter.addEventListener(
      "change",
      filterAssets
    );


    /* =========================================================
       TABLE
    ========================================================= */

    function renderTable(
      assets
    ) {

      resultCount.textContent =
        `${assets.length} asset${assets.length === 1 ? "" : "s"} shown`;


      if (
        assets.length === 0
      ) {

        tableWrap.style.display =
          "none";

        emptyState.style.display =
          "block";

        return;
      }


      tableWrap.style.display =
        "block";

      emptyState.style.display =
        "none";


      tableBody.innerHTML =
        assets
          .map(
            asset => `
              <tr
                data-id="${asset.id}"
              >

                <td>

                  <div class="asset-cell">

                    <div class="asset-icon">
                      ${typeShort(asset.type)}
                    </div>

                    <div class="asset-name">

                      <strong>
                        ${asset.id}
                      </strong>

                      <span>
                        ${asset.location} · ${currentRegion}
                      </span>

                    </div>

                  </div>

                </td>


                <td>
                  <span class="type-pill">
                    ${asset.type}
                  </span>
                </td>


                <td>
                  <span class="risk ${riskClass(asset.risk)}">
                    ${asset.risk}
                  </span>
                </td>


                <td class="health-value">
                  ${asset.health}%
                </td>


                <td class="health-value">
                  ${asset.probability}%
                </td>


                <td>
                  ${asset.signal}
                </td>


                <td class="maintenance">
                  ${asset.maintenance}
                </td>


                <td>

                  <div class="signal">

                    <span class="signal-dot"></span>

                    ${asset.telemetry}

                  </div>

                </td>


                <td class="view-arrow">
                  →
                </td>

              </tr>
            `
          )
          .join("");


      document
        .querySelectorAll(
          "#assetTableBody tr"
        )
        .forEach(
          row => {

            row.addEventListener(
              "click",
              () => {

                openAsset(
                  row.dataset.id
                );

              }
            );

          }
        );

    }


    /* =========================================================
       DRAWER
    ========================================================= */

    function openAsset(
      id
    ) {

      const asset =
        regionData[currentRegion]
          .assets
          .find(
            item =>
              item.id === id
          );


      if (!asset) {
        return;
      }


      document.getElementById(
        "drawerAssetId"
      ).textContent =
        asset.id;


      document.getElementById(
        "drawerType"
      ).textContent =
        asset.type;


      document.getElementById(
        "drawerLocation"
      ).textContent =
        asset.location;


      document.getElementById(
        "drawerRegion"
      ).textContent =
        currentRegion;


      document.getElementById(
        "drawerScore"
      ).textContent =
        asset.score;


      document.getElementById(
        "drawerRisk"
      ).textContent =
        asset.risk;


      document.getElementById(
        "drawerHealth"
      ).textContent =
        `${asset.health}%`;


      document.getElementById(
        "drawerProbability"
      ).textContent =
        `${asset.probability}%`;


      document.getElementById(
        "drawerMaintenance"
      ).textContent =
        asset.maintenance;


      document.getElementById(
        "drawerTelemetry"
      ).textContent =
        asset.telemetry;


      document.getElementById(
        "drawerSignal"
      ).textContent =
        asset.signal;


      document.getElementById(
        "drawerRecommendation"
      ).textContent =
        asset.recommendation;


      document.getElementById(
        "sensorList"
      ).innerHTML =
        asset.sensors
          .map(
            sensor => `
              <div class="sensor-row">

                <div>

                  <div class="sensor-label">

                    <span>
                      ${sensor[0]}
                    </span>

                  </div>

                  <div class="sensor-bar">

                    <div
                      class="sensor-fill"
                      style="width:${sensor[1]}%"
                    ></div>

                  </div>

                </div>

                <div class="sensor-value">
                  ${sensor[2]}
                </div>

              </div>
            `
          )
          .join("");


      drawer.classList.add(
        "open"
      );

      drawerOverlay.classList.add(
        "open"
      );

      document.body.style.overflow =
        "hidden";

    }


    function closeDrawer() {

      drawer.classList.remove(
        "open"
      );

      drawerOverlay.classList.remove(
        "open"
      );

      document.body.style.overflow =
        "";

    }


    drawerClose.addEventListener(
      "click",
      closeDrawer
    );


    drawerOverlay.addEventListener(
      "click",
      closeDrawer
    );


    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape"
        ) {

          closeDrawer();

        }

      }
    );


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    const storedRegion =
      localStorage.getItem(
        "gridguard-region"
      );


    if (
      storedRegion
      &&
      regionData[storedRegion]
    ) {

      currentRegion =
        storedRegion;

      regionSelect.value =
        storedRegion;

    }


    loadUser();

    updateRegion(
      currentRegion
    );


    window.addEventListener(
      "resize",
      () => {

        if (
          window.innerWidth > 720
        ) {

          sidebar.classList.remove(
            "mobile-open"
          );

          mobileOverlay.classList.remove(
            "open"
          );

        }

      }
    );

  
return { refresh(region, view) {
    const filters = [...document.querySelectorAll('#riskFilter,#typeFilter,#statusFilter,#stateFilter')].map(el=>[el,el.value]);
    regionData[region] = view;
    regionSelect.value = region;
    updateRegion(region);
    for (const [el,value] of filters) {el.value=value;el.dispatchEvent(new Event('change'));}
  }};

}
