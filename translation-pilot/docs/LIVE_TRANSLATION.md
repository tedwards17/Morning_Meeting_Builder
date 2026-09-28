# Live translation pilot (v0.3.7 source; GitHub Pages remains v0.3.6)

Presentation Mode now shows a local device clock on every slide, including embedded YouTube. Its lower-third captions can be previewed in the GitHub Pages demo with **Preview captions**. The preview is sample text and does not use the microphone or Azure.

## Enable real captions

Real English/Spanish captions require two Azure resources: Speech and Translator Text. You can try them in a local pilot without a hosted website or database, or in the signed-in hosted installation. GitHub Pages is static and cannot keep subscription keys private or run the API.

### Try it today on a PC or in a Codespace

The **v0.3.7 source archive** contains this local pilot. Download and extract it on your PC, or upload and extract it into a private Codespace workspace. It runs a small Node gateway on loopback port 8081 for Azure keys, and Vite on port 5173 for the meeting app. Saved presentations and personal media remain in that browser's local storage. This pilot does not move them between devices.

1. Create an Azure Speech resource and an Azure Translator Text resource. Copy each key and region from Azure's **Keys and Endpoint** page. If Translator's resource region is **Global**, use the literal value `global` for `AZURE_TRANSLATOR_REGION`; the gateway then omits the region header for Translator. Azure services may incur charges. In a Codespace, add four **Codespaces secrets** named `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `AZURE_TRANSLATOR_KEY`, and `AZURE_TRANSLATOR_REGION`, then restart the Codespace so they load. For a PC, set the four environment variables in your terminal session. Never commit or paste keys into Vite, GitHub Pages, or browser storage.
2. From the extracted source directory, run `npm ci`. Start the gateway in the first terminal with `node scripts/local-translation-pilot.mjs`. Start the app in a second terminal with `npm run pilot`. In a Codespace, keep port **5173 private** and open its forwarded HTTPS link. Do not expose port 8081. On your PC, open `http://localhost:5173` in Chrome. For a Codespace whose forwarded URL differs from the default GitHub format, set `MMB_PILOT_ORIGIN` to its exact origin before starting the gateway.
3. Open or create a presentation, choose **Present**, click **Start Translation**, and allow microphone access. Speak an English sentence, then a Spanish sentence. The opposite-language caption should appear under each completed sentence. Test while advancing slides and playing a video. Stop translation when done.

For a first check **without Azure resources**, the GitHub Pages **Preview captions** button tests placement only. Microsoft's Speech Studio speech translation demo lets you separately experiment with recognition and translation using an Azure resource; it does not test this app's microphone or presentation overlay. A working in-app test still needs Azure Speech and Translator resources, plus this local gateway or the hosted API.

### Later: signed-in hosted installation

1. Deploy the app's existing hosted build and `api/` to an HTTPS PHP/MySQL host, with its existing account login and same-origin API. Enable PHP cURL. Follow the hosted deployment guide for the existing setup.
2. Create Speech and Translator resources in Azure. Put `speech_key`, `speech_region`, `translator_key`, and `translator_region` in the server's **private** `config.php`, following `api/config.example.php`. Do not paste keys into GitHub, browser settings, the source archive, or `.env` values embedded by Vite.
3. Sign in as a presenter on the hosted site. Open a saved presentation and choose **Start Translation**. Allow browser microphone access. Speak English and Spanish separately, then test slides and the room's TV speakers at meeting volume. **Stop Translation** or exit Presentation Mode to release the microphone and end paid recognition.

The hosted server checks the existing login and CSRF session; the local pilot uses its private forwarded app port and origin restriction. Azure keys remain in the server environment. The client refreshes its short Speech token every eight minutes. Speech uses the universal v2 endpoint for continuous recognition with `en-US` and `es-MX` candidates; completed utterances go to Translator Text in the opposite language. No transcript or audio is stored by this application. Azure's own data handling depends on the configured resource and service terms.

## Practical limits

- English/Spanish detection changes between utterances, not within a sentence. Very short speech, loud machinery, speaker overlap, code switching, and TV audio picked up by the microphone can reduce accuracy. Validate it in the actual room before relying on it.
- YouTube remains embedded; its own full-screen button is hidden so the clock and caption overlay can remain above the video. This first pilot listens through the room microphone and does not capture a protected YouTube iframe's audio stream.
- Captions display only the translated sentence for approximately 5.5 seconds. Incoming speech replaces the caption. Only the most recent waiting sentence is queued if translation falls behind, to avoid a delayed scrolling transcript.
- If the browser denies microphone permission or either Azure service/network fails, Presentation Mode and slide navigation continue. The presenter sees a retryable error. The GitHub Pages demo intentionally reports that no secure Azure connection is configured.
- The hosted API's account authentication protects token and text requests. Limit presenter accounts and configure Azure spending/quotas for the pilot; a short-lived Speech token is still usable by its authorized holder until expiration.

## Verification after Azure configuration

The browser-only demo verifies layout, clock, slide persistence, and failure handling. A real service test needs Azure resources and either the local gateway or the deployed authenticated backend. Test English to Spanish, Spanish to English, multiple slide changes, microphone pickup of a playing YouTube video, manual stop, exit, and retry after a denied microphone or lost connection. Verify TV readability at the distance of the furthest attendee.
