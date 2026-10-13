const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const server=spawn('python3',['-m','http.server','5192','--bind','127.0.0.1','--directory','build'],{stdio:'ignore'});
 let browser;const checks=[];
 const ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS',name);};
 try{
  await new Promise(resolve=>setTimeout(resolve,400));
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5192/demo/');await page.locator('.start-panel').waitFor();
  await page.getByRole('button',{name:'Build a meeting',exact:true}).last().click();
  await page.getByPlaceholder('Who is leading today?').fill('Transcript tester');
  await page.getByRole('button',{name:'Save presentation',exact:true}).click();
  await page.getByText('Presentation saved for future use.',{exact:true}).waitFor();
  const original=await page.evaluate(async()=>{
   const state=await MMB.repository.load();const meeting=state.meetings[0];
   meeting.slides[0].definition.type='text';
   meeting.status='completed';meeting.startedAt='2026-10-12T12:00:00Z';meeting.endedAt='2026-10-12T12:30:00Z';
   meeting.presentedTopics=meeting.slides.slice(0,2).map((slide,i)=>({id:slide.id,slideId:slide.id,title:i?'Improvements':'Safety',at:meeting.startedAt,presenter:meeting.presenter,content:[]}));
   meeting.transcript=Array.from({length:180},(_,i)=>({id:crypto.randomUUID(),at:new Date(Date.parse(meeting.startedAt)+i*4000).toISOString(),
    text:i===0?'Keep the':i===1?'aisle clear.':i===35?'We discussed latch adjustment and safe mounting.':i===179?'El pasillo está libre.':`Recorded fragment ${i}: prepare the tools before work.`,
    language:i===179?'es':'en',presenter:meeting.presenter,slideId:meeting.slides[i<100?0:1].id,
    slideTitle:i<100?'Safety':'Improvements',contentTitles:[]}));
   await MMB.repository.save(state);return JSON.stringify(meeting.transcript);
  });
  await page.reload();await page.locator('.start-panel').waitFor();
  await page.getByRole('button',{name:'Meetings',exact:true}).click();
  await page.locator('.meeting-list-row').click();
  const reader=page.locator('.meeting-transcript');
  await reader.waitFor();
  async function clearSearch(){
   const field=reader.getByRole('searchbox');await field.focus();const box=await field.boundingBox();
   await field.click({position:{x:box.width-20,y:box.height/2}});
  }
  ok('readable view joins partial sentences and replaces 180 entries with compact paragraphs',await reader.getByText(/Keep the aisle clear\./).isVisible()&&await reader.locator('.transcript-paragraph').count()<20&&await reader.locator('ol').count()===0);
  ok('meeting details and presented topics come before the transcript',JSON.stringify(await page.locator('.meeting-record > .panel h2').allTextContents())===JSON.stringify(['Meeting details','Presented topics','Transcript'])&&JSON.stringify(await reader.locator('h3').allTextContents())===JSON.stringify(['Safety','Improvements']));
  ok('search action is an icon inside the field with no separate Search/Clear buttons',await reader.locator('.transcript-search-button').innerText()===''&&await reader.getByRole('button',{name:'Clear',exact:true}).count()===0&&await reader.locator('.transcript-search-button').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.parentElement.querySelector('input').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom;}));
  const paragraphCount=await reader.locator('.transcript-paragraph').count();
  await reader.getByRole('searchbox',{name:'Search transcript',exact:true}).fill('latch adjustment');
  ok('readable search highlights matching words while keeping every paragraph visible',await reader.locator('.transcript-paragraph').count()===paragraphCount&&await reader.locator('mark').count()===1&&await reader.locator('mark').innerText()==='latch adjustment');
  await reader.getByRole('button',{name:'Search',exact:true}).click();
  ok('Search dismisses input focus and brings the first highlighted match into view',await reader.getByRole('searchbox').evaluate(el=>document.activeElement!==el)&&await reader.locator('mark').evaluate(el=>{const box=el.getBoundingClientRect();return box.top>=0&&box.bottom<=innerHeight;}));
  await clearSearch();
  ok('native × clears query and highlights without removing paragraphs',await reader.getByRole('searchbox').inputValue()===''&&await reader.locator('mark').count()===0&&await reader.locator('.transcript-paragraph').count()===paragraphCount);
  await reader.getByRole('searchbox').fill('keep the aisle');
  ok('readable search finds a phrase spanning original speech fragments',await reader.locator('mark').innerText()==='Keep the aisle');
  await reader.getByRole('searchbox').press('Enter');
  ok('keyboard Search action also dismisses input focus',await reader.getByRole('searchbox').evaluate(el=>document.activeElement!==el));
  await reader.getByRole('searchbox').fill('latch adjustment');
  await reader.getByRole('button',{name:'Copy entire transcript',exact:true}).click();
  await reader.getByText('Entire transcript copied.',{exact:true}).waitFor();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  ok('copy includes the entire original-language transcript without highlight markup',copied.includes('Keep the aisle clear.')&&copied.includes('El pasillo está libre.')&&copied.includes('Transcript tester')&&!copied.includes('[2026-10-12T')&&!copied.includes('<mark'));
  const downloadPromise=page.waitForEvent('download');
  await reader.getByRole('button',{name:'Download transcript (.txt)',exact:true}).click();
  const download=await downloadPromise;
  ok('UTF-8 plain-text download matches the full clean copy',download.suggestedFilename().startsWith('Transcript-')&&fs.readFileSync(await download.path(),'utf8')===copied);
  await reader.getByRole('searchbox').fill('');
  await reader.getByRole('button',{name:'Detailed timestamps',exact:true}).click();
  ok('detailed view retains all 180 entries and original timestamps',await reader.locator('li').count()===180&&await reader.locator('time').first().getAttribute('datetime')==='2026-10-12T12:00:00.000Z');
  await reader.getByRole('searchbox').fill('latch adjustment');
  ok('detailed search still filters entries and highlights the matched phrase',await reader.locator('li').count()===1&&await reader.locator('mark').innerText()==='latch adjustment');
  await reader.getByRole('searchbox').fill('unmatched-query');
  ok('search has a clear empty state',await reader.getByText('No matching transcript text.',{exact:true}).isVisible());
  await reader.getByRole('searchbox').fill('');
  await reader.getByRole('button',{name:'Readable view',exact:true}).click();
  await reader.getByRole('searchbox').fill('unmatched-query');
  ok('an unmatched readable search leaves the full transcript on screen',await reader.locator('.transcript-paragraph').count()===paragraphCount&&await reader.getByText('No matching transcript text.',{exact:true}).isVisible());
  await clearSearch();
  await page.getByRole('button',{name:'Switch interface language',exact:true}).click();await page.getByRole('button',{name:'Español',exact:true}).click();
  ok('Spanish controls retain original spoken text and translate the search icon',await page.getByRole('button',{name:'Copiar toda la transcripción',exact:true}).isVisible()&&await reader.getByRole('button',{name:'Buscar',exact:true}).isVisible()&&await reader.getByRole('button',{name:'Limpiar',exact:true}).count()===0&&await page.getByText(/Keep the aisle clear\./).isVisible());
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Blocked');}}}));
  await page.getByRole('button',{name:'Copiar toda la transcripción',exact:true}).click();
  const fallback=page.getByRole('textbox',{name:'Transcripción completa',exact:true});await fallback.waitFor();
  ok('blocked clipboard offers a selectable full transcript fallback', (await fallback.inputValue()).includes('El pasillo está libre.'));
  await page.setViewportSize({width:390,height:844});
  ok('mobile transcript stays within its panel',await page.locator('.meeting-transcript').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await reader.getByRole('searchbox').fill('pasillo');
  await reader.getByRole('button',{name:'Buscar',exact:true}).click();
  ok('mobile Search highlights Spanish speech and dismisses input focus',await reader.locator('mark').innerText()==='pasillo'&&await reader.getByRole('searchbox').evaluate(el=>document.activeElement!==el));
  const saved=await page.evaluate(async()=>JSON.stringify((await MMB.repository.load()).meetings[0].transcript));
  ok('viewing, searching, copying, downloading and switching languages leave saved fragments unchanged',saved===original&&errors.length===0);
  console.log(`${checks.length} transcript reader checks passed.`);
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exit(1);});
