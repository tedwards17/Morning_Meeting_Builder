<?php
// Local/Codespaces PHP development server only. Never upload this router.
$root = realpath(__DIR__.'/../build/demo');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path === '/translation-api/index.php') { require __DIR__.'/../translation-api/index.php'; return true; }
if (str_starts_with($path, '/translation-api/')) { http_response_code(404); return true; }
$file = realpath($root.($path === '/' ? '/index.html' : $path));
if ($file && str_starts_with($file, $root.'/') && is_file($file)) return false;
http_response_code(404); echo 'Not found'; return true;
