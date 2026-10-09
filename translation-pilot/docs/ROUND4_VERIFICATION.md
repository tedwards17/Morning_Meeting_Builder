# Round 4 verification — October 2, 2026

Baseline: Round 3 commit `b99ef562785f4a021fbdc5d9d2618797fc2916b1`. Release: v0.4.0 on `Round-4-Development`.

## Completed checks

| Check actually run | Result and scope |
|---|---|
| TypeScript typecheck | Passed |
| ESLint (frontend source/tests) | Passed |
| Vitest | 32 checks passed, including the 26 existing checks for content/default upgrades, media storage, retention, permissions, schedules and reporting; 6 added translation lifecycle checks |
| PHP 8.3 syntax | 18 PHP files passed |
| PHP captions gateway integration | 16 checks passed against the real PHP request handler, with test-only deterministic cURL responses: presenter auth, origin/CSRF, bounded token/deadline, English/Spanish target routing, global-region header omission, input validation, stop, server expiry, no permanent credentials returned and access throttling |
| Chromium desktop and mobile layouts | 35 browser checks passed: 1366×900, 390×844 portrait, 844×390 landscape; fullscreen enter/exit and unsupported fallback; bottom gap, caption bounds and usable navigation; disabled configuration; clear static-Pages error; short text fits closely |
| Browser capture pipeline | Actual AudioWorklet and browser synthetic microphone produced PCM buffers for a mocked WebSocket; manual Stop and exiting presentation ended tracks/closed the socket |
| YouTube preservation | Existing YouTubePlayer/media-renderer source is byte-identical to Round 3. Overlay layout tested using the actual player wrapper with a mocked iframe API/player. Actual YouTube network/playback was not tested |
| Builds/package | Static and account-hosted frontend builds completed; deployment asset paths, service-worker JavaScript and ZIP contents checked |

Browser engine used for local layout/audio checks: headless Chromium 134 through Playwright. Mobile dimensions are **emulated layouts**, not Android/iOS browser/device tests. Provider messages/tokens in automated tests are fixtures, not real service credentials.

## Remaining checks

- Real Deepgram token authorization, Nova-3 recognition and Azure Translator requests with your private project/resource credentials.
- English→Spanish and Spanish→English accuracy, short utterances, mixed-language speech, noisy shop/meeting-room microphone pickup, room TV readability and latency.
- Actual YouTube playback during a microphone session; its iframe audio is heard through the room microphone rather than captured directly.
- Physical Android Chrome, iPhone Safari/Home Screen and target tablet fullscreen/browser-controls behavior, safe-area insets and backgrounding.
- Actual company HTTPS/PHP configuration, environment variables, private-directory permissions, reverse-proxy HTTPS reporting, CSP, firewall and outbound service connectivity.
- Existing optional MySQL/account installation integration on the target host. Its previous tests remain available; that broader system was not deployed or exercised end-to-end in this round.
- A real 45-minute pilot. The deadline and cleanup were checked with controlled time and PHP session-expiry fixtures, not 45 minutes of billed live audio.

## Reproduce focused checks

From `translation-pilot/`:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run check:php
python3 tests/api/translation.py
npm run build:demo
npm run build:hosted
npx playwright install chromium
mkdir -p test-results
node tests/e2e/round4.cjs
npm run package
```

The PHP integration uses `php -n` and a test-only cURL substitute, so it requires PHP CLI but no API keys. The test router is never packaged into public deployment files. The browser test explicitly mocks provider APIs and YouTube; it uses the browser's synthetic audio device.

If Chromium is installed outside the project's Playwright package, set `PLAYWRIGHT_MODULE` to the corresponding package path. `PHP_BIN` selects the syntax-check executable; `PHP_BINARY` selects the PHP integration executable. These are local tooling paths, not production configuration.

## October 9 Codespaces origin correction

Codespaces can rewrite the browser Origin to localhost while retaining the external forwarded Host. The development router now normalizes that case only with the exact configured Codespaces hostname and port, loopback peer and explicit pilot HTTP switch. The production gateway remains unchanged.

The real PHP development router passed 11 HTTP regression checks with simulated tunnel headers: exact external origin and four localhost forms accepted; other origins, missing origin, wrong port/host and disabled pilot/non-Codespaces modes rejected. The 16 existing PHP gateway checks also passed. The actual user Codespace still needs the pull/restart and phone retry; no live provider success is claimed.

Reproduce with `python3 tests/api/codespaces-origin.py` (PHP CLI required).
