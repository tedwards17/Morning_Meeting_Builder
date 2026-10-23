"""Batch 1 regression checks. Requires only a DISPOSABLE migrated/seeded database."""
import os,json,uuid,secrets,subprocess,urllib.request,urllib.error,http.cookiejar
assert os.environ.get('MMB_TEST_ALLOW_RESET')=='1','Disposable database only'
BASE=os.environ.get('MMB_TEST_URL','http://127.0.0.1:8081');PHP=os.environ.get('PHP_BIN','php')
uid=lambda:str(uuid.uuid4());password=secrets.token_urlsafe(24);org=uid();loc=uid()
users=[{'id':uid(),'username':'batch1_'+r+'_'+secrets.token_hex(4),'role':r} for r in ['administrator','content_manager','location','report_viewer']]
f={'config':os.environ['MMB_CONFIG'],'org':org,'loc':loc,'password':password,'users':users}
def sql(code):return subprocess.run([PHP,'-r',"$f=json_decode(stream_get_contents(STDIN),true);$c=require $f['config'];$p=new PDO($c['dsn'],$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);"+code],input=json.dumps(f),text=True,check=True,capture_output=True)
sql('''$p->prepare("INSERT INTO organizations(id,name,settings) VALUES(?,?,'{}')")->execute([$f['org'],'Batch 1 test']);$p->prepare("INSERT INTO locations(id,organization_id,name) VALUES(?,?,'Batch 1 location')")->execute([$f['loc'],$f['org']]);foreach($f['users'] as $u)$p->prepare("INSERT INTO accounts(id,organization_id,location_id,username,password_hash,category,role,can_create_templates) VALUES(?,?,?,?,?,?,?,0)")->execute([$u['id'],$f['org'],$u['role']==='location'?$f['loc']:null,$u['username'],password_hash($f['password'],PASSWORD_DEFAULT),$u['role']==='location'?'location':'individual',$u['role']]);''')
class Client:
 def __init__(self,u):
  self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));self.csrf=''
  status,data=self.req('auth/login',{'username':u['username'],'password':password,'device_id':uid(),'device_name':'Batch 1 API'})
  assert status==200,(status,data);self.csrf=data['csrf']
 def req(self,path,body=None):
  r=urllib.request.Request(BASE+'/api/v1/'+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json','Origin':BASE,'X-CSRF-Token':self.csrf})
  try:
   with self.http.open(r) as res:return res.status,json.loads(res.read())
  except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
 def write(self,kind,data,version=0):return self.req('records/batch',{'records':[{'id':data['id'],'kind':kind,'data':data,'expected_version':version}]})
checks=0
def check(name,value):
 global checks
 assert value,name
 checks+=1;print('PASS',name)
sql("$p->exec('DELETE FROM login_attempts');")
clients=[Client(u) for u in users]
for u,c in zip(users[:2],clients[:2]):
 lib={'id':uid(),'name':u['role']+' library','description':'','archived':False}
 status,res=c.write('libraries',lib);check(u['role']+' creates a library',status==200)
 lib=res['records'][0]['data'];status,res=c.write('libraries',{**lib,'name':lib['name']+' renamed'},lib['version']);check(u['role']+' edits library',status==200)
 item={'id':uid(),'libraryId':lib['id'],'title':'Batch 1 text','description':'Keep the walkway clear.','type':'lesson','tags':[],'url':'','createdAt':'2026-10-23T00:00:00.000Z','updatedAt':'2026-10-23T00:00:00.000Z','lastUsedAt':None,'useCount':0,'archived':False,'source':''}
 status,res=c.write('items',item);check(u['role']+' creates text content',status==200)
 item=res['records'][0]['data'];status,res=c.write('items',{**item,'description':'Updated text.'},item['version']);check(u['role']+' edits text content',status==200)
 check(u['role']+' content appears in API list',any(r['id']==item['id'] and r['description']=='Updated text.' for r in c.req('content')[1]['records']))
for u,c in zip(users[2:],clients[2:]):
 for kind in ['lesson','external-video']:
  added={**item,'id':uid(),'type':kind,'title':u['role']+' contribution '+kind,'url':'https://youtu.be/dQw4w9WgXcQ' if kind=='external-video' else ''}
  status,res=c.write('items',added);check(u['role']+' adds '+kind+' to another account library',status==200)
 status,res=c.write('libraries',{'id':uid(),'name':'Denied','description':'','archived':False});check(u['role']+' creation denied with role guidance',status==403 and 'Administrator and Content Manager' in res['error']['message'])
 status,res=c.write('items',item,item['version']);check(u['role']+' edit denied with role guidance',status==403 and 'Administrator and Content Manager' in res['error']['message'])
c=clients[0]
# Independent company movement and Safety libraries plus a template for builder regression.
f['stretchLibrary']='00000000-0000-4000-8000-000000000002';f['safetyLibrary']='00000000-0000-4000-8000-000000000003'
for key,name in [('stretchLibrary','Stretches'),('safetyLibrary','Safety')]:
 status,res=c.write('libraries',{'id':f[key],'name':name,'description':'','archived':False});check(name+' fixture library saved',status==200)
f['stretchText']='Movement instructions from company library';f['stretchVideo']='Movement video from company library'
for title,kind,url in [(f['stretchText'],'lesson',''),(f['stretchVideo'],'external-video','https://youtu.be/dQw4w9WgXcQ')]:
 status,res=clients[2].write('items',{**item,'id':uid(),'libraryId':f['stretchLibrary'],'title':title,'type':kind,'url':url});check('location adds '+kind+' to company Stretches',status==200)
slide={'id':'00000000-0000-4000-8000-000000001002','title':'Morning movement','type':'stretch','layout':'center','text':'','notes':'','optional':False,'duration':30,'contentIds':[],'selection':'oldest','count':1,'allowRepeat':False,'libraryId':f['stretchLibrary']}
f['templateId']=uid()
status,res=c.write('templates',{'id':f['templateId'],'name':'Batch 1 movement regression','description':'','theme':{'background':'#143650','foreground':'#ffffff','accent':'#71b5ff'},'groups':[],'slides':[slide],'archived':False,'company_visible':True,'access':[],'createdAt':'2026-10-23T00:00:00.000Z','updatedAt':'2026-10-23T00:00:00.000Z'});check('company movement template saved',status==200)
status,res=c.write('libraries',{'id':uid(),'name':'á'*300,'description':'','archived':False});check('300-character Unicode library name accepted',status==200)
status,res=c.write('libraries',{'id':uid(),'name':'á'*301,'description':'','archived':False});check('301-character name rejected as validation',status==422)
status,res=c.write('libraries',{'id':uid(),'name':'   ','description':'','archived':False});check('blank library name rejected as validation',status==422)
# Force a real transaction failure without modifying production code or private config.
failed_id=uid()
sql("$p->exec('RENAME TABLE record_versions TO batch1_record_versions');")
try:
 status,res=c.write('libraries',{'id':failed_id,'name':'Rollback check','description':'','archived':False})
 check('unexpected PHP/database failure returns safe request ID',status==500 and len(res['error']['request_id'])==16 and 'SQLSTATE' not in json.dumps(res) and 'batch1_record_versions' not in json.dumps(res))
 print('Expected server failure request ID:',res['error']['request_id'])
finally:sql("$p->exec('RENAME TABLE batch1_record_versions TO record_versions');")
check('failed transaction left no library record',not any(r['id']==failed_id for r in c.req('libraries')[1]['records']))
status,res=c.write('libraries',{'id':failed_id,'name':'Retry works','description':'','archived':False});check('retry saves after server recovers',status==200)
# Keep this fixture suite from consuming the next suite's shared-IP login budget.
# Production throttle behavior is unchanged; this database is explicitly disposable.
sql("$p->exec('DELETE FROM login_attempts');")
open('/tmp/mmb-round6-fixture.json','w').write(json.dumps(f))
print('Round 6 API:',checks,'checks passed')
