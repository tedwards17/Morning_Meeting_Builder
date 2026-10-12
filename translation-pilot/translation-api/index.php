<?php
declare(strict_types=1);
// Independent PHP captions gateway. No database, long-lived worker, or Node service.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
function reply(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}
function problem(int $status, string $message): never { reply(['error' => $message], $status); }
set_exception_handler(function (Throwable $e): void {
    // Do not log upstream bodies, headers, audio, transcripts, or credentials.
    error_log('MMB captions gateway failed: '.get_class($e));
    problem(500, 'Captions gateway failed. Ask IT to check the PHP configuration.');
});
$config = [];
$configPath = getenv('MMB_TRANSLATION_CONFIG');
if ($configPath) {
    if (!is_file($configPath)) problem(503, 'Private captions configuration is missing.');
    $documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: '';
    if ($documentRoot && str_starts_with(realpath($configPath), $documentRoot.'/'))
        problem(503, 'Move captions configuration outside the web document root.');
    $config = require $configPath;
    if (!is_array($config)) problem(503, 'Private captions configuration is invalid.');
}
foreach ([
    'enabled'=>'MMB_TRANSLATION_ENABLED', 'origin'=>'MMB_TRANSLATION_ORIGIN',
    'deepgram_key'=>'DEEPGRAM_API_KEY', 'translator_key'=>'AZURE_TRANSLATOR_KEY',
    'translator_region'=>'AZURE_TRANSLATOR_REGION', 'presenter_hash'=>'MMB_PRESENTER_HASH',
    'state_dir'=>'MMB_TRANSLATION_STATE_DIR', 'test_http'=>'MMB_TRANSLATION_TEST_HTTP',
] as $field=>$variable) {
    $value = getenv($variable);
    if ($value !== false) $config[$field] = in_array($field, ['enabled','test_http'], true)
        ? filter_var($value, FILTER_VALIDATE_BOOLEAN) : $value;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') problem(405, 'Use a POST request.');
$origin = (string)($config['origin'] ?? '');
if (!$origin || ($_SERVER['HTTP_ORIGIN'] ?? '') !== $origin) problem(403, 'App origin rejected. Check the private captions configuration.');
$testHttp = ($config['test_http'] ?? false) === true;
if (($_SERVER['HTTPS'] ?? '') !== 'on' && !$testHttp) problem(400, 'HTTPS is required. Ask IT to configure HTTPS at PHP or its trusted proxy.');
if (!str_starts_with($origin, 'https://') && !($testHttp && preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)))
    problem(400, 'Configure an HTTPS app origin.');
if (!($config['enabled'] ?? false)) reply(['enabled'=>false, 'error'=>'Translation is disabled on this server.'], 503);
if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) problem(415, 'Send JSON.');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) problem(413, 'Captions request is too large.');
$raw = file_get_contents('php://input', false, null, 0, 8193);
if (strlen($raw) > 8192) problem(413, 'Captions request is too large.');
try { $body = json_decode($raw, true, 16, JSON_THROW_ON_ERROR); }
catch (Throwable) { problem(400, 'Invalid JSON.'); }
if (!is_array($body)) problem(400, 'Expected a JSON object.');
$stateDir = (string)($config['state_dir'] ?? '');
if (!$stateDir || (!is_dir($stateDir) && !mkdir($stateDir, 0700, true)) || !is_writable($stateDir))
    problem(503, 'Private captions state folder is missing or not writable.');
$documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: '';
if ($documentRoot && (realpath($stateDir) === $documentRoot || str_starts_with(realpath($stateDir), $documentRoot.'/')))
    problem(503, 'Move captions state outside the web document root.');
