# Translated meeting transcripts — v0.4.18

Meeting records follow the website's English/Mexican Spanish selection. Original speech already in that language stays unchanged; passages in the other language use their saved translation. Translated passages are italicized and marked with an asterisk. Readable and detailed views both search the displayed language.

Copy entire transcript copies the currently displayed language, with the asterisk legend. Download spoken transcript (.txt) always downloads the original English/Spanish speech in its original sequence. Download meeting notes also retains the original speech and detailed metadata. No library content is rewritten.

## Saved captions and missing translations

Each recognized phrase receives a stable identifier before original storage. A successful live caption is saved against that identifier after original storage finishes. A stale builder save cannot erase the saved translation. The original wording, timestamps, language, presenter and slide context remain immutable after completion; translations may be added later, but not silently replaced.

Live captions still favor the newest queued phrase for responsiveness. On opening a record, missing translations for the selected language are prepared in batches through the existing private Azure Translator configuration. This also supports older and transcript-only recordings. Completed translations are reused; changing the website language does not retranslate already available passages. Cached complete transcripts work offline.

The text-only review endpoint requires the same exact-origin, presenter authentication and CSRF checks as captions. It neither requests microphone access nor creates a Deepgram grant/capture session. If the presenter session is not unlocked, select Prepare translated transcript and enter the existing presenter passphrase. Review request limits: 20 phrases, 12,000 bytes per phrase, 20,000 total text bytes and 64 KiB JSON per request; 60 requests/minute. Capture retains its existing 45-minute/background/exit stop.

While a passage is unavailable, the page marks it as pending and disables Copy rather than copying a mixed or incomplete target-language transcript. Download of the original speech remains available. Errors leave the original text intact and offer retry. Preparing missing text uses the existing Azure Translator resource; cached viewing needs no further provider request.

## Account/device scope

Translations are included in the meeting payload when saved by its owning account/device. Reviews by a read-only account or administrator on another device store derived text in a browser cache rather than modifying the meeting's official payload. Cache entries are tied to the phrase's identifier, original wording and source language; account logout/change clears them with the other account data. These supplemental caches do not grant access to another account's meetings and are not a shared server translation store. Spoken downloads and original meeting history remain unchanged.

## Hosting and verification

No database migration or new secret is needed for this feature. The browser-local PHP pilot uses the existing secrets; the hosted account version continues to require PHP/MySQL setup. GitHub Pages can display already-saved translations but cannot prepare missing translations.

Verification: 59 frontend tests; 22 PHP history + 22 gateway + 20 origin checks; 19 PHP syntax files; 14 translated-review, 19 reader, 4 live-caption/storage and 10 hosted-interface browser checks. Providers, microphone hardware and account server responses were mocked where applicable. No new real provider calls, physical-device claims or live MySQL staging verification.
