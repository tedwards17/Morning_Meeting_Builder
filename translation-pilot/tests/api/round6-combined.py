"""Combined Batches 2/3. Only a disposable database; never production."""
import os,json,uuid,secrets,subprocess,urllib.request,urllib.error,http.cookiejar,base64,pathlib
assert os.environ.get('MMB_TEST_ALLOW_RESET')=='1','Disposable database only'
ROOT=pathlib.Path(__file__).resolve().parents[2];BASE=os.environ.get('MMB_TEST_URL','http://127.0.0.1:8081');PHP=os.environ.get('PHP_BIN','php')
uid=lambda:str(uuid.uuid4());org=uid();other=uid();a=uid();b=uid();password=secrets.token_urlsafe(24)
users=[{'id':uid(),'username':'combined_'+role+'_'+secrets.token_hex(4),'role':role,'location_id':loc,'org':o} for role,loc,o in [('administrator',None,org),('location',a,org),('location',b,org),('content_manager',None,org),('report_viewer',None,org),('administrator',None,other)]]
f={'config':os.environ['MMB_CONFIG'],'org':org,'other':other,'a':a,'b':b,'users':users,'password':password,'safety':uid(),'stretch':uid(),'template':uid()}
def sql(code):return subprocess.run([PHP,'-r',"$f=json_decode(stream_get_contents(STDIN),true);$c=require $f['config'];$p=new PDO($c['dsn'],$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);"+code],input=json.dumps(f),text=True,check=True,capture_output=True,cwd=ROOT)
sql('''$p->prepare("INSERT INTO organizations(id,name,settings) VALUES(?,?,'{}')")->execute([$f['org'],'Combined tests']);$p->prepare("INSERT INTO organizations(id,name,settings) VALUES(?,?,'{}')")->execute([$f['other'],'Other test']);foreach([[$f['a'],'Assembly'],[$f['b'],'Paint']] as $l)$p->prepare("INSERT INTO locations(id,organization_id,name) VALUES(?,?,?)")->execute([$l[0],$f['org'],$l[1]]);foreach($f['users'] as $u)$p->prepare("INSERT INTO accounts(id,organization_id,location_id,username,password_hash,category,role,can_create_templates) VALUES(?,?,?,?,?,?,?,0)")->execute([$u['id'],$u['org'],$u['location_id'],$u['username'],password_hash($f['password'],PASSWORD_DEFAULT),$u['role']==='location'?'location':'individual',$u['role']]);$p->exec('DELETE FROM login_attempts');''')
class Client:
 def __init__(self,u):
  self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));self.csrf='';self.device=uid()
  code,res=self.req('auth/login',{'username':u['username'],'password':password,'device_id':self.device,'device_name':'Combined API'})
  assert code==200,(code,res);self.csrf=res['csrf'];self.session=res
 def req(self,path,body=None,raw=None,ctype='application/json',headers=None):
  r=urllib.request.Request(BASE+'/api/v1/'+path,data=raw if raw is not None else json.dumps(body).encode() if body is not None else None,headers={'Content-Type':ctype,'Origin':BASE,'X-CSRF-Token':self.csrf,**(headers or {})})
  try:
   with self.http.open(r) as res:return res.status,json.loads(res.read()) if 'json' in res.headers.get('Content-Type','') else res.read()
  except urllib.error.HTTPError as e:
   data=e.read()
   try:return e.code,json.loads(data)
   except:return e.code,data
 def write(self,kind,data):return self.req('records/batch',{'records':[{'id':data['id'],'kind':kind,'data':data,'expected_version':data.get('version',0)}]})
 def upload(self,name,mime,data):
  boundary='combined'+secrets.token_hex(8);body=(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n').encode()+data+f'\r\n--{boundary}--\r\n'.encode()
  return self.req('media',raw=body,ctype='multipart/form-data; boundary='+boundary)
 def rotation(self,loc,item,enabled):return self.req('content/rotation',{'location_id':loc,'content_id':item,'enabled':enabled})
 def context(self,loc):return self.req('content/rotation?location='+loc)[1]
admin,asm,paint,manager,viewer,outsider=[Client(u) for u in users];checks=0
def check(name,value):
 global checks
 assert value,name
 checks+=1;print('PASS',name)
for id,name in [(f['safety'],'Safety'),(f['stretch'],'Stretches')]:assert admin.write('libraries',{'id':id,'name':name,'description':'','archived':False})[0]==200
png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAAHUlEQVR4nGOU9M5jIBcwka1zVPOo5lHNo5qpohkASx8A+rXaktMAAAAASUVORK5CYII=')
code,image=asm.upload('shared.png','image/png',png);check('location uploads a shared image',code==201)
code,video=asm.upload('shared.webm','video/webm',(ROOT/'tests/fixtures/reusable.webm').read_bytes());check('location uploads reusable WebM video',code==201)
f['image']=image;f['video']=video
base={'libraryId':f['safety'],'description':'Useful instructions','tags':[],'url':'','createdAt':'2026-10-20T00:00:00.000Z','updatedAt':'2026-10-20T00:00:00.000Z','lastUsedAt':None,'useCount':0,'archived':False,'source':'Regression'}
legacy=[]
for kind in ['lesson','text','vocabulary','recognition','stretch','image','image-text','video','external-video','link']:
 row={**base,'id':uid(),'title':'Legacy '+kind,'type':kind,'locations':[]}
 if kind in ['image','image-text','video']:row['assetId']=video['id'] if kind=='video' else image['id']
 if kind in ['link','external-video']:row['url']='https://www.youtube.com/watch?v=dQw4w9WgXcQ' if kind=='external-video' else 'https://example.org/reference'
 legacy.append(row)
# Simulate genuine records present BEFORE 005, then execute its SQL once.
f['legacy']=legacy
sql('''$p->exec('DROP TABLE content_rotation');$p->exec('DELETE FROM schema_migrations WHERE version=5');foreach($f['legacy'] as $d){$d['organization_id']=$f['org'];$d['owner_id']=$f['users'][0]['id'];$d['version']=1;$p->prepare("INSERT INTO records(organization_id,kind,id,owner_id,version,archived,payload,updated_at) VALUES(?,'items',?,?,1,0,?,UTC_TIMESTAMP())")->execute([$f['org'],$d['id'],$d['owner_id'],json_encode($d)]);$p->prepare("INSERT INTO record_versions(organization_id,kind,record_id,version,payload,created_at) VALUES(?,'items',?,1,?,UTC_TIMESTAMP())")->execute([$f['org'],$d['id'],json_encode($d)]);} $p->exec(file_get_contents('database/migrations/005_content_rotation.sql'));''')
check('migration preserves every legacy item in both existing location rotations',all(row['id'] in asm.context(a)['enabled'] and row['id'] in paint.context(b)['enabled'] for row in legacy))
subprocess.run([PHP,'scripts/migrate.php',f['config']],cwd=ROOT,check=True,capture_output=True);check('migration runner safely skips installed migration',True)
def create(client,title='New text',**fields):
 row={**base,'id':uid(),'title':title,'type':'lesson','allLocations':True,'locations':[],**fields};code,res=client.write('items',row);assert code==200,(code,res);return res['records'][0]['data']
new=create(asm)
check('new shared content visible at Assembly and Paint',new['id'] in asm.context(a)['available'] and new['id'] in paint.context(b)['available'])
check('new content starts outside every rotation',new['id'] not in asm.context(a)['enabled'] and new['id'] not in paint.context(b)['enabled'])
check('normal account opts into its own rotation',asm.rotation(a,new['id'],True)[0]==200)
check('Assembly enrollment does not enroll Paint',new['id'] in asm.context(a)['enabled'] and new['id'] not in paint.context(b)['enabled'])
check('Paint manages same item independently',paint.rotation(b,new['id'],True)[0]==200)
asm.rotation(a,new['id'],False);check('removing Assembly preserves Paint and browsing access',new['id'] not in asm.context(a)['enabled'] and new['id'] in paint.context(b)['enabled'] and new['id'] in asm.context(a)['available'])
check('crafted cross-location rotation request rejected',asm.rotation(b,new['id'],False)[0]==403)
check('content manager gets no implicit cross-location rotation rights',manager.rotation(a,new['id'],True)[0]==403)
check('report viewer gets no implicit cross-location rotation rights',viewer.rotation(a,new['id'],True)[0]==403)
check('another organization cannot manage this rotation',outsider.rotation(a,new['id'],True)[0]==403)
check('administrator manages a selected company location',admin.rotation(a,new['id'],True)[0]==200)
asm2=Client(users[1]);check('membership persists on another device for same location',new['id'] in asm2.context(a)['enabled'])
partial=create(asm,'Paint only',allLocations=False,locations=[b]);check('individual sharing available only at receiving location',partial['id'] not in asm.context(a)['available'] and partial['id'] in paint.context(b)['available'])
check('cannot enroll unavailable item',asm.rotation(a,partial['id'],True)[0]==403)
check('ordinary creator cannot alter another location access through editing',asm.write('items',{**new,'allLocations':False,'locations':[a]})[0]==403)
invalid={**base,'id':uid(),'title':'Invalid sharing','type':'lesson','allLocations':False,'locations':[]};check('at least one receiving location required',asm.write('items',invalid)[0]==422)
for client,name in [(manager,'content manager'),(viewer,'report viewer')]:check(name+' can still contribute',bool(create(client,name+' contribution')))
link=create(asm,'Website',type='link',url='https://example.org/reference',description='');check('link accepts optional body text',link['description']=='')
check('unsafe URL rejected',asm.write('items',{**base,'id':uid(),'title':'Bad URL','type':'link','url':'javascript:alert(1)'})[0]==422)
check('text body required',asm.write('items',{**base,'id':uid(),'title':'No text','type':'lesson','description':''})[0]==422)
media=create(asm,'Reusable video',type='video',assetId=video['id'],description='');check('video accepts optional accompanying text',media['type']=='video')
check('protected reusable video download works',asm.req('media/'+video['id'])[0]==200)
code,chunk=asm.req('media/'+video['id'],headers={'Range':'bytes=0-15'});check('reusable video supports byte ranges',code==206 and len(chunk)==16)
# Saving/archiving retains snapshots and media. A saved draft is deliberately kept.
slide={'id':uid(),'title':'Safety','type':'library','layout':'center','text':'','notes':'','optional':False,'duration':0,'contentIds':[],'selection':'oldest','count':1,'allowRepeat':False,'libraryId':f['safety']}
movement={**slide,'id':'00000000-0000-4000-8000-000000001002','title':'Morning movement','type':'stretch','libraryId':f['stretch']}
template={'id':f['template'],'name':'Combined test meeting','description':'','theme':{'background':'#143650','foreground':'#ffffff','accent':'#71b5ff'},'groups':[],'slides':[movement,slide],'archived':False,'company_visible':True,'access':[],'createdAt':'2026-10-20T00:00:00.000Z','updatedAt':'2026-10-20T00:00:00.000Z'}
code,res=admin.write('templates',template);assert code==200,(code,res)
f['template']=res['records'][0]['data']
image_item=create(asm,'Saved image',type='image',assetId=image['id'],description='')
meeting={'id':uid(),'location_id':a,'templateId':template['id'],'templateName':template['name'],'theme':template['theme'],'groups':[],'presenter':'Saved snapshot','date':'2026-10-26','createdAt':'2026-10-26T00:00:00.000Z','status':'draft','slides':[{'id':uid(),'definition':slide,'items':[image_item],'skipped':False}]}
check('save presentation with shared image',asm.req('sync/push',{'writes':[{'id':meeting['id'],'kind':'meeting','data':meeting}]})[0]==200)
check('ordinary account cannot delete company content',asm.req('content/'+image_item['id']+'/delete',{'expected_version':image_item['version']})[0]==403)
check('content manager cannot archive company-wide through generic record save',manager.write('items',{**image_item,'archived':True})[0]==403)
admin.rotation(a,image_item['id'],True);admin.rotation(b,image_item['id'],True)
check('administrator archives company content',admin.req('content/'+image_item['id']+'/delete',{'expected_version':image_item['version']})[0]==200)
check('deleted content absent from all future location pools',all(image_item['id'] not in c.context(loc)['available'] and image_item['id'] not in c.context(loc)['enabled'] for c,loc in [(asm,a),(paint,b)]))
check('saved presentation snapshot preserved',asm.req('meetings/'+meeting['id'])[1]['meeting']['slides'][0]['items'][0]['id']==image_item['id'])
check('referenced media remains downloadable after deletion',asm.req('media/'+image['id'])[0]==200)
meeting['status']='completed';check('completed snapshot remains savable after content deletion',asm.req('sync/push',{'writes':[{'id':meeting['id'],'kind':'meeting','data':meeting}]})[0]==200)
check('completed history retains archived content and shared media',asm.req('meetings/'+meeting['id'])[1]['meeting']['slides'][0]['items'][0]['assetId']==image['id'] and asm.req('media/'+image['id'])[0]==200)
# Adding a location shares All content but does not opt it into any rotation.
c=uid();check('administrator creates a future location',admin.req('admin/locations',{'id':c,'name':'Future location','enabled':True})[0]==200)
ctx=admin.context(c);check('All includes a new location without enrolling it',new['id'] in ctx['available'] and not ctx['enabled']);check('partial sharing excludes new location',partial['id'] not in ctx['available'])
# Revoked membership must not silently return upon re-sharing.
code,res=admin.write('items',{**new,'allLocations':False,'locations':[b]});assert code==200,(code,res)
changed=res['records'][0]['data'];code,res=admin.write('items',{**changed,'allLocations':True,'locations':[]});assert code==200
check('re-sharing does not restore revoked location enrollment',new['id'] not in asm.context(a)['enabled'])
f['new']=res['records'][0]['data'];f['partial']=partial;f['c']=c
# Movement fixture: new text and YouTube are available, outside rotation until chosen.
f['movementText']=create(asm,'Movement instructions',libraryId=f['stretch']);f['movementVideo']=create(asm,'Movement video',libraryId=f['stretch'],type='external-video',url='https://www.youtube.com/watch?v=dQw4w9WgXcQ',description='')
# Fresh browser fixture with no login-counter dependency on this API suite.
sql("$p->exec('DELETE FROM login_attempts');")
pathlib.Path('/tmp/mmb-combined-fixture.json').write_text(json.dumps(f))
print('Combined API:',checks,'checks passed')
