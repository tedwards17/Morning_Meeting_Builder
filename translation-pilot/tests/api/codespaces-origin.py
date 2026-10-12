"""Exercise the real PHP pilot router with simulated Codespaces tunnel headers."""
import json, os, socket, subprocess, tempfile, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
PHP = os.environ.get('PHP_BINARY', 'php')
checks = []
def check(name, condition):
    assert condition, name
    checks.append(name)
    print('PASS', name)
with tempfile.TemporaryDirectory() as temp:
    public = Path(temp)/'public'; public.mkdir()
    for mode in ['codespaces', 'http-disabled', 'not-codespaces']:
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
        host = f'origin-test-codespace-{port}.app.github.dev'
        origin = 'https://'+host
        env = {**os.environ, 'MMB_TRANSLATION_ORIGIN':origin,
            'MMB_TRANSLATION_ENABLED':'true', 'MMB_TRANSLATION_TEST_HTTP':'true',
            'MMB_TRANSLATION_STATE_DIR':str(Path(temp)/'private'),
            'CODESPACE_NAME':'origin-test-codespace',
            'GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN':'app.github.dev'}
        env.pop('MMB_TRANSLATION_CONFIG', None)
        if mode == 'http-disabled': env['MMB_TRANSLATION_TEST_HTTP'] = 'false'
        if mode == 'not-codespaces': env.pop('CODESPACE_NAME')
        server = subprocess.Popen([PHP, '-n', '-S', f'127.0.0.1:{port}', '-t', str(public),
            str(ROOT/'scripts/php-pilot-router.php')], env=env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        def request(request_origin, request_host=host, page_origin=origin, method='POST'):
            headers={'Host':request_host, 'Content-Type':'application/json'}
            if request_origin is not None: headers['Origin']=request_origin
            if page_origin is not None: headers['X-MMB-Page-Origin']=page_origin
            req=urllib.request.Request(f'http://127.0.0.1:{port}/translation-api/index.php?action=status',
                data=b'{}', headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=3) as response:
                    return response.status, json.load(response)
            except urllib.error.HTTPError as error: return error.code, json.load(error)
        try:
            for _ in range(30):
                try: request(origin); break
                except urllib.error.URLError: time.sleep(.1)
            if mode == 'codespaces':
                check('accepts the unchanged exact external origin', request(origin)[0]==200)
                for local in [f'http://localhost:{port}', f'http://127.0.0.1:{port}',
                              f'https://localhost:{port}', f'https://127.0.0.1:{port}']:
                    status, result=request(local)
                    check('normalizes Codespaces '+local, status==200 and not result['authenticated'])
                for local_host in [f'localhost:{port}', f'127.0.0.1:{port}']:
                    status, result=request('http://'+local_host, local_host)
                    check('normalizes both rewritten Origin and Host: '+local_host,
                        status==200 and not result['authenticated'])
                local=f'http://localhost:{port}'; local_host=f'localhost:{port}'
                check('rejects missing browser page origin', request(local, local_host, None)[0]==403)
                check('rejects a different browser page origin', request(local, local_host, 'https://other.invalid')[0]==403)
                check('rejects browser page origin with a path', request(local, local_host, origin+'/')[0]==403)
                check('rejects local host for a different port', request(local, 'localhost:1')[0]==403)
                check('does not allow cross-origin preflight', request(local, local_host, method='OPTIONS')[0]==405)
                check('rejects a different browser origin', request('https://other.invalid')[0]==403)
                check('rejects missing origin', request(None)[0]==403)
                check('rejects local origin for a different port', request('http://localhost:1')[0]==403)
                check('rejects a mismatched forwarded host', request(f'http://localhost:{port}', 'other.app.github.dev')[0]==403)
            else:
                check('normalization disabled: '+mode, request(f'http://localhost:{port}')[0]==403)
                check('both-header normalization disabled: '+mode,
                    request(f'http://localhost:{port}', f'localhost:{port}')[0]==403)
        finally:
            server.terminate(); server.wait(timeout=5)
print(f'{len(checks)} PHP origin checks passed. Actual Codespaces proxy not exercised.')
