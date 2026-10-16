"""Real database/upload regression for temporary meeting media and device handoff."""
import os,json,uuid,urllib.request,urllib.error,http.cookiejar,subprocess,base64,datetime
assert os.environ.get('MMB_TEST_ALLOW_RESET')=='1'
base=os.environ.get('MMB_TEST_URL','http://127.0.0.1:8081');fixture=json.load(open('/tmp/mmb-e2e-fixture.json'));uid=lambda:str(uuid.uuid4());checks=[]
class Client:
 def __init__(self,user):
  self.device=uid();self.jar=http.cookiejar.CookieJar();self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar));self.csrf=''
  status,body=self.call('auth/login',{'username':user['username'],'password':fixture['password'],'device_id':self.device,'device_name':'Media test'})
  assert status==200,(status,body);self.csrf=body['csrf'];self.user=user
 def call(self,path,body=None,raw=None,content_type=None,headers=None):
  request=urllib.request.Request(base+'/api/v1/'+path,data=raw if raw is not None else json.dumps(body).encode() if body is not None else None,headers={'Origin':base,'Content-Type':content_type or 'application/json','X-CSRF-Token':self.csrf,**(headers or {})})
  try:
   with self.http.open(request) as r:
    raw=r.read();return r.status,json.loads(raw) if 'json' in r.headers.get('Content-Type','') else raw
  except urllib.error.HTTPError as e:
   raw=e.read()
   try:return e.code,json.loads(raw)
   except:return e.code,raw
 def upload(self,meeting,png,scope='meeting-only'):
  boundary='mmb-'+uid();parts=[]
  for key,value in [('scope',scope),('meeting_id',meeting['id'])]:parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
  parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="personal.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+png+b'\r\n');parts.append(f'--{boundary}--\r\n'.encode())
  return self.call('media',raw=b''.join(parts),content_type='multipart/form-data; boundary='+boundary)
def check(name,condition):
 assert condition,name
 checks.append(name);print('PASS',name)
