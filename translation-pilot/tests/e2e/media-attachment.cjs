// Disposable hosted API + seeded starter content. No production/provider calls.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fixture=JSON.parse(fs.readFileSync(process.env.MMB_UPLOAD_FIXTURE||'/tmp/mmb-e2e-fixture.json'));
const user=fixture.users?.[1]??fixture;
const presenter='Media attachment '+Date.now();
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAAHUlEQVR4nGOU9M5jIBcwka1zVPOo5lHNo5qpohkASx8A+rXaktMAAAAASUVORK5CYII=','base64');
let count=0;
function check(name,value){assert.ok(value,name);console.log('PASS',name);count++;}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu']});
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1366,height:900}});
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 async function login(page){await page.goto('http://127.0.0.1:8081');await page.getByLabel('Username',{exact:true}).fill(user.username);await page.getByLabel('Password',{exact:true}).fill(fixture.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.start-panel').waitFor();await page.evaluate(()=>MMB.sync());}
 async function upload(name){const [chooser]=await Promise.all([p.waitForEvent('filechooser'),p.getByRole('button',{name:'Upload images / videos',exact:true}).click()]);await chooser.setFiles({name,mimeType:'image/png',buffer:png});}
 async function saved(){return p.evaluate(async presenter=>(await MMB.repository.load()).meetings.find(m=>m.presenter===presenter),presenter);}
 try{
  await login(p);
  await p.evaluate(async()=>{const s=await MMB.repository.load();s.settings.defaultTemplateId='00000000-0000-4000-8000-000000000600';await MMB.repository.save(s);});await p.reload();await p.locator('.start-panel').waitFor();
  if(await p.getByLabel('Meeting location',{exact:true}).count())await p.getByLabel('Meeting location',{exact:true}).selectOption('d7b00000-0000-4000-8000-000000000011');
  await p.getByRole('button',{name:'Build a meeting',exact:true}).last().click();await p.getByPlaceholder('Who is leading today?').fill(presenter);
  await p.locator('.agenda-select').filter({hasText:'Small changes. Better work.'}).click();await p.getByLabel('Skip this slide',{exact:true}).uncheck();
  await p.evaluate(()=>{const originalPut=IDBObjectStore.prototype.put,originalGet=IDBObjectStore.prototype.get;window.cacheFault='quota';
   IDBObjectStore.prototype.put=function(...args){if(this.transaction.db.name==='dtb-morning-meeting'&&this.name==='assets'){if(cacheFault==='quota')throw new DOMException('Injected cache quota exceeded','QuotaExceededError');if(cacheFault==='blocked')return new Promise(()=>{});}return originalPut.apply(this,args);};
   IDBObjectStore.prototype.get=function(...args){if(this.transaction.db.name==='dtb-morning-meeting'&&this.name==='assets'&&cacheFault)throw new DOMException('Injected cache unavailable','InvalidStateError');return originalGet.apply(this,args);};});
  await upload('improvement-quota.png');await p.locator('.media-upload-feedback').filter({hasText:'Media attached and saved'}).waitFor();
  await p.waitForFunction(()=>[...document.querySelectorAll('.meeting-review img')].some(img=>img.naturalWidth>0));
  check('server image attaches and renders despite browser media storage failures',await p.locator('.selection-row').filter({hasText:'improvement-quota.png'}).isVisible());
  let meeting=await saved();let slide=meeting.slides.find(s=>s.definition.title==='Small changes. Better work.');
  check('attachment saves immediately and includes required Improvements slide',slide.items.length===1&&!slide.skipped);
  check('preview URL uses the attached asset ID, even with repeated image hashes',await p.locator('.meeting-review img').first().getAttribute('src')==='./api/v1/media/'+slide.items[0].assetId);
  check('incomplete offline download is explained beside upload button',(await p.locator('.media-upload-feedback').innerText()).includes('Offline download is incomplete'));
  check('required-media validation clears after upload',!await p.getByText(/Add media to “Small changes/).count());
  await p.evaluate(()=>MMB.sync());const serverMeeting=await p.evaluate(id=>fetch('./api/v1/meetings/'+id).then(r=>r.json()).then(r=>r.meeting),meeting.id);
  check('attachment reaches PHP/MySQL without clicking Save presentation',serverMeeting.slides.find(s=>s.id===slide.id).items[0].assetId===slide.items[0].assetId);
  await p.setViewportSize({width:390,height:844});
  // Hold the POST while the user switches slides and edits the presenter.
  let release,started;const began=new Promise(resolve=>started=resolve),gate=new Promise(resolve=>release=resolve);
  const slow=async route=>{if(route.request().method()==='POST'){started();await gate;}await route.continue();};
  await p.route('**/api/v1/media',slow);await upload('improvement-slow.png');await began;
  await p.locator('.agenda-select').filter({hasText:'Personal share'}).click();await p.getByPlaceholder('Who is leading today?').fill(presenter+' edited');release();
  await p.locator('.media-upload-feedback').filter({hasText:'Media attached and saved'}).waitFor();await p.unroute('**/api/v1/media',slow);
  meeting=await p.evaluate(async id=>(await MMB.repository.load()).meetings.find(m=>m.id===id),meeting.id);
  check('slow upload keeps newer edits and original target slide',meeting.presenter===presenter+' edited'&&meeting.slides.find(s=>s.id===slide.id).items.length===2&&!meeting.slides.find(s=>s.definition.title==='Personal share').items.length);
  // A transient GET failure after a successful POST must not discard the item.
  await p.locator('.agenda-select').filter({hasText:'Small changes. Better work.'}).click();await p.evaluate(()=>window.cacheFault='');let failGet=true;
  const download=async route=>{if(failGet){failGet=false;await route.fulfill({status:503,body:'Injected temporary download failure'});}else await route.continue();};
  await p.route('**/api/v1/media/*',download);await upload('improvement-download.png');await p.locator('.media-upload-feedback').filter({hasText:'Media attached and saved'}).waitFor();await p.unroute('**/api/v1/media/*',download);
  check('temporary cache download failure preserves successful attachment',await p.locator('.selection-row').filter({hasText:'improvement-download.png'}).isVisible());
  await p.getByRole('button',{name:'Download meeting media',exact:true}).click();await p.getByText('Ready offline. YouTube and external links still require internet.',{exact:true}).waitFor();await context.setOffline(true);
  await p.locator('.agenda-select').filter({hasText:'Personal share'}).click();await p.locator('.agenda-select').filter({hasText:'Small changes. Better work.'}).click();await p.waitForFunction(()=>[...document.querySelectorAll('.meeting-review img')].some(img=>img.src.startsWith('blob:')&&img.naturalWidth>0));
  check('downloaded image renders from cached bytes when offline',true);await context.setOffline(false);await p.evaluate(()=>MMB.sync());
  // A real PHP rejection remains a visible, actionable error at the upload control.
  const rejected=route=>route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({error:{message:'Media upload failed; check PHP upload limits'}})});
  await p.route('**/api/v1/media',rejected);await upload('rejected.png');await p.locator('.media-upload-feedback[role=alert]').waitFor();
  check('PHP upload errors appear beside the upload button without fake attachments',(await p.locator('.media-upload-feedback').innerText()).includes('PHP upload limits')&&!await p.locator('.selection-row').filter({hasText:'rejected.png'}).count());await p.unroute('**/api/v1/media',rejected);
  // A stalled legacy cache must release the UI instead of leaving an upload hanging.
  await p.evaluate(()=>window.cacheFault='blocked');await upload('improvement-blocked.png');await p.locator('.selection-row').filter({hasText:'improvement-blocked.png'}).waitFor({timeout:15000});await p.locator('.media-upload-feedback').filter({hasText:'Media attached and saved'}).waitFor();
  check('blocked offline cache cannot leave upload stuck indefinitely',await p.getByRole('button',{name:'Upload images / videos',exact:true}).isEnabled());
  await p.evaluate(()=>MMB.sync());await p.getByRole('button',{name:'Save presentation',exact:true}).click();await p.getByText('Presentation saved for future use.',{exact:true}).waitFor();
  await p.setViewportSize({width:1366,height:900});await p.reload();await p.locator('.start-panel').waitFor();await p.getByRole('button',{name:'Meetings',exact:true}).click();await p.locator('.meeting-list-row').filter({hasText:presenter+' edited'}).click();await p.getByRole('button',{name:'Open saved presentation',exact:true}).click();await p.getByPlaceholder('Who is leading today?').waitFor();await p.locator('.agenda-select').filter({hasText:'Small changes. Better work.'}).click();
  await p.waitForFunction(()=>[...document.querySelectorAll('.meeting-review img')].some(img=>img.naturalWidth>0));check('saved attachments and preview survive reopening the meeting',await p.locator('.selection-row').count()===4);
  await p.getByRole('button',{name:'Present saved meeting',exact:true}).click();await p.locator('.presentation-stage').waitFor();check('meeting with required Improvements media can present',true);
  await p.locator('.presentation-stage').click({position:{x:300,y:300}});await p.getByRole('button',{name:'Pause and exit presentation',exact:true}).click();await p.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();await p.getByPlaceholder('Who is leading today?').waitFor();
  check('upload and presentation workflows have no uncaught runtime errors',!errors.length);console.log('Media attachment browser:',count,'checks passed');
 }catch(error){await p.screenshot({path:'/tmp/mmb-media-attachment-failure.png'});console.error((await p.locator('body').innerText()).slice(-9000));throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
