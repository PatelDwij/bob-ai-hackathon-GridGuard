# Final GridGuard validation

## Presentation fallback

Set `VITE_FORCE_DEMO_DATA=true` and restart Vite (or rebuild). Otherwise Firebase is primary. On network/unavailable/quota failures, the session switches to local simulation. The persistent badge reads **Demo Fallback · Simulated Data**. The public login page no longer exposes any demo/simulation button; fallback engages automatically only on eligible network/quota errors (never on credential errors) or under the forced env flag.

Settings lets you choose a role in local simulation. Save, then navigate to the relevant page. The same session data is shared by all pages and simulated roles, including refreshes. Local changes are never intentionally replayed to Firebase. Close the tab to end the simulation session. Real profile roles remain locked in Settings.

Local simulation is a browser-session convenience, not a security boundary or multi-user server. Firebase authorization must be validated separately. Permission/authentication failures do not count as network failures and do not silently enable successful writes. A Firebase write already dispatched before a timeout can have an uncertain remote outcome; confirm remote state before retrying in a later live session.

## Conservative cleanup

`npm run cleanup:real` performs no deletion without an exact automated-test manifest. Use `--manifest=/path/manifest.json` to review exact paths and uid/email pairs; `--apply` applies that manifest with Application Default Credentials. No broad matching, collection scanning, or guessed seed-record deletion is performed.

## Validation execution

Results and exact terminal output are recorded after the single final pass. A real authenticated live pass now succeeded for the single available account (role `operator`); the admin-gated journey correctly stops before writing. No new live test accounts were created.

## Credential source

The live runner loads `VITE_TEST_EMAIL` and `VITE_TEST_PASSWORD` from `.env.test.local` in Node only. This file is gitignored. Vite's explicit public environment prefixes exclude `VITE_TEST_`, including when running in test mode. No private key is requested or used. Live testing creates no Auth users, disables screenshots/traces, and prints Firebase error codes rather than credentials or raw error objects.

The runner signs in once against real Firebase (`gridguard-ai-32b1b`), reads `users/{uid}`, requires `admin` for its main workflow, and performs an acknowledged profile write before testing. The detected live account role is `operator`, so the main journey exits `test/admin-role-required` before creating any records. A focused live operator-role probe (below) verified the permitted real workflow instead. Separate-role live sessions still require existing role accounts; local role switching does not validate real Firebase roles.

## Bugs found and corrected in this task

