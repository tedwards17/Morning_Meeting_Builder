"""Split typography, guarded quote migration, admin unused-deletion; disposable DB only."""
import runpy,pathlib,json,subprocess,copy
v=runpy.run_path(str(pathlib.Path(__file__).with_name('round6-font.py')))
globals().update({k:v[k] for k in ['admin','asm','f','check','uid','template','meeting']})
base=v
while 'paint' not in base:base=base['v']
globals().update({k:base[k] for k in ['sql','paint','manager','viewer','outsider','ROOT','PHP']})
template=next(t for t in admin.req('templates')[1]['records'] if t['id']==f['template']['id'])
checks=0
def verify(name,ok):
 global checks
 assert ok,name
 checks+=1;print('PASS',name)
code,res=admin.write('templates',{**template,'theme':{**template['theme'],'titleFontSize':72,'textFontSize':32}});assert code==200,(code,res)
template=res['records'][0]['data'];verify('independent title and body sizes persist',template['theme']['titleFontSize']==72 and template['theme']['textFontSize']==32)
for key in ['titleFontSize','textFontSize']:
 for invalid in [0,97,32.5,'48']:assert admin.write('templates',{**template,'theme':{**template['theme'],key:invalid}})[0]==422
verify('both split size fields receive API validation',True)
def save(m,client=asm):return client.req('sync/push',{'writes':[{'id':m['id'],'kind':'meeting','data':m}]})
def draft(**fields):return {**copy.deepcopy(meeting),'id':uid(),'theme':copy.deepcopy(template['theme']),**fields}
m=draft();verify('saved meeting snapshots keep both font sizes',save(m)[0]==200 and asm.req('meetings/'+m['id'])[1]['meeting']['theme']['textFontSize']==32)
verify('invalid split meeting typography rejected',save(draft(theme={**m['theme'],'titleFontSize':100}))[0]==422)
# Seed every original quote plus guards in a second organization. No starter reimport.
quotes=[row for i in range(1,5) for row in json.loads((ROOT/f'frontend/src/round2-seed-items-{i}.json').read_text()) if row['libraryId'].endswith('008')]
titles=json.loads((ROOT/'frontend/src/quote-titles.json').read_text());f['quoteRows']=quotes
for client in [admin,outsider]:assert client.write('libraries',{'id':quotes[0]['libraryId'],'name':'Quote of the day','description':'','archived':False})[0]==200
assert outsider.write('libraries',{'id':f['safety'],'name':'Moved quotes','description':'','archived':False})[0]==200
sql('''foreach($f['quoteRows'] as $index=>$d){$d['organization_id']=$f['org'];$d['owner_id']=$f['users'][0]['id'];$d['version']=1;$d['useCount']=7;$d['lastUsedAt']='2026-10-01T00:00:00.000Z';$d['archived']=$index%2===0;$p->prepare("INSERT INTO records(organization_id,kind,id,owner_id,version,archived,payload,updated_at) VALUES(?,'items',?,?,1,?,?,UTC_TIMESTAMP())")->execute([$f['org'],$d['id'],$d['owner_id'],(int)$d['archived'],json_encode($d)]);$p->prepare("INSERT INTO record_versions(organization_id,kind,record_id,version,payload,created_at) VALUES(?,'items',?,1,?,UTC_TIMESTAMP())")->execute([$f['org'],$d['id'],json_encode($d)]);}
foreach(array_slice($f['quoteRows'],0,4) as $i=>$d){$d['organization_id']=$f['other'];$d['owner_id']=$f['users'][5]['id'];$d['version']=1;if($i===0)$d['title']='Custom summary';if($i===1)$d['description']='Edited quote';if($i===2)$d['libraryId']=$f['safety'];$p->prepare("INSERT INTO records(organization_id,kind,id,owner_id,version,archived,payload,updated_at) VALUES(?,'items',?,?,1,0,?,UTC_TIMESTAMP())")->execute([$f['other'],$d['id'],$d['owner_id'],json_encode($d)]);$p->prepare("INSERT INTO record_versions(organization_id,kind,record_id,version,payload,created_at) VALUES(?,'items',?,1,?,UTC_TIMESTAMP())")->execute([$f['other'],$d['id'],json_encode($d)]);}''')
# Keep an actual saved quote snapshot and an existing rotation membership.
snapshot=draft(slides=[{**m['slides'][0],'items':[quotes[0]]}]);assert save(snapshot)[0]==200
f['quoteId']=quotes[0]['id'];sql("$p->prepare('INSERT INTO content_rotation(organization_id,location_id,content_id) VALUES(?,?,?)')->execute([$f['org'],$f['a'],$f['quoteId']]);")
cursor=admin.req('sync/bootstrap')[1]['cursor']
sql("$p->exec('DELETE FROM schema_migrations WHERE version=7');foreach(explode(';',file_get_contents('database/migrations/007_quote_titles.sql')) as $s)if(trim($s)!=='')$p->exec($s);")
rows={row['id']:row for row in admin.req('content')[1]['records']}
verify('007 applies all 688 reviewed titles including archived quotes',all(rows[q['id']]['title']==titles[q['id']] and rows[q['id']]['version']==2 for q in quotes))
verify('007 keeps exact quote bodies and attributions',all(all(rows[q['id']].get(key)==q.get(key) for key in ['description','source','url','id','libraryId','tags']) for q in quotes))
verify('007 keeps usage and rotation membership',all(rows[q['id']]['useCount']==7 and rows[q['id']]['lastUsedAt']=='2026-10-01T00:00:00.000Z' for q in quotes) and sql("$q=$p->prepare('SELECT COUNT(*) FROM content_rotation WHERE organization_id=? AND content_id=?');$q->execute([$f['org'],$f['quoteId']]);echo $q->fetchColumn();").stdout=='1')
verify('007 never rewrites saved presentation quote titles',asm.req('meetings/'+snapshot['id'])[1]['meeting']['slides'][0]['items'][0]['title']==quotes[0]['title'])
other_rows={row['id']:row for row in outsider.req('content')[1]['records']}
verify('007 skips customized titles, bodies and moved entries',other_rows[quotes[0]['id']]['title']=='Custom summary' and other_rows[quotes[1]['id']]['description']=='Edited quote' and other_rows[quotes[2]['id']]['libraryId']==f['safety'] and all(other_rows[q['id']]['version']==1 for q in quotes[:3]))
verify('007 updates untouched quotes in other organizations independently',other_rows[quotes[3]['id']]['title']==titles[quotes[3]['id']] and other_rows[quotes[3]['id']]['version']==2)
changes=[];after=cursor
while True:
 result=admin.req('sync/changes?after='+str(after))[1];changes+=result['changes'];after=result['cursor']
 if not result['more']:break
