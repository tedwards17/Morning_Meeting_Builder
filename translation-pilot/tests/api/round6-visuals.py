"""Company design assets and targeted template editing. Disposable fixtures only."""
import runpy,pathlib,copy,json,subprocess,base64,hashlib
v=runpy.run_path(str(pathlib.Path(__file__).with_name('round6-editor.py')))
globals().update({k:v[k] for k in ['admin','asm','paint','manager','viewer','outsider','sql','f','uid','ROOT','PHP','draft']})
base=v
while 'Client' not in base:base=base['base'] if 'base' in base and isinstance(base['base'],dict) else base['v']
Client=base['Client'];checks=0
def check(name,ok):
 global checks
 assert ok,name
 checks+=1;print('PASS',name)
def png(kind):
 code='''$kind=$argv[1];$im=imagecreatetruecolor(80,80);imagealphablending($im,false);imagesavealpha($im,true);$clear=imagecolorallocatealpha($im,0,0,0,127);$white=imagecolorallocate($im,255,255,255);$black=imagecolorallocate($im,0,0,0);$red=imagecolorallocate($im,220,30,30);$blue=imagecolorallocate($im,20,60,200);imagefill($im,0,0,$kind==='opaque'?$white:$clear);if($kind==='transparent')imagefilledellipse($im,40,40,48,48,$black);elseif($kind==='opaque')imagefilledrectangle($im,20,20,60,60,$black);elseif($kind==='background'){imagefill($im,0,0,$red);imagefilledrectangle($im,10,10,70,70,$blue);}else{imagefilledrectangle($im,15,15,38,65,$red);imagefilledrectangle($im,42,15,65,65,$blue);}imagepng($im);'''
 return subprocess.check_output([PHP,'-r',code,kind])
