"""Branding collections, fixed logo bounds, backgrounds and retained sharing."""
import runpy,pathlib,copy,json,subprocess,hashlib
v=runpy.run_path(str(pathlib.Path(__file__).with_name('round6-editor.py')))
globals().update({k:v[k] for k in ['admin','asm','paint','manager','viewer','outsider','sql','f','uid','ROOT','PHP','draft']})
base=v
while 'Client' not in base:base=base['base'] if 'base' in base and isinstance(base['base'],dict) else base['v']
Client=base['Client'];checks=0
def check(name,ok):
 global checks
 assert ok,name
 checks+=1;print('PASS',name)
def upload(client,template=None):
 data=subprocess.check_output([PHP,'-r',"$i=imagecreatetruecolor(200,100);imagealphablending($i,false);imagesavealpha($i,true);imagefill($i,0,0,imagecolorallocatealpha($i,0,0,0,127));imagefilledrectangle($i,40,40,160,60,imagecolorallocate($i,20,100,190));imagepng($i);"])
 boundary='design'+uid();body=(f'--{boundary}\r\nContent-Disposition: form-data; name="design_image"\r\n\r\n1\r\n').encode()
 if template:body+=(f'--{boundary}\r\nContent-Disposition: form-data; name="template_id"\r\n\r\n{template}\r\n').encode()
 body+=(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="padded.png"\r\nContent-Type: image/png\r\n\r\n').encode()+data+f'\r\n--{boundary}--\r\n'.encode()
 return client.req('media',raw=body,ctype='multipart/form-data; boundary='+boundary)
def save(client,record,template=None):return client.req('design-assets',{'data':record,'expected_version':record.get('version',0),'template_id':template})
def register(client,asset,role='logo',template=None):return save(client,{'id':uid(),'name':role+' '+uid(),'role':role,'assetId':asset['id'],'archived':False},template)
code,asset=upload(admin);assert code==201
code,r=register(admin,asset);assert code==200;logo=r['record']
check('company logos remain administrator-managed',all(register(c,asset)[0]==403 for c in [asm,paint,manager,viewer]))
check('retired illustrations cannot be newly registered',register(admin,asset,'illustration')[0]==422)
t={**copy.deepcopy(f['template']),'id':uid(),'name':'Branding template','version':0,'company_visible':False,'access':[{'location_id':f['a'],'can_use':True,'can_edit':False}],'theme':{**f['template']['theme'],'logoAssetId':asset['id'],'logoSize':100,'logoTrim':True,'backgroundFit':'contain'},'slides':[{**f['template']['slides'][0],'id':uid(),'title':'Branding heading','type':'discussion','contentIds':[],'text':'Fixed template text','illustration':{'builtin':'safety','matchHighlight':True}}]}
t['slides'][0].pop('libraryId',None)
code,r=admin.write('templates',t);assert code==200,(code,r);t=r['records'][0]['data']
check('legacy illustration metadata is harmless while logo size and background fit persist',t['theme']['logoSize']==100 and t['theme']['backgroundFit']=='contain')
check('use-only template recipients cannot upload backgrounds',upload(asm,t['id'])[0]==403)
check('background registration requires editable template context',register(asm,asset,'background',t['id'])[0]==403 and register(admin,asset,'background')[0]==422)
code,r=admin.write('templates',{**t,'access':[{'location_id':f['a'],'can_use':True,'can_edit':True}]});assert code==200;t=r['records'][0]['data']
code,bg=upload(asm,t['id']);assert code==201
code,r=register(asm,bg,'background',t['id']);assert code==200,(code,r);background=r['record']
check('repeated background registration reuses a single collection entry',register(asm,bg,'background',t['id'])[1]['record']['id']==background['id'])
check('explicit location editors register their backgrounds without library content',background['role']=='background' and background['owner_id']==f['users'][1]['id'])
check('company backgrounds and logos are readable across devices in the same organization',paint.req('media/'+bg['id'])[0]==200 and paint.req('media/'+asset['id'])[0]==200)
check('unrelated organizations cannot read images or catalog entries',outsider.req('design-assets')[1]['records']==[] and outsider.req('media/'+bg['id'])[0]==404)
check('catalog lists only registered branding images',{r['role'] for r in asm.req('design-assets')[1]['records']}=={'background','logo'})
check('location editors cannot register another uploader asset as their own background',register(asm,asset,'background',t['id'])[0]==403)
code,r=asm.write('templates',{**t,'name':'Location edited branding','theme':{**t['theme'],'backgroundAssetId':bg['id'],'logoSize':75},'slides':[{**t['slides'][0],'backgroundFit':'cover'}]});assert code==200,(code,r);t=r['records'][0]['data']
check('location editor saves image settings without a false sharing denial',t['theme']['logoSize']==75 and t['slides'][0]['backgroundFit']=='cover')
check('location editor cannot redistribute shared master',asm.write('templates',{**t,'company_visible':True})[0]==403)
code,r=admin.write('templates',{**t,'theme':{**t['theme'],'logoSize':200,'logoPosition':'right'}});assert code==200,(code,r);t=r['records'][0]['data']
check('200 percent logos and right alignment save through server validation',t['theme']['logoSize']==200 and t['theme']['logoPosition']=='right')
check('invalid fit and logo settings are actionable validation failures',all(admin.write('templates',{**t,'theme':{**t['theme'],**patch}})[0]==422 for patch in [{'backgroundFit':'stretch'},{'logoSize':0},{'logoSize':201},{'logoTrim':'yes'},{'logoPosition':'bottom'}]))
snapshot=draft(templateId=t['id'],templateName=t['name'],theme=copy.deepcopy(t['theme']),slides=[{'id':uid(),'definition':copy.deepcopy(t['slides'][0]),'items':[],'additionalText':'Meeting additions','skipped':False}])
snapshot['slides'][0]['definition']['title']='Meeting-specific heading'
assert asm.req('sync/push',{'writes':[{'id':snapshot['id'],'kind':'meeting','data':snapshot}]})[0]==200
check('meeting title edit persists without changing the template',asm.req('meetings/'+snapshot['id'])[1]['meeting']['slides'][0]['definition']['title']=='Meeting-specific heading' and next(row for row in admin.req('templates')[1]['records'] if row['id']==t['id'])['slides'][0]['title']=='Branding heading')
code,r=admin.write('templates',{**t,'theme':{**t['theme'],'logoSize':25,'backgroundFit':'cover'}});assert code==200;t=r['records'][0]['data']
check('editing template image settings preserves saved snapshots',asm.req('meetings/'+snapshot['id'])[1]['meeting']['theme']==snapshot['theme'])
original=hashlib.sha256(asm.req('media/'+bg['id'])[1]).hexdigest()
code,r=save(asm,{**background,'archived':True},t['id']);assert code==200;hidden=r['record']
check('hiding backgrounds retains referenced files and snapshots',asm.req('media/'+bg['id'])[0]==200 and asm.req('meetings/'+snapshot['id'])[0]==200)
check('collection version conflicts prevent stale edits',save(asm,{**background,'name':'Stale'},t['id'])[0]==409)
code,r=admin.write('templates',{**t,'access':[{'location_id':f['a'],'can_use':True,'can_edit':True},{'location_id':f['b'],'can_use':True,'can_edit':True}]});assert code==200;t=r['records'][0]['data']
check('only background uploader or admin may manage a collection entry',save(paint,{**hidden,'name':'Denied'},t['id'])[0]==403)
code,r=save(admin,{**hidden,'archived':False,'name':'Reusable background'},t['id']);assert code==200;background=r['record']
check('admin can restore another uploader background without modifying its bytes',hashlib.sha256(asm.req('media/'+bg['id'])[1]).hexdigest()==original)
code,r=admin.write('templates',{**t,'access':[{'location_id':f['a'],'can_use':True,'can_edit':True},{'location_id':f['b'],'can_use':True,'can_edit':False}]});assert code==200;t=r['records'][0]['data']
check('multiple locations can use template branding without unintended edit rights',any(row['id']==t['id'] for row in paint.req('templates')[1]['records']) and paint.write('templates',{**t,'name':'Denied'})[0]==403)
code,r=admin.write('templates',{**t,'company_visible':True});assert code==200;t=r['records'][0]['data']
check('company-wide sharing remains available to location users',any(row['id']==t['id'] for row in paint.req('templates')[1]['records']))
f['visuals']={'template':t,'snapshot':snapshot,'logo':logo,'background':background,'asset':asset};pathlib.Path('/tmp/mmb-visual-fixture.json').write_text(json.dumps(f))
sql("$p->exec('DELETE FROM login_attempts');")
print(f'{checks} branding API checks passed in addition to retained 97 checks')