verify('007 exposes all changed quote IDs through paginated sync',set(q['id'] for q in quotes)<=set(row['id'] for row in changes if row['kind']=='items'))
verify('007 preserves original versions for rollback review',sql("$q=$p->prepare(\"SELECT COUNT(*) FROM record_versions WHERE organization_id=? AND kind='items' AND version=1 AND record_id IN (SELECT id FROM records WHERE organization_id=? AND kind='items' AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.libraryId'))='00000000-0000-4000-8000-000000000008')\");$q->execute([$f['org'],$f['org']]);echo $q->fetchColumn();").stdout=='688')
subprocess.run([PHP,'scripts/migrate.php',f['config']],cwd=ROOT,check=True,capture_output=True);verify('migration runner skips already-installed 007',all(row['version']==2 for row in admin.req('content')[1]['records'] if row['id'] in titles))
# Authorization and immutable use history enforced in PHP, not only hidden buttons.
unused=draft();assert save(unused)[0]==200
for client in [asm,paint,manager,viewer,outsider]:assert client.req('meetings/'+unused['id']+'/delete',{'confirm':True})[0] in [403,404]
verify('all non-admin roles and another organization cannot delete',True)
verify('deletion requires explicit confirmation',admin.req('meetings/'+unused['id']+'/delete',{})[0]==422)
cursor=admin.req('sync/bootstrap')[1]['cursor'];verify('administrator can delete another account unused draft',admin.req('meetings/'+unused['id']+'/delete',{'confirm':True})[0]==200)
verify('deleted presentation is unavailable and sync returns a tombstone',asm.req('meetings/'+unused['id'])[0]==404 and any(row['kind']=='meetings' and row['id']==unused['id'] and row['deleted'] for row in admin.req('sync/changes?after='+str(cursor))[1]['changes']))
code,conflict=save(unused);verify('stale draft cannot resurrect a deleted presentation',code==409 and conflict['error']['deleted_meeting_id']==unused['id'])
for patch in [{'status':'presenting'},{'status':'completed'},{'startedAt':'2026-10-29T00:00:00Z'},{'endedAt':'2026-10-29T00:01:00Z'},{'presentedTopics':[{'slideId':m['slides'][0]['id'],'title':'Used topic','content':[]}]}]:
 used=draft(**patch);assert save(used)[0]==200,patch
 assert admin.req('meetings/'+used['id']+'/delete',{'confirm':True})[0]==409,patch
verify('started, completed, finished and topic-history meetings cannot be deleted',True)
event_draft=draft();assert save(event_draft)[0]==200
write={'id':uid(),'kind':'event','data':{'id':uid(),'meeting_id':event_draft['id'],'event_type':'meeting_started','occurred_at_utc':'2026-10-29T00:00:00Z'}};write['id']=write['data']['id'];assert asm.req('sync/push',{'writes':[write]})[0]==200
verify('server event history blocks deletion even if payload says draft',admin.req('meetings/'+event_draft['id']+'/delete',{'confirm':True})[0]==409)
write['data']['meeting_id']=unused['id'];write['id']=uid();write['data']['id']=write['id'];verify('late event for deleted draft receives a recoverable conflict',asm.req('sync/push',{'writes':[write]})[0]==409)
verify('delete action leaves an administrator audit entry',sql("$q=$p->prepare(\"SELECT COUNT(*) FROM audit_log WHERE organization_id=? AND action='unused_meeting_deleted'\");$q->execute([$f['org']]);echo $q->fetchColumn();").stdout=='1')
verify('shared media survives unused meeting deletion',asm.req('media/'+f['image']['id'])[0]==200)
print(f'{checks} editor/quote/deletion API checks passed in addition to retained 74 checks')
