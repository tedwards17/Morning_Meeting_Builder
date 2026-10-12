<?php
// Local/Codespaces PHP development server only. Never upload this router.
$root = realpath(__DIR__.'/../build/demo');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path === '/translation-api/index.php') {
    // Codespaces can rewrite both Origin and Host to localhost.
    // Normalize only this development router's loopback tunnel, never production PHP.
    $configured = getenv('MMB_TRANSLATION_ORIGIN') ?: '';
    $codespace = getenv('CODESPACE_NAME') ?: '';
    $domain = getenv('GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN') ?: 'app.github.dev';
    $port = (string)($_SERVER['SERVER_PORT'] ?? '');
    $forwardedHost = $codespace.'-'.$port.'.'.$domain;
    $received = $_SERVER['HTTP_ORIGIN'] ?? '';
    $pageOrigin = $_SERVER['HTTP_X_MMB_PAGE_ORIGIN'] ?? '';
    $allowedHosts = [$forwardedHost, 'localhost:'.$port, '127.0.0.1:'.$port];
    $localOrigins = ['http://localhost:'.$port, 'http://127.0.0.1:'.$port,
        'https://localhost:'.$port, 'https://127.0.0.1:'.$port];
    if (PHP_SAPI === 'cli-server' && $codespace !== '' &&
        filter_var(getenv('MMB_TRANSLATION_TEST_HTTP'), FILTER_VALIDATE_BOOLEAN) &&
        $configured === 'https://'.$forwardedHost &&
        in_array($_SERVER['HTTP_HOST'] ?? '', $allowedHosts, true) &&
        $pageOrigin === $configured &&
        in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1', '::ffff:127.0.0.1'], true) &&
        in_array($received, $localOrigins, true)) {
        $_SERVER['HTTP_ORIGIN'] = $configured;
    }
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== $configured) {
        // Public routing values only; never log cookies, passwords, keys or request bodies.
        error_log('MMB pilot origin mismatch '.json_encode([
            'expected'=>$configured, 'received'=>$received,
            'host'=>$_SERVER['HTTP_HOST'] ?? '',
            'pageOrigin'=>$pageOrigin,
        ]));
    }
    require __DIR__.'/../translation-api/index.php';
    return true;
}
if (str_starts_with($path, '/translation-api/')) { http_response_code(404); return true; }
$file = realpath($root.($path === '/' ? '/index.html' : $path));
if ($file && str_starts_with($file, $root.'/') && is_file($file)) return false;
http_response_code(404); echo 'Not found'; return true;
