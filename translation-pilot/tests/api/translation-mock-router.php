<?php
// Test-only cURL substitute: run with php -n. Never included in deployment packages.
foreach (['CURLOPT_POST','CURLOPT_POSTFIELDS','CURLOPT_HTTPHEADER','CURLOPT_RETURNTRANSFER','CURLOPT_CONNECTTIMEOUT','CURLOPT_TIMEOUT','CURLOPT_SSL_VERIFYPEER','CURLOPT_SSL_VERIFYHOST','CURLINFO_HTTP_CODE'] as $i=>$name) define($name,$i+1);
function curl_init($url) { return (object)['url'=>$url,'options'=>[]]; }
function curl_setopt_array($curl,$options) { $curl->options=$options; }
function curl_exec($curl) {
    file_put_contents(getenv('MMB_TEST_CAPTURE'), json_encode(['url'=>$curl->url,'options'=>$curl->options])."\n", FILE_APPEND);
    if (str_contains($curl->url,'/auth/grant')) return json_encode(['access_token'=>str_repeat('temporary-token-',5),'expires_in'=>30]);
    return json_encode([['translations'=>[['text'=>'Buenos días']]]]);
}
function curl_getinfo($curl,$option) { return 200; }
function curl_close($curl) {}
require __DIR__.'/../../translation-api/index.php';