1. No local fallback implementation existed. Added an isolated session store, atomic local assignment, shared risk/telemetry and lifecycle operations, role checks, outage detection and presentation flag.
2. Crews Field Operations referenced `createSelect`, `wrap`, `btn` and `runAction` outside their Maintenance-only scope.
3. Add Asset, Add Crew and telemetry called undefined `notify()` after successful writes, showing a false save failure and leaving modals open.
4. Work-order creation sent `predictedPriority` and `aiRecommendedAction`, which the rules' field allowlist rejects. Removed these redundant fields.
5. Priority options (`High`, `Medium`, `Low`) and incident severity options (`Warning`, `Major`) did not match the rules' `Critical`, `Elevated`, `Stable` values.
6. Incident actions read a stale/nonexistent local-storage user instead of the authenticated page user. Removed the duplicate incident form with an undefined `head` reference.
7. Supervisor selectors included already assigned orders; Maintenance selectors included Pending orders. Action labels/handlers were not refreshed when subscription state changed, and empty selections could retain an action handler.
8. Unauthorized roles still received disabled Add Asset/Add Crew/telemetry controls. Operational mutation controls are now absent for those roles.
9. Focusing either map re-enabled scroll-wheel zoom. Removed that behavior while preserving dragging and zoom controls. WebKit also changed the dashboard map to relative positioning with zero height, hiding its contents and zoom controls. Explicit absolute positioning before Leaflet initialization fixes this on both maps.
10. Maintenance actions were mounted before the page heading/flexed into the wrong header. Corrected placement and spacing, retaining the existing design.
11. Crew avatars showed the full ID, overflowing their circles, and cards displayed duplicated `CREW-` prefixes. Separated short initials from the canonical ID.
12. Cleanup used broad substring/email matching, which could remove legitimate seed records. Replaced it with an exact manifest and default dry run.
13. The old live journey repeatedly registered users and relied on delays instead of persisted-state assertions. Replaced it with dedicated-account authentication and explicit checks.
14. No location picker existed for the required "Set location on map" asset workflow. Added `js/map-picker.js`: a shared admin-only Leaflet control that pins a suggested location on click, persists only via an explicit Use This Location action, and never mutates data during normal map interaction (drag/zoom/plain clicks stay inert). Wired into `js/pages/dashboard.js` (dashboard map) and `js/pages/risk-map.js` (risk map) against the focus asset; the pending picker is cancelled whenever the map re-renders or the region changes.
15. The dashboard map referenced an undeclared `selectedAssetId` (initialization variable was never added), throwing `ReferenceError` in strict mode during focus rendering and silently breaking the location picker's asset context. Declared the variable; the picker now resolves to the focus asset (verified helper "Set location for TR-104").
16. The picker toggle initially mounted top-right, where the `.map-focus` panel intercepted pointer events in WebKit. Moved the control to top-left; both browsers now click cleanly. The helper-text assertion also tolerated both "Click the map to set a new location for TR-104." and the post-click "Set location for TR-104" form.
17. No admin path to correct an existing asset existed. Added an Edit Asset modal to the assets drawer (admin only, absent for other roles) with the same rule-compatible payload as Add Asset, including hidden `region` and `dataSource: simulated`, which the Firestore rules require for asset updates.
18. The public login card offered an unauthenticated bypass: an **Open local simulation** button (appended by `js/auth.js`) called `startDemo()` and entered protected pages directly, plus a **⚡ Continue as Demo Operator** button with an embedded fallback `demo-operator@gridguard.ai` credential. Removed both controls, their CSS (`.demo-btn`, `.divider`), and the embedded password/email from the login page and from `js/auth.js`. The login card now contains only the production flow (email, password, keep-me-signed-in, forgot password, privacy agreement, sign in, create account, personnel notice), and the security notice's top margin was raised to keep the card balanced. No empty gap remains.
19. The operational fallback engine was deliberately retained and is not a public bypass: `isFallback()`/`startDemo()`/`activateFallback()` only fire under `VITE_FORCE_DEMO_DATA=true`, after an authenticated profile-fetch fails with a network/quota error, or when a sign-in attempt fails with an `auth/network`-class error (never on `auth/invalid-credential`/`auth/user-not-found`). `fallbackEligible()` matches only 429/network/unavailable/timeout codes.

## Validation evidence and limits