// Session and rate-limit files stay outside public_html. Trust direct peer address only.
function throttle(string $bucket, int $limit, int $window): void {
    global $stateDir;
    $filename = $stateDir.'/rate-'.hash('sha256', $bucket.'|'.($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $file = fopen($filename, 'c+');
    if (!$file || !flock($file, LOCK_EX)) problem(503, 'Captions rate limiter is unavailable.');
    $data = json_decode(stream_get_contents($file), true) ?: ['start'=>time(), 'count'=>0];
    if (time() - (int)$data['start'] >= $window) $data = ['start'=>time(), 'count'=>0];
    $allowed = ++$data['count'] <= $limit;
    rewind($file); ftruncate($file, 0); fwrite($file, json_encode($data));
    flock($file, LOCK_UN); fclose($file); chmod($filename, 0600);
    if (!$allowed) problem(429, 'Too many captions requests. Wait a minute before trying again.');
}
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_save_path($stateDir);
session_name('mmb_captions');
session_set_cookie_params(['lifetime'=>0, 'path'=>'/', 'secure'=>str_starts_with($origin, 'https://'), 'httponly'=>true, 'samesite'=>'Strict']);
session_start();
$action = $_GET['action'] ?? '';
$authenticated = (int)($_SESSION['authenticated_until'] ?? 0) > time();
if ($action === 'status') reply(['enabled'=>true, 'authenticated'=>$authenticated, 'csrf'=>$authenticated ? $_SESSION['csrf'] : '']);
if ($action === 'unlock') {
    throttle('unlock', 10, 600);
    $passphrase = $body['passphrase'] ?? '';
    $hash = (string)($config['presenter_hash'] ?? '');
    if (!$hash) problem(503, 'Presenter access has not been configured.');
    if (!is_string($passphrase) || strlen($passphrase) > 256 || !password_verify($passphrase, $hash))
        problem(401, 'Presenter passphrase was not accepted.');
    session_regenerate_id(true);
    $_SESSION = ['authenticated_until'=>time()+8*3600, 'csrf'=>bin2hex(random_bytes(32))];
    reply(['authenticated'=>true, 'csrf'=>$_SESSION['csrf']]);
}
if (!$authenticated) problem(401, 'Presenter access expired. Start translation again.');
if (!hash_equals((string)$_SESSION['csrf'], $_SERVER['HTTP_X_MMB_CSRF'] ?? '')) problem(403, 'Captions session verification failed.');
function provider(string $url, array $headers, array $payload, string $label): array {
    if (!function_exists('curl_init')) problem(503, 'Captions require the PHP cURL extension.');
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>json_encode($payload, JSON_THROW_ON_ERROR),
        CURLOPT_HTTPHEADER=>array_merge(['Content-Type: application/json'], $headers),
        CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>15,
        CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2]);
    $response = curl_exec($curl); $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE); curl_close($curl);
    if ($status === 401 || $status === 403) problem(503, $label.' credentials or permissions were rejected. Ask IT to check the private configuration.');
    if ($status === 429) problem(503, $label.' quota or rate limit reached. Stop captions and try later.');
    if (!is_string($response) || $status < 200 || $status >= 300) problem(503, $label.' is unavailable. Check the connection and try again.');
    try { $data = json_decode($response, true, 32, JSON_THROW_ON_ERROR); }
    catch (Throwable) { problem(503, $label.' returned an unreadable response.'); }
    if (!is_array($data)) problem(503, $label.' returned an invalid response.');
    return $data;
}
if ($action === 'session') {
    throttle('session', 10, 600);
    $key = (string)($config['deepgram_key'] ?? '');
    if (!$key || empty($config['translator_key'])) problem(503, 'Deepgram and Azure Translator keys must be configured privately on the server.');
    $grant = provider('https://api.deepgram.com/v1/auth/grant', ['Authorization: Token '.$key], ['ttl_seconds'=>30], 'Deepgram');
    $token = $grant['access_token'] ?? '';
    if (!is_string($token) || strlen($token) < 32 || strlen($token) > 8192) problem(503, 'Deepgram token unavailable.');
    $_SESSION['caption_session'] = ['id'=>bin2hex(random_bytes(16)), 'expires'=>time()+45*60, 'count'=>0];
    reply(['access_token'=>$token, 'expires_in'=>30, 'sessionId'=>$_SESSION['caption_session']['id'], 'expiresAt'=>$_SESSION['caption_session']['expires']]);
}
$session = $_SESSION['caption_session'] ?? [];
if (!isset($session['id']) || !is_string($body['sessionId'] ?? null) || !hash_equals($session['id'], $body['sessionId']))
    problem(409, 'Captions session ended. Start Translation again.');
if ($action === 'stop') { unset($_SESSION['caption_session']); reply(['ok'=>true]); }
if (time() >= $session['expires']) { unset($_SESSION['caption_session']); problem(410, 'Translation stopped at the 45-minute limit.'); }
if ($action === 'text') {
    throttle('text', 120, 60);
    if (++$_SESSION['caption_session']['count'] > 3000) problem(429, 'Captions session request limit reached.');
    $text = is_string($body['text'] ?? null) ? trim($body['text']) : '';
    $source = $body['source'] ?? '';
    if (!$text || strlen($text) > 3000 || !in_array($source, ['en','es'], true)) problem(422, 'Invalid caption text or language.');
    $key = (string)($config['translator_key'] ?? ''); $region = (string)($config['translator_region'] ?? 'global');
    if (!$key || !preg_match('/^[a-z0-9-]{2,32}$/', $region)) problem(503, 'Azure Translator key or region is not configured.');
    $headers = ['Ocp-Apim-Subscription-Key: '.$key];
    if ($region !== 'global') $headers[] = 'Ocp-Apim-Subscription-Region: '.$region;
    $target = $source === 'en' ? 'es' : 'en';
    $data = provider('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from='.$source.'&to='.$target,
        $headers, [['Text'=>$text]], 'Azure Translator');
    $translated = $data[0]['translations'][0]['text'] ?? '';
    if (!is_string($translated) || !trim($translated)) problem(503, 'Azure Translator returned no caption.');
    reply(['text'=>$translated]);
}
problem(404, 'Captions action not found.');
