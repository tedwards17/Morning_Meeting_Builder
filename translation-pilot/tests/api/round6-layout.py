"""Layout/meeting additions use optional existing JSON fields; disposable DB only."""
import runpy,pathlib
v=runpy.run_path(str(pathlib.Path(__file__).with_name('round6-slides.py')))
globals().update({k:v[k] for k in ['admin','asm','f','check','uid']})
template=next(t for t in admin.req('templates')[1]['records'] if t['id']==f['template']['id'])
layout={'titlePosition':'top-right','textOnlyPosition':'middle-left','imageOnlyPosition':'middle-center','imageTextPosition':'middle-left','mediaPlacement':'left'}
code,res=admin.write('templates',{**template,'layoutDefaults':layout,'slides':[{**template['slides'][0],'layoutOverrides':{'titlePosition':'bottom-left','mediaPlacement':'right'}}]})
assert code==200,(code,res);template=res['records'][0]['data'];check('template layout defaults and slide overrides persist',template['layoutDefaults']==layout and template['slides'][0]['layoutOverrides']['titlePosition']=='bottom-left')
check('invalid overlay placement is rejected',admin.write('templates',{**template,'layoutDefaults':{'mediaPlacement':'overlay'}})[0]==422)
meeting={'id':uid(),'location_id':f['a'],'templateId':template['id'],'templateName':template['name'],'theme':template['theme'],'groups':[],'presenter':'Layout test','date':'2026-10-27','createdAt':'2026-10-27T00:00:00.000Z','status':'draft','slides':[{'id':uid(),'definition':{**template['slides'][0],'templateLayout':layout},'items':[f['movementText']],'additionalText':'Meeting-only text','layoutOverrides':{'textOnlyPosition':'bottom-right'},'skipped':False}]}
def save(m):return asm.req('sync/push',{'writes':[{'id':m['id'],'kind':'meeting','data':m}]})
check('meeting-specific text and content positioning save',save(meeting)[0]==200)
saved=asm.req('meetings/'+meeting['id'])[1]['meeting'];check('template body remains separate from meeting additions',saved['slides'][0]['additionalText']=='Meeting-only text' and saved['slides'][0]['definition']['text']==template['slides'][0]['text'])
invalid={**meeting,'slides':[{**meeting['slides'][0],'layoutOverrides':{'titlePosition':'top-left'}}]};check('meeting layout controls cannot move protected template title',save(invalid)[0]==422)
invalid={**meeting,'slides':[{**meeting['slides'][0],'additionalText':'x'*20001}]};check('oversized meeting additions receive validation feedback',save(invalid)[0]==422)
code,res=admin.write('templates',{**template,'layoutDefaults':{**layout,'titlePosition':'bottom-center'}});assert code==200
check('editing template defaults does not rewrite saved meeting layout snapshot',asm.req('meetings/'+meeting['id'])[1]['meeting']['slides'][0]['definition']['templateLayout']==layout)
print('7 layout API checks passed in addition to the retained 62 checks')