- Unit tests: **6 passed**, exit **0**.
- Build: **passed**, exit **0**; rebuilt after the final application changes. Existing large-chunk warning remains.
- Firestore rules emulator: **11 passed**, exit **0**, including reciprocal assignment, start/completion, incident lifecycle, admin creation and unauthorized-write denial. This does not prove the deployed rules match.
- Chromium and WebKit: both executed and passed all fallback lifecycle assertions through incident resolution and reload. Both passed automatic quota/network fallback and competing-assignment checks.
- Both browsers passed all eight protected-page checks for absent legacy controls and read-only operational controls, plus layout checks after transitions settled. Panel screenshots were inspected.
- Final map-only verification: **Chromium passed; WebKit passed; 2 passed (26.9s), exit 0**. Assertions cover positive map dimensions, no wheel zoom after focus, actual +/- clicks, and mouse dragging after both region switches.
- The broad validation initially exited **1** because of the undefined notification call. After that fix, focused checks encountered test synchronization problems: sampling layouts/zoom during animation and clicking an informational map overlay. Those were corrected. A focused check then exposed the real WebKit zero-height map issue; it was fixed and verified in both engines. Only affected or unfinished checks were continued. There was no second full validation-suite run and no repeated registration loop.
- Second full validation pass (this session, single clean run of the final config, not a resume): all **16** checks passed on Chromium and WebKit, exit **0** — `completion.spec.js` (8: persisted role workflows, read-only panels, map controls and region panning, quota/network fallback and atomic assignment contention) plus `location-picker.spec.js` (8: the picker persists focused-asset coordinates across reload, normal map interaction never mutates coordinates, reliability has no location/edit controls and receives `permission-denied` on direct `updateAsset`, and an admin asset edit persists). Unit tests **6/6** and Firestore rules **11/11** passed again, and the production build succeeded. Details are retained in `validation-results/final-full-suite.txt`.
- Real Firebase live pass (single available account, role **operator**): authenticate once (success, no retries) against `gridguard-ai-32b1b`; `users/{uid}` read returned role `operator`; role-permitted write to the operator's own `users/{uid}` (same-value `name` + `updatedAt`) was accepted by live rules and read back as persisted **after reload** and **after an explicit sign-out/sign-in cycle**; live rules enforcement confirmed an operator `updateDoc` on `crews/{id}` returns `permission-denied` (denied writes leave no records). The dedicated admin-gated journey `test:real` exited **2** with `LIVE STOPPED: test/admin-role-required (role=operator)` before creating any records. Details in `validation-results/final-live.txt`.
- Targeted login-page regression after removing the demo controls: **42/42 passed** on desktop (1280x800) and mobile (375x667) — no `#demoBtn`, no `#localDemoBtn`, no "Demo Operator", no "Demo Access", no "Open local simulation"; email/password/toggle/privacy/forgot/register/submit/notice all present; password-visibility toggle works; privacy and register links correct; forgot-password shows local validation; empty submit does not navigate; no horizontal overflow; card height sane with the notice inside near the bottom (no empty gap).
- Unauthenticated gating (fresh contexts, `VITE_FORCE_DEMO_DATA` off): `dashboard`, `assets`, `risk-map`, `predictions`, `maintenance`, `crews`, `incidents`, `settings` all redirect to `login.html`; the login page shows no demo control and no fallback badge.
- Not live-testable with the available account: admin-gated workflows (asset add, crew add, location-picker save) — covered in the Firestore emulator suite (11/11). Operator create paths (work orders `WO-{assetId}`, incidents) were intentionally not live-executed because cleanup would be unreliable (admin-SDK service account returns `RESOURCE_EXHAUSTED: Quota exceeded` on this project) and `WO-{assetId}` ids could overwrite legitimate seed work orders; their rules are covered in the emulator suite. No live records or Auth users were created by this task. Cleanup exited **0** without deletion because no automated-test manifest was produced.
- Authenticated real-Firebase reads from a client succeeded (single documents and a `crews`/region collection query); the same operator session's attempted `crews/{id}` update was denied by live rules (`permission-denied`), consistent with the emulator suite.

**Production readiness is not established for all roles.** Real Firebase authenticated workflow was verified for the single available `operator` account only; admin/maintenance/field_supervisor/reliability live coverage was not testable with that account, so full role coverage is not claimed. Local simulation is session-only, not cross-device or a server authorization boundary. Timed-out writes can have uncertain remote outcomes; simulated changes are not automatically synchronized back to Firebase.

## Files changed in this task

Existing files edited:

- `.env.example`, `.gitignore`, `vite.config.js`
- `js/app.js`, `js/auth.js`, `js/firestore.js`, `js/operations.js`
- `js/pages/dashboard.js`, `js/pages/incidents.js`, `js/pages/risk-map.js`
- `js/settings.js`, `js/utils.js`, `js/view-model.js`
- `login.html` (public demo controls and demo CSS removed; notice spacing rebalanced)
- `tests/security.rules.mjs`

Added or replaced previously untracked task files:

