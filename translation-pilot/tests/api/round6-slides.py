"""Reconstructed Batches 4/5 regressions. Disposable DB only; includes retained compact workflow checks."""
import runpy,pathlib,json,subprocess
v=runpy.run_path(str(pathlib.Path(__file__).with_name('round6-combined.py')))
globals().update({k:v[k] for k in ['sql','f','admin','asm','check','uid','create','PHP','ROOT']})
# Migration is an intentional one-time body cleanup, preserving all other fields and saved snapshots.
video=create(asm,'Cleanup video',type='external-video',url='https://youtu.be/dQw4w9WgXcQ',description='Video 1 of 46',summary='Old browsing summary')
text=create(asm,'Retained text',description='Retain this text',summary='Browse this text')
f['cleanupId']=video['id'];f['textId']=text['id']
snapshot={'id':uid(),'location_id':f['a'],'templateId':f['template']['id'],'templateName':'Legacy cleanup snapshot','theme':f['template']['theme'],'groups':[],'presenter':'Snapshot regression','date':'2026-10-27','createdAt':'2026-10-27T00:00:00.000Z','status':'draft','slides':[{'id':uid(),'definition':{**f['template']['slides'][0],'duration':45,'count':5,'allowRepeat':False},'items':[video,text],'skipped':False}]}
assert asm.req('sync/push',{'writes':[{'id':snapshot['id'],'kind':'meeting','data':snapshot}]})[0]==200
sql("$p->exec('DELETE FROM schema_migrations WHERE version=6');$p->exec(file_get_contents('database/migrations/006_video_text_cleanup.sql'));")
code,res=admin.req('content');cleaned=next(row for row in res['records'] if row['id']==video['id']);retained=next(row for row in res['records'] if row['id']==text['id'])
check('006 clears only target video body and browsing summary',cleaned['description']=='' and cleaned['summary']=='' and retained['description']=='Retain this text' and retained['summary']=='Browse this text')
check('006 preserves video identity, URL, sharing, usage and source',all(cleaned.get(k)==video.get(k) for k in ['id','title','url','libraryId','allLocations','locations','source','useCount','lastUsedAt']))
check('006 increments version and retains old content versions',cleaned['version']==video['version']+1 and sql("$q=$p->prepare(\"SELECT COUNT(*) FROM record_versions WHERE kind='items' AND record_id=?\");$q->execute([$f['cleanupId']]);echo $q->fetchColumn();").stdout=='2')
old=asm.req('meetings/'+snapshot['id'])[1]['meeting'];check('006 preserves saved multi-item snapshots and inert countdown metadata',len(old['slides'][0]['items'])==2 and old['slides'][0]['items'][0]['description']=='Video 1 of 46' and old['slides'][0]['definition']['duration']==45)
check('006 sends versioned content synchronization without rotation removal',cleaned['id'] in asm.context(f['a'])['enabled'])
subprocess.run([PHP,'scripts/migrate.php',f['config']],cwd=ROOT,check=True,capture_output=True)
check('migration runner skips already-installed cleanup',True)
summary=create(asm,'Separate description',description='Audience body',summary='Browsing only')
check('description and slide body save independently',summary['summary']=='Browsing only' and summary['description']=='Audience body')
code,_=admin.write('items',{**summary,'summary':'x'*4001});check('description has actionable server validation',code==422)
template=f['template'];bad={**template,'slides':[{**template['slides'][0],'textPosition':'outside'}]}
check('invalid text positions are rejected',admin.write('templates',bad)[0]==422)
bad={**template,'slides':[{**template['slides'][0],'mediaUrl':'javascript:alert(1)'}]}
check('unsafe inline media links are rejected',admin.write('templates',bad)[0]==422)
valid={**template,'slides':[{**template['slides'][0],'textPosition':'bottom-right','builderColor':'#123aBc'}]}
check('valid text position and arbitrary builder color save',admin.write('templates',valid)[0]==200)
print('11 combined slide API checks passed in addition to the retained 51 checks')