def upload(client,kind,template=None):
 boundary='visual'+uid();data=png(kind);body=b''
 if template:body+=(f'--{boundary}\r\nContent-Disposition: form-data; name="template_id"\r\n\r\n{template}\r\n').encode()
 body+=(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{kind}.png"\r\nContent-Type: image/png\r\n\r\n').encode()+data+f'\r\n--{boundary}--\r\n'.encode()
 return client.req('media',raw=body,ctype='multipart/form-data; boundary='+boundary)
def register(client,asset,role='illustration',**patch):return client.req('design-assets',{'data':{'id':uid(),'name':role+' '+asset['name'],'role':role,'assetId':asset['id'],**patch},'expected_version':0})
assets={}
for kind in ['transparent','opaque','multicolor','background']:
 code,asset=upload(admin,kind);assert code==201,(code,asset);assets[kind]=asset
records={}
for kind in ['transparent','opaque','multicolor']:
 code,r=register(admin,assets[kind]);assert code==200,(code,r);records[kind]=r['record']
check('transparent single-color artwork is eligible for matching',records['transparent']['tintable'] is True)
check('opaque images and multicolor artwork retain original colors',records['opaque']['tintable'] is False and records['opaque']['tintReason']=='opaque' and records['multicolor']['tintable'] is False and records['multicolor']['tintReason']=='multicolor')
code,r=register(admin,assets['opaque'],'logo');assert code==200;logo=r['record'];check('administrators can register company logos independently of content',logo['role']=='logo')
for client in [asm,paint,manager,viewer]:assert register(client,assets['opaque'])[0]==403
check('company collection writes denied to every non-admin role',True)
check('catalog is organization-scoped',outsider.req('design-assets')[1]['records']==[] and len(asm.req('design-assets')[1]['records'])==4)
check('location recipients can read company illustration and logo bytes',all(paint.req('media/'+assets[k]['id'])[0]==200 for k in ['transparent','opaque','multicolor']))
original=asm.req('media/'+assets['transparent']['id'])[1];original_hash=hashlib.sha256(original).hexdigest()
# New shared template is available at Assembly only; editing is a separate grant.
t={**copy.deepcopy(f['template']),'id':uid(),'name':'Visual template','version':0,'company_visible':False,'access':[{'location_id':f['a'],'can_use':True,'can_edit':False}],'theme':{**f['template']['theme'],'backgroundAssetId':assets['background']['id'],'logoAssetId':logo['assetId']},'slides':[{**f['template']['slides'][0],'id':uid(),'title':'Safety illustration','type':'discussion','libraryId':None,'contentIds':[],'text':'Template fixed text','builderColor':'#36a852','illustration':{'builtin':'safety','matchHighlight':True}}]}
t['slides'][0].pop('libraryId',None)
code,res=admin.write('templates',t);assert code==200,(code,res);t=res['records'][0]['data']
check('built-in illustration and exact slide highlight persist',t['slides'][0]['illustration']['builtin']=='safety' and t['slides'][0]['builderColor']=='#36a852')
check('one-location availability grants no unintended edit or background access elsewhere',any(row['id']==t['id'] for row in asm.req('templates')[1]['records']) and not any(row['id']==t['id'] for row in paint.req('templates')[1]['records']) and asm.write('templates',{**t,'name':'Denied master edit'})[0]==403 and paint.req('media/'+assets['background']['id'])[0]==404)
check('authorized use includes referenced template background',asm.req('media/'+assets['background']['id'])[0]==200)
check('read-only template recipient cannot upload backgrounds into that template',upload(asm,'background',t['id'])[0]==403)
code,res=admin.write('templates',{**t,'access':[{'location_id':f['a'],'can_edit':True,'can_use':True}]});assert code==200;t=res['records'][0]['data']
code,new_background=upload(asm,'background',t['id']);assert code in [200,201],(code,new_background)
code,res=asm.write('templates',{**t,'name':'Location-edited template','theme':{**t['theme'],'backgroundAssetId':new_background['id']},'slides':[{**t['slides'][0],'illustration':{'assetId':records['transparent']['assetId'],'name':records['transparent']['name'],'tintable':True,'matchHighlight':True}}]});assert code==200,(code,res);t=res['records'][0]['data']
check('explicit location editor can customize images without a false sharing denial',t['name']=='Location-edited template' and t['theme']['backgroundAssetId']==new_background['id'])
check('location editor cannot redistribute the shared master',asm.write('templates',{**t,'company_visible':True})[0]==403 and asm.write('templates',{**t,'access':[{'location_id':f['b'],'can_use':True,'can_edit':True}]})[0]==403)
for kind in ['opaque','multicolor']:
 bad={**t,'slides':[{**t['slides'][0],'illustration':{'assetId':records[kind]['assetId'],'name':'Unsafe tint','tintable':True,'matchHighlight':True}}]};assert admin.write('templates',bad)[0]==422
check('server rejects forced tinting of opaque or multicolor images',True)
check('invalid built-in illustration receives validation feedback',admin.write('templates',{**t,'slides':[{**t['slides'][0],'illustration':{'builtin':'unknown','matchHighlight':False}}]})[0]==422)
snapshot=draft(templateId=t['id'],templateName=t['name'],theme=copy.deepcopy(t['theme']),slides=[{'id':uid(),'definition':copy.deepcopy(t['slides'][0]),'items':[],'additionalText':'Meeting additions','skipped':False}])
assert asm.req('sync/push',{'writes':[{'id':snapshot['id'],'kind':'meeting','data':snapshot}]})[0]==200
code,res=admin.write('templates',{**t,'slides':[{**t['slides'][0],'illustration':{'builtin':'lean','matchHighlight':False}}]});assert code==200;t=res['records'][0]['data']
check('editing a template preserves saved illustration/theme/text snapshots',asm.req('meetings/'+snapshot['id'])[1]['meeting']['slides'][0]['definition']['illustration']['assetId']==records['transparent']['assetId'] and asm.req('meetings/'+snapshot['id'])[1]['meeting']['theme']==snapshot['theme'])
record=records['transparent'];code,res=admin.req('design-assets',{'data':{**record,'archived':True},'expected_version':record['version']});assert code==200;records['transparent']=res['record']
check('hiding an illustration preserves saved slides and asset availability',asm.req('media/'+record['assetId'])[0]==200 and asm.req('meetings/'+snapshot['id'])[0]==200)
check('collection edits use version conflicts rather than overwriting',admin.req('design-assets',{'data':{**record,'name':'Stale overwrite'},'expected_version':record['version']})[0]==409)
check('changing highlight mode never changes stored image bytes',hashlib.sha256(asm.req('media/'+record['assetId'])[1]).hexdigest()==original_hash)
# Restore the fixture illustration for the visual picker tests.
code,res=admin.req('design-assets',{'data':{**records['transparent'],'archived':False},'expected_version':records['transparent']['version']});assert code==200;records['transparent']=res['record']
code,res=admin.write('templates',{**t,'access':[{'location_id':f['a'],'can_use':True,'can_edit':True},{'location_id':f['b'],'can_use':True,'can_edit':False}]});assert code==200;t=res['records'][0]['data']
check('multiple locations can use the same template images without receiving edit rights',any(row['id']==t['id'] for row in paint.req('templates')[1]['records']) and paint.req('media/'+new_background['id'])[0]==200 and paint.write('templates',{**t,'name':'Denied Paint edit'})[0]==403)
code,res=admin.write('templates',{**t,'company_visible':True});assert code==200;t=res['records'][0]['data']
f['c']=uid();f['newUser']={'id':uid(),'username':'visual_future_'+uid(),'role':'location','location_id':f['c'],'org':f['org']}
sql('''$p->prepare("INSERT INTO locations(id,organization_id,name) VALUES(?,?,'New visual location')")->execute([$f['c'],$f['org']]);$u=$f['newUser'];$p->prepare("INSERT INTO accounts(id,organization_id,location_id,username,password_hash,category,role,can_create_templates) VALUES(?,?,?,?,?,'location','location',0)")->execute([$u['id'],$f['org'],$f['c'],$u['username'],password_hash($f['password'],PASSWORD_DEFAULT)]);''')
future=Client(f['newUser']);check('company-wide availability includes a newly created location',any(row['id']==t['id'] for row in future.req('templates')[1]['records']) and future.req('media/'+new_background['id'])[0]==200)
new_device=Client(f['users'][1]);check('saved branding and illustrations remain readable on another device',new_device.req('meetings/'+snapshot['id'])[0]==200 and new_device.req('media/'+new_background['id'])[0]==200 and new_device.req('media/'+logo['assetId'])[0]==200)
check('image original bytes remain shared rather than meeting-only uploads',all(asset['scope']=='shared' for asset in assets.values()))
f['visuals']={'template':t,'snapshot':snapshot,'records':records,'logo':logo,'assets':assets,'background':new_background};pathlib.Path('/tmp/mmb-visual-fixture.json').write_text(json.dumps(f))
sql("$p->exec('DELETE FROM login_attempts');")
print(f'{checks} visual-design API checks passed in addition to retained 97 checks')
