<?php
declare(strict_types=1);
require __DIR__.'/src/core.php';
$GLOBALS['request_id']=bin2hex(random_bytes(8));
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: same-origin');header('X-Frame-Options: DENY');header('X-Request-ID: '.$GLOBALS['request_id']);
set_exception_handler(function(Throwable $e){if(isset($GLOBALS['pdo'])&&$GLOBALS['pdo']->inTransaction())$GLOBALS['pdo']->rollBack();error_log('MMB '.$GLOBALS['request_id'].' '.$e->getMessage());fail(500,'Request failed. Contact your administrator with the request ID.');});
$configPath=getenv('MMB_CONFIG')?:dirname(__DIR__,2).'/morning-meeting-private/config.php';
if(!is_file($configPath))fail(503,'Private configuration is not installed');
$config=require $configPath;$GLOBALS['config']=$config;
$pdo=new PDO($config['dsn'],$config['user'],$config['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false]);$GLOBALS['pdo']=$pdo;query("SET time_zone='+00:00'");
$method=$_SERVER['REQUEST_METHOD'];$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);$path=preg_replace('#^.*?/api/v1/?#','',$path);
if((int)($_SERVER['CONTENT_LENGTH']??0)>max($config['max_image_bytes']+1048576,2097152))fail(413,'Request too large');
$body=[];if($method!=='GET'&&str_contains($_SERVER['CONTENT_TYPE']??'','application/json')){try{$body=json_decode(file_get_contents('php://input'),true,128,JSON_THROW_ON_ERROR)??[];}catch(Throwable){fail(400,'Invalid JSON');}if(!is_array($body))fail(400,'Expected an object');}
if($method!=='GET'){if(($_SERVER['HTTP_ORIGIN']??'')!==$config['origin'])fail(403,'Origin rejected');if(($_SERVER['HTTPS']??'')!=='on'&&!($config['test_http']??false))fail(400,'HTTPS is required');}
require __DIR__.'/src/auth.php';
if($path==='auth/login'&&$method==='POST')login($body);
authenticate();
if($method!=='GET'&&!hash_equals($GLOBALS['session']['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))fail(403,'Session verification failed');
require __DIR__.'/src/translation.php';
if($path==='auth/session'&&$method==='GET')json_out(session_response());
if($path==='auth/logout'&&$method==='POST'){query('DELETE FROM sessions WHERE token_hash=?',[$GLOBALS['session']['token_hash']]);setcookie('mmb_session','',['expires'=>1,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);json_out(['ok'=>true]);}
require __DIR__.'/src/media.php';require __DIR__.'/src/records.php';require __DIR__.'/src/sync.php';require __DIR__.'/src/admin.php';
fail(404,'Route not found');
