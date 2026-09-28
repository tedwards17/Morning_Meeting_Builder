"""Against a disposable migrated database and running PHP API only. Never run against production."""
import os,json,uuid,secrets,subprocess,urllib.request,urllib.error,http.cookiejar,datetime
assert os.environ.get('MMB_TEST_ALLOW_RESET')=='1','Set MMB_TEST_ALLOW_RESET=1 only for a disposable database'
BASE=os.environ.get('MMB_TEST_URL','http://127.0.0.1:8081')
PHP=os.environ.get('PHP_BIN','php');CONFIG=os.environ['MMB_CONFIG']
uid=lambda:str(uuid.uuid4())
org='d7b00000-0000-4000-8000-000000000001';assembly='d7b00000-0000-4000-8000-000000000011';paint='d7b00000-0000-4000-8000-000000000012'
other=uid();otherloc=uid();password=secrets.token_urlsafe(24)
users=[{'id':uid(),'username':'test_'+role+'_'+secrets.token_hex(3),'role':role,'location_id':loc,'organization_id':o} for role,loc,o in [('administrator',None,org),('location',assembly,org),('location',paint,org),('content_manager',None,org),('report_viewer',None,org),('administrator',None,other)]]
fixtures={'config':CONFIG,'users':users,'password':password,'other':other,'otherloc':otherloc}
php='''$f=json_decode(stream_get_contents(STDIN),true);$c=require $f['config'];$p=new PDO($c['dsn'],$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);$q=$p->prepare("INSERT INTO organizations(id,name,settings) VALUES(?,?,?)");$q->execute([$f['other'],'Isolation test','{}']);$p->prepare("INSERT INTO locations(id,organization_id,name) VALUES(?,?,?)")->execute([$f['otherloc'],$f['other'],'Other']);foreach($f['users'] as $u){$p->prepare("INSERT INTO accounts(id,organization_id,location_id,username,password_hash,category,role,can_create_templates) VALUES(?,?,?,?,?,?,?,1)")->execute([$u['id'],$u['organization_id'],$u['location_id'],$u['username'],password_hash($f['password'],PASSWORD_DEFAULT),$u['location_id']?'location':'individual',$u['role']]);}'''
subprocess.run([PHP,'-r',php],input=json.dumps(fixtures),text=True,check=True)
checks=[]
def check(name,condition):
 assert condition,name
 checks.append(name);print('PASS',name)
