"""PHP gateway integration with deterministic provider responses; no real credentials/network."""
import http.cookiejar, json, os, re, socket, subprocess, tempfile, time, urllib.request, urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PHP=os.environ.get('PHP_BINARY','php')
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name);print('PASS',name)
with tempfile.TemporaryDirectory() as tmp:
    state=Path(tmp)/'state';state.mkdir();capture=Path(tmp)/'capture.jsonl'
    hash_=subprocess.check_output([PHP,'-n',str(ROOT/'scripts/presenter-hash.php')],input=b'example-only-test-passphrase').decode().strip()
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    origin=f'http://127.0.0.1:{port}'
    env={**os.environ,'MMB_TRANSLATION_ENABLED':'true','MMB_TRANSLATION_TEST_HTTP':'true','MMB_TRANSLATION_ORIGIN':origin,'MMB_TRANSLATION_STATE_DIR':str(state),'MMB_PRESENTER_HASH':hash_,'DEEPGRAM_API_KEY':'test-deepgram-placeholder','AZURE_TRANSLATOR_KEY':'test-azure-placeholder','AZURE_TRANSLATOR_REGION':'global','MMB_TEST_CAPTURE':str(capture)}
    server=subprocess.Popen([PHP,'-n','-S',f'127.0.0.1:{port}',str(ROOT/'tests/api/translation-mock-router.php')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
        def request(action,body=None,csrf='',custom_origin=origin):
            req=urllib.request.Request(origin+'/translation-api/index.php?action='+action,data=json.dumps(body or {}).encode(),headers={'Origin':custom_origin,'Content-Type':'application/json','X-MMB-CSRF':csrf,'X-MMB-Page-Origin':origin})
            try:
                with client.open(req,timeout=3) as res:return res.status,json.load(res)
            except urllib.error.HTTPError as err:return err.code,json.load(err)
        for _ in range(30):
            try:status,body=request('status');break
            except urllib.error.URLError:time.sleep(.1)
        check('status requires presenter authentication',status==200 and not body['authenticated'])
        check('rejects incorrect native origin even with the configured page-origin header',request('status',custom_origin='https://untrusted.invalid')[0]==403)
        check('blocks token mint before authentication',request('session')[0]==401)
        check('rejects incorrect passphrase',request('unlock',{'passphrase':'incorrect'})[0]==401)
        status,auth=request('unlock',{'passphrase':'example-only-test-passphrase'});csrf=auth['csrf']
        check('presenter unlock creates CSRF session',status==200 and len(csrf)==64)
        check('rejects missing CSRF',request('session')[0]==403)
        status,grant=request('session',csrf=csrf);sid=grant['sessionId']
        check('session returns temporary credential and bounded deadline',status==200 and grant['expires_in']==30 and 2690<grant['expiresAt']-time.time()<=2700)
        calls=[json.loads(line) for line in capture.read_text().splitlines()]
        check('Deepgram grant requests a 30-second TTL server-side',calls[0]['url']=='https://api.deepgram.com/v1/auth/grant' and json.loads(calls[0]['options']['2'])=={'ttl_seconds':30})
        check('validates source language and text length',request('text',{'sessionId':sid,'text':'hi','source':'fr'},csrf)[0]==422 and request('text',{'sessionId':sid,'text':'x'*3001,'source':'en'},csrf)[0]==422)
        status,answer=request('text',{'sessionId':sid,'text':'Good morning','source':'en'},csrf)
        check('English to Spanish response',status==200 and answer['text']=='Buenos días')
        request('text',{'sessionId':sid,'text':'Buenos días','source':'es'},csrf)
        calls=[json.loads(line) for line in capture.read_text().splitlines()]
        check('uses opposite Azure target language',calls[-1]['url'].endswith('from=es&to=en') and calls[-2]['url'].endswith('from=en&to=es'))
        check('global Translator omits region header',not any('Subscription-Region:' in v for v in calls[-1]['options']['3']))
        check('stop invalidates the active translation session',request('stop',{'sessionId':sid},csrf)[0]==200 and request('text',{'sessionId':sid,'text':'hi','source':'en'},csrf)[0]==409)
        status,grant=request('session',csrf=csrf);sid=grant['sessionId']
        for file in state.glob('sess_*'):
            text=file.read_text();file.write_text(re.sub(r'("expires";i:)\d+',r'\g<1>1',text))
        check('server rejects an expired 45-minute session',request('text',{'sessionId':sid,'text':'hi','source':'en'},csrf)[0]==410)
        check('never returns permanent provider credentials',all('test-deepgram-placeholder' not in json.dumps(value) and 'test-azure-placeholder' not in json.dumps(value) for value in [auth,grant,answer]))
        for _ in range(10):last=request('unlock',{'passphrase':'wrong'})
        check('limits repeated presenter access attempts',last[0]==429)
        print(f'{len(checks)} PHP gateway checks passed; provider calls mocked.')
    finally:server.terminate();server.wait(timeout=5)
