# Morning Meeting Builder — Round 4 (v0.4.16)

Meeting details and presented topics come first, followed by a compact transcript with highlighted search, inline search/clear icons, full-text copy/download, and optional detailed timestamps. The square flag selector is in the sidebar; subtitles move above visible presentation controls. Existing saved recordings are preserved. Speaker diarization is not enabled.

Development branch: **Round-4-Development**, based on approved Round 3 commit `b99ef562`. The repository root is the static GitHub Pages test build. It preserves existing content and YouTube presentation embedding. No PHP or private configuration is deployed by GitHub Pages.

Round 4 adds Deepgram Nova-3 + Azure Translator captions through a PHP gateway, compact bottom captions, explicit presentation fullscreen controls, optional translation switches and 45-minute session safeguards. Production requires static files and PHP, not a Node service.

**Follow-up:** all ten requested improvements have separate checkpoints: meeting history/transcripts, save-in-place, practice fullscreen, presentation remotes, dated targeted announcements, Personal share, default skips and builder-only colors. Read [the follow-up handoff](translation-pilot/docs/ROUND4_FOLLOWUP_HANDOFF.md) and [checkpoints](translation-pilot/docs/ROUND4_CHECKPOINTS.md).

Editable project: `translation-pilot/`. Start with [Round 4 setup and handoff](translation-pilot/docs/ROUND4_HANDOFF.md) and [tested checks and gaps](translation-pilot/docs/ROUND4_VERIFICATION.md). Build with `npm ci`, `npm run build:demo`, `npm run build:hosted`, and `npm run package` from that directory. Node is build tooling only.

For authenticated company meeting history and cross-device announcements use `morning-meeting-builder-cpanel.zip` (PHP/MySQL). The existing `morning-meeting-builder-round4-php.zip` preserves the working browser-local app plus independent PHP captions gateway for local/Codespaces trials; it cannot provide company account isolation or push to other tablets. No provider keys or presenter credentials belong in the repository or browser settings.

Pages settings and the default branch are unchanged. Publish this testing branch through Pages settings only when ready; live microphone tests use the private same-origin PHP pilot documented in the handoff. Preserve previous hashed assets for already-open tabs.

**Interface language:** English / Español selector with US/Mexico flags; see [localization and future additions](translation-pilot/docs/LOCALIZATION.md). Library/presentation content and speech transcripts remain in their original language.
