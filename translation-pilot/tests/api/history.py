"""Exercise real PHP history validation without a database or credentials."""
import json, os, subprocess, uuid
from pathlib import Path
root = Path(__file__).resolve().parents[2]
php = os.environ.get('PHP_BINARY', 'php')
uid = lambda: str(uuid.uuid4())
slide_id = uid()
meeting = {'id':uid(), 'status':'completed', 'presenter':'Thomas',
           'slides':[{'id':slide_id}], 'presentedTopics':[]}
entry = {'id':uid(), 'at':'2026-10-09T22:00:00.000Z', 'text':'Keep the aisle clear.',
         'language':'en', 'presenter':'Thomas', 'slideId':slide_id,
         'slideTitle':'Safety Moment', 'contentTitles':['Safe lifting']}
code = '''require 'api/src/core.php';require 'api/src/history.php';
$b=json_decode(stream_get_contents(STDIN),true);
if(isset($b['actor'])){$GLOBALS['actor']=$b['actor'];echo json_encode(['allowed'=>isset($b['meeting']['announcement'])?scoped($b['meeting'],$b['actor']):can_read_meeting($b['meeting'])]);exit;}
validate_meeting_history($b['meeting']);
if(isset($b['prior']))append_completed_history($b['prior'],$b['meeting']);
echo json_encode(['ok'=>true]);'''
def request(m, prior=None, actor=None):
    body={'meeting':m}
    if prior is not None: body['prior']=prior
    if actor is not None: body['actor']=actor
    result=subprocess.run([php,'-n','-r',code],cwd=root,input=json.dumps(body),text=True,capture_output=True,check=True)
    return json.loads(result.stdout)
checks=[]
def check(name, condition):
    assert condition,name
    checks.append(name);print('PASS',name)
saved={**meeting,'transcript':[entry]}
check('valid text and topic context accepted',request(saved).get('ok'))
def reorder(value):
    if isinstance(value,dict):return {key:reorder(value[key]) for key in reversed(value)}
    if isinstance(value,list):return [reorder(item) for item in value]
    return value
check('completed details accept equivalent reordered JSON keys',request(reorder(saved),saved).get('ok'))
check('late translation accepts reordered transcript context keys',request(reorder({**saved,'transcript':[{**entry,'translations':{'es':'Mantenga el pasillo libre.'}}]}),saved).get('ok'))

check('late transcript append accepted after completion',request(saved,meeting).get('ok'))
check('saved transcript cannot be erased',bool(request(meeting,saved).get('error')))
translated={**saved,'transcript':[{**entry,'translations':{'es':'Mantén el pasillo despejado.'}}]}
check('completed transcript accepts an additive translation',request(translated,saved).get('ok'))
check('stored translation cannot be replaced',bool(request({**translated,'transcript':[{**entry,'translations':{'es':'Changed'}}]},translated).get('error')))
check('translation cannot replace the original speech',bool(request({**translated,'transcript':[{**translated['transcript'][0],'text':'Changed'}]},translated).get('error')))
check('translation must use the opposite supported language',bool(request({**saved,'transcript':[{**entry,'translations':{'en':'Changed'}}]}).get('error')) and bool(request({**saved,'transcript':[{**entry,'translations':{'fr':'Changed'}}]}).get('error')))
check('oversized translation rejected',bool(request({**saved,'transcript':[{**entry,'translations':{'es':'x'*36001}}]}).get('error')))
check('completed presenter cannot be changed',bool(request({**saved,'presenter':'Other'},saved).get('error')))
check('unknown transcript slide rejected',bool(request({**meeting,'transcript':[{**entry,'slideId':uid()}]}).get('error')))
check('duplicate transcript identifiers rejected',bool(request({**meeting,'transcript':[entry,entry]}).get('error')))
check('unsupported transcript language rejected',bool(request({**meeting,'transcript':[{**entry,'language':'fr'}]}).get('error')))
owned={**saved,'organization_id':'dtb','account_id':'own'}
owner={'id':'own','organization_id':'dtb','role':'location'}
check('own-account history allowed',request(owned,actor=owner)['allowed'])
for role in ['location','content_manager','report_viewer']:
    check('other-account history denied for '+role,not request(owned,actor={**owner,'id':'other','role':role})['allowed'])
check('administrator can read all company meetings',request(owned,actor={**owner,'id':'admin','role':'administrator'})['allowed'])
check('administrator cannot read another company',not request(owned,actor={**owner,'organization_id':'other','role':'administrator'})['allowed'])
announcement={'announcement':True,'allAccounts':False,'accounts':['own'],'locations':[]}
check('announcement target account can receive content',request(announcement,actor=owner)['allowed'])
check('other meeting account cannot receive targeted content',not request(announcement,actor={**owner,'id':'other'})['allowed'])
check('no announcement recipients does not mean all',not request({**announcement,'accounts':[]},actor=owner)['allowed'])
check('administrator can manage targeted announcements',request(announcement,actor={**owner,'id':'admin','role':'administrator'})['allowed'])
print(f'{len(checks)} PHP history checks passed. Database transport not exercised.')
