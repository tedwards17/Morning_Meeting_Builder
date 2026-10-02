const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const fs=require('node:fs');
(async()=>{
const server=spawn('python3',['-m','http.server','5183','--bind','127.0.0.1','--directory','build'],{stdio:'ignore'});
let browser;const checks=[];function ok(name,test){assert.ok(test,name);checks.push(name);console.log('PASS',name)}
try{
await new Promise(r=>setTimeout(r,500));browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
for(const viewport of [{width:1366,height:900},{width:390,height:844},{width:844,height:390}]){
const context=await browser.newContext({viewport,serviceWorkers:'block'});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
// YouTube network is mocked: this verifies the existing player wrapper and overlay, not actual playback.
await p.route('https://www.youtube.com/iframe_api',route=>route.fulfill({contentType:'application/javascript',body:`window.YT={Player:class{constructor(element,options){this.iframe=document.createElement('iframe');this.iframe.src='https://www.youtube.com/embed/'+options.videoId;this.iframe.style.cssText='width:100%;height:100%';element.replaceWith(this.iframe);}destroy(){this.iframe.remove();}}};window.onYouTubeIframeAPIReady?.();`}));
await p.route(/https:\/\/(www\.youtube|www\.youtube-nocookie)\.com\/embed\//,route=>route.fulfill({contentType:'text/html',body:'<html><body style="background:#111;color:white">YouTube iframe placeholder</body></html>'}));
await p.goto('http://127.0.0.1:5183/demo/');await p.locator('.start-panel').waitFor();
await p.getByRole('button',{name:/Build a meeting/}).last().click();await p.getByPlaceholder('Who is leading today?').fill('Round 4 test');
for(const title of ['Personal share','Small changes. Better work.']){await p.locator('.agenda-select').filter({hasText:title}).click();await p.getByLabel('Skip this slide',{exact:true}).check();} await p.getByRole('button',{name:'Save presentation',exact:true}).click();
await p.locator('.recent-list button').first().waitFor();
await p.evaluate(async()=>{const state=await MMB.repository.load();const meeting=state.meetings.at(-1);const slide=meeting.slides.find(s=>s.definition.title==='Safety Moment');const video=state.items.find(item=>item.type==='external-video'&&item.libraryId===slide.definition.libraryId)||state.items.find(item=>item.type==='external-video');if(!video)throw new Error('Missing shipped YouTube test content');slide.items=[structuredClone(video)];await MMB.repository.save(state);});
await p.reload();await p.locator('.recent-list button').first().click();
await p.getByRole('button',{name:'Present saved meeting',exact:true}).last().click();await p.locator('.presentation').waitFor();
ok(`${viewport.width}: fullscreen control present`,await p.getByRole('button',{name:'Fullscreen',exact:true}).count()===1);
await p.getByRole('button',{name:'Fullscreen',exact:true}).click();
await p.getByRole('button',{name:'Exit fullscreen',exact:true}).waitFor();ok(`${viewport.width}: fullscreen entered`,await p.evaluate(()=>Boolean(document.fullscreenElement)));
await p.getByRole('button',{name:'Exit fullscreen',exact:true}).click();ok(`${viewport.width}: fullscreen exited`,await p.evaluate(()=>!document.fullscreenElement));
await p.getByRole('button',{name:'Preview captions',exact:true}).click();
await p.locator('.translation-caption').waitFor();
await p.waitForTimeout(50);
const box=await p.locator('.translation-caption').boundingBox();const controls=await p.locator('.presentation-controls').boundingBox();
ok(`${viewport.width}: bottom gap is 6 pixels`,Math.abs(viewport.height-box.y-box.height-6)<2);
ok(`${viewport.width}: navigation remains above captions`,controls.y+controls.height<=box.y-3);
ok(`${viewport.width}: caption stays inside visible width`,box.x>=0&&box.x+box.width<=viewport.width);
await p.screenshot({path:`test-results/round4-${viewport.width}.png`});
// Slide changes preserve overlay; advance to the existing safety YouTube slide.
for(let i=0;i<2;i++)await p.getByRole('button',{name:'Next slide',exact:true}).click();
await p.locator('.youtube-player iframe').waitFor({timeout:5000});
await p.getByRole('button',{name:'Preview captions',exact:true}).click();
ok(`${viewport.width}: YouTube embed retained with captions`,await p.locator('.youtube-player iframe').count()===1&&await p.locator('.translation-caption').isVisible());
await p.screenshot({path:`test-results/round4-video-${viewport.width}.png`});
await p.getByRole('button',{name:'Start Translation',exact:true}).click();
await p.locator('.translation-state.error').waitFor();ok(`${viewport.width}: Pages limitation explained`,(await p.locator('.translation-state').innerText()).includes('GitHub Pages'));
await p.evaluate(()=>{Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true})});
await p.getByRole('button',{name:'Fullscreen',exact:true}).click();ok(`${viewport.width}: unsupported fullscreen gives fallback`,(await p.locator('.fullscreen-message').innerText()).includes('Add to Home Screen'));
ok(`${viewport.width}: no runtime errors`,errors.length===0);
await context.close();}
const audioContext=await browser.newContext({serviceWorkers:'block',permissions:['microphone']});const audioPage=await audioContext.newPage();
await audioPage.addInitScript(()=>{
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async options=>{window.testStream=await original(options);return window.testStream;};
  window.WebSocket=class{
    static OPEN=1;
    readyState=1;bufferedAmount=0;binaryCount=0;
    constructor(url,protocols){this.url=url;this.protocols=protocols;window.testSocket=this;setTimeout(()=>this.onopen?.(),0);}
    send(data){if(data instanceof ArrayBuffer)this.binaryCount++;}
    close(){this.closed=true;this.readyState=3;}
  };
});
await audioPage.route('**/translation-api/index.php?*',async route=>{
  const action=new URL(route.request().url()).searchParams.get('action');
  const body=route.request().postDataJSON();
  const response=action==='status'?{enabled:true,authenticated:true,csrf:'test-csrf'}:action==='session'?{access_token:'short-lived-test-token',sessionId:'test-session',expiresAt:Math.floor(Date.now()/1000)+2700}:action==='text'?{text:body.source==='en'?'Buenos días':'Good morning'}:{ok:true};
  await route.fulfill({contentType:'application/json',body:JSON.stringify(response)});
});
await audioPage.goto('http://127.0.0.1:5183/demo/');await audioPage.locator('.start-panel').waitFor();await audioPage.getByRole('button',{name:/Build a meeting/}).last().click();await audioPage.getByPlaceholder('Who is leading today?').fill('PCM pipeline test');
for(const title of ['Personal share','Small changes. Better work.']){await audioPage.locator('.agenda-select').filter({hasText:title}).click();await audioPage.getByLabel('Skip this slide',{exact:true}).check();}
await audioPage.getByRole('button',{name:'Save presentation',exact:true}).click();await audioPage.locator('.recent-list button').first().click();await audioPage.getByRole('button',{name:'Present saved meeting',exact:true}).click();
await audioPage.getByRole('button',{name:'Start Translation',exact:true}).click();
await audioPage.waitForFunction(()=>window.testSocket?.binaryCount>2);
ok('actual browser AudioWorklet sends PCM from a synthetic microphone',await audioPage.evaluate(()=>testSocket.binaryCount>2&&testSocket.url.includes('encoding=linear16')&&testSocket.protocols[0]==='bearer'));
await audioPage.evaluate(()=>testSocket.onmessage({data:JSON.stringify({type:'Results',is_final:true,channel:{alternatives:[{transcript:'Good morning',words:[{word:'Good',language:'en'},{word:'morning',language:'en'}]}]}})}));
await audioPage.getByText('Buenos días',{exact:true}).waitFor();
const shortBox=await audioPage.locator('.translation-caption').boundingBox();
ok('short captions fit text without stretching',shortBox.width<500);
await audioPage.getByRole('button',{name:'Stop Translation',exact:true}).click();
ok('manual stop ends actual browser audio tracks and closes socket',await audioPage.evaluate(()=>testStream.getTracks().every(t=>t.readyState==='ended')&&testSocket.closed));
await audioPage.getByRole('button',{name:'Start Translation',exact:true}).click();await audioPage.waitForFunction(()=>testSocket.binaryCount>2);
audioPage.on('dialog',dialog=>dialog.accept());await audioPage.getByRole('button',{name:'Pause and exit presentation',exact:true}).click();await audioPage.locator('.presentation').waitFor({state:'detached'});
ok('exiting presentation releases the actual browser capture pipeline',await audioPage.evaluate(()=>testStream.getTracks().every(t=>t.readyState==='ended')&&testSocket.closed));
await audioContext.close();
const context=await browser.newContext({serviceWorkers:'block'});const p=await context.newPage();
await p.route('**/config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MMB_CONFIG={translationEnabled:false,captionGap:0}'}));
await p.goto('http://127.0.0.1:5183/demo/');await p.locator('.start-panel').waitFor();await p.getByRole('button',{name:/Build a meeting/}).last().click();await p.getByPlaceholder('Who is leading today?').fill('Disabled captions test');for(const title of ['Personal share','Small changes. Better work.']){await p.locator('.agenda-select').filter({hasText:title}).click();await p.getByLabel('Skip this slide',{exact:true}).check();} await p.getByRole('button',{name:'Save presentation',exact:true}).click();await p.locator('.recent-list button').first().waitFor();await p.locator('.recent-list button').first().click();await p.getByRole('button',{name:'Present saved meeting',exact:true}).last().click();await p.locator('.presentation').waitFor();
ok('disabled configuration hides captions and keeps presentation navigation',await p.getByRole('button',{name:'Start Translation',exact:true}).count()===0&&await p.getByRole('button',{name:'Preview captions',exact:true}).count()===0&&await p.getByRole('button',{name:'Next slide',exact:true}).isVisible());
await context.close();fs.writeFileSync('test-results/round4-checks.json',JSON.stringify(checks,null,2));console.log(`${checks.length} browser checks passed. YouTube frames mocked; mobile layouts emulated.`);
}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