a=Client(fixture['users'][1]);b=Client(fixture['users'][1]);other=Client(fixture['users'][2]);admin=Client(fixture['users'][0])
now=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
slide={'id':uid(),'title':'Personal share','type':'gallery','layout':'center','text':'','notes':'','optional':False,'duration':0,'contentIds':[],'selection':'oldest','count':1,'allowRepeat':False}
template={'id':uid(),'name':'Meeting media regression','description':'','theme':{'background':'#143650','foreground':'#ffffff','accent':'#236ac9'},'groups':[],'slides':[slide],'archived':False,'createdAt':now,'updatedAt':now}
status,result=a.call('records/batch',{'records':[{'id':template['id'],'kind':'templates','data':template,'expected_version':0}]});assert status==200,(status,result)
meeting={'id':uid(),'location_id':fixture['assembly'],'templateId':template['id'],'templateName':template['name'],'presenter':'Cross-device presenter','theme':template['theme'],'groups':[],'slides':[{'id':uid(),'definition':slide,'items':[],'skipped':False}],'status':'draft','date':'2026-01-01','createdAt':now}
def push(client,m):return client.call('sync/push',{'writes':[{'id':m['id'],'kind':'meeting','data':m}]})
check('a past scheduled date does not expire an unfinished meeting',push(a,meeting)[0]==200)
png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAAHUlEQVR4nGOU9M5jIBcwka1zVPOo5lHNo5qpohkASx8A+rXaktMAAAAASUVORK5CYII=')
status,asset=a.upload(meeting,png);check('location account uploads private meeting media',status==201 and asset['scope']=='meeting-only')
meeting['slides'][0]['items']=[{'id':uid(),'scope':'meeting-only','assetId':asset['id'],'type':'image-text','libraryId':uid(),'title':'Personal photo','description':'','url':'','tags':[],'createdAt':now,'updatedAt':now,'lastUsedAt':None,'useCount':0,'archived':False,'source':'Meeting-only'}]
check('saved meeting keeps server asset references',push(a,meeting)[0]==200)
asset_php="$c=require getenv('MMB_CONFIG');$p=new PDO($c['dsn'],$c['user'],$c['password']);$q=$p->prepare('SELECT stored_path FROM media_assets WHERE id=?');$q->execute([$argv[1]]);echo $q->fetchColumn();"
asset_path=subprocess.check_output([os.environ.get('PHP_BIN','php'),'-r',asset_php,asset['id']],text=True).strip()
assert asset_path and os.path.isfile(asset_path)
check('owner can retrieve the authoritative meeting',b.call('meetings/'+meeting['id'])[0]==200)
check('another account cannot retrieve the meeting',other.call('meetings/'+meeting['id'])[0]==404)
check('same account on another device can download photo',b.call('media/'+asset['id'])[0]==200)
check('other account cannot download private meeting photo',other.call('media/'+asset['id'])[0]==404)
check('other account cannot claim presentation',other.call('meetings/'+meeting['id']+'/claim',{'expected_device_id':a.device})[0]==403)
status,handoff=b.call('meetings/'+meeting['id']+'/claim',{'expected_device_id':a.device});check('same account explicitly hands presentation to a second device',status==200)
check('old device cannot overwrite after handoff',push(a,meeting)[0]==403)
check('stale handoff request cannot steal a newer lease',a.call('meetings/'+meeting['id']+'/claim',{'expected_device_id':a.device})[0]==409)
meeting=handoff['meeting'];meeting['status']='presenting';check('paused/in-progress meeting keeps its uploaded photo',push(b,meeting)[0]==200 and b.call('media/'+asset['id'])[0]==200)
stored_bytes=b.call('media/'+asset['id'])[1]
check('range request supports video-style media seeking',b.call('media/'+asset['id'],headers={'Range':'bytes=0-7'})==(206,stored_bytes[:8]))
status,shared=admin.upload(meeting,png,scope='shared');assert status in [200,201],(status,shared)
check('shared and temporary copies are not deduplicated together',shared['id']!=asset['id'])
meeting['status']='completed';meeting['endedAt']=now
check('completion requires explicit media deletion confirmation',push(b,meeting)[0]==422)
meeting['mediaCleanupConfirmed']=True
check('confirmed completion succeeds',push(b,meeting)[0]==200)
check('temporary media is unavailable immediately after completion',b.call('media/'+asset['id'])[0]==404)
check('completion physically deletes the private uploaded file',not os.path.exists(asset_path))
check('shared library copy survives completion',admin.call('media/'+shared['id'])[0]==200)
php="""$c=require getenv('MMB_CONFIG');$p=new PDO($c['dsn'],$c['user'],$c['password']);$q=$p->prepare('SELECT payload FROM meetings WHERE id=?');$q->execute([$argv[1]]);echo $q->fetchColumn();"""
saved=json.loads(subprocess.check_output([os.environ.get('PHP_BIN','php'),'-r',php,meeting['id']],text=True));check('completion removes private media IDs while retaining text history',saved.get('mediaExpiredAt') and saved['slides'][0]['items'][0]['title']=='Personal photo' and 'assetId' not in saved['slides'][0]['items'][0])
# Late original speech remains additive after cleanup; its full meeting payload survives.
entry={'id':uid(),'at':now,'text':'Keep the aisle clear.','language':'en','presenter':meeting['presenter'],'slideId':meeting['slides'][0]['id'],'slideTitle':'Personal share','contentTitles':[]}
saved['transcript']=[entry];check('late transcript append works after media cleanup',push(b,saved)[0]==200)
saved['transcript'][0]['translations']={'es':'Mantenga el pasillo despejado.'};check('late translation preserves the complete meeting payload',push(b,saved)[0]==200)
persisted=json.loads(subprocess.check_output([os.environ.get('PHP_BIN','php'),'-r',php,meeting['id']],text=True));check('late history updates keep the full meeting and translated transcript',persisted['id']==meeting['id'] and persisted['transcript'][0]['translations']['es']=='Mantenga el pasillo despejado.')
check('completed meeting cannot be claimed for further editing',a.call('meetings/'+meeting['id']+'/claim',{'expected_device_id':b.device})[0]==409)
# Reset throttling for the following browser test; do not touch content/history.
subprocess.run([os.environ.get('PHP_BIN','php'),'-r',"$c=require getenv('MMB_CONFIG');$p=new PDO($c['dsn'],$c['user'],$c['password']);$p->exec('DELETE FROM login_attempts');"],check=True)
print('Meeting media API:',len(checks),'checks passed')
