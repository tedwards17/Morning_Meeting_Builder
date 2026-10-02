# Morning Meeting Builder — Round 4 (v0.4.0)

Development branch: **Round-4-Development**, based on approved Round 3 commit `b99ef562`. The repository root is the static GitHub Pages test build. It preserves existing content and YouTube presentation embedding. No PHP or private configuration is deployed by GitHub Pages.

Round 4 adds Deepgram Nova-3 + Azure Translator captions through a PHP gateway, compact bottom captions, explicit presentation fullscreen controls, optional translation switches and 45-minute session safeguards. Production requires static files and PHP, not a Node service.

Editable project: `translation-pilot/`. Start with [Round 4 setup and handoff](translation-pilot/docs/ROUND4_HANDOFF.md) and [tested checks and gaps](translation-pilot/docs/ROUND4_VERIFICATION.md). Build with `npm ci`, `npm run build:demo`, `npm run build:hosted`, and `npm run package` from that directory. Node is build tooling only.

The recommended deployment ZIP is `morning-meeting-builder-round4-php.zip`: built local-browser app plus independent PHP captions gateway. The optional full company account/MySQL package remains separate. No provider keys or presenter credentials belong in the repository or browser settings.

Pages settings and the default branch are unchanged. Publish this testing branch through Pages settings only when ready; live microphone tests use the private same-origin PHP pilot documented in the handoff. Preserve previous hashed assets for already-open tabs.
