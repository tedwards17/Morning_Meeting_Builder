const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const server=spawn('python3',['-m','http.server','5194','--bind','127.0.0.1','--directory','build'],{stdio:'ignore'});
 let browser;let count=0;
 const ok=(name,value)=>{assert.ok(value,name);count++;console.log('PASS',name);};
 try{
  await new Promise(resolve=>setTimeout(resolve,400));
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const viewport of [{width:1366,height:900},{width:844,height:390},{width:667,height:375},{width:390,height:844}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block'});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:5194/demo/');await page.locator('.start-panel').waitFor();
   if(viewport.width<=680)await page.getByRole('button',{name:'Open navigation',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().left>=-.1);
   const selector=page.locator('.sidebar .language-selector');const flag=selector.locator('.language-button');
   await flag.waitFor();const box=await flag.boundingBox();
   ok(`${viewport.width}: square flag button is inside sidebar and unobstructed`,Math.abs(box.width-box.height)<1&&await flag.innerText()===''&&await flag.evaluate(el=>{const r=el.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el.contains(top)&&r.top>=0&&r.bottom<=innerHeight;}));
   ok(`${viewport.width}: no language selector behind the top toolbar or hamburger`,await page.locator('.v2-bar .language-selector').count()===0);
   await flag.click();const menu=selector.locator('.language-menu');await menu.waitFor();
   ok(`${viewport.width}: dropdown shows flags and names within visible screen`,await menu.getByRole('button',{name:'English',exact:true}).isVisible()&&await menu.getByRole('button',{name:'Español',exact:true}).isVisible()&&await menu.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}));
   await menu.getByRole('button',{name:'Español',exact:true}).click();
   ok(`${viewport.width}: Spanish selection changes the flag and interface`,await flag.getAttribute('title')==='Español'&&await page.getByRole('heading',{name:'Buenos días.',exact:true}).isVisible()&&await page.evaluate(()=>document.title==='Morning Meeting Builder'));
   await flag.click();await menu.getByRole('button',{name:'English',exact:true}).click();
   if(viewport.width<=680)await page.locator('.mobile-menu').click();
   await page.getByRole('button',{name:'Build a meeting',exact:true}).last().click();await page.getByPlaceholder('Who is leading today?').fill('Caption placement test');
   await page.getByRole('button',{name:'Save presentation',exact:true}).click();await page.getByRole('button',{name:'Present saved meeting',exact:true}).click();
   await page.getByRole('button',{name:'Dismiss message',exact:true}).click();
   await page.getByRole('button',{name:'Preview captions',exact:true}).click();await page.locator('.translation-caption').waitFor();await page.waitForTimeout(250);
   const caption=page.locator('.translation-caption');const controls=page.locator('.presentation-controls');
   let cap=await caption.boundingBox();let bar=await controls.boundingBox();
   ok(`${viewport.width}: subtitles sit above visible controls while controls stay at bottom`,Math.abs(viewport.height-bar.y-bar.height)<2&&cap.y+cap.height<=bar.y-6&&cap.x>=0&&cap.x+cap.width<=viewport.width);
   await page.screenshot({path:`test-results/sidebar-captions-visible-${viewport.width}.png`});
   await page.keyboard.press('ArrowRight');await page.waitForTimeout(250);cap=await caption.boundingBox();
   ok(`${viewport.width}: remote-hidden controls let subtitles return to bottom`,await controls.evaluate(el=>getComputedStyle(el).opacity==='0')&&Math.abs(viewport.height-cap.y-cap.height-6)<2);
   await controls.locator('button').first().focus();await page.waitForTimeout(250);cap=await caption.boundingBox();bar=await controls.boundingBox();
   ok(`${viewport.width}: keyboard-focused controls also keep subtitles above them`,cap.y+cap.height<=bar.y-6);
   await page.evaluate(()=>document.activeElement.blur());await page.locator('.presentation-stage').click({position:{x:20,y:20}});await page.waitForTimeout(250);cap=await caption.boundingBox();bar=await controls.boundingBox();
   ok(`${viewport.width}: touching the slide restores controls below subtitles without runtime errors`,cap.y+cap.height<=bar.y-6&&errors.length===0);
   await context.close();
  }
  console.log(`${count} sidebar/caption checks passed.`);
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exit(1);});
