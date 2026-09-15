import { renderProfile, normalizeRole } from '../auth.js';
import { updateAsset } from '../firestore.js';
import { mapLocationPicker } from '../map-picker.js';
export function mount(regionData,user){


    /* =========================================================
       REGION DATA
    ========================================================= */




    /* =========================================================
       DOM
    ========================================================= */

    const sidebar =
      document.getElementById(
        "sidebar"
      );

    const collapseBtn =
      document.getElementById(
        "collapseBtn"
      );

    const mobileMenu =
      document.getElementById(
        "mobileMenu"
      );

    const mobileOverlay =
      document.getElementById(
        "mobileOverlay"
      );

    const regionSelect =
      document.getElementById(
        "regionSelect"
      );

    const riskFilter =
      document.getElementById(
        "riskFilter"
      );

    const typeFilter =
      document.getElementById(
        "typeFilter"
      );

    const assetLayerBtn =
      document.getElementById(
        "assetLayerBtn"
      );

    const weatherLayerBtn =
      document.getElementById(
        "weatherLayerBtn"
      );

    const assetList =
      document.getElementById(
        "assetList"
      );

    const assetDetail =
      document.getElementById(
        "assetDetail"
      );

    const selectedEmpty =
      document.getElementById(
        "selectedEmpty"
      );


    /* =========================================================
       CURRENT STATE
    ========================================================= */

    let currentRegion =
      "Ahmedabad East";

    let assetsVisible =
      true;

    let weatherVisible = user.preferences?.weatherLayer !== false;

    let selectedAssetId =
      null;

    let picker = null;


    /* =========================================================
       LOAD SAVED REGION
    ========================================================= */

    const savedRegion =
      localStorage.getItem(
        "gridguard-region"
      );


    if (
      savedRegion
      &&
      regionData[savedRegion]
    ) {

      currentRegion =
        savedRegion;

      regionSelect.value =
        savedRegion;

    }


    /* =========================================================
       LEAFLET MAP
    ========================================================= */

    const initial =
      regionData[currentRegion];


    // Keep the inset map sized in WebKit before Leaflet inspects its layout.
    document.getElementById('map').style.position = 'absolute';

    const map =
      L.map(
        "map",
        {
          zoomControl:
            false,
          preferCanvas:
            true,
          scrollWheelZoom:
            false
        }
      )
      .setView(
        initial.center,
        initial.zoom
      );

    map.scrollWheelZoom.disable();
    window.gridMap = map;
    map.on('blur', () => { map.scrollWheelZoom.disable(); });
    map.getContainer().addEventListener('mouseleave', () => { map.scrollWheelZoom.disable(); });

    picker = mapLocationPicker({
      map,
      canEdit: () => normalizeRole(user?.role) === 'admin',
      getAsset: () => selectedAssetId ? { assetId: selectedAssetId, region: currentRegion } : null,
      onSave: async (assetId, coords) => {
        await updateAsset(assetId, coords);
      }
    });

    L.control
      .zoom({
        position:
          "bottomright"
      })
      .addTo(map);


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom:
          19,

        attribution:
          "&copy; OpenStreetMap contributors"
      }
    )
    .addTo(map);


    const markerLayer =
      L.layerGroup()
      .addTo(map);


    const weatherLayer =
      L.layerGroup()
      .addTo(map);


    /* =========================================================
       SIDEBAR
    ========================================================= */

    collapseBtn.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "collapsed"
        );


        setTimeout(
          () => {

            map.invalidateSize();

          },
          260
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
      closeMobileSidebar
    );


    function closeMobileSidebar() {

      sidebar.classList.remove(
        "mobile-open"
      );

      mobileOverlay.classList.remove(
        "open"
      );

    }


    /* =========================================================
       PROFILE
    ========================================================= */

    const profileBtn =
      document.getElementById(
        "profileBtn"
      );

    const profileMenu =
      document.getElementById(
        "profileMenu"
      );


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


    document
      .getElementById(
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


    /* =========================================================
       HELPERS
    ========================================================= */

    function markerColor(
      risk
    ) {

      if (
        risk === "Critical"
      ) {

        return "#ad4d49";

      }


      if (
        risk === "Elevated"
      ) {

        return "#bb7e26";

      }


      return "#137c62";

    }


    function markerClass(
      risk
    ) {

      return risk
        .toLowerCase();

    }


    function shortType(
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


    function filteredAssets() {

      const assets =
        regionData[currentRegion]
          .assets;


      return assets.filter(
        asset => {

          const riskMatch =
            riskFilter.value === "All"
            ||
            asset.risk ===
            riskFilter.value;


          const typeMatch =
            typeFilter.value === "All"
            ||
            asset.type ===
            typeFilter.value;


          return (
            riskMatch
            &&
            typeMatch
          );

        }
      );

    }


    /* =========================================================
       MARKER ICON
    ========================================================= */

    function createAssetIcon(
      asset
    ) {

      const className =
        markerClass(
          asset.risk
        );


      return L.divIcon({

        className:
          "asset-marker-wrap",

        html: `
          <div class="asset-marker ${className}">
            ${shortType(asset.type)}
          </div>
        `,

        iconSize:
          [32,32],

        iconAnchor:
          [16,16],

        popupAnchor:
          [0,-17]

      });

    }


    /* =========================================================
       POPUP
    ========================================================= */

    function createPopup(
      asset
    ) {

      return `
        <div class="popup-title">
          ${asset.id}
        </div>

        <div class="popup-location">
          ${asset.location} · ${asset.type}
        </div>

        <div class="popup-row">
          <span>Risk</span>
          <strong>
            ${asset.risk}
          </strong>
        </div>

        <div class="popup-row">
          <span>Risk score</span>
          <strong>
            ${asset.score}
          </strong>
        </div>

        <div class="popup-row">
          <span>Failure probability</span>
          <strong>
            ${asset.probability}%
          </strong>
        </div>
      `;

    }


    /* =========================================================
       RENDER MAP
    ========================================================= */

    function renderMapAssets() {

      markerLayer.clearLayers();


      if (
        !assetsVisible
      ) {

        return;

      }


      const assets =
        filteredAssets();


      assets.forEach(
        asset => {

          const marker =
            L.marker(
              [
                asset.lat,
                asset.lng
              ],
              {
                icon:
                  createAssetIcon(
                    asset
                  ),

                riseOnHover:
                  true
              }
            );


          marker.bindPopup(
            createPopup(
              asset
            )
          );


          marker.on(
            "click",
            () => {

              selectAsset(
                asset.id,
                false
              );

            }
          );


          marker.addTo(
            markerLayer
          );

        }
      );

    }


    /* =========================================================
       WEATHER AREA
    ========================================================= */

    function renderWeatherZone() {

      weatherLayer.clearLayers();


      if (
        !weatherVisible
      ) {

        return;

      }


      const region =
        regionData[
          currentRegion
        ];


      L.circle(
        region.weatherZone.center,
        {
          radius:
            region.weatherZone.radius,

          color:
            "#b77b1f",

          weight:
            1.5,

          opacity:
            .65,

          fillColor:
            "#d7a855",

          fillOpacity:
            .13,

          interactive:
            false
        }
      )
      .addTo(
        weatherLayer
      );

    }


    /* =========================================================
       ASSET LIST
    ========================================================= */

    function renderAssetList() {

      const assets =
        filteredAssets();


      if (
        assets.length === 0
      ) {

        assetList.innerHTML = `
          <div class="empty-filter">
            No assets match the selected filters.
          </div>
        `;

        return;

      }


      assetList.innerHTML =
        assets
          .map(
            asset => `

              <button
                class="
                  asset-list-item
                  ${
                    selectedAssetId === asset.id
                      ? "active"
                      : ""
                  }
                "
                data-id="${asset.id}"
              >

                <span
                  class="asset-risk-dot"
                  style="
                    background:
                    ${markerColor(asset.risk)}
                  "
                ></span>


                <span class="asset-list-copy">

                  <strong>
                    ${asset.id}
                  </strong>

                  <span>
                    ${asset.location}
                    ·
                    ${asset.type}
                  </span>

                </span>


                <span class="asset-list-score">
                  ${asset.score}
                </span>

              </button>

            `
          )
          .join("");


      document
        .querySelectorAll(
          ".asset-list-item"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                selectAsset(
                  button.dataset.id,
                  true
                );

              }
            );

          }
        );

    }


    /* =========================================================
       SELECT ASSET
    ========================================================= */

    function selectAsset(
      id,
      moveMap = true
    ) {

      const asset =
        regionData[
          currentRegion
        ]
        .assets
        .find(
          item =>
            item.id === id
        );


      if (!asset) {
        return;
      }


      selectedAssetId =
        id;


      selectedEmpty.style.display =
        "none";


      assetDetail.classList.add(
        "show"
      );


      document.getElementById(
        "detailType"
      ).textContent =
        asset.type;


      document.getElementById(
        "detailId"
      ).textContent =
        asset.id;


      document.getElementById(
        "detailLocation"
      ).textContent =
        `${asset.location} · ${currentRegion}`;


      const score =
        document.getElementById(
          "detailScore"
        );


      score.textContent =
        asset.score;


      score.className =
        `risk-score ${markerClass(asset.risk)}`;


      document.getElementById(
        "detailRisk"
      ).textContent =
        asset.risk;


      document.getElementById(
        "detailProbability"
      ).textContent =
        `${asset.probability}%`;


      document.getElementById(
        "detailImpact"
      ).textContent =
        asset.impact;


      document.getElementById(
        "detailHealth"
      ).textContent =
        `${asset.health}%`;


      document.getElementById(
        "detailSignal"
      ).textContent =
        asset.signal;


      document.getElementById(
        "detailWeather"
      ).textContent =
        asset.weather;


      document.getElementById(
        "detailReason"
      ).textContent =
        asset.reason;


      document.getElementById(
        "detailRecommendation"
      ).textContent =
        asset.recommendation;


      renderAssetList();


      if (
        moveMap
      ) {

        map.flyTo(
          [
            asset.lat,
            asset.lng
          ],
          14,
          {
            duration:
              .8
          }
        );

      }

    }


    function clearSelectedAsset() {

      selectedAssetId =
        null;


      assetDetail.classList.remove(
        "show"
      );


      selectedEmpty.style.display =
        "grid";

    }


    /* =========================================================
       SUMMARY
    ========================================================= */

    function updateSummary() {

      const data =
        regionData[
          currentRegion
        ];


      document.getElementById(
        "pageSubtitle"
      ).textContent =
        `Geographic asset health and predicted outage exposure across ${currentRegion}.`;


      document.getElementById(
        "streamCount"
      ).textContent =
        data.total;


      document.getElementById(
        "weatherChip"
      ).textContent =
        data.weather;


      document.getElementById(
        "mappedAssets"
      ).textContent =
        data.total;


      document.getElementById(
        "criticalAssets"
      ).textContent =
        data.critical;


      document.getElementById(
        "elevatedAssets"
      ).textContent =
        data.elevated;


      document.getElementById(
        "outageExposure"
      ).textContent =
        data.outageExposure;


      document.getElementById(
        "highestRiskZone"
      ).textContent =
        data.highestZone;


      document.getElementById(
        "regionRiskText"
      ).textContent =
        data.regionRiskText;


      document.getElementById(
        "panelRegion"
      ).textContent =
        currentRegion;


      document.getElementById(
        "riskMenuBadge"
      ).textContent =
        data.critical;

    }


    /* =========================================================
       REGION UPDATE
    ========================================================= */

    function updateRegion(
      region
    ) {

      currentRegion =
        region;

      picker?.cancel();

      localStorage.setItem(
        "gridguard-region",
        currentRegion
      );


      const data =
        regionData[
          currentRegion
        ];


      riskFilter.value =
        "All";


      typeFilter.value =
        "All";


      clearSelectedAsset();


      updateSummary();


      renderMapAssets();

      renderWeatherZone();

      renderAssetList();


      map.flyTo(
        data.center,
        data.zoom,
        {
          duration:
            .9
        }
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


    /* =========================================================
       FILTERS
    ========================================================= */

    function applyFilters() {

      clearSelectedAsset();

      renderMapAssets();

      renderAssetList();

    }


    riskFilter.addEventListener(
      "change",
      applyFilters
    );


    typeFilter.addEventListener(
      "change",
      applyFilters
    );


    /* =========================================================
       LAYERS
    ========================================================= */

    assetLayerBtn.addEventListener(
      "click",
      () => {

        assetsVisible =
          !assetsVisible;


        assetLayerBtn.classList.toggle(
          "active",
          assetsVisible
        );


        renderMapAssets();

    });


    weatherLayerBtn.addEventListener(
      "click",
      () => {

        weatherVisible =
          !weatherVisible;


        weatherLayerBtn.classList.toggle(
          "active",
          weatherVisible
        );


        renderWeatherZone();

    });


    /* =========================================================
       MAP INTERACTION
    ========================================================= */

    map.on(
      "click",
      event => {

        if (
          !event.originalEvent
            .target
            .closest(
              ".asset-marker"
            )
        ) {

          clearSelectedAsset();

          renderAssetList();

        }

      }
    );


    /* =========================================================
       INITIAL RENDER
    ========================================================= */

    loadUser();

    updateSummary();

    renderMapAssets();

    renderWeatherZone();

    renderAssetList();


    setTimeout(
      () => {

        map.invalidateSize();

      },
      250
    );


    /* =========================================================
       RESIZE
    ========================================================= */

    window.addEventListener(
      "resize",
      () => {

        if (
          window.innerWidth > 720
        ) {

          closeMobileSidebar();

        }


        map.invalidateSize();

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
