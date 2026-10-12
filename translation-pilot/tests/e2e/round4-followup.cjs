const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
(async()=>{
  const server=spawn('python3',['-m','http.server','5184','--bind','127.0.0.1','--directory','build'],{stdio:'ignore'});
  let browser; const checks=[];
  function ok(name,condition){assert.ok(condition,name);checks.push(name);console.log('PASS',name);}
  try {
    await new Promise(resolve=>setTimeout(resolve,400));
    browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
    const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
    const page=await context.newPage(); page.setDefaultTimeout(30000); const errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error('Browser error:',error.message);});
    await page.goto('http://127.0.0.1:5184/demo/');
    await page.locator('.start-panel').waitFor();
    await page.getByRole('button',{name:/Build a meeting/}).last().click();
    await page.getByPlaceholder('Who is leading today?').fill('Checkpoint presenter');
    await page.getByRole('button',{name:'Save presentation',exact:true}).click();
    await page.getByText('Presentation saved for future use.',{exact:true}).waitFor();
    ok('Save keeps the meeting builder and presenter in place',await page.getByPlaceholder('Who is leading today?').inputValue()==='Checkpoint presenter');
    ok('Save makes the presentation available in the same builder',await page.getByRole('button',{name:'Present saved meeting',exact:true}).isVisible());
    await page.getByText('Presentation saved for future use.',{exact:true}).waitFor({state:'hidden',timeout:4500});
    ok('save notification expires without user action',await page.locator('.toast').count()===0);
    await page.getByRole('button',{name:'Save presentation',exact:true}).click();
    await page.getByRole('button',{name:'Dismiss message',exact:true}).click();
    ok('save notification can be dismissed early',await page.locator('.toast').count()===0);
    let state=await page.evaluate(()=>MMB.repository.load());
    ok('saving twice updates one meeting and does not count content usage',state.meetings.length===1&&state.usage.length===0);
    await page.getByRole('button',{name:'Preview',exact:true}).click();
    await page.getByRole('button',{name:'Fullscreen preview',exact:true}).click();
    await page.waitForFunction(()=>Boolean(document.fullscreenElement));
    await page.getByRole('button',{name:'Exit fullscreen',exact:true}).waitFor();
    ok('practice preview enters browser fullscreen',await page.getByRole('button',{name:'Exit fullscreen',exact:true}).isVisible());
    await page.getByRole('button',{name:'Next',exact:true}).click();
    await page.getByRole('button',{name:'Done',exact:true}).click();
    await page.waitForFunction(()=>!document.fullscreenElement);
    state=await page.evaluate(()=>MMB.repository.load());
    ok('closing fullscreen practice keeps usage and transcript unchanged',state.usage.length===0&&!state.meetings[0].transcript?.length);
    await page.locator('.agenda-select').filter({hasText:'Personal share'}).click();
    ok('Personal share stays included and has no skip checkbox',await page.getByLabel('Skip this slide',{exact:true}).count()===0);
    for(const title of ['Small changes. Better work.']){
      await page.locator('.agenda-select').filter({hasText:title}).click();
      ok('optional improvement media starts skipped',await page.getByLabel('Skip this slide',{exact:true}).isChecked());
    }
    await page.getByRole('button',{name:'Save presentation',exact:true}).click();
    const calls=[];
    await page.route('**/translation-api/index.php?*',async route=>{
      const action=new URL(route.request().url()).searchParams.get('action');calls.push(action);
      const data=action==='status'?{enabled:true,authenticated:true,csrf:'test-csrf'}:
        action==='session'?{access_token:'test-temporary-token',sessionId:'test-session',expiresAt:Math.floor(Date.now()/1000)+2700}:
        action==='text'?{text:'Caption test'}:{ok:true};
      await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
    });
    await page.evaluate(()=>{
      window.WebSocket=class{
        static OPEN=1;readyState=1;bufferedAmount=0;
        constructor(){window.testSocket=this;setTimeout(()=>this.onopen?.(),0);}
        send(){}close(){this.readyState=3;}
      };
    });
    await page.getByRole('button',{name:'Present saved meeting',exact:true}).click();
    await page.getByRole('button',{name:'Fullscreen',exact:true}).click();
    await page.waitForFunction(()=>Boolean(document.fullscreenElement));
    await page.getByRole('button',{name:'Exit fullscreen',exact:true}).waitFor();
    await page.keyboard.press('PageDown');
    ok('remote Page Down advances while keeping fullscreen and hiding buttons',await page.evaluate(()=>Boolean(document.fullscreenElement)&&!document.querySelector('.presentation-controls').classList.contains('visible')));
    await page.keyboard.press('PageUp');
    await page.locator('.presentation-stage').click({position:{x:20,y:20}});
    ok('touching the slide reveals controls after remote navigation',await page.locator('.presentation-controls').evaluate(element=>element.classList.contains('visible')));
    await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();
    await page.getByRole('button',{name:'Start transcript',exact:true}).click();
    await page.waitForFunction(()=>window.testSocket);
    await page.getByText('Transcript ON · Saving speech text…',{exact:true}).waitFor();
    await page.evaluate(()=>testSocket.onmessage({data:JSON.stringify({type:'Results',is_final:true,channel:{alternatives:[{transcript:'Keep the aisle clear.',words:[{word:'Keep',language:'en'},{word:'the',language:'en'},{word:'aisle',language:'en'},{word:'clear.',language:'en'}]}]}})}));
    await page.waitForFunction(async()=>(await MMB.repository.load()).meetings[0].transcript?.length===1);
    ok('transcript-only mode saves speech without Azure text requests',!calls.includes('text'));
    await page.getByRole('button',{name:'Next slide',exact:true}).click();
    await page.getByRole('button',{name:'Next slide',exact:true}).click();
    await page.getByRole('button',{name:'Next slide',exact:true}).click();
    await page.evaluate(()=>testSocket.onmessage({data:JSON.stringify({type:'Results',is_final:true,channel:{alternatives:[{transcript:'Safety matters.',words:[{word:'Safety',language:'en'},{word:'matters.',language:'en'}]}]}})}));
    await page.waitForFunction(async()=>(await MMB.repository.load()).meetings[0].transcript?.length===2);

    await page.getByRole('button',{name:'Pause and exit presentation',exact:true}).click();await page.getByRole('dialog',{name:'Confirm action',exact:true}).getByRole('button',{name:'Confirm',exact:true}).click();
    await page.getByPlaceholder('Who is leading today?').waitFor();
    state=await page.evaluate(()=>MMB.repository.load());
    ok('presentation exit preserves both phrases and presenter/topic context',state.meetings[0].transcript.length===2&&state.meetings[0].transcript.every(entry=>entry.presenter==='Checkpoint presenter')&&state.meetings[0].transcript[1].slideTitle==='Safety Moment');
    ok('actual presented topic titles persist with the meeting',state.meetings[0].presentedTopics.some(topic=>topic.title==='Safety Moment'&&topic.content.length>0));
    await page.reload();await page.locator('.start-panel').waitFor();
    state=await page.evaluate(()=>MMB.repository.load());
    ok('transcript survives a browser reload',state.meetings[0].transcript.length===2);
    await page.getByRole('button',{name:'Meetings',exact:true}).click();
    await page.getByRole('heading',{name:'Previously presented',exact:true}).waitFor();
    await page.locator('.meeting-list-row').first().click();
    await page.getByRole('heading',{name:'Transcript',exact:true}).waitFor();
    ok('meeting detail shows persisted speech and topic titles',await page.getByText('Safety matters.',{exact:true}).isVisible()&&await page.getByText('Keep the aisle clear.',{exact:true}).isVisible());
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Download meeting notes',exact:true}).click();
    const download=await downloadPromise;
    ok('meeting notes export downloads a text file',download.suggestedFilename().endsWith('.txt'));
    await page.getByRole('button',{name:'Back to Meetings',exact:true}).click();
    ok('Meetings retains a build-new shortcut',await page.getByRole('button',{name:'Build a new meeting',exact:true}).isVisible());
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    await page.getByRole('button',{name:'Learn next key',exact:true}).click();
    await page.keyboard.press('x');
    await page.getByText('Saved x for next.',{exact:true}).waitFor();
    state=await page.evaluate(()=>MMB.repository.load());
    ok('remote learning saves a device key mapping',state.settings.remoteKeys.next==='x');
    ok('version appears only in Local data and Round labels are gone',await page.getByText(/App v0\.4\./).count()===1&&await page.getByText(/Round 3/).count()===0&&!await page.locator('.v2-bar').textContent().then(text=>/v0\./.test(text)));
    await page.getByRole('button',{name:'Company workspace',exact:true}).click();
    await page.getByRole('button',{name:'Create broadcast',exact:true}).click();
    await page.getByLabel('Title',{exact:true}).fill('Admin announcement');
    await page.getByLabel('Announcement message',{exact:true}).fill('Christmas party at noon.');
    await page.getByLabel('Upload announcement image',{exact:true}).setInputFiles({name:'party.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=','base64')});
    await page.getByText('Selected image: party.png',{exact:true}).waitFor();
    await page.getByLabel('Publication',{exact:true}).selectOption('published');
    await page.getByLabel('Select all meeting areas',{exact:true}).uncheck();
    await page.getByLabel('Select all meeting areas',{exact:true}).check();
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await page.getByLabel('Announcement message',{exact:true}).waitFor({state:'hidden'});
    await page.getByRole('button',{name:'Back to meeting builder',exact:true}).click();
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:/Build a meeting/}).last().click();
    await page.locator('.agenda-select').filter({hasText:'Admin announcement'}).waitFor();
    state=await page.evaluate(()=>MMB.repository.load());
    const latest=state.meetings.find(meeting=>meeting.slides.some(slide=>slide.definition.title==='Admin announcement'));const shown=latest.slides.filter(slide=>!slide.skipped);
    ok('admin published announcement automatically appears after stretches',shown.findIndex(slide=>slide.broadcast_id)===shown.findIndex(slide=>slide.definition.type==='stretch')+1);
    ok('empty reserved announcement slot stays hidden in the builder',await page.locator('.agenda-select').filter({hasText:/^Announcements$/}).count()===0);
    await page.getByPlaceholder('Who is leading today?').fill('Name and present');
    await page.getByRole('button',{name:'Present meeting',exact:true}).click();
    await page.locator('.presentation').waitFor();
    state=await page.evaluate(()=>MMB.repository.load());
    const quick=state.meetings.find(meeting=>meeting.presenter==='Name and present');
    ok('build, enter name and present needs no media or separate Save step',quick.status==='presenting'&&quick.slides.find(slide=>slide.definition.title==='Small changes. Better work.').skipped&&!quick.slides.find(slide=>slide.definition.title==='Personal share').skipped);
    ok('no browser runtime errors',errors.length===0);
    console.log(`${checks.length} follow-up browser checks passed.`);
    await context.close();
  } finally {await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
