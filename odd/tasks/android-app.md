# Android app with Capacitor, for Google Play

Branch `feat/android-app` (worktree `../Pomodoro Dragon android`, from `main` 7314cc6). Delivery: ask-on-risk. Runner: `npx vitest run`, baseline 997 tests green.

## Specs

- **S1** (user, verbatim): "Y si lo convertimos en app?" and then, to the proposal to start with Capacitor before the images: "si". The same app, packaged as a native Android app with Capacitor, free on Google Play, no ads, no accounts, no data collected (see `docs/play-listing.md`).
- **S2** The save lives in native storage in the app (Capacitor Preferences, Android SharedPreferences) so Android Auto Backup copies it to the device's Google account without any sign-in. The web PWA keeps localStorage. The store stays synchronous for the app: a preloaded backend reads the native keys before start-up and writes through in the background. The keys are the save, `<key>.previous` and `<key>.corrupt`.
- **S3** Native build mode: assets served from the app root (`base: '/'`), no service worker (the files ship inside the app), the content security policy still applied.
- **S4** A privacy policy page in English and Spanish, served by the web app (Google requires a URL even when no data is collected).
- **S5** Assumption, open to correction before the first upload: application id `io.github.inigomunoz.pomodorofantasy` (it can never change once on Google Play).
- **S6** Environment the user installs (not automated: large downloads and system changes): Android Studio (Android SDK and JDK 21) and Node 22 for Capacitor 8's CLI. Then: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/preferences` (Capacitor 8), the Android project, a debug build on an emulator or the tablet, and a restore of the daughter's backup inside the app.

## Tasks

| ID | Specs | Route | Status | Commit |
|---|---|---|---|---|
| T1 | S2 | inline | pending | |
| T2 | S3 | inline | pending | |
| T3 | S4 | inline | pending | |
| T4 | S5, S6 | inline, after the user installs Android Studio and Node 22 | blocked | |
| T5 | S2, S6 | inline after T4 | blocked | |
| T6 | S6 | inline after T5 | blocked | |

- **T1** Storage backend injectable into `createApp` and `boot`; `createPreloadedBackend(asyncStore, keys)` with tests against a fake async store (preload, write-through, failures never block the game).
- **T2** `vite build --mode native` (base `/`, no service worker registration, CSP kept); `npm run build:native`.
- **T3** `public/privacy.html` in both languages, linked from Credits and the store listing notes.
- **T4** Install Capacitor 8, `capacitor.config`, `npx cap add android`, app id, name, icons.
- **T5** Native storage adapter on Capacitor Preferences; Auto Backup left on (default) and checked.
- **T6** Debug APK on an emulator or the tablet; restore the daughter's backup inside the app; checklist for the closed test.

## Log

- **L1** (2026-11-16, user): "Y si lo convertimos en app?"; Capacitor recommended over TWA (native storage with Auto Backup, reliable notifications). Free on Play, no ads.
- **L2** (2026-11-16, user): "si", to starting with Capacitor now, while the image quota is out.
- **L3** Environment found: OpenJDK 17, Node 20.18, no Android SDK. Capacitor 8.6.2 (current) needs Node >= 22 and targets API 36; Capacitor 7 accepts Node 20 but targets API 35, which Google Play may soon reject for new apps. Recommendation: Capacitor 8 + Node 22 + Android Studio, installed by the user. T1-T3 need none of it.
