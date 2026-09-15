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

    const statusFilter =
      document.getElementById("statusFilter");

    let selectedOrderId = null;


    /* =====================================================
       SIDEBAR
    ===================================================== */

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


    /* =====================================================
       PROFILE
    ===================================================== */

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


    document.getElementById("logoutBtn")
      .addEventListener(
        "click",
        () => {

          

          

          window.location.href =
            "login.html";

        }
      );


    function loadUser() { renderProfile(user); }


    /* =====================================================
       HELPERS
    ===================================================== */

    function priorityClass(
      priority
    ) {

      if (
        priority === "Critical"
      ) {
        return "critical";
      }

      if (
        priority === "High"
      ) {
        return "high";
      }

      return "normal";

    }


    function statusClass(
      status
    ) {

      if (
        status === "Assigned"
      ) {
        return "assigned";
      }

      if (
        status === "In Progress"
      ) {
        return "progress";
      }

      return "pending";

    }


    function filteredOrders() {

      const data =
        regionData[
          regionSelect.value
        ];


      if (
        statusFilter.value === "All"
      ) {
        return data.orders;
      }


      return data.orders.filter(
        item =>
          item.status ===
          statusFilter.value
      );

    }


    /* =====================================================
       WORK ORDERS
    ===================================================== */

    function renderOrders() {

      const orders =
        filteredOrders();


      const list =
        document.getElementById(
          "workList"
        );


      if (
        orders.length === 0
      ) {

        list.innerHTML = `
          <div style="
            padding:28px;
            text-align:center;
            color:#748487;
            font-size:8px;
          ">
            No work orders match this status.
          </div>
        `;

        clearInspector();
        return;

      }


      if (
        !orders.some(
          item =>
            item.order === selectedOrderId
        )
      ) {

        selectedOrderId =
          orders[0].order;

      }


      list.innerHTML =
        orders
          .map(
            item => `

              <button
                class="
                  work-order
                  ${
                    item.order === selectedOrderId
                      ? "active"
                      : ""
                  }
                "
                data-order="${item.order}"
              >

                <div
                  class="
                    priority-line
                    ${priorityClass(item.priority)}
                  "
                ></div>


                <div class="work-main">

                  <strong>
                    ${item.order}
                    ·
                    ${item.asset}
                  </strong>

                  <span>
                    ${item.area}
                    ·
                    ${item.type}
                    ·
                    ${item.priority}
                  </span>

                  <small>
                    ${item.summary}
                  </small>

                </div>


                <div class="work-meta due-col">
                  <span>Due</span>
                  <strong>${item.due}</strong>
                </div>


                <div class="work-meta crew-col">
                  <span>Assigned crew</span>
                  <div class="crew-pill">
                    ${item.crew}
                  </div>
                </div>


                <div
                  class="
                    status-pill
                    ${statusClass(item.status)}
                  "
                >
                  ${item.status}
                </div>

              </button>

            `
          )
          .join("");


      document
        .querySelectorAll(
          ".work-order"
        )
        .forEach(
          row => {

            row.addEventListener(
              "click",
              () => {

                selectedOrderId =
                  row.dataset.order;

                renderOrders();

                renderInspector();

              }
            );

          }
        );


      renderInspector();

    }


    /* =====================================================
       INSPECTOR
    ===================================================== */

    function renderInspector() {

      const data =
        regionData[
          regionSelect.value
        ];


      const item =
        data.orders.find(
          order =>
            order.order === selectedOrderId
        )
        ||
        data.orders[0];


      if (!item) {
 for (const el of document.querySelectorAll('[id^="detail"]')) if (!el.children.length) el.textContent = '—';
 for (const id of ['evidenceList','checklist','skillList','memberList','eventTimeline','reasonBox','rootCause','assignmentTitle','assignmentDescription']) { const el=document.getElementById(id); if(el) el.textContent='No matching records'; }
 return;
 }


      selectedOrderId =
        item.order;


      document.getElementById(
        "detailOrder"
      ).textContent =
        item.order;


      document.getElementById(
        "detailAsset"
      ).textContent =
        `${item.asset} · ${item.area} ${item.type}`;


      document.getElementById(
        "detailPriority"
      ).textContent =
        item.priority;


      document.getElementById(
        "detailSummary"
      ).textContent =
        item.summary;


      document.getElementById(
        "detailDue"
      ).textContent =
        item.due;


      document.getElementById(
        "detailRisk"
      ).textContent =
        item.risk;


      document.getElementById(
        "detailCrew"
      ).textContent =
        item.crew;


      document.getElementById(
        "detailImpact"
      ).textContent =
        item.impact;


      document.getElementById(
        "reasonBox"
      ).textContent =
        item.reason;


      document.getElementById(
        "checklist"
      ).innerHTML =
        item.checklist
          .map(
            check => `

              <div class="check-item">

                <div class="check-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    ${check[0]}
                  </strong>

                  <span>
                    ${check[1]}
                  </span>

                </div>

              </div>

            `
          )
          .join("");


      const badge =
        document.getElementById(
          "detailPriority"
        );


      if (
        item.priority === "Critical"
      ) {

        badge.style.color =
          "#8f4742";

        badge.style.background =
          "#f2dddd";

      } else {

        badge.style.color =
          "#886021";

        badge.style.background =
          "#f2e8d4";

      }

    }


    /* =====================================================
       PIPELINE
    ===================================================== */

    function renderPipeline(
      stages
    ) {

      document.getElementById(
        "pipeline"
      ).innerHTML =
        stages
          .map(
            (stage,index) => `

              <div
                class="
                  pipeline-stage
                  ${index === 3 ? "active" : ""}
                "
              >

                <div class="stage-number">
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
          )
          .join("");

    }


    /* =====================================================
       RESOURCES
    ===================================================== */

    function renderResources(
      resources
    ) {

      document.getElementById(
        "resourceList"
      ).innerHTML =
        resources
          .map(
            resource => `

              <div class="resource-row">

                <div class="resource-icon">
                  ${resource[0]}
                </div>

                <div class="resource-copy">

                  <strong>
                    ${resource[1]}
                  </strong>

                  <span>
                    ${resource[2]}
                  </span>

                </div>

                <div class="resource-state">
                  ${resource[3]}
                </div>

              </div>

            `
          )
          .join("");

    }


    /* =====================================================
       REGION UPDATE
    ===================================================== */

    function updateRegion(
      region
    ) {

      const data =
        regionData[region];


      selectedOrderId =
        (data.orders[0]?.order || "");


      statusFilter.value =
        "All";


      document.getElementById(
        "pageSubtitle"
      ).textContent =
        `AI-prioritized work orders, inspection windows and crew assignments for ${region}.`;


      document.getElementById(
        "weatherChip"
      ).textContent =
        data.weather;


      document.getElementById(
        "activeOrdersTop"
      ).textContent =
        parseInt(
          data.stats.open,
          10
        );


      document.getElementById(
        "priorityAsset"
      ).textContent =
        (data.orders[0]?.asset || "—");


      document.getElementById(
        "priorityNote"
      ).textContent =
        `${(data.orders[0]?.due || "—") === "Immediate"
          ? "Immediate action"
          : "Inspect within " + (data.orders[0]?.due || "—")}
          · ${(data.orders[0]?.area || "—")}`;


      document.getElementById(
        "openOrders"
      ).textContent =
        data.stats.open;


      document.getElementById(
        "assignedCrews"
      ).textContent =
        data.stats.crews;


      document.getElementById(
        "protectedLoad"
      ).textContent =
        data.stats.load;


      document.getElementById(
        "riskReduction"
      ).textContent =
        data.stats.reduction;


      document.getElementById(
        "stabilized"
      ).textContent =
        data.stats.stabilized;


      document.getElementById(
        "avoidedExposure"
      ).textContent =
        data.stats.exposure;


      document.getElementById(
        "due12"
      ).textContent =
        data.stats.due12;


      document.getElementById(
        "due24"
      ).textContent =
        data.stats.due24;


      document.getElementById(
        "due72"
      ).textContent =
        data.stats.due72;


      document.getElementById(
        "resourceRegion"
      ).textContent =
        `${region} availability`;


      document.getElementById(
        "riskBadge"
      ).textContent =
        data.orders.filter(
          item =>
            item.priority === "Critical"
        ).length;


      renderOrders();

      renderPipeline(
        data.pipeline
      );

      renderResources(
        data.resources
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

        renderOrders();

      }
    );


    /* =====================================================
       INITIAL
    ===================================================== */

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
    const previousRegion = regionSelect.value; const previousSelection = selectedOrderId;
    const filters = [...document.querySelectorAll('#riskFilter,#typeFilter,#statusFilter,#stateFilter')].map(el=>[el,el.value]);
    regionData[region] = view;
    regionSelect.value = region;
    updateRegion(region);
    if(previousRegion === region) selectedOrderId = previousSelection;
    for (const [el,value] of filters) {el.value=value;el.dispatchEvent(new Event('change'));}
  }};

}
