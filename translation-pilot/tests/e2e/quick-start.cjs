const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');const assert=require('node:assert/strict');
(async()=>{const server=spawn('python3',['-m','http.server','5186','--bind','127.0.0.1','--directory','build'],{stdio:'ignore'});let browser;
try{await new Promise(resolve=>setTimeout(resolve,350));browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({serviceWorkers:'block'});
await page.goto('http://127.0.0.1:5186/demo/');await page.locator('.start-panel').waitFor();await page.getByRole('button',{name:/Build a meeting/}).last().click();
await page.getByPlaceholder('Who is leading today?').fill('Quick presenter');await page.getByRole('button',{name:'Present meeting',exact:true}).click();await page.locator('.presentation').waitFor();
await page.waitForTimeout(900);const state=await page.evaluate(()=>MMB.repository.load());assert.equal(state.meetings[0].status,'presenting');assert.equal(state.meetings[0].presenter,'Quick presenter');
assert.equal(state.meetings[0].slides.find(slide=>slide.definition.title==='Personal share').skipped,false);assert.equal(state.meetings[0].slides.find(slide=>slide.definition.title==='Small changes. Better work.').skipped,true);
console.log('PASS name-only presentation starts and stays presenting after the draft autosave interval');
page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Pause and exit presentation',exact:true}).click();await page.getByPlaceholder('Who is leading today?').waitFor();
await page.getByRole('button',{name:'Templates',exact:true}).click();await page.getByRole('button',{name:'Edit',exact:true}).first().click();
await page.locator('.slide-select').filter({hasText:'Small changes. Better work.'}).click();assert.ok(await page.getByLabel('Skipped by default in new meetings',{exact:true}).isChecked());
await page.locator('.slide-select').filter({hasText:'Safety Moment'}).click();await page.getByLabel('Builder slide color',{exact:true}).selectOption('#bdd5e8');await page.getByRole('button',{name:'Save template',exact:true}).click();await page.getByText('Template saved on this device.',{exact:true}).waitFor();
await page.getByRole('button',{name:'Meetings',exact:true}).click();await page.getByRole('button',{name:'Build a new meeting',exact:true}).click();
const row=page.locator('.agenda-row').filter({hasText:'Safety Moment'});assert.equal(await row.evaluate(element=>getComputedStyle(element).getPropertyValue('--builder-slide-color').trim()),'#bdd5e8');
await row.locator('.agenda-select').click();assert.equal(await page.locator('.meeting-review .slide-canvas').evaluate(element=>element.style.getPropertyValue('--builder-slide-color')),'');
console.log('PASS template default skip and muted builder-only slide color persist into a new meeting');
await page.evaluate(async()=>{const state=await MMB.repository.load();const prior=state.meetings.find(meeting=>meeting.presenter==='Quick presenter');prior.status='completed';prior.endedAt=new Date().toISOString();prior.transcript=[{id:crypto.randomUUID(),text:'Original meeting text.',at:prior.endedAt,presenter:prior.presenter,language:'en',slideId:prior.slides[0].id,slideTitle:prior.slides[0].definition.title,contentTitles:[]}];await MMB.repository.save(state);});
await page.reload();await page.locator('.start-panel').waitFor();await page.getByRole('button',{name:'Meetings',exact:true}).click();await page.locator('.meeting-list-row').filter({hasText:'Quick presenter'}).click();await page.getByRole('button',{name:'Open saved presentation',exact:true}).click();await page.getByRole('button',{name:'Present again',exact:true}).click();await page.locator('.presentation').waitFor();
const replay=await page.evaluate(()=>MMB.repository.load());assert.ok(replay.meetings.some(meeting=>meeting.status==='completed'&&meeting.transcript?.[0]?.text==='Original meeting text.'));assert.ok(replay.meetings.some(meeting=>meeting.status==='presenting'&&meeting.presenter==='Quick presenter'&&meeting.transcript.length===0));
console.log('PASS presenting again creates a new record and preserves the completed transcript');
page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Pause and exit presentation',exact:true}).click();await page.getByPlaceholder('Who is leading today?').waitFor();await page.setViewportSize({width:390,height:844});
await page.getByRole('button',{name:'Preview',exact:true}).click();await page.getByRole('button',{name:'Fullscreen preview',exact:true}).click();await page.getByRole('button',{name:'Exit fullscreen',exact:true}).waitFor();
const mobileBounds=await page.locator('.practice-preview').boundingBox();assert.ok(mobileBounds.width<=390&&mobileBounds.height<=844);await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Done',exact:true}).click();await page.waitForFunction(()=>!document.fullscreenElement);
console.log('PASS mobile-layout fullscreen practice fits the viewport and exits cleanly');



}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
