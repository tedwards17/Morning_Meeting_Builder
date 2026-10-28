"""Optional shared typography is stored in the existing template/meeting theme JSON."""
import runpy,pathlib
v=runpy.run_path(str(pathlib.Path(__file__).with_name('round6-layout.py')))
globals().update({k:v[k] for k in ['admin','asm','f','check','uid']})
template=next(t for t in admin.req('templates')[1]['records'] if t['id']==f['template']['id'])
code,res=admin.write('templates',{**template,'theme':{**template['theme'],'fontSize':64}})
assert code==200,(code,res);template=res['records'][0]['data'];check('template shared font size persists',template['theme']['fontSize']==64)
for value in [0,97,'64',48.5]:assert admin.write('templates',{**template,'theme':{**template['theme'],'fontSize':value}})[0]==422
check('invalid template font sizes receive validation feedback',True)
meeting={'id':uid(),'location_id':f['a'],'templateId':template['id'],'templateName':template['name'],'theme':template['theme'],'groups':[],'presenter':'Font test','date':'2026-10-28','createdAt':'2026-10-28T00:00:00.000Z','status':'draft','slides':[{'id':uid(),'definition':template['slides'][0],'items':[f['movementText']],'additionalText':'1. First\n2. Second\n3. Third','skipped':False}]}
def save(m):return asm.req('sync/push',{'writes':[{'id':m['id'],'kind':'meeting','data':m}]})
check('meeting snapshots preserve shared typography and line breaks',save(meeting)[0]==200 and asm.req('meetings/'+meeting['id'])[1]['meeting']['theme']['fontSize']==64 and asm.req('meetings/'+meeting['id'])[1]['meeting']['slides'][0]['additionalText'].count('\n')==2)
check('invalid meeting font size is rejected',save({**meeting,'theme':{**meeting['theme'],'fontSize':120}})[0]==422)
code,res=admin.write('templates',{**template,'theme':{**template['theme'],'fontSize':36}});assert code==200
check('editing template typography preserves saved meeting snapshots',asm.req('meetings/'+meeting['id'])[1]['meeting']['theme']['fontSize']==64)
print('5 font API checks passed in addition to the retained 69 checks')
