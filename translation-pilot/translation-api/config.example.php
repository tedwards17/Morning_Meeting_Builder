<?php
// Store OUTSIDE the web root as config.php. Set MMB_TRANSLATION_CONFIG to its path.
// Environment variables work without this file. Empty provider values are examples only.
return [
    'enabled' => false, // MMB_TRANSLATION_ENABLED=true to enable paid provider requests.
    'origin' => 'https://meetings.example.invalid', // MMB_TRANSLATION_ORIGIN: exact app origin, no path.
    'deepgram_key' => '', // DEEPGRAM_API_KEY: permanent key with Member permissions.
    'translator_key' => '', // AZURE_TRANSLATOR_KEY: Translator Text resource key.
    'translator_region' => 'global', // AZURE_TRANSLATOR_REGION: global or resource region, e.g. westus2.
    'presenter_hash' => '', // MMB_PRESENTER_HASH: PHP password_hash of a presenter passphrase.
    'state_dir' => '/home/ACCOUNT/morning-meeting-private/translation-state', // MMB_TRANSLATION_STATE_DIR: writable, private.
    'test_http' => false, // MMB_TRANSLATION_TEST_HTTP=true ONLY for localhost/Codespaces TLS proxy pilot.
];
