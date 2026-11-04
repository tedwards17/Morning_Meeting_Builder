const {chromium}=require('playwright'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
let checks=0;const check=(name,ok)=>{assert.ok(ok,name);checks++;console.log('PASS',name);};
(async()=>{
 const server=spawn('python3',['-m','http.server','5198','--bind','127.0.0.1','--directory','build/demo'],{stdio:'ignore'});let browser,p;
 try{
  await new Promise(r=>setTimeout(r,300));browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  for(const viewport of [{width:1920,height:1080},{width:390,height:844},{width:844,height:390}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block'});p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await context.route('https://i.ytimg.com/**',r=>r.abort());
   await context.route('https://www.youtube.com/iframe_api',r=>r.fulfill({contentType:'application/javascript',body:`window.YT={Player:function(el,c){window.ytCreated=(window.ytCreated||0)+1;this.destroy=()=>{window.ytDestroyed=(window.ytDestroyed||0)+1;};this.playVideo=()=>c.events.onStateChange?.({data:1,target:this});this.stopVideo=()=>{};setTimeout(()=>{c.events.onReady?.({target:this});this.playVideo();},10);}};window.onYouTubeIframeAPIReady?.();`}));
   await p.addInitScript(()=>{
    window.trackStops=0;window.socketCloses=0;
    const track={stop(){window.trackStops++;},addEventListener(){}};
    Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[track],getAudioTracks:()=>[track]})},configurable:true});
    window.AudioContext=class{sampleRate=48000;state='running';destination={};audioWorklet={addModule:async()=>{}};resume=async()=>{};close=async()=>{};createMediaStreamSource(){return{connect:n=>n,disconnect(){}};}createGain(){return{gain:{value:1},connect:n=>n,disconnect(){}};}};
    window.AudioWorkletNode=class{port={onmessage:null};connect(n){return n;}disconnect(){}};
    window.WebSocket=class{static OPEN=1;readyState=1;bufferedAmount=0;constructor(){window.testSocket=this;setTimeout(()=>this.onopen?.(),0);}send(){}close(){this.readyState=3;window.socketCloses++;}};
   });
   await p.route('**/translation-api/index.php?*',async r=>{
    const a=new URL(r.request().url()).searchParams.get('action'),b=r.request().postDataJSON();
    const data=a==='status'?{enabled:true,authenticated:true,csrf:'mock'}:a==='session'?{access_token:'mock',sessionId:'mock',expiresAt:Math.floor(Date.now()/1000)+2700}:a==='text'?{text:b.source==='en'?'El camión está listo.':'The truck is ready.'}:{ok:true};
    await r.fulfill({contentType:'application/json',body:JSON.stringify(data)});
   });
   await p.goto('http://127.0.0.1:5198/');await p.locator('.start-panel').waitFor();
   await p.evaluate(async()=>{
    const s=await MMB.repository.load(),t=s.templates[0],base=t.slides[0],id=crypto.randomUUID();
    const slides=['Navigation one','Temporary image','YouTube playback','Explicit finish'].map((title,i)=>({...base,id:crypto.randomUUID(),title,type:i===1||i===2?'gallery':'text',libraryId:undefined,contentIds:[],selection:'manual',text:'Shop meeting navigation check',defaultSkipped:false,optional:false,mediaUrl:i===2?'https://www.youtube.com/watch?v=dQw4w9WgXcQ':undefined}));
    await MMB.repository.save({...s,templates:[...s.templates,{...t,id,name:'Navigation fixture',slides,groups:[]}],settings:{...s.settings,lastTemplateId:id,defaultTemplateId:id}});
   });
   await p.reload();await p.getByRole('button',{name:'Build a meeting',exact:true}).last().click();await p.getByPlaceholder('Who is leading today?').fill('Navigation tester');
   await p.locator('.meeting-agenda .agenda-row').filter({has:p.getByText('Temporary image',{exact:true})}).locator('.agenda-select').click();
   const chooser=p.waitForEvent('filechooser');await p.getByRole('button',{name:'Upload images / videos',exact:true}).click();await(await chooser).setFiles({name:'shop-test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAAHUlEQVR4nGOU9M5jIBcwka1zVPOo5lHNo5qpohkASx8A+rXaktMAAAAASUVORK5CYII=','base64')});await p.getByText('Media attached and saved to this meeting.',{exact:true}).waitFor();
   await p.getByRole('button',{name:'Save presentation',exact:true}).click();
   const before=await p.evaluate(async()=>{const s=await MMB.repository.load(),m=s.meetings.at(-1);return{id:m.id,usage:s.usage.length,items:m.slides.flatMap(s=>s.items.map(i=>i.id)),length:history.length};});
   const label=viewport.width+': ';
   for(let repeat=0;repeat<2;repeat++){
    await p.getByRole('button',{name:'Preview',exact:true}).click();await p.getByRole('dialog',{name:/Meeting preview/}).waitFor();
    const length=await p.evaluate(()=>history.length);await p.getByRole('dialog',{name:/Meeting preview/}).getByRole('button',{name:'Next',exact:true}).click();
    check(label+'preview rerenders do not add history '+repeat,await p.evaluate(()=>history.length)===length);
    await p.evaluate(()=>history.back());await p.getByRole('dialog',{name:/Meeting preview/}).waitFor({state:'hidden'});await p.waitForFunction(()=>!history.state?.mmbPresentation);
   }
   check(label+'Back from preview restores same draft without usage or lost media',await p.evaluate(async b=>{const s=await MMB.repository.load(),m=s.meetings.find(m=>m.id===b.id);return m.status==='draft'&&s.usage.length===b.usage&&b.items.every(id=>m.slides.some(s=>s.items.some(i=>i.id===id)));},before));
   await p.locator('.meeting-agenda .agenda-row').filter({has:p.getByText('YouTube playback',{exact:true})}).locator('.agenda-select').click();
   await p.locator('.review-selection').getByRole('button',{name:/Play preview/}).click();await p.locator('.content-preview').waitFor();await p.waitForFunction(()=>window.ytCreated===1);await p.evaluate(()=>history.back());await p.locator('.content-preview').waitFor({state:'hidden'});await p.waitForFunction(()=>!history.state?.mmbPresentation);
   check(label+'Back from thumbnail preview restores the builder and destroys its player',await p.locator('.meeting-layout').isVisible()&&await p.evaluate(()=>!!window.ytDestroyed)&&await p.evaluate(async n=>(await MMB.repository.load()).usage.length===n,before.usage));
   await p.getByRole('button',{name:/^Present (saved )?meeting$/}).click();await p.locator('.presentation').waitFor();
   await p.getByRole('button',{name:'Start Translation',exact:true}).click();await p.getByRole('button',{name:'Stop Translation',exact:true}).waitFor();await p.waitForFunction(()=>window.testSocket?.onmessage);
   const emit=async(source='en')=>{await p.evaluate(source=>testSocket.onmessage({data:JSON.stringify({type:'Results',is_final:true,channel:{alternatives:[{transcript:'Truck ready',words:[{word:'Truck',language:source},{word:'ready',language:source}]}]}})}),source);};
   await emit();await p.locator('.caption-es').first().waitFor();
   check(label+'stable active button replaces floating status',await p.getByRole('button',{name:'Stop Translation',exact:true}).getAttribute('aria-pressed')==='true'&&await p.locator('.translation-state').count()===0);
   const visible=await p.locator('.presentation-next').boundingBox();await p.keyboard.press('ArrowRight');await p.waitForTimeout(180);
   const hidden=await p.locator('.presentation-next').boundingBox();check(label+'one persistent touch target keeps identical geometry',await p.getByRole('button',{name:'Next slide',exact:true}).count()===1&&hidden.width>=44&&hidden.height>=44&&Math.abs(visible.x-hidden.x)<.1&&Math.abs(visible.y-hidden.y)<.1);
   check(label+'captions clear hidden Next and retain language contrast',await p.locator('.translation-caption').evaluate((el,b)=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el),color=getComputedStyle(el.querySelector('.caption-es')).color;return r.bottom<b.y&&parseFloat(s.fontSize)<=(innerWidth>680?25.3:15.5)&&getComputedStyle(el.querySelector('.caption-line')).backgroundColor.includes('0.65')&&color==='rgb(138, 230, 163)';},hidden));
   await p.locator('.presentation-next').click();await p.locator('.presentation-stage h2').filter({hasText:'YouTube playback'}).waitFor();await p.waitForTimeout(150);
   check(label+'hidden Next advances once and captions survive media/YouTube slide changes',await p.locator('.presentation-controls').innerText().then(t=>t.includes('3 / 4'))&&await p.locator('.caption-es').count()>0);
   await p.waitForFunction(()=>window.ytCreated>=2);check(label+'YouTube player remains active under captions',await p.locator('.presentation-stage .youtube-player').count()===1&&await p.evaluate(()=>ytCreated>=2));
   await emit('es');await p.locator('.caption-en').first().waitFor();check(label+'caption word spacing is readable',await p.locator('.caption-line').innerText().then(t=>t.includes('El camión está listo.')&&t.includes('The truck is ready.')));check(label+'English remains blue while Spanish remains green',await p.locator('.caption-en').first().evaluate(el=>getComputedStyle(el).color==='rgb(143, 200, 255)'));
   await p.screenshot({path:`/tmp/mmb0695-${viewport.width}.png`});
   if(viewport.width===1920){for(const [name,bg] of [['light','#fff'],['dark','#09131b'],['busy','repeating-linear-gradient(35deg,#eee 0px,#eee 12px,#222 12px,#222 24px)']]){
    await p.locator('.presentation-stage .slide-canvas').evaluate((el,bg)=>el.style.background=bg,bg);await p.screenshot({path:`/tmp/mmb0695-background-${name}.png`});
    check('caption contrast over '+name,await p.locator('.caption-line').first().evaluate(el=>getComputedStyle(el).backgroundColor.includes('0.65')&&getComputedStyle(el).opacity==='1'));
   }}
   await p.waitForTimeout(5200);check(label+'captions clear after five seconds of silence',await p.locator('.caption-line').count()===0);
   await p.locator('.presentation-stage').click({position:{x:10,y:10}});await p.waitForTimeout(180);const bar=await p.locator('.presentation-controls').boundingBox();await emit();await p.locator('.caption-es').first().waitFor();await p.waitForTimeout(180);
   check(label+'captions clear expanded controls',await p.locator('.translation-caption').evaluate((el,b)=>el.getBoundingClientRect().bottom<=b.y-5,bar));
   await p.evaluate(()=>history.back());let dialog=p.getByRole('dialog',{name:'Confirm action',exact:true});await dialog.waitFor();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();check(label+'Back cancellation keeps presentation and capture',await p.locator('.presentation').isVisible()&&await p.evaluate(()=>trackStops)===0);
   await p.evaluate(()=>history.back());await dialog.waitFor();await p.evaluate(()=>history.back());await p.waitForTimeout(80);check(label+'repeated Back keeps only one confirmation',await dialog.count()===1);await dialog.getByRole('button',{name:'Confirm',exact:true}).click();await p.getByPlaceholder('Who is leading today?').waitFor();await p.waitForFunction(()=>!history.state?.mmbPresentation);
   check(label+'actual Back preserves transcript and media and shuts down microphone',await p.evaluate(async b=>{const s=await MMB.repository.load(),m=s.meetings.find(m=>m.id===b.id);return trackStops===1&&socketCloses===1&&m.status==='presenting'&&!m.mediaCleanupConfirmed&&!m.mediaExpiredAt&&m.transcript.length>=3&&b.items.every(id=>m.slides.some(s=>s.items.some(i=>i.id===id)));},before));
   await p.getByRole('button',{name:'Resume presentation',exact:true}).click();await p.locator('.presentation').waitFor();await p.keyboard.press('End');for(let i=0;i<3;i++)await p.keyboard.press('ArrowRight');await p.getByRole('button',{name:'Finish meeting',exact:true}).waitFor();
   await p.locator('.presentation-next').click();await dialog.waitFor();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();check(label+'final persistent button requires explicit confirmation',await p.evaluate(async id=>{const m=(await MMB.repository.load()).meetings.find(m=>m.id===id);return m.status!=='completed'&&!m.mediaCleanupConfirmed;},before.id));
   if(viewport.width===1920){
    await p.locator('.presentation-stage').click({position:{x:10,y:10}});await p.getByRole('button',{name:'Fullscreen',exact:true}).click();await p.waitForFunction(()=>document.fullscreenElement||document.querySelector('.fullscreen-message'));const entered=await p.evaluate(()=>!!document.fullscreenElement);console.log('Fullscreen API entered:',entered);
    if(!entered)await p.locator('.fullscreen-message').waitFor();check('fullscreen is available or gives its explicit browser limitation',entered||await p.locator('.fullscreen-message').isVisible());
    if(entered){check('fullscreen Next remains within safe viewport',await p.locator('.presentation-next').evaluate(el=>{const r=el.getBoundingClientRect();return r.right<=innerWidth&&r.bottom<=innerHeight;}));await p.evaluate(()=>history.back());await dialog.waitFor();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();check('browser-history Back in native fullscreen preserves pause confirmation',await p.locator('.presentation').isVisible());if(await p.evaluate(()=>!!document.fullscreenElement))await p.evaluate(()=>document.exitFullscreen());}
   }
   await p.evaluate(()=>history.back());await dialog.waitFor();await dialog.getByRole('button',{name:'Confirm',exact:true}).click();await p.getByPlaceholder('Who is leading today?').waitFor();await p.waitForFunction(()=>!history.state?.mmbPresentation);
   await p.evaluate(()=>{window.normalPops=0;window.addEventListener('popstate',()=>normalPops++);history.pushState({normal:true},'',location.href);history.back();});await p.waitForFunction(()=>normalPops===1);
   check(label+'normal navigation outside presentation has no guard or trap',await p.locator('.presentation').count()===0&&await p.evaluate(()=>!history.state?.mmbPresentation)&&errors.length===0);
   if(viewport.width===1920){
    const es=require('../../frontend/src/locales/es-MX.json');await p.locator('.sidebar .language-button').click();await p.getByRole('button',{name:'Español',exact:false}).click();
    await p.getByRole('button',{name:es['Resume presentation'],exact:true}).click();await p.locator('.presentation').waitFor();
    check('Spanish navigation labels',await p.getByRole('button',{name:es['Next slide'],exact:true}).count()===1);
    await p.getByRole('button',{name:es['Start Translation'],exact:true}).click();await p.waitForFunction(()=>window.testSocket?.onmessage&&window.testSocket.readyState===1);await emit();await p.locator('.caption-es').first().waitFor();
    await p.getByRole('button',{name:es['Stop Translation'],exact:true}).click();await p.waitForFunction(()=>!document.querySelector('.caption-line'));
    check('explicit Stop clears captions immediately',await p.getByRole('button',{name:es['Start Translation'],exact:true}).getAttribute('aria-pressed')==='false');
    await p.getByRole('button',{name:es['Start Translation'],exact:true}).click();await p.waitForFunction(()=>window.testSocket?.onclose&&window.testSocket.readyState===1);await p.evaluate(()=>testSocket.onclose());
    check('actionable connection errors remain visible in Spanish',await p.getByRole('alert').filter({hasText:es['Speech connection ended. Start Translation to reconnect.']}).isVisible());
    await p.evaluate(()=>history.back());const d=p.getByRole('dialog',{name:es['Confirm action'],exact:true});await d.waitFor();await d.getByRole('button',{name:es['Confirm'],exact:true}).click();await p.locator('.meeting-layout').waitFor();await p.waitForFunction(()=>!history.state?.mmbPresentation);
   }
   if(viewport.width===844){
    await p.getByRole('button',{name:'Resume presentation',exact:true}).click();await p.locator('.presentation').waitFor();for(let i=0;i<3;i++)await p.keyboard.press('ArrowRight');
    await p.getByRole('button',{name:'Finish meeting',exact:true}).click();const d=p.getByRole('dialog',{name:'Confirm action',exact:true});await d.waitFor();await d.getByRole('button',{name:'Confirm',exact:true}).click();await p.locator('.presentation').waitFor({state:'hidden'});
    check('only explicit confirmed Finish completes the meeting and enables media cleanup',await p.evaluate(async id=>{const m=(await MMB.repository.load()).meetings.find(m=>m.id===id);return m.status==='completed'&&m.mediaCleanupConfirmed&&m.mediaExpiredAt&&m.transcript.length>=3;},before.id));
   }
   await context.close();
  }
  console.log('Round 6 caption/navigation:',checks,'checks passed');
 }catch(e){if(p){console.error((await p.locator('body').innerText()).slice(-3500));await p.screenshot({path:'/tmp/mmb0695-failure.png'}).catch(()=>{});}throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1);});
