import { renderProfile } from '../auth.js';
export function mount(regionData,user){


    const SETTINGS_KEY =
      "gridguard-settings";


    const sidebar =
      document.getElementById(
        "sidebar"
      );


    const overlay =
      document.getElementById(
        "overlay"
      );


    const collapseBtn =
      document.getElementById(
        "collapseBtn"
      );


    const mobileMenu =
      document.getElementById(
        "mobileMenu"
      );


    const regionSelect =
      document.getElementById(
        "regionSelect"
      );


    const profileBtn =
      document.getElementById(
        "profileBtn"
      );


    const profileMenu =
      document.getElementById(
        "profileMenu"
      );


    const toast =
      document.getElementById(
        "toast"
      );


    /* =====================================================
       SIDEBAR
    ===================================================== */

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
      closeMobileSidebar
    );


    function closeMobileSidebar() {

      sidebar.classList.remove(
        "mobile-open"
      );

      overlay.classList.remove(
        "open"
      );

    }


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


    /* =====================================================
       USER
    ===================================================== */

    function loadUser() { renderProfile(user); }


    /* =====================================================
       TAB NAVIGATION
    ===================================================== */

    const tabs =
      document.querySelectorAll(
        ".settings-tab"
      );


    const sections =
      document.querySelectorAll(
        ".settings-section"
      );


    tabs.forEach(
      tab => {

        tab.addEventListener(
          "click",
          () => {

            const sectionId =
              tab.dataset.section;


            tabs.forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );


            sections.forEach(
              section =>
                section.classList.remove(
                  "active"
                )
            );


            tab.classList.add(
              "active"
            );


            document
              .getElementById(
                sectionId
              )
              .classList.add(
                "active"
              );

          }
        );

      }
    );


    /* =====================================================
       THRESHOLD VALUES
    ===================================================== */

    const criticalThreshold =
      document.getElementById(
        "criticalThreshold"
      );


    const elevatedThreshold =
      document.getElementById(
        "elevatedThreshold"
      );


    const predictionHorizon =
      document.getElementById(
        "predictionHorizon"
      );


    function updateThresholdLabels() {

      document.getElementById(
        "criticalValue"
      ).textContent =
        `${criticalThreshold.value}%`;


      document.getElementById(
        "elevatedValue"
      ).textContent =
        `${elevatedThreshold.value}%`;


      document.getElementById(
        "horizonValue"
      ).textContent =
        `${predictionHorizon.value}h`;

    }


    criticalThreshold.addEventListener(
      "input",
      updateThresholdLabels
    );


    elevatedThreshold.addEventListener(
      "input",
      updateThresholdLabels
    );


    predictionHorizon.addEventListener(
      "input",
      updateThresholdLabels
    );


    /* =====================================================
       CONFIG SERIALIZATION
    ===================================================== */

    function getSettings() {

      return {

        displayName:
          document.getElementById(
            "displayName"
          ).value.trim(),

        operatorRole:
          document.getElementById(
            "operatorRole"
          ).value,

        defaultRegion:
          document.getElementById(
            "defaultRegion"
          ).value,

        interfaceDensity:
          document.getElementById(
            "interfaceDensity"
          ).value,

        rememberRegion:
          document.getElementById(
            "rememberRegion"
          ).checked,

        autoSelectRisk:
          document.getElementById(
            "autoSelectRisk"
          ).checked,

        rememberSidebar:
          document.getElementById(
            "rememberSidebar"
          ).checked,

        mapZoom:
          document.getElementById(
            "mapZoom"
          ).value,

        refreshInterval:
          document.getElementById(
            "refreshInterval"
          ).value,

        weatherLayer:
          document.getElementById(
            "weatherLayer"
          ).checked,

        mapAnimation:
          document.getElementById(
            "mapAnimation"
          ).checked,

        markerPulse:
          document.getElementById(
            "markerPulse"
          ).checked,

        criticalThreshold:
          criticalThreshold.value,

        elevatedThreshold:
          elevatedThreshold.value,

        predictionHorizon:
          predictionHorizon.value,

        useWeather:
          document.getElementById(
            "useWeather"
          ).checked,

        useIncidents:
          document.getElementById(
            "useIncidents"
          ).checked,

        showEvidence:
          document.getElementById(
            "showEvidence"
          ).checked,

        alertCritical:
          document.getElementById(
            "alertCritical"
          ).checked,

        alertWeather:
          document.getElementById(
            "alertWeather"
          ).checked,

        alertMaintenance:
          document.getElementById(
            "alertMaintenance"
          ).checked,

        alertCrew:
          document.getElementById(
            "alertCrew"
          ).checked,

        alertStable:
          document.getElementById(
            "alertStable"
          ).checked,

        apiBaseUrl:
          document.getElementById(
            "apiBaseUrl"
          ).value.trim(),

        requestTimeout:
          document.getElementById(
            "requestTimeout"
          ).value,

        dataMode:
          document.getElementById(
            "dataMode"
          ).value

      };

    }


    function applySettings(
      settings
    ) {

      if (!settings) {
        return;
      }


      const setValue =
        (id,value) => {

          const element =
            document.getElementById(id);

          if (
            element
            &&
            value !== undefined
            &&
            value !== null
          ) {

            element.value =
              value;

          }

        };


      const setChecked =
        (id,value) => {

          const element =
            document.getElementById(id);

          if (
            element
            &&
            typeof value === "boolean"
          ) {

            element.checked =
              value;

          }

        };


      setValue(
        "displayName",
        settings.displayName
      );


      setValue(
        "operatorRole",
        settings.operatorRole
      );


      setValue(
        "defaultRegion",
        settings.defaultRegion
      );


      setValue(
        "interfaceDensity",
        settings.interfaceDensity
      );


      setValue(
        "mapZoom",
        settings.mapZoom
      );


      setValue(
        "refreshInterval",
        settings.refreshInterval
      );


      setValue(
        "criticalThreshold",
        settings.criticalThreshold
      );


      setValue(
        "elevatedThreshold",
        settings.elevatedThreshold
      );


      setValue(
        "predictionHorizon",
        settings.predictionHorizon
      );


      setValue(
        "apiBaseUrl",
        settings.apiBaseUrl
      );


      setValue(
        "requestTimeout",
        settings.requestTimeout
      );


      setValue(
        "dataMode",
        settings.dataMode
      );


      setChecked(
        "rememberRegion",
        settings.rememberRegion
      );


      setChecked(
        "autoSelectRisk",
        settings.autoSelectRisk
      );


      setChecked(
        "rememberSidebar",
        settings.rememberSidebar
      );


      setChecked(
        "weatherLayer",
        settings.weatherLayer
      );


      setChecked(
        "mapAnimation",
        settings.mapAnimation
      );


      setChecked(
        "markerPulse",
        settings.markerPulse
      );


      setChecked(
        "useWeather",
        settings.useWeather
      );


      setChecked(
        "useIncidents",
        settings.useIncidents
      );


      setChecked(
        "showEvidence",
        settings.showEvidence
      );


      setChecked(
        "alertCritical",
        settings.alertCritical
      );


      setChecked(
        "alertWeather",
        settings.alertWeather
      );


      setChecked(
        "alertMaintenance",
        settings.alertMaintenance
      );


      setChecked(
        "alertCrew",
        settings.alertCrew
      );


      setChecked(
        "alertStable",
        settings.alertStable
      );


      updateThresholdLabels();

    }


    /* =====================================================
       SAVE / DISCARD
    ===================================================== */

    function showToast(
      message
    ) {

      toast.textContent =
        message;


      toast.classList.add(
        "show"
      );


      clearTimeout(
        showToast.timer
      );


      showToast.timer =
        setTimeout(
          () => {

            toast.classList.remove(
              "show"
            );

          },
          2200
        );

    }


    document.getElementById(
      "saveBtn"
    )
    .addEventListener(
      "click",
      () => {

        const settings =
          getSettings();


        localStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify(
            settings
          )
        );


        if (
          settings.rememberRegion
        ) {

          localStorage.setItem(
            "gridguard-region",
            regionSelect.value
          );

        }


        if (
          settings.rememberSidebar
        ) {

          localStorage.setItem(
            "gridguard-sidebar-collapsed",
            sidebar.classList.contains(
              "collapsed"
            )
              ? "1"
              : "0"
          );

        } else {

          localStorage.removeItem(
            "gridguard-sidebar-collapsed"
          );

        }


        document.getElementById(
          "profileName"
        ).textContent =
          settings.displayName
          ||
          "Demo Operator";


        document.getElementById(
          "profileRole"
        ).textContent =
          settings.operatorRole;


        document.getElementById(
          "operatorName"
        ).textContent =
          settings.displayName
          ||
          "Demo Operator";


        const initials =
          (
            settings.displayName
            ||
            "Demo Operator"
          )
          .trim()
          .split(/\s+/)
          .slice(0,2)
          .map(
            word =>
              word.charAt(0)
                .toUpperCase()
          )
          .join("");


        document.getElementById(
          "avatar"
        ).textContent =
          initials;


        document.getElementById(
          "profileAvatar"
        ).textContent =
          initials;


        document.getElementById(
          "saveMessage"
        ).textContent =
          "Configuration saved in this browser.";


        showToast(
          "Settings saved successfully."
        );

      }
    );


    document.getElementById(
      "discardBtn"
    )
    .addEventListener(
      "click",
      () => {

        const stored =
          localStorage.getItem(
            SETTINGS_KEY
          );


        if (stored) {

          try {

            applySettings(
              JSON.parse(
                stored
              )
            );

          } catch (error) {}

        }


        document.getElementById(
          "saveMessage"
        ).textContent =
          "Unsaved changes discarded.";


        showToast(
          "Changes discarded."
        );

      }
    );


    /* =====================================================
       RESET
    ===================================================== */

    document.getElementById(
      "resetSettings"
    )
    .addEventListener(
      "click",
      () => {

        const confirmed =
          window.confirm(
            "Reset GridGuard AI local settings?"
          );


        if (!confirmed) {
          return;
        }


        localStorage.removeItem(
          SETTINGS_KEY
        );


        localStorage.removeItem(
          "gridguard-region"
        );


        localStorage.removeItem(
          "gridguard-sidebar-collapsed"
        );


        showToast(
          "Local settings reset."
        );


        setTimeout(
          () => {

            window.location.reload();

          },
          500
        );

      }
    );


    /* =====================================================
       REGION
    ===================================================== */

    regionSelect.addEventListener(
      "change",
      event => {

        const remember =
          document.getElementById(
            "rememberRegion"
          ).checked;


        if (remember) {

          localStorage.setItem(
            "gridguard-region",
            event.target.value
          );

        }

      }
    );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    const savedRegion =
      localStorage.getItem(
        "gridguard-region"
      );


    if (savedRegion) {

      const exists =
        Array.from(
          regionSelect.options
        )
        .some(
          option =>
            option.value === savedRegion
        );


      if (exists) {

        regionSelect.value =
          savedRegion;

      }

    }


    document.getElementById(
      "defaultRegion"
    ).value =
      regionSelect.value;


    loadUser();


    const storedSettings =
      localStorage.getItem(
        SETTINGS_KEY
      );


    if (storedSettings) {

      try {

        applySettings(
          JSON.parse(
            storedSettings
          )
        );

      } catch (error) {}

    }


    const savedSidebarState =
      localStorage.getItem(
        "gridguard-sidebar-collapsed"
      );


    if (
      savedSidebarState === "1"
      &&
      window.innerWidth > 900
    ) {

      sidebar.classList.add(
        "collapsed"
      );

    }


    updateThresholdLabels();


    window.addEventListener(
      "resize",
      () => {

        if (
          window.innerWidth > 720
        ) {

          closeMobileSidebar();

        }

      }
    );

  
return {getSettings,applySettings,showToast};

}