class Client:
 def __init__(self,user=None):
  self.cookie=http.cookiejar.CookieJar();self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookie));self.csrf='';self.device=uid();self.user=user
  if user:
   code,data=self.req('auth/login',{'username':user['username'],'password':password,'device_id':self.device,'device_name':'Integration device'})
   assert code==200,(code,data)
   self.csrf=data['csrf']
 def req(self,path,body=None,csrf=True,origin=BASE):
  req=urllib.request.Request(BASE+'/api/v1/'+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json','Origin':origin,**({'X-CSRF-Token':self.csrf} if csrf else {})})
  try:
   with self.http.open(req) as r:return r.status,json.loads(r.read())
  except urllib.error.HTTPError as e:
   raw=e.read()
   try:data=json.loads(raw)
   except:data=raw.decode()
   return e.code,data
admin,asm,pnt,manager,viewer,outsider=[Client(u) for u in users];asm2=Client(users[1]);anon=Client()
check('anonymous API rejected',anon.req('sync/bootstrap')[0]==401)
check('CSRF rejected',admin.req('records/batch',{'records':[]},csrf=False)[0]==403)
check('foreign Origin rejected',admin.req('records/batch',{'records':[]},origin='https://evil.invalid')[0]==403)
check('report viewer cannot administer',viewer.req('admin/accounts')[0]==403)
check('location cannot read company reports',asm.req('admin/reports/usage')[0]==403)
check('content manager cannot manage accounts',manager.req('admin/accounts')[0]==403)
def write(client,kind,data,version=0):return client.req('records/batch',{'records':[{'id':data['id'],'kind':kind,'data':data,'expected_version':version}]})
lib={'id':uid(),'name':'Safety','description':'','archived':False,'locations':[]}
check('manager creates library',write(manager,'libraries',lib)[0]==200)
item={'id':uid(),'libraryId':lib['id'],'title':'Safe paths','description':'Keep paths clear','type':'lesson','tags':['safety'],'url':'','createdAt':'2026-09-16T00:00:00.000Z','updatedAt':'2026-09-16T00:00:00.000Z','lastUsedAt':None,'useCount':0,'archived':False,'source':'Test'}
check('manager creates content',write(manager,'items',item)[0]==200)
check('location cannot edit shared content',write(asm,'items',item,1)[0]==403)
check('stale edit conflicts',write(manager,'items',item,0)[0]==409)
check('other organization cannot reference content library',write(outsider,'items',{**item,'id':uid()})[0]==422)
slide={'id':uid(),'title':'Welcome','type':'intro','layout':'center','text':'','notes':'','optional':False,'duration':0,'contentIds':[],'selection':'oldest','count':1,'allowRepeat':False}
template={'id':uid(),'name':'Test template','description':'','theme':{'background':'#143650','foreground':'#ffffff','accent':'#71b5ff'},'groups':[],'slides':[slide],'archived':False,'company_visible':False,'access':[],'createdAt':'2026-09-16T00:00:00.000Z','updatedAt':'2026-09-16T00:00:00.000Z'}
code,res=write(asm,'templates',template);check('location capability creates template',code==200);template=res['records'][0]['data']
check('private template hidden from other location',not any(r['id']==template['id'] for r in pnt.req('templates')[1]['records']))
template['company_visible']=True;code,res=write(asm,'templates',template,1);check('owner publishes company use',code==200);template=res['records'][0]['data']
check('company use visible',any(r['id']==template['id'] for r in pnt.req('templates')[1]['records']))
check('company use does not grant edit',write(pnt,'templates',template,2)[0]==403)
template['access']=[{'location_id':paint,'can_use':True,'can_edit':True}];code,res=write(asm,'templates',template,2);template=res['records'][0]['data'];check('owner grants edit',code==200)
code,res=write(pnt,'templates',{**template,'description':'Paint edit'},3);check('selected location edit allowed',code==200);template=res['records'][0]['data']
check('editor cannot reshare',write(pnt,'templates',{**template,'company_visible':False},4)[0]==403)
check('cross organization template invisible',not outsider.req('templates')[1]['records'])
check('cross organization account ID cannot mutate',outsider.req('admin/accounts',{**users[0],'category':'individual','enabled':True,'password':password})[0]==404)
check('cross organization username cannot overwrite',outsider.req('admin/accounts',{'id':uid(),'username':users[0]['username'],'category':'individual','role':'administrator','enabled':True,'password':password})[0]==409)
now=datetime.datetime.now(datetime.timezone.utc);fmt=lambda d:d.isoformat(timespec='milliseconds').replace('+00:00','Z')
broadcast={'id':uid(),'title':'Required notice','content':item,'status':'published','importance':'required','start':fmt(now-datetime.timedelta(days=1)),'end':fmt(now+datetime.timedelta(days=1)),'recurrence':'once','priority':10,'slot':'Announcements','locations':[assembly,paint]}
code,res=write(manager,'broadcasts',broadcast);check('manager publishes targeted required broadcast',code==200);broadcast=res['records'][0]['data']
ms={'id':uid(),'definition':{**slide,'id':uid(),'title':'Required notice','type':'text'},'items':[item],'required':True,'broadcast_id':broadcast['id'],'broadcast_version':1,'skipped':False}
meeting={'id':uid(),'location_id':assembly,'templateId':template['id'],'templateName':'Test template','presenter':'Test presenter','theme':template['theme'],'groups':[],'slides':[ms],'status':'completed','date':now.date().isoformat(),'createdAt':fmt(now)}
def push(client,writes):return client.req('sync/push',{'writes':writes})
check('cross-location meeting denied',push(pnt,[{'id':meeting['id'],'kind':'meeting','data':meeting}])[0]==403)
check('required draft skip denied',push(asm,[{'id':meeting['id'],'kind':'meeting','data':{**meeting,'slides':[{**ms,'skipped':True}]}}])[0]==422)
check('meeting accepted',push(asm,[{'id':meeting['id'],'kind':'meeting','data':meeting}])[0]==200)
event={'id':uid(),'meeting_id':meeting['id'],'slide_id':ms['id'],'content_id':item['id'],'broadcast_id':broadcast['id'],'event_type':'content_presented','occurred_at_utc':fmt(now),'event_key':'client-key','organization_id':other,'location_id':paint}
check('event accepted with server-owned identity',push(asm,[{'id':event['id'],'kind':'event','data':event}])[0]==200)
check('retry event is idempotent',push(asm,[{'id':event['id'],'kind':'event','data':event}])[0]==200)
check('different UUID same logical event is idempotent',push(asm,[{'id':uid(),'kind':'event','data':{**event,'id':uid()}}])[0]==200)
events=[c['data'] for c in asm2.req('sync/bootstrap')[1]['changes'] if c['kind']=='events' and not c['deleted']]
check('two devices share one location history',len(events)==1 and events[0]['location_id']==assembly and events[0]['organization_id']==org)
check('Paint history independent',not [c for c in pnt.req('sync/bootstrap')[1]['changes'] if c['kind']=='events' and not c['deleted']])
check('other company history isolated',not [c for c in outsider.req('sync/bootstrap')[1]['changes'] if c['kind']=='events' and not c['deleted']])
skip={**event,'id':uid(),'event_type':'broadcast_skipped','content_id':None}
check('required skip requires reason',push(asm,[{'id':skip['id'],'kind':'event','data':skip}])[0]==422)
skip['reason']='Network unavailable';check('required skip with reason accepted',push(asm,[{'id':skip['id'],'kind':'event','data':skip}])[0]==200)
report=viewer.req('admin/reports/skips')[1]['rows'];check('skip reason appears centrally',len(report)==1 and report[0]['reason']=='Network unavailable')
check('all usage retained exactly once',len(viewer.req('admin/reports/usage')[1]['rows'])==2)
check('revocation scoped to device',admin.req('admin/devices',{'id':asm.device,'name':'Revoked','revoked':True})[0]==200 and asm.req('auth/session')[0]==401 and asm2.req('auth/session')[0]==200)
# Invalid uploads are rejected without exposing filesystem paths.
check('empty image upload rejected',manager.req('media',{})[0]==422)
# Incremental edits, archive tombstones, disabled identities and protected media.
checkpoint=asm2.req('sync/bootstrap')[1]['cursor']
code,changed=write(manager,'items',{**item,'description':'Edited after the meeting'},1)
check('versioned content edit accepted',code==200)
changes=asm2.req('sync/changes?after='+str(checkpoint))[1]
check('incremental cursor advances with edits',changes['cursor']>checkpoint and any(c['id']==item['id'] for c in changes['changes']))
check('historical event title retained',next(e for e in viewer.req('admin/reports/usage')[1]['rows'] if e['event_type']=='content_presented')['title']=='Safe paths')
check('archive produces synced tombstone state',write(manager,'items',{**changed['records'][0]['data'],'archived':True},2)[0]==200 and any(c['id']==item['id'] and c['data']['archived'] for c in asm2.req('sync/changes?after='+str(changes['cursor']))[1]['changes']))
check('disabled location blocks its sessions',admin.req('admin/locations',{'id':paint,'name':'Paint','enabled':False})[0]==200 and pnt.req('auth/session')[0]==401)
admin.req('admin/locations',{'id':paint,'name':'Paint','enabled':True})
check('disabled account blocks sessions',admin.req('admin/accounts',{**users[2],'category':'location','can_create_templates':True,'enabled':False})[0]==200 and pnt.req('auth/session')[0]==401)
admin.req('admin/accounts',{**users[2],'category':'location','can_create_templates':True,'enabled':True})
check('HttpOnly and Strict session cookie',any('HttpOnly' in c._rest and c._rest.get('SameSite')=='Strict' for c in admin.cookie))
import struct,zlib
chunk=lambda kind,data:struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',1,1,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b'\x00\x14\x40\x70'))+chunk(b'IEND',b'')
def upload(client,data,mime='image/png',name='test.png'):
 boundary='mmbboundary'+secrets.token_hex(8)
 raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n').encode()+data+f'\r\n--{boundary}--\r\n'.encode()
 req=urllib.request.Request(BASE+'/api/v1/media',data=raw,headers={'Origin':BASE,'X-CSRF-Token':client.csrf,'Content-Type':'multipart/form-data; boundary='+boundary})
 try:
  with client.http.open(req) as r:return r.status,json.loads(r.read())
 except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
code,asset=upload(manager,png);check('valid image upload accepted',code in [200,201])
check('image metadata includes hash and dimensions',len(asset['hash'])==64 and asset['width']==1 and asset['height']==1)
check('same-company image deduplicated',upload(manager,png)[1]['id']==asset['id'])
check('spoofed MIME and SVG rejected',upload(manager,b'<svg onload="bad()"></svg>')[0]==422)
check('location image upload forbidden',upload(asm2,png)[0]==403)
check('unreferenced protected media not accessible to location',asm2.req('media/'+asset['id'])[0]==404)
check('cross-organization image read blocked',outsider.req('media/'+asset['id'])[0]==404)
check('location template cannot launder a protected media reference',write(asm2,'templates',{**template,'id':uid(),'theme':{**template['theme'],'backgroundAssetId':asset['id']}},0)[0]==403)
# Read-only identities, omission enforcement, and application storage limits.
assert asm2.req('sync/bootstrap')[0]==200
missing={**meeting,'id':uid(),'createdAt':fmt(datetime.datetime.now(datetime.timezone.utc)),'slides':[]}
check('known required broadcast cannot be omitted from a meeting',push(asm2,[{'id':missing['id'],'kind':'meeting','data':missing}])[0]==422)
subprocess.run([PHP,'-r',"$c=require $argv[1];$p=new PDO($c['dsn'],$c['user'],$c['password']);$q=$p->prepare('UPDATE sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 DAY) WHERE account_id=?');$q->execute([$argv[2]]);",CONFIG,users[4]['id']],check=True)
check('expired session rejected',viewer.req('auth/session')[0]==401)
original_config=open(CONFIG).read()
try:
 subprocess.run([PHP,'-r',"$c=require $argv[1];$c['max_storage_bytes']=1;file_put_contents($argv[1],'<?php return '.var_export($c,true).';');",CONFIG],check=True)
 check('organization storage limit rejects upload safely',upload(manager,png)[0]==413)
finally:
 open(CONFIG,'w').write(original_config)
# Exercise multiple bootstrap pages, concurrent writes, and session-bound continuations.
paged_ids=[]
for offset in range(0,300,50):
 batch=[{'id':uid(),'kind':'libraries','expected_version':0,'data':{'name':'Pagination '+str(n)}} for n in range(offset,offset+50)]
 paged_ids.extend(w['id'] for w in batch)
 assert manager.req('records/batch',{'records':batch})[0]==200
code,first=manager.req('sync/bootstrap')
check('bootstrap response bounded to 250 records',code==200 and len(first['changes'])==250 and first['more'] and bool(first['next']))
check('bootstrap continuation bound to session',admin.req('sync/bootstrap?page='+first['next'])[0]==422)
check('tampered bootstrap continuation rejected',manager.req('sync/bootstrap?page='+first['next']+'0')[0]==422)
late={'id':uid(),'name':'Concurrent snapshot write'}
assert write(manager,'libraries',late)[0]==200
collected=first['changes'];page=first
while page.get('next'):
 code,page=manager.req('sync/bootstrap?page='+page['next']);assert code==200 and not page['reset'] and len(page['changes'])<=250
 collected+=page['changes']
check('bootstrap pages include every initial record',set(paged_ids).issubset({r['id'] for r in collected}))
code,catchup=manager.req('sync/changes?after='+str(page['cursor']))
check('snapshot cursor catches concurrent writes',code==200 and any(r['id']==late['id'] for r in catchup['changes']))
_,restart=manager.req('sync/bootstrap')
assert write(manager,'libraries',{'id':uid(),'name':'Scope change','locations':[assembly]})[0]==200
code,restarted=manager.req('sync/bootstrap?page='+restart['next'])
check('permission changes restart a partial snapshot',code==200 and restarted['reset'])
# Login throttling uses both user and IP buckets. The fixture logins consumed 7 attempts.
last=None
for _ in range(12):last=anon.req('auth/login',{'username':'missing','password':'invalid','device_id':uid(),'device_name':'test'})[0]
check('login throttling active',last==429)
print(f'API integration: {len(checks)} checks passed')
open('/tmp/mmb-api-results.json','w').write(json.dumps({'checks':checks,'count':len(checks)},indent=2))

# Ephemeral browser test handoff; never included in any package.
open('/tmp/mmb-e2e-fixture.json','w').write(json.dumps({'users':users,'password':password,'assembly':assembly,'paint':paint}))
subprocess.run([PHP,'-r',"$c=require $argv[1];$p=new PDO($c['dsn'],$c['user'],$c['password']);$p->exec('DELETE FROM login_attempts');",CONFIG],check=True)

subprocess.run([PHP,'-r',"$c=require $argv[1];$p=new PDO($c['dsn'],$c['user'],$c['password']);foreach(['usage_events','meetings','record_versions','records','media_assets','sync_changes'] as $t)$p->exec('DELETE FROM '.$t);$p->exec('UPDATE organizations SET sequence=0,permission_epoch=0');",CONFIG],check=True)
