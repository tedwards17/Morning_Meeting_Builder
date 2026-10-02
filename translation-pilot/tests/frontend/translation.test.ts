import { afterEach, beforeEach, expect, test, vi } from 'vitest';

let track: { stop: ReturnType<typeof vi.fn>; addEventListener: ReturnType<typeof vi.fn> };
let sockets: FakeSocket[];
let fetchMock: ReturnType<typeof vi.fn>;
class FakeSocket {
  static OPEN = 1;
  readyState = 1; bufferedAmount = 0;
  onopen: (()=>void) | null = null;
  onclose: (()=>void) | null = null;
  onerror: (()=>void) | null = null;
  onmessage: ((event: {data:string})=>void) | null = null;
  close = vi.fn(); send = vi.fn();
  constructor(public url:string, public protocols:string[]) { sockets.push(this); setTimeout(()=>this.onopen?.(), 0); }
}
class FakeAudio {
  sampleRate = 48000; state = 'running'; destination = {};
  audioWorklet = {addModule:vi.fn().mockResolvedValue(undefined)};
  resume = vi.fn().mockResolvedValue(undefined); close = vi.fn().mockResolvedValue(undefined);
  createMediaStreamSource() { return {connect:(next:unknown)=>next, disconnect:vi.fn()}; }
  createGain() { return {gain:{value:1},connect:(next:unknown)=>next,disconnect:vi.fn()}; }
}
class FakeWorklet {
  port = {onmessage:null}; disconnect = vi.fn();
  connect(next:unknown) { return next; }
}
beforeEach(() => {
  vi.resetModules(); sockets=[];
  track = {stop:vi.fn(), addEventListener:vi.fn()};
  const getUserMedia = vi.fn().mockResolvedValue({getTracks:()=>[track], getAudioTracks:()=>[track]});
  vi.stubGlobal('window', Object.assign(new EventTarget(), {AudioContext:FakeAudio, AudioWorkletNode:FakeWorklet, prompt:vi.fn()}));
  vi.stubGlobal('document', Object.assign(new EventTarget(), {hidden:false}));
  vi.stubGlobal('navigator', {onLine:true, mediaDevices:{getUserMedia}});
  vi.stubGlobal('AudioContext', FakeAudio); vi.stubGlobal('AudioWorkletNode',FakeWorklet); vi.stubGlobal('WebSocket',FakeSocket);
  fetchMock = vi.fn(async (url:string, init:RequestInit) => {
    const action = new URL(url,'https://test.invalid').searchParams.get('action');
    const body = JSON.parse(String(init.body));
    const data = action==='status' ? {enabled:true,authenticated:true,csrf:'csrf-test'}
      : action==='session' ? {access_token:'temporary-grant',sessionId:'session-test',expiresAt:Math.floor(Date.now()/1000)+2700}
      : action==='text' ? {text:body.source==='en'?'Buenos días':'Good morning'} : {ok:true};
    return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
  });
  vi.stubGlobal('fetch',fetchMock);
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
async function start() {
  const {startTranslation}=await import('../../frontend/src/translation');
  const callbacks={onStatus:vi.fn(),onCaption:vi.fn(),onError:vi.fn()};
  const session=await startTranslation(callbacks);
  return {session,callbacks};
}
function result(source:string) {
  sockets[0].onmessage?.({data:JSON.stringify({type:'Results',is_final:true,channel:{alternatives:[{transcript:'Good morning',words:[{word:'Good',language:source},{word:'morning',language:source}]}]}})});
}
test('uses a temporary bearer token and Nova-3 PCM; translates English and Spanish',async()=>{
  const {session,callbacks}=await start();
  expect(sockets[0].protocols).toEqual(['bearer','temporary-grant']);
  expect(sockets[0].url).toContain('model=nova-3'); expect(sockets[0].url).toContain('language=multi');
  expect(sockets[0].url).toContain('sample_rate=48000');
  result('en'); await vi.waitFor(()=>expect(callbacks.onCaption).toHaveBeenCalledWith({text:'Buenos días',source:'en'}));
  result('es'); await vi.waitFor(()=>expect(callbacks.onCaption).toHaveBeenCalledWith({text:'Good morning',source:'es'}));
  session.stop(); expect(track.stop).toHaveBeenCalledOnce(); expect(sockets[0].close).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls.some(([url])=>String(url).endsWith('action=stop'))).toBe(true);
});
test('page exit releases the microphone and socket',async()=>{
  await start(); window.dispatchEvent(new Event('pagehide'));
  expect(track.stop).toHaveBeenCalledOnce(); expect(sockets[0].close).toHaveBeenCalledOnce();
});
test('45-minute deadline stops capture and ignores later speech',async()=>{
  vi.useFakeTimers(); const pending=start(); await vi.runAllTimersAsync();
  const {callbacks}=await pending;
  await vi.advanceTimersByTimeAsync(45*60*1000);
  expect(track.stop).toHaveBeenCalledOnce(); expect(callbacks.onError).toHaveBeenCalledWith(expect.stringContaining('45-minute'));
  result('en'); expect(callbacks.onCaption).not.toHaveBeenCalled();
});
test('cancel while permission is pending releases a late microphone without connecting',async()=>{
  let resolvePermission!: (value:unknown)=>void;
  vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(()=>new Promise(resolve=>{resolvePermission=resolve;}));
  const {startTranslation}=await import('../../frontend/src/translation');
  const controller=new AbortController();
  const pending=startTranslation({onStatus:vi.fn(),onCaption:vi.fn(),onError:vi.fn(),signal:controller.signal});
  const rejected=expect(pending).rejects.toThrow('canceled');
  await vi.waitFor(()=>expect(resolvePermission).toBeDefined());
  controller.abort(); resolvePermission({getTracks:()=>[track], getAudioTracks:()=>[track]});
  await rejected; expect(track.stop).toHaveBeenCalledOnce(); expect(sockets).toHaveLength(0);
});
test('static Pages backend failure gives the PHP pilot fallback',async()=>{
  fetchMock.mockResolvedValue(new Response('<html>Not found</html>',{status:404,headers:{'Content-Type':'text/html'}}));
  const {startTranslation}=await import('../../frontend/src/translation');
  await expect(startTranslation({onStatus:vi.fn(),onCaption:vi.fn(),onError:vi.fn()})).rejects.toThrow('GitHub Pages');
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
});
test('disabled captions do not access providers or microphone; zero gap is supported',async()=>{
  window.MMB_CONFIG={translationEnabled:false,captionGap:0};
  const {captionGap}=await import('../../frontend/src/presentation-config'); expect(captionGap).toBe(0);
  const {startTranslation}=await import('../../frontend/src/translation');
  await expect(startTranslation({onStatus:vi.fn(),onCaption:vi.fn(),onError:vi.fn()})).rejects.toThrow('disabled');
  expect(fetchMock).not.toHaveBeenCalled(); expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
});
