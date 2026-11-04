// One same-document entry per active preview/presentation, never a global Back override.
export function guardPresentationBack({meetingId,kind,onBack}:{meetingId:string;kind:"preview"|"presentation";onBack:()=>Promise<unknown>|unknown}) {
  const token=crypto.randomUUID();
  const previous=history.state;
  const marker={...(previous&&typeof previous==='object'?previous:{}),mmbPresentation:{token,meetingId,kind}};
  let active=true,pending=false;
  const owns=()=>history.state?.mmbPresentation?.token===token;
  history.pushState(marker,'',location.href);
  const back=()=>{
    if(!active||owns())return;
    // Re-arm before asynchronous confirmation. A cancelled exit retains exactly
    // one guard; pushing discards its forward copy rather than accumulating entries.
    history.pushState(marker,'',location.href);
    const video=kind==='presentation'?document.querySelector('.presentation .video-expand-frame.is-expanded'):null;
    if(video){video.dispatchEvent(new Event('mmb-video-collapse'));return;}
    if(pending)return;
    pending=true;
    Promise.resolve().then(onBack).catch(()=>{}).finally(()=>{pending=false;});
  };
  window.addEventListener('popstate',back);
  return ()=>{
    active=false;window.removeEventListener('popstate',back);
    if(owns())history.back();
  };
}
