"""Round 5 auth checks. Run only against a disposable database after integration.py."""
import os,json,uuid,subprocess,urllib.request,urllib.error,http.cookiejar
assert os.environ.get('MMB_TEST_ALLOW_RESET')=='1'
fixture=json.load(open('/tmp/mmb-e2e-fixture.json'));base=os.environ.get('MMB_TEST_URL','http://127.0.0.1:8081');checks=[]
class Client:
 def __init__(self,user=None):
  self.jar=http.cookiejar.CookieJar();self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar));self.csrf=''
  if user:
   code,data=self.call('api/v1/auth/login',{'username':user['username'],'password':fixture['password'],'device_id':str(uuid.uuid4()),'device_name':'Round 5 test'})
   assert code==200,(code,data)
   self.csrf=data['csrf']
 def call(self,path,body=None,headers=None):
  request=urllib.request.Request(base+'/'+path,data=json.dumps(body).encode() if body is not None else None,headers={'Origin':base,'Content-Type':'application/json','X-CSRF-Token':self.csrf,**(headers or {})})
  try:
   with self.http.open(request) as r:return r.status,json.loads(r.read())
  except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
def check(name,test):
 assert test,name
 checks.append(name);print('PASS',name)
admin=Client(fixture['users'][0]);second=Client(fixture['users'][0]);viewer=Client(fixture['users'][4]);anon=Client()
check('captions require account without spending provider credits',anon.call('translation-api/index.php?action=status',{})[0]==401)
library_id=str(uuid.uuid4());item_id=str(uuid.uuid4())
code,result=admin.call('api/v1/records/batch',{'records':[{'id':library_id,'kind':'libraries','expected_version':0,'data':{'id':library_id,'name':'Unicode check','description':'','archived':False,'locations':[]}}, {'id':item_id,'kind':'items','expected_version':0,'data':{'id':item_id,'libraryId':library_id,'title':'A'*299+'®','type':'lesson','description':'Boundary test','tags':[],'url':'','createdAt':'2026-10-15T00:00:00.000Z','updatedAt':'2026-10-15T00:00:00.000Z','lastUsedAt':None,'useCount':0,'archived':False,'source':'Test'}}]})
check('hosted content accepts 300 Unicode characters like the shipped library',code==200)
code,status=admin.call('translation-api/index.php?action=status',{})
check('signed-in captions need no presenter passphrase',code==200 and status['authenticated'] and bool(status['csrf']))
check('caption grant requires captions CSRF',admin.call('translation-api/index.php?action=session',{})[0]==403)
check('viewer cannot start speech',viewer.call('translation-api/index.php?action=session',{})[0]==403)
check('passphrase cannot bypass hosted accounts',admin.call('translation-api/index.php?action=unlock',{'passphrase':'anything'})[0]==403)
check('password change rejects bad current password',admin.call('api/v1/auth/password',{'current_password':'wrong','password':'replacement-password-for-test'})[0]==403)
check('password change rejects bcrypt truncation',admin.call('api/v1/auth/password',{'current_password':fixture['password'],'password':'x'*73})[0]==422)
# All account roles can update their own password. Keep this session and revoke others.
new='round5-test-password-'+str(uuid.uuid4())
check('self-service password change works',admin.call('api/v1/auth/password',{'current_password':fixture['password'],'password':new})[0]==200)
check('current session survives password change',admin.call('api/v1/auth/session')[0]==200)
check('other device session is revoked',second.call('api/v1/auth/session')[0]==401)
check('logout succeeds',admin.call('api/v1/auth/logout',{})[0]==200)
check('captions cookie cannot survive account signout',admin.call('translation-api/index.php?action=status',{})[0]==401)
# Restore fixture password privately for browser tests and remove throttle entries.
php="""$f=json_decode(stream_get_contents(STDIN),true);$c=require getenv('MMB_CONFIG');$p=new PDO($c['dsn'],$c['user'],$c['password']);$p->prepare('UPDATE accounts SET password_hash=? WHERE id=?')->execute([password_hash($f['password'],PASSWORD_DEFAULT),$f['users'][0]['id']]);$p->exec('DELETE FROM login_attempts');"""
subprocess.run([os.environ.get('PHP_BIN','php'),'-r',php],input=json.dumps(fixture),text=True,check=True)
print('Round 5 API:',len(checks),'checks passed')
