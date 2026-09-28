<?php
// Translation is available only on the authenticated hosted installation.
// Neither the Azure subscription keys nor speech transcripts are persisted here.
function translation_request(string $url,array $headers,?string $body=null):array{
 if(!function_exists('curl_init'))fail(503,'Translation requires PHP cURL');
 $curl=curl_init($url);
 curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$body??'',CURLOPT_HTTPHEADER=>$headers,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>10]);
 $answer=curl_exec($curl);$code=(int)curl_getinfo($curl,CURLINFO_HTTP_CODE);curl_close($curl);
 if(!is_string($answer)||$code<200||$code>=300)fail(503,'Azure translation is unavailable. Try again shortly.');
 return [$answer,$code];
}
if($path==='translation/session'&&$method==='POST'){
 role(['administrator','content_manager','location']);
 $key=(string)($config['speech_key']??'');$region=(string)($config['speech_region']??'');
 if(!$key||!preg_match('/^[a-z0-9-]{2,32}$/',$region))fail(503,'Live translation has not been configured');
 [$token]=translation_request('https://'.$region.'.api.cognitive.microsoft.com/sts/v1.0/issueToken',[
  'Ocp-Apim-Subscription-Key: '.$key,'Content-Length: 0',
 ]);
 if(strlen($token)<32||strlen($token)>8192)fail(503,'Speech token unavailable');
 json_out(['token'=>$token,'region'=>$region]);
}
if($path==='translation/text'&&$method==='POST'){
 role(['administrator','content_manager','location']);
 $text=is_string($body['text']??null)?trim($body['text']):'';$source=$body['source']??'';
 if(!$text||strlen($text)>3000||!in_array($source,['en','es'],true))fail(422,'Invalid translation request');
 $key=(string)($config['translator_key']??'');$region=(string)($config['translator_region']??'');
 if(!$key||!preg_match('/^[a-z0-9-]{2,32}$/',$region))fail(503,'Live translation has not been configured');
 $target=$source==='en'?'es':'en';
 [$answer]=translation_request('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from='.$source.'&to='.$target,[
  'Ocp-Apim-Subscription-Key: '.$key,'Ocp-Apim-Subscription-Region: '.$region,
  'Content-Type: application/json; charset=UTF-8',
 ],encoded([['Text'=>$text]]));
 try{$result=json_decode($answer,true,16,JSON_THROW_ON_ERROR)[0]['translations'][0]['text']??'';}catch(Throwable){$result='';}
 if(!is_string($result)||!trim($result))fail(503,'Translation response unavailable');
 json_out(['text'=>$result]);
}
