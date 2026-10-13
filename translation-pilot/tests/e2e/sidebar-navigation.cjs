const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');const assert=require('node:assert/strict');
(async()=>{
 const server=spawn('python3',['-m','http.server','5195','--bind','127.0.0.1','--directory','build'],{stdio:'ignore'});
 let browser;let count=0;const ok=(name,value)=>{assert.ok(value,name);count++;console.log('PASS',name);};
 try{
  await new Promise(resolve=>setTimeout(resolve,400));browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const viewport of [{width:1366,height:900},{width:390,height:844}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   async function nav(name){
    if(viewport.width<=680){await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().left>=-.1);}
    await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('button',{name,exact:true}).click();
   }
   await page.goto('http://127.0.0.1:5195/demo/');await page.locator('.start-panel').waitFor();
   await page.getByRole('button',{name:'Build a meeting',exact:true}).last().click();await page.getByPlaceholder('Who is leading today?').fill('Navigation test');await page.getByRole('button',{name:'Save presentation',exact:true}).click();
   await page.getByText('Presentation saved for future use.',{exact:true}).waitFor();
   const original=await page.evaluate(async()=>{
    const state=await MMB.repository.load();const meeting=state.meetings[0];const slide=meeting.slides[0];
    meeting.transcript=[{id:crypto.randomUUID(),at:new Date().toISOString(),language:'en',text:'Good morning, team. Keep the aisle clear.',slideId:slide.id,slideTitle:slide.definition.title,presenter:meeting.presenter,contentTitles:[]}];
    await MMB.repository.save(state);return JSON.stringify(meeting.transcript);
   });
   await page.reload();await page.locator('.start-panel').waitFor();await nav('Meetings');await page.locator('.meeting-list-row').click();
   const reader=page.locator('.meeting-transcript');await reader.waitFor();
   ok(`${viewport.width}: introduction heading is absent and spoken Good morning remains`,await reader.locator('h3').count()===0&&await reader.getByText(/Good morning, team\./).isVisible());
   await reader.getByRole('button',{name:'Detailed timestamps',exact:true}).click();
   ok(`${viewport.width}: detailed metadata omits greeting label but keeps speech`,!(await reader.locator('small').innerText()).includes('Good morning')&&(await reader.locator('li p').innerText()).includes('Good morning, team.'));
   await nav('Meetings');await page.locator('.meetings-page').waitFor();
   ok(`${viewport.width}: clicking active Meetings returns from record to list`,await page.locator('.meeting-record').count()===0&&await page.locator('.meeting-list-row').count()===1&&await page.evaluate(()=>scrollY===0));
   for(const name of ['Home','Templates','Content library','Backup & restore','Settings']){
    await nav(name);const before=await page.locator('.main-content').elementHandle();
    await page.evaluate(()=>scrollTo(0,300));await nav(name);
    ok(`${viewport.width}: active ${name} reopens its main page at the top`,await before.evaluate(el=>!el.isConnected)&&await page.evaluate(()=>scrollY===0));
   }
   await nav('Templates');await page.getByRole('button',{name:'Edit',exact:true}).first().click();
   await nav('Templates');
   ok(`${viewport.width}: active Templates exits its editor to the template list`,await page.locator('.template-grid').isVisible());
   await page.getByRole('button',{name:'Edit',exact:true}).first().click();
   await page.locator('.template-settings > summary').click();
   const field=page.getByLabel('Template name',{exact:true});await field.fill('Uncommitted template change');
   await nav('Templates');const dialog=page.getByRole('dialog',{name:'Confirm action',exact:true});await dialog.waitFor();
   await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
   ok(`${viewport.width}: cancelling unsaved navigation retains the editor`,await field.inputValue()==='Uncommitted template change');
   // The drawer stays open after cancelling the guarded click.
   await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('button',{name:'Templates',exact:true}).click();
   await dialog.getByRole('button',{name:'Confirm',exact:true}).click();await page.locator('.template-grid').waitFor();
   ok(`${viewport.width}: confirmed navigation returns to list without saving the edit`,await page.getByLabel('Template name',{exact:true}).count()===0&&!(await page.evaluate(()=>MMB.repository.load())).templates.some(t=>t.name==='Uncommitted template change'));
   ok(`${viewport.width}: saved transcript and runtime remain intact`,await page.evaluate(async()=>JSON.stringify((await MMB.repository.load()).meetings[0].transcript))===original&&errors.length===0);
   await context.close();
  }
  console.log(`${count} sidebar navigation checks passed.`);
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exit(1);});
