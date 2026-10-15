"""Smoke-test the packaged PHP files with private file configuration, no host env vars."""
import os,json,pathlib,shutil,socket,subprocess,tempfile,time,urllib.request,urllib.error,http.cookiejar
assert os.environ.get('MMB_TEST_ALLOW_RESET')=='1'
root=pathlib.Path(__file__).resolve().parents[2];php=os.environ.get('PHP_BIN','php');fixture=json.load(open('/tmp/mmb-e2e-fixture.json'))
with tempfile.TemporaryDirectory() as directory:
 stage=pathlib.Path(directory);public=stage/'public_html';shutil.copytree(root.parent/'hosting-upload/public_html',public);private=stage/'morning-meeting-private';private.mkdir()
 with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
 origin=f'http://127.0.0.1:{port}'
 # Test-only config, copied privately. Never display its contents or package it.
 code="$c=require getenv('MMB_CONFIG');$c['origin']=$argv[1];echo '<?php return '.var_export($c,true).';';"
 (private/'config.php').write_bytes(subprocess.check_output([php,'-r',code,origin]))
 (private/'translation-config.php').write_text("<?php return "+"['enabled'=>true,'auth_mode'=>'passphrase','origin'=>'"+origin+"','test_http'=>true,'state_dir'=>"+repr(str(private/'state'))+"];" )
 router=stage/'router.php';router.write_text("<?php $p=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);if(str_contains($p,'/api/v1/')){require $_SERVER['DOCUMENT_ROOT'].'/api/index.php';return true;}return false;")
 env={k:v for k,v in os.environ.items() if k not in ['MMB_CONFIG','MMB_TRANSLATION_CONFIG']}
 server=subprocess.Popen([php,'-S',f'127.0.0.1:{port}','-t',str(public),str(router)],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  time.sleep(.4);jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
  def call(path,body):
   req=urllib.request.Request(origin+path,data=json.dumps(body).encode(),headers={'Origin':origin,'Content-Type':'application/json'})
   try:
    with client.open(req) as response:return response.status,json.loads(response.read())
   except urllib.error.HTTPError as error:return error.code,json.loads(error.read())
  assert call('/translation-api/index.php?action=status',{})[0]==401
  print('PASS upload package enforces accounts even if private captions config says passphrase')
  status,session=call('/api/v1/auth/login',{'username':fixture['users'][0]['username'],'password':fixture['password'],'device_id':__import__('uuid').uuid4().__str__(),'device_name':'Package test'})
  assert status==200,(status,session)
  print('PASS packaged account API finds private config without environment variables')
  status,result=call('/translation-api/index.php?action=status',{})
  assert status==200 and result['authenticated'],(status,result)
  print('PASS packaged captions finds private config and accepts the signed-in account')
 finally:
  server.terminate();server.wait(timeout=5)
print('Upload package: 3 checks passed')
