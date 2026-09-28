# Local development and verification

Node 24 and Python 3 build/package the app. PHP 8.3 with pdo_mysql/fileinfo and MySQL 8 run the API locally. Production does not need Node, Python, or a development server.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run check:php
python3 scripts/check-migrations.py
npm run build:demo
npm run build:hosted
npm run package
```

`npm run dev` starts local demo mode at localhost. `npm run dev -- --mode hosted` uses the same frontend with Vite’s `/api` proxy to localhost:8081. Configure the private API `origin` to the exact frontend origin, e.g. `http://127.0.0.1:5173`. Set `test_http => true` **only in a disposable local config**; never in deployment config. Start the local API with:

```sh
MMB_CONFIG=/absolute/path/local-config.php php -S 127.0.0.1:8081 -t build/hosted tests/api/router.php
```

For full integration tests, use an empty disposable database and a private config. Run migrations and DTB seed first. Start the API using origin `http://127.0.0.1:8081` and `test_http => true` so tests can use localhost cookies. Then:

```sh
MMB_TEST_ALLOW_RESET=1 MMB_CONFIG=/absolute/path/test-config.php python3 tests/api/integration.py
node tests/e2e/hosted.cjs
node tests/e2e/demo.cjs
```

Install Playwright and Chromium with `npm ci` then `npx playwright install chromium`. Tests use the normal Playwright browser unless CHROMIUM_PATH is explicitly provided. The hosted test consumes an ephemeral fixture written to `/tmp/mmb-e2e-fixture.json` by the API suite; it is never packaged. The integration suite creates and clears test rows and must never target real data.

`PHP_BIN` may select a PHP executable. `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` are optional test-runtime overrides. The demo browser test starts its own Python static server at port 5173. Keep the API test server running for the hosted test. MySQL 8 CI uses the same integration suite; local evidence from MariaDB is reported separately.

## Recovered source boundary

The 26,000-line `frontend/recovered/index-DwifuW9D.js` includes the original bundled React and third-party code. The new UI deliberately uses that React instance to avoid duplicate-hook runtimes. New code has strict TypeScript checks; the recovered generated JavaScript is not falsely represented as reconstructed original TypeScript. Preserve its export names because the native runtime chunks import them. Formatting and edits are committed as readable source. A future source-cleanup project can extract components one at a time behind the passing workflow tests.
