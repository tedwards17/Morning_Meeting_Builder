# Morning Meeting Builder Round 4 — v0.4.0

Round 4 starts from `Round-3-Development` commit `b99ef562785f4a021fbdc5d9d2618797fc2916b1` (the working v0.3.7 translation pilot). Changes live on **Round-4-Development**. The default branch and existing Pages setting are not changed. Existing starter libraries, safety/Lean/quote content, saved presentations, media handling and YouTube player are retained.

## What changed

- Deepgram Nova-3 multilingual speech recognition replaces Azure Speech. Browser microphone audio uses mono PCM through an AudioWorklet, streaming directly over a secure WebSocket to Deepgram. There is no translated voice audio or ElevenLabs integration.
- PHP mints a 30-second Deepgram grant and calls Azure AI Translator for recognized English/Spanish phrases. Only temporary credentials enter browser memory. Permanent keys stay in private PHP configuration or environment variables. Grants are bearer-authenticated in the WebSocket subprotocol, not URL parameters.
- The new independent `translation-api/` gateway uses PHP 8.3+, cURL, PHP sessions and a private writable directory. It requires presenter authentication with a passphrase hash, exact-origin checks, CSRF verification and request limits. It does not require MySQL or a WebSocket server. The existing optional account/MySQL application remains available as a separate build.
- Captions fit their text, stay 6 pixels above the bottom safe area, show at most two lines, and expire after 5.5 seconds. Long captions can be clipped to keep the presentation visible. Navigation rises above the actual caption height. The gap is adjustable from 0 to 32 pixels.
- A **Fullscreen / Exit fullscreen** control works through the user-initiated browser API. A rejected or unsupported request shows the browser/Home Screen fallback. No forced hiding of browser UI is claimed.
- Stop works during connection as well as during recognition. Exiting presentation, leaving/closing the page, backgrounding it, microphone disconnection, network errors or the 45-minute deadline release capture and close the socket. PHP also rejects translation requests after 45 minutes. No transcript/audio is persisted by this application; provider data handling is governed by the resources you configure.

## Packages and production runtime

`morning-meeting-builder-round4-php.zip` is the recommended first company-host deployment. It preserves the current local-browser workflow. Upload only its `public_html/` contents; its `private/`, `docs/` and `scripts/` folders remain outside the web root. It includes built browser files, PHP captions backend, configuration example and this guide.

`morning-meeting-builder-cpanel.zip` is the existing account-based hosted build, updated with the same captions gateway. It additionally requires the existing MySQL database/account setup. Do not select this package solely to test translation.

`morning-meeting-builder-github-pages-demo.zip` contains browser files only. `morning-meeting-builder-source.zip` contains editable source and tests. No package includes provider credentials, private configuration, dependencies or the former Node translation gateway.

**Build machine only:** Node 24/npm, Vite/TypeScript and Python build/package the frontend. **Production:** static files + ordinary PHP requests, PHP 8.3+, cURL, working trusted CA certificates and a private writable session/rate-limit directory. No Node daemon, npm install, Java server, persistent PHP worker or database is required by the recommended package.

## Create the actual provider resources

### Deepgram

