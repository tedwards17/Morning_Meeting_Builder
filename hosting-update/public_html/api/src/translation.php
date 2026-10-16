<?php
// Legacy Azure Speech endpoints were replaced by the independent PHP captions gateway.
// Existing account, content, media, and synchronization endpoints are unchanged.
if (str_starts_with($path, 'translation/')) fail(410, 'Use the Round 4 captions gateway at translation-api/index.php.');
