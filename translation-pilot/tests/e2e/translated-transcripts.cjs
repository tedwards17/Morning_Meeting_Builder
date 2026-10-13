const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const server=spawn('python3',['-m','http.server','5196','--bind','127.0.0.1','--directory','build'],{stdio:'ignore'});
 let browser;let count=0;const ok=(name,value)=>{assert.ok(value,name);count++;console.log('PASS',name);};
 try{
  await new Promise(resolve=>setTimeout(resolve,400));browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});await context.grantPermissions(['clipboard-read','clipboard-write']);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const calls=[];let authenticated=true;let rejectResponse=false;
  const dictionary={'Check compressor alignment.':'Revisa la alineación del compresor.','Las herramientas están listas.':'The tools are ready.','Inspect the latch.':'Inspecciona el cierre.','Hola equipo.':'Hello team.'};
  await page.route('**/translation-api/index.php?*',async route=>{
   const action=new URL(route.request().url()).searchParams.get('action');const body=route.request().postDataJSON();calls.push({action,body});
   const data=action==='status'?{enabled:true,authenticated,csrf:authenticated?'test-csrf':''}:action==='unlock'?(authenticated=true,{authenticated:true,csrf:'test-csrf'}):
    {translations:body.items.map(item=>({id:rejectResponse?crypto.randomUUID():item.id,language:body.source==='en'?'es':'en',text:dictionary[item.text]}))};
   await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto('http://127.0.0.1:5196/demo/');await page.locator('.start-panel').waitFor();
  await page.getByRole('button',{name:'Build a meeting',exact:true}).last().click();await page.getByPlaceholder('Who is leading today?').fill('Bilingual test');
  await page.getByRole('button',{name:'Save presentation',exact:true}).click();await page.getByText('Presentation saved for future use.',{exact:true}).waitFor();
  const original=await page.evaluate(async()=>{
   const state=await MMB.repository.load(),meeting=state.meetings[0],slide=meeting.slides[0];meeting.status='completed';meeting.startedAt=new Date().toISOString();
   meeting.transcript=[['en','Check compressor alignment.',{es:'Revisa la alineación del compresor.'}],['es','Las herramientas están listas.'],['en','Inspect the latch.']].map(([language,text,translations])=>({id:crypto.randomUUID(),at:meeting.startedAt,language,text,...(translations?{translations}:{}),slideId:slide.id,slideTitle:slide.definition.title,presenter:meeting.presenter,contentTitles:[]}));
   const legacy=structuredClone(meeting);legacy.id=crypto.randomUUID();legacy.templateName='Legacy transcript';legacy.presenter='Legacy presenter';legacy.transcript=[{...meeting.transcript[1],id:crypto.randomUUID(),text:'Hola equipo.'}];state.meetings.push(legacy);
   await MMB.repository.save(state);return meeting.transcript.map(({translations,...entry})=>entry);
  });
  await page.reload();await page.locator('.start-panel').waitFor();await page.getByRole('button',{name:'Meetings',exact:true}).click();await page.locator('.meeting-list-row').filter({hasText:'Bilingual test'}).click();
  const reader=page.locator('.meeting-transcript');await reader.getByText(/The tools are ready/).waitFor();
  ok('English interface shows all speech in English with translated passages marked',await reader.getByText(/Check compressor alignment\./).isVisible()&&await reader.getByText(/Inspect the latch\./).isVisible()&&await reader.locator('em').innerText()==='The tools are ready.*'&&!(await reader.locator('.transcript-paragraphs').innerText()).includes('Las herramientas'));
  ok('only missing Spanish-to-English text is translated; saved captions are reused',calls.filter(c=>c.action==='transcript').length===1&&calls.find(c=>c.action==='transcript').body.items.length===1&&calls.find(c=>c.action==='transcript').body.source==='es');
  await reader.getByRole('button',{name:'Copy entire transcript',exact:true}).click();await reader.getByText('Entire transcript copied.',{exact:true}).waitFor();
  const english=await page.evaluate(()=>navigator.clipboard.readText());
  ok('Copy uses displayed English',english.includes('The tools are ready.*')&&!english.includes('Las herramientas'));
  let downloadPromise=page.waitForEvent('download');await reader.getByRole('button',{name:'Download spoken transcript (.txt)',exact:true}).click();let downloaded=fs.readFileSync(await (await downloadPromise).path(),'utf8');
  ok('Download preserves English and Spanish exactly as spoken',downloaded.includes('Check compressor alignment.')&&downloaded.includes('Las herramientas están listas.')&&downloaded.includes('Inspect the latch.')&&!downloaded.includes('The tools are ready.')&&!downloaded.includes('Translated from'));
  await page.getByRole('button',{name:'Switch interface language',exact:true}).click();await page.getByRole('button',{name:'Español',exact:true}).click();await reader.getByText(/Inspecciona el cierre/).waitFor();
  ok('Spanish interface uses saved Spanish captions plus original Spanish speech',(await reader.locator('.transcript-paragraphs').innerText()).includes('Revisa la alineación del compresor.')&&(await reader.locator('.transcript-paragraphs').innerText()).includes('Las herramientas están listas.')&&!(await reader.locator('.transcript-paragraphs').innerText()).includes('Inspect the latch.'));
  ok('switching language translates only the remaining uncached English passage',calls.filter(c=>c.action==='transcript').length===2&&calls.filter(c=>c.action==='transcript')[1].body.items[0].text==='Inspect the latch.');
  await reader.getByRole('button',{name:'Copiar toda la transcripción',exact:true}).click();await reader.getByText('Se copió la transcripción completa.',{exact:true}).waitFor();
  const spanish=await page.evaluate(()=>navigator.clipboard.readText());ok('Copy switches to Spanish',spanish.includes('Inspecciona el cierre.*')&&spanish.includes('Las herramientas están listas.')&&!spanish.includes('The tools are ready.'));
  downloadPromise=page.waitForEvent('download');await reader.getByRole('button',{name:'Descargar transcripción original (.txt)',exact:true}).click();downloaded=fs.readFileSync(await (await downloadPromise).path(),'utf8');
  ok('Spanish-interface download also keeps the original mixed speech',downloaded.includes('Inspect the latch.')&&downloaded.includes('Las herramientas están listas.')&&!downloaded.includes('Inspecciona el cierre.'));
  await page.getByRole('button',{name:'Cambiar idioma de la interfaz',exact:true}).click();await page.getByRole('button',{name:'English',exact:true}).click();await reader.getByText(/The tools are ready/).waitFor();
  const stored=await page.evaluate(async()=>{const meeting=(await MMB.repository.load()).meetings.find(m=>m.presenter==='Bilingual test'&&m.templateName!=='Legacy transcript');return meeting.transcript.map(({translations,...entry})=>entry);});
  ok('language switches do not modify spoken words, timestamps, order or identifiers',JSON.stringify(stored)===JSON.stringify(original)&&calls.filter(c=>c.action==='transcript').length===2);
  await page.getByRole('button',{name:'Meetings',exact:true}).click();authenticated=false;
  await page.evaluate(()=>{MMB.canSaveTranscriptTranslations=()=>false;});
  await page.locator('.meeting-list-row').filter({hasText:'Legacy transcript'}).click();await reader.getByRole('button',{name:'Prepare translated transcript',exact:true}).waitFor();
  ok('legacy missing translations require protected access and cannot be copied as mixed English',await reader.getByRole('button',{name:'Copy entire transcript',exact:true}).isDisabled());
  await reader.getByRole('button',{name:'Prepare translated transcript',exact:true}).click();const prompt=page.getByRole('dialog',{name:'Enter information',exact:true});await prompt.waitFor();await prompt.getByLabel('Presenter passphrase',{exact:true}).fill('test-only-passphrase');
  rejectResponse=true;await prompt.getByRole('button',{name:'OK',exact:true}).click();await reader.getByText('The translated transcript response was incomplete. Try again.',{exact:true}).waitFor();
  ok('unmatched provider identifiers cannot attach translations to the wrong speech',await reader.getByRole('button',{name:'Copy entire transcript',exact:true}).isDisabled());
  rejectResponse=false;await reader.getByRole('button',{name:'Prepare translated transcript',exact:true}).click();await reader.getByText(/Hello team/).waitFor();
  ok('read-only reviews cache translations without altering the meeting record',await page.evaluate(async()=>!(await MMB.repository.load()).meetings.find(m=>m.templateName==='Legacy transcript').transcript[0].translations));
  const requestCount=calls.length;await page.addInitScript(()=>Object.defineProperty(navigator,'onLine',{get:()=>false}));await page.reload();await page.locator('.start-panel').waitFor();await page.getByRole('button',{name:'Meetings',exact:true}).click();await page.locator('.meeting-list-row').filter({hasText:'Legacy transcript'}).click();await reader.getByText(/Hello team/).waitFor();
  ok('cached translated transcripts survive reload and read offline without new requests',calls.length===requestCount&&await reader.getByRole('button',{name:'Copy entire transcript',exact:true}).isEnabled());
  ok('review never starts microphone sessions and has no runtime errors',!calls.some(c=>['session','text','stop'].includes(c.action))&&errors.length===0);
  console.log(`${count} translated-transcript checks passed.`);
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exit(1);});