1. Open [Deepgram Console](https://console.deepgram.com/), create/sign into an account and select a project. Confirm available credits/billing before the microphone test.
2. Choose **API Keys → Create Key → Advanced** and select **Member** permissions. Deepgram's token-grant endpoint requires at least Member permissions. Give the key a recognizable pilot name. Store it privately as `DEEPGRAM_API_KEY`. Never paste it into chat, a browser setting or GitHub.
3. No voice, ElevenLabs or Azure Speech resource is needed. The implementation chooses `model=nova-3&language=multi`. It uses Deepgram's `api.deepgram.com` endpoint; there is no Azure-style Deepgram region variable in this version. Ask IT before changing processing regions; the HTTP and WebSocket endpoints and security policy must agree.
4. If the gateway reports rejected Deepgram credentials, check this key's permissions and project access. Nova-3's multilingual result identifies languages on words; the app translates English/Spanish runs. Mixed-language speech and noisy shop audio still need real-room evaluation.

References: [Deepgram token grants](https://developers.deepgram.com/guides/fundamentals/token-based-authentication), [Nova multilingual recognition](https://developers.deepgram.com/docs/multilingual-code-switching), [Deepgram SDK bearer subprotocol](https://github.com/deepgram/deepgram-js-sdk/blob/main/src/CustomClient.ts).

### Azure AI Translator

1. Open [Azure Portal](https://portal.azure.com/). Create a **Translator** resource for text translation under your subscription/resource group. Use an available free tier for the pilot if your subscription permits it; check the displayed quota and billing conditions.
2. Open the resource's **Keys and Endpoint** page. Store a resource key as `AZURE_TRANSLATOR_KEY`. Set `AZURE_TRANSLATOR_REGION` to the exact resource region. For a single-service **Global** resource, set it to `global`; the gateway then omits the region header. Regional/multi-service resources need the matching region header.
3. This version calls the public `https://api.cognitive.microsofttranslator.com/translate` v3 endpoint. Private-network-only/custom-endpoint resources require a documented endpoint adaptation before use. An existing Speech key cannot substitute for a Translator key.

References: [Microsoft Translator setup/REST quickstart](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/quickstart/rest-api), [Translator authentication](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/authentication).

**ElevenLabs:** an alternative speech provider for a future comparison. It is not installed or required for this Deepgram + Azure test. ElevenLabs setup is intentionally outside this handoff so the test uses one clear combination.

## Configuration

Public `config.js` contains only these non-secret settings:

```js
window.MMB_CONFIG = { translationEnabled: true, captionGap: 6 };
```

Set `translationEnabled: false` to hide translation and caption preview; refresh the app. This file is fetched with a network-first service-worker policy so the latest switch is not locked into an old browser bundle. The last successfully loaded setting is retained for offline use. Fullscreen, slides, media and navigation remain available.

Enable the server separately only when credentials/access are ready. Set `MMB_TRANSLATION_ENABLED=false` to block provider requests even if an old browser has the button visible. Changes do not forcibly revoke already-open Deepgram sockets; presenters should stop existing sessions before disabling the feature.

Private environment variables (or equivalent keys in `translation-api/config.example.php`):

| Variable | Value to provide privately |
|---|---|
| `MMB_TRANSLATION_ENABLED` | `true` to allow translation; default false |
| `MMB_TRANSLATION_ORIGIN` | Exact browser origin, e.g. `https://meetings.example.invalid`, no trailing slash/path |
| `DEEPGRAM_API_KEY` | Permanent Deepgram Member key |
| `AZURE_TRANSLATOR_KEY` | Translator Text key |
| `AZURE_TRANSLATOR_REGION` | `global` or exact regional resource name |
| `MMB_PRESENTER_HASH` | PHP password hash of a presenter passphrase |
| `MMB_TRANSLATION_STATE_DIR` | Absolute private writable session/rate-limit directory |
| `MMB_TRANSLATION_CONFIG` | Optional absolute path to private `config.php` outside the document root |
| `MMB_TRANSLATION_TEST_HTTP` | false for production; true only for local/private Codespaces TLS proxy pilot |

Environment variables override private config entries. The app uses same-origin cookie authentication. It does not support an anonymous token endpoint or browser API-key input. Presenter access lasts eight hours in that browser; recognition still has a 45-minute limit per start. A presenter passphrase is an access credential, never a provider key.

Generate the hash without putting the passphrase into a command argument or shell history. From `translation-pilot/`, in a Bash terminal:

```bash
read -rsp 'Choose a presenter passphrase (12+ characters): ' mmb_phrase
printf '\n'
printf '%s' "$mmb_phrase" | php scripts/presenter-hash.php
unset mmb_phrase
```

Copy the displayed **hash** into the private `presenter_hash` setting or an environment secret. Keep the original passphrase with authorized presenters; the app prompts for it only when needed. Do not commit either value.

## Test from GitHub and Codespaces

GitHub Pages can serve the static meeting app, subtitles preview, navigation and fullscreen controls. **GitHub Pages cannot execute PHP or Java.** Starting real translation there reports the PHP limitation. No permanent or shared backend secret belongs in Pages files.

The simplest safe live test is the same branch running static files and PHP together on **one private Codespaces HTTPS port**, rather than cross-origin Pages-to-PHP cookies. This implementation deliberately does not enable cross-origin API access. Opening a public Codespaces backend to Pages is not the supported test path.

1. In GitHub, open **Round-4-Development** and create/open its Codespace. In the terminal, verify your directory/branch:

   ```bash
   git switch Round-4-Development
   git pull --ff-only
   cd translation-pilot
   php -v
   php -m
   ```

   Use PHP 8.3+ with `curl`. If missing, install it in the development Codespace:

   ```bash
   sudo apt-get update
   sudo apt-get install -y php-cli php-curl
   ```

2. In **GitHub user Settings → Codespaces → Secrets**, add `DEEPGRAM_API_KEY`, `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION`, and `MMB_PRESENTER_HASH`, with repository access enabled. Obtain the hash using the command above. Restart the Codespace after adding secrets. Do not create or commit a `.env` file. Never prefix private variables with `VITE_`.
3. Build the static browser app, then start PHP in the same terminal:

   ```bash
   npm ci
   npm run build:demo
   export MMB_TRANSLATION_ENABLED=true
   export MMB_TRANSLATION_TEST_HTTP=true
   export MMB_TRANSLATION_STATE_DIR="$HOME/mmb-private/translation-state"
   mkdir -p "$MMB_TRANSLATION_STATE_DIR"
   chmod 700 "$MMB_TRANSLATION_STATE_DIR"
   export MMB_TRANSLATION_ORIGIN="https://${CODESPACE_NAME}-8081.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
   npm run pilot:php
   ```

   Node/npm here is just a build/command launcher; the listening application server is PHP. To avoid the npm launcher entirely, run `php -S 0.0.0.0:8081 -t build/demo scripts/php-pilot-router.php`.
4. In Codespaces **Ports**, forward **8081**, keep visibility **Private**, then open its HTTPS link. Use that same link on your phone/tablet while signed into the authorized GitHub account. If the actual forwarded address differs, stop PHP with Ctrl+C, set `MMB_TRANSLATION_ORIGIN` to that exact HTTPS origin and restart. Port 5173 and the old Node gateway are not needed.
5. Build/save a meeting and choose **Present → Start Translation**. Enter the presenter passphrase, then allow microphone access. Speak a complete English sentence and then a Spanish sentence. Verify the opposite-language captions. Try a slide change, the existing YouTube slide, **Stop Translation**, start again and exit presentation. Check that the microphone indicator turns off. Turn off network/background the app and check the reported stop/error. Test the 45-minute limit during a long trial.
6. For a browser-only Pages trial, use repository **Settings → Pages → Deploy from a branch → Round-4-Development → /(root)** if permitted. This changes the test site's published branch; it does not merge to main. Alternatively upload the browser-only ZIP to a separate static test site. Existing Pages settings were left unchanged by this work.

On a PC, the same PHP pilot can run with `MMB_TRANSLATION_ORIGIN=http://localhost:8081` and `MMB_TRANSLATION_TEST_HTTP=true`; use `http://localhost:8081`. A mobile device cannot use another computer's localhost. Use the private HTTPS Codespaces link for mobile tests.

Saved local presentations/media stay in the browser and origin where they were created. Export a backup from the existing Pages app before moving to the PHP test origin, then restore it there if needed. Provider audio comes from the room microphone; this app does not directly capture audio inside a protected YouTube iframe.

## Upload to the company host

1. IT creates the HTTPS subdomain/document root and confirms PHP 8.3+, cURL, session support, CA certificates and outbound HTTPS to Deepgram/Translator. Meeting devices also need outbound `wss://api.deepgram.com`.
2. Extract the recommended `morning-meeting-builder-round4-php.zip`. Upload the **contents** of `public_html/` to the document root, including `.htaccess`, `assets/`, `config.js`, `pcm-worklet.js`, and `translation-api/index.php`.
3. Outside the web root, place the example config as `config.php`, fill its private values, create its private state directory and set filesystem permissions so only the PHP account can read/write it. Set `MMB_TRANSLATION_CONFIG` to its absolute path in the host's PHP environment. If the control panel cannot set this environment variable, IT can add one fixed private config path to the PHP gateway; never place credentials in public PHP source.
4. Set the exact company HTTPS origin and leave `test_http` false. The gateway intentionally does not trust arbitrary forwarded HTTPS headers. If TLS terminates at a proxy, IT must make PHP's trusted server configuration report `HTTPS=on` for verified TLS requests. Do not solve this by enabling the pilot HTTP bypass in production.
5. Apache uses the supplied `.htaccess`. For nginx/IIS/Java-fronted hosting, IT must reproduce its security policy and route PHP normally. Serve `config.js` without long-lived caching; allow same-origin microphones/fullscreen and `wss://api.deepgram.com` in the site's CSP. Deny directory listing and direct access to any configuration/source folder. The package uploads only the gateway index; private examples do not belong in the public translation directory.
6. Open the site, migrate a browser backup if needed, verify existing slides/media/YouTube and test captions with authorized presenters. If PHP is unavailable or blocked, set public translation off and deploy just the static app while IT arranges an HTTPS PHP service. Java is not technically required for this design; if the host is Java-only, a Java HTTP gateway with equivalent token/auth/translation routes would be the next implementation, not a Node service.

## Questions for IT

- PHP version, cURL availability, session permissions and the exact web document root/private configuration path?
- Apache `.htaccess` support or equivalent nginx/IIS rules? HTTPS at PHP or through a trusted proxy?
- Environment-variable support in the PHP worker; otherwise a private file path? Writable private directory and cleanup policy for expired `sess_*` and `rate-*` files?
- Outbound HTTPS allowed to `api.deepgram.com` and `api.cognitive.microsofttranslator.com`, plus device WebSocket access to Deepgram?
- Agreed Deepgram processing region and Azure Translator public/global versus private/regional resource?
- Keep the current per-browser workflow for this pilot, or separately deploy the existing MySQL/account system later?

## Limits and focused verification

The token expires for **new connection establishment** after 30 seconds; an already-open Deepgram WebSocket can continue after its token expires. The app therefore enforces the 45-minute timer and closes capture/socket; PHP separately enforces the text-session deadline. A direct browser-to-provider architecture cannot make PHP forcibly terminate a deliberately modified client socket. This is a presenter-controlled safeguard, not an absolute provider billing cap; use provider project quotas for a separate spending boundary.

Only the latest waiting phrase is retained if translation falls behind. English/Spanish language runs within mixed speech may replace one another; this is captions, not complete meeting notes. Nothing in Round 4 adds recording, AI summaries or an Obeya board.

Fullscreen depends on browser/version, user activation and site/iframe permissions. Desktop and mobile-sized Chromium layouts are checked locally. Physical Android Chrome, iPhone Safari/Home Screen and tablet browsers still need device tests; an emulated viewport cannot prove mobile browser-chrome behavior. Native video fullscreen can place video above DOM captions; use the whole-presentation fullscreen control so the subtitle overlay remains in the page.

See `ROUND4_VERIFICATION.md` for the exact checks run and remaining gaps. No live-provider success, real microphone quality, actual YouTube playback, real-host deployment or physical mobile fullscreen is claimed without those tests.