- `js/data-client.js`, `js/demo-session.js`, `js/map-picker.js`
- `playwright.final.config.js`, `tests/final/completion.spec.js`, `tests/final/location-picker.spec.js`
- `tests/live-credentials.mjs`, `tests/live-client.js`, `tests/test-real-journey.mjs`
- `scripts/cleanup-test-data.mjs`, `scripts/final-validation.mjs`
- `FINAL_VALIDATION.md`

Other modifications already present in the workspace were retained.

## Exact terminal output

Raw terminal logs are retained in `validation-results/` (gitignored):

- `final-terminal-output.txt`: validation resume after sandbox port denial; rules, initial browsers, conservative cleanup, exact exit codes.
- `failed-journey-recheck.txt`: post-notification-fix lifecycle assertions; later layout/animation assertion failures.
- `remaining-checks.txt`: read-only/panel assertions; later zoom-animation assertion failure.
- `map-check.txt`: interrupted overlay-click check.
- `map-final.txt`: Chromium passed; WebKit failed because its map had zero height.
- `webkit-map-centered.txt`, `webkit-map-geometry.txt`: focused evidence isolating the WebKit zero-height container.
- `map-verified.txt`: both browsers passed after the positioning fix (exit 0).
- `final-build.txt`: build after final application edits.
- `live-result.txt`: dedicated-credential runner's exact missing-file output.
- `final-full-suite.txt`: this session's clean full pass (unit, rules, build, 16/16 E2E, live probe) recorded after the location-picker work.
- `final-live.txt`: real Firebase authenticated operator-role validation (authenticate, role read, permitted write, reload + re-login persistence, live rules denial, unauthenticated gating) and exact exit codes.

## Final terminal excerpts and exit codes

Last map verification (exit **0**):

```text
  ✓  1 [chromium] › tests/final/completion.spec.js:143:1 › map controls and region panning (13.1s)
  ✓  2 [webkit] › tests/final/completion.spec.js:143:1 › map controls and region panning (12.5s)

  2 passed (26.9s)
```

Dedicated live runner (this session, real credentials now available):

```text
LIVE STOPPED: test/admin-role-required (role=operator)     # exit 2, before any records were written
```

Live operator-role probe (focused, this session, exit **0**):

```text
STEP authenticate (single attempt):           {"code":"ok","uid":"tIItPtZMgCPUhrfU2XKZibeRIq03"}
STEP users/{uid} read + role:                 {"code":"ok","role":"operator","name":"Dwij"}
STEP own-profile update (operator permitted): {"code":"ok"}
STEP persistence after reload:                {"authed":true,"role":"operator","name":"Dwij"}
STEP sign out:                                {"authed":false}
STEP re-login + profile re-read:              {"code":"ok","role":"operator","name":"Dwij"}
STEP operator crew-update denial (live rules):{"code":"permission-denied"}
```

Targeted login regression (this session, exit **0**):

```text
TARGETED LOGIN CHECK: 42/42 passed        # desktop + mobile; demo controls absent, flow controls present, no overflow, balanced card
```

Unauthenticated gating (this session): all 8 protected pages redirected to `login.html`; no demo control or fallback badge on the login page.

Second full validation pass (this session, exit **0**):

```text
  16 passed (1.5m)    # completion.spec.js (8) + location-picker.spec.js (8), Chromium + WebKit
```

Single read-only live probe this session (project `gridguard-ai-32b1b`, bundled demo credentials, superseded by the credentialed pass above):

```text
LIVE RESULT: {"code":"auth/invalid-credential"}
```

The broad validation's recorded exit remains **1**; it is not relabeled as a clean full-suite pass, but a separate clean full-suite pass (exit **0**) was executed and recorded this session, and a real authenticated live **operator** pass (exit **0**) was executed this session. Admin/maintenance/supervisor/reliability live coverage is not testable with the single available `operator` account.

**Local/fallback/browser/rules validation passed. Real Firebase authenticated workflow was verified for the single available operator account; admin/maintenance/field_supervisor/reliability live coverage was not testable with that account, so full role coverage is not claimed.**
