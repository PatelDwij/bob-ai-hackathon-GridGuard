import { renderProfile, normalizeRole } from '../auth.js';
import { updateAsset } from '../firestore.js';
import { mapLocationPicker } from '../map-picker.js';
export function mount(regionData,user){


    /* =====================================================
       REGION DATA
    ===================================================== */




    /* =====================================================
       ELEMENTS
    ===================================================== */

    const sidebar =
      document.getElementById("sidebar");

    const overlay =
      document.getElementById("overlay");

    const collapseBtn =
      document.getElementById("collapseBtn");

    const mobileMenu =
      document.getElementById("mobileMenu");

    const profileBtn =
      document.getElementById("profileBtn");

    const profileMenu =
      document.getElementById("profileMenu");

    const logoutBtn =
      document.getElementById("logoutBtn");

    const regionSelect =
      document.getElementById("regionSelect");


    /* =====================================================
       CURRENT REGION
    ===================================================== */

    const savedRegion =
      localStorage.getItem(
        "gridguard-region"
      );

    let picker = null;

    let selectedAssetId = null;


    if (
      savedRegion &&
      regionData[savedRegion]
    ) {
      regionSelect.value =
        savedRegion;
    }


    /* =====================================================
       MAP
    ===================================================== */

    const initialRegion =
      regionData[
        regionSelect.value
      ];


    // Keep the inset map sized in WebKit before Leaflet inspects its layout.
    document.getElementById('dashboardMap').style.position = 'absolute';

    const dashboardMap =
      L.map(
        "dashboardMap",
        {
          zoomControl: false,
          attributionControl: true,
          preferCanvas: true,
          scrollWheelZoom: false
        }
      )
      .setView(
        initialRegion.map.center,
        initialRegion.map.zoom
      );

    dashboardMap.scrollWheelZoom.disable();
    window.gridMap = dashboardMap;
    dashboardMap.on('blur', () => { dashboardMap.scrollWheelZoom.disable(); });
    dashboardMap.getContainer().addEventListener('mouseleave', () => { dashboardMap.scrollWheelZoom.disable(); });

    picker = mapLocationPicker({
      map: dashboardMap,
      canEdit: () => normalizeRole(user?.role) === 'admin',
      getAsset: () => selectedAssetId ? { assetId: selectedAssetId, region: regionSelect.value } : null,
      onSave: async (assetId, coords) => {
        await updateAsset(assetId, coords);
      }
    });

    L.control
      .zoom({
        position:
          "bottomright"
      })
      .addTo(
        dashboardMap
      );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,

        attribution:
          "&copy; OpenStreetMap contributors"
      }
    )
    .addTo(
      dashboardMap
    );


    const assetLayer =
      L.layerGroup()
      .addTo(
        dashboardMap
      );


    const weatherLayer =
      L.layerGroup()
      .addTo(
        dashboardMap
      );


    function markerClass(
      risk
    ) {

      return risk
        .toLowerCase();

    }


    function markerText(
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


    function createMarkerIcon(
      asset
    ) {

      return L.divIcon({

        className:
          "grid-marker-wrapper",

        html: `
          <div class="grid-marker ${markerClass(asset.risk)}">
            ${markerText(asset.type)}
          </div>
        `,

        iconSize:
          [30,30],

        iconAnchor:
          [15,15],

        popupAnchor:
          [0,-16]

      });

    }


    function createPopup(
      asset
    ) {

      return `
        <div class="map-popup">

          <strong>
            ${asset.id}
          </strong>

          <small>
            ${asset.location} · ${asset.type}
          </small>

          <div class="popup-line">
            <span>Risk</span>
            <b>${asset.risk}</b>
          </div>

          <div class="popup-line">
            <span>Score</span>
            <b>${asset.score}</b>
          </div>

          <div class="popup-line">
            <span>Failure</span>
            <b>${asset.probability}</b>
          </div>

        </div>
      `;

    }


    function renderMap(
      region
    ) {

      const data =
        regionData[region];

      picker?.cancel();

      assetLayer.clearLayers();

      weatherLayer.clearLayers();


      data.assets.forEach(
        asset => {

          const marker =
            L.marker(
              [
                asset.lat,
                asset.lng
              ],
              {
                icon:
                  createMarkerIcon(asset),

                riseOnHover:
                  true
              }
            )
            .addTo(
              assetLayer
            );


          marker.bindPopup(
            createPopup(asset)
          );


          marker.on(
            "click",
            () => {

              showAssetOnFocus(
                asset,
                region
              );

            }
          );

        }
      );


      L.circle(
        data.map.weatherCenter,
        {
          radius:
            data.map.weatherRadius,

          color:
            "#b77b1f",

          weight:
            1.4,

          opacity:
            .55,

          fillColor:
            "#d7a655",

          fillOpacity:
            .12,

          interactive:
            false
        }
      )
      .addTo(
        weatherLayer
      );


      dashboardMap.flyTo(
        data.map.center,
        data.map.zoom,
        {
          duration:
            .9
        }
      );


      document.getElementById(
        "mapRegion"
      ).textContent =
        region;

    }


    document.getElementById(
      "mapReset"
    )
    .addEventListener(
      "click",
      () => {

        const region =
          regionSelect.value;

        const data =
          regionData[region];


        dashboardMap.flyTo(
          data.map.center,
          data.map.zoom,
          {
            duration:
              .7
          }
        );


        showMainFocus(
          region
        );

      }
    );


    /* =====================================================
       MAP FOCUS
    ===================================================== */

    function updateScoreStyle(
      risk
    ) {

      const score =
        document.getElementById(
          "focusScore"
        );


      score.className =
        "risk-score";


      if (
        risk === "Elevated"
      ) {

        score.classList.add(
          "medium"
        );

      }


      if (
        risk === "Stable"
      ) {

        score.classList.add(
          "low"
        );

      }

    }


    function showAssetOnFocus(
      asset,
      region
    ) {

      document.getElementById(
        "focusLabel"
      ).textContent =
        "Selected map asset";

      selectedAssetId = asset.id;


      document.getElementById(
        "focusAsset"
      ).textContent =
        asset.id;


      document.getElementById(
        "focusLocation"
      ).textContent =
        `${asset.location} · ${region}`;


      document.getElementById(
        "focusScore"
      ).textContent =
        asset.score;


      document.getElementById(
        "focusProbability"
      ).textContent =
        asset.probability;


      document.getElementById(
        "focusImpact"
      ).textContent =
        asset.impact;


      document.getElementById(
        "focusWeather"
      ).textContent =
        asset.weather;


      document.getElementById(
        "focusSignal"
      ).textContent =
        asset.signal;


      document.getElementById(
        "focusAction"
      ).textContent =
        asset.action;


      updateScoreStyle(
        asset.risk
      );

    }


    function showMainFocus(
      region
    ) {

      const data =
        regionData[region];


      document.getElementById(
        "focusLabel"
      ).textContent =
        "Highest risk asset";

      selectedAssetId = data.focus.id;


      document.getElementById(
        "focusAsset"
      ).textContent =
        data.focus.id;


      document.getElementById(
        "focusLocation"
      ).textContent =
        `${data.focus.area} · ${region}`;


      document.getElementById(
        "focusScore"
      ).textContent =
        data.focus.score;


      document.getElementById(
        "focusProbability"
      ).textContent =
        data.focus.probability;


      document.getElementById(
        "focusImpact"
      ).textContent =
        data.focus.impact;


      document.getElementById(
        "focusWeather"
      ).textContent =
        data.focus.weather;


      document.getElementById(
        "focusSignal"
      ).textContent =
        data.focus.signal;


      document.getElementById(
        "focusAction"
      ).textContent =
        data.focus.action;


      document.getElementById(
        "focusScore"
      ).className =
        "risk-score";

    }


    /* =====================================================
       SIDEBAR
    ===================================================== */

    collapseBtn.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "collapsed"
        );


        setTimeout(
          () => {

            dashboardMap.invalidateSize();

          },
          280
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
      () => {

        sidebar.classList.remove(
          "mobile-open"
        );

        overlay.classList.remove(
          "open"
        );

      }
    );


    /* =====================================================
       PROFILE
    ===================================================== */

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


    /* =====================================================
       USER
    ===================================================== */

    function loadOperator() { renderProfile(user); }


    /* =====================================================
       TABLE
    ===================================================== */

    function riskClass(
      risk
    ) {

      if (
        risk === "Critical"
      ) {
        return "high";
      }

      if (
        risk === "Elevated"
      ) {
        return "medium";
      }

      return "low";

    }


    function renderAssets(
      assets,
      region
    ) {

      const tbody =
        document.getElementById(
          "assetTableBody"
        );


      tbody.innerHTML =
        assets
          .slice(0,5)
          .map(
            asset => `

              <tr>

                <td>

                  <div class="asset-id">
                    ${asset.id}
                  </div>

                  <div class="asset-loc">
                    ${asset.location} · ${region}
                  </div>

                </td>


                <td>

                  <span class="risk-pill ${riskClass(asset.risk)}">
                    ${asset.risk}
                  </span>

                </td>


                <td class="probability">
                  ${asset.probability}
                </td>


                <td>
                  ${asset.impact}
                </td>


                <td>
                  ${asset.signal}
                </td>


                <td class="action-text">
                  ${asset.action}
                </td>

              </tr>

            `
          )
          .join("");

    }


    /* =====================================================
       CREWS
    ===================================================== */

    function renderCrews(
      crews
    ) {

      document.getElementById(
        "crewList"
      ).innerHTML =
        crews
          .map(
            crew => `

              <div class="crew-row">

                <div class="crew-dot">
                  ${crew[0]}
                </div>

                <div class="crew-info">

                  <strong>
                    ${crew[1]}
                  </strong>

                  <span>
                    ${crew[2]}
                  </span>

                </div>

                <span class="crew-state ${
                  crew[3] === "Ready"
                    ? "ready"
                    : "deployed"
                }">
                  ${crew[3]}
                </span>

              </div>

            `
          )
          .join("");

    }


    /* =====================================================
       INCIDENTS
    ===================================================== */

    function renderIncidents(
      incidents
    ) {

      document.getElementById(
        "incidentList"
      ).innerHTML =
        incidents
          .map(
            incident => `

              <div class="incident">

                <div
                  class="incident-marker"
                  style="
                    background:${incident[0]}
                  "
                ></div>

                <div>

                  <strong>
                    ${incident[1]}
                  </strong>

                  <p>
                    ${incident[2]}
                  </p>

                </div>

              </div>

            `
          )
          .join("");

    }


    /* =====================================================
       UPDATE REGION
    ===================================================== */

    function updateRegion(
      region
    ) {

      const data =
        regionData[region];


      if (!data) {
        return;
      }


      document.getElementById(
        "pageSubtitle"
      ).textContent =
        `Equipment health, weather exposure and predicted outage risk across ${region}.`;


      document.getElementById(
        "streamingCount"
      ).textContent =
        data.monitored;


      document.getElementById(
        "gridHealth"
      ).textContent =
        data.gridHealth;


      document.getElementById(
        "criticalAssets"
      ).textContent =
        data.critical;


      document.getElementById(
        "riskBadge"
      ).textContent =
        parseInt(data.critical,10);


      document.getElementById(
        "assetsMonitored"
      ).textContent =
        data.monitored;


      document.getElementById(
        "highRiskPredictions"
      ).textContent =
        data.highRisk;


      document.getElementById(
        "topWeather"
      ).textContent =
        data.weather.short;


      document.getElementById(
        "weatherLocation"
      ).textContent =
        region;


      document.getElementById(
        "weatherTemp"
      ).textContent =
        data.weather.temp;


      document.getElementById(
        "weatherStatus"
      ).textContent =
        data.weather.status;


      document.getElementById(
        "rainfall"
      ).textContent =
        data.weather.rainfall;


      document.getElementById(
        "wind"
      ).textContent =
        data.weather.wind;


      document.getElementById(
        "humidity"
      ).textContent =
        data.weather.humidity;


      document.getElementById(
        "weatherAlert"
      ).textContent =
        data.weather.alert;


      document.getElementById(
        "aiTitle"
      ).textContent =
        data.ai.title;


      document.getElementById(
        "aiDescription"
      ).textContent =
        data.ai.description;


      document.getElementById(
        "aiAction1"
      ).textContent =
        data.ai.actions[0];


      document.getElementById(
        "aiAction2"
      ).textContent =
        data.ai.actions[1];


      document.getElementById(
        "aiAction3"
      ).textContent =
        data.ai.actions[2];


      document.getElementById(
        "crewRegion"
      ).textContent =
        `${region} field operations`;


      document.getElementById(
        "summaryRegion"
      ).textContent =
        region;


      document.getElementById(
        "summaryAsset"
      ).textContent =
        data.focus.id;


      document.getElementById(
        "summaryWeather"
      ).textContent =
        data.focus.weather;


      showMainFocus(
        region
      );


      renderAssets(
        data.assets,
        region
      );


      renderCrews(
        data.crews
      );


      renderIncidents(
        data.incidents
      );


      renderMap(
        region
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


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    loadOperator();


    updateRegion(
      regionSelect.value
    );


    setTimeout(
      () => {

        dashboardMap.invalidateSize();

      },
      300
    );


    /* =====================================================
       RESPONSIVE
    ===================================================== */

    window.addEventListener(
      "resize",
      () => {

        if (
          window.innerWidth > 720
        ) {

          sidebar.classList.remove(
            "mobile-open"
          );

          overlay.classList.remove(
            "open"
          );

        }


        dashboardMap.invalidateSize();

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
