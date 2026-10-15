# Interface languages — v0.4.12

The top language button shows a US flag for **English** and a Mexico flag for **Español**. The same selector is available before sign-in and in Company workspace. Its choice is remembered in this browser/device, independently of the company account. Changing it updates the current page without reloading or discarding form input.

The application name **Morning Meeting Builder** remains in English in every language. Wrapped sidebar labels stay aligned to the left.

The interface uses Mexican Spanish: navigation, page headings, form labels, helper text, accessible names, empty states, menus, notices, app confirmations/text-entry dialogs, admin/report columns and presentation/practice controls. Date/time display follows the selected interface locale; the organization's scheduling timezone does not change. Presenter passphrase entry is masked and is never persisted by the dialog.

Content is intentionally separate. Library names and entries, quotes, topics, slide titles/text, uploaded media, announcement messages, presenter/account/location names, saved transcripts and exported meeting text keep their original values. System labels surrounding those values are translated. Choosing Español does not enable captions, change the speech stream, call Azure, or translate audience content. There is no translation-service charge for switching the interface.

## Adding or changing interface text

- Use `t("English source text")` (imported as `translateUI` in existing screens) for every new label, instruction and message.
- Add the matching entry to `frontend/src/locales/es-MX.json`. English uses the original source key. Dynamic text uses named placeholders, for example `t("Remove slide “{arg0}”?", {arg0: slide.title})`; interpolate user content without translating it.
- Use `uiText` only for application messages that may already exist in component state when the language changes. Use `uiError` for server/application errors and `uiLabel`/`fieldLabel` for protocol enums and metadata labels. Never pass library content or transcript text through these functions.
- Use `confirmUI`, `promptUI` and `alertUI` from `dialogs.ts` for app popups, and await their result. These give the app control over both message and button language. Keep browser/OS leave-page warnings and file, permission or password-manager interfaces under browser control; those follow the device/browser language.
- Run `npm run check:i18n`. Demo and hosted builds run it automatically. It checks catalog entries, dynamic placeholders, source references, direct JSX text and direct recovered interface labels. Existing content/default data and internal protocol values are excluded. Developers must use this pattern for new text; the check is not an automatic machine translator or a replacement for reviewing new wording.

## Another language

Add a JSON catalog with the same English source keys in `frontend/src/locales/`; import and register it in `localeRegistry` in `i18n.ts` with its native name, locale and country. Add its flag to `language-selector.tsx`. The selector, persistence, React updates, dialogs and formatting reuse the registry. The audit discovers JSON catalogs automatically. Translate new wording in every supported catalog. Right-to-left layout would need a separate layout review if such a language is added.

## Verification

Frontend checks cover both-direction switching, subscriptions, persistence/storage failure, dynamic messages and content preservation. Browser checks cover home, templates, library editor, meetings/details, backup, settings, remote configuration, announcements, practice/live presentation controls, saved/unsaved page state, custom dialogs, reload persistence and a 390-pixel mobile viewport. A separate hosted-build browser test uses mocked API responses to cover sign-in, accounts/roles, reports, locations/devices, organization, storage, audit and server checks. Backend permissions and actual provider connections are not revalidated by those mocks.

Use Settings → Local data to confirm **v0.4.12**. GitHub Pages serves the static interface; the existing PHP Codespaces pilot is still needed for live speech. Physical mobile/fullscreen/remote and a real PHP/MySQL staging trial remain separate checks.
