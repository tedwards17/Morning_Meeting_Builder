import type * as RT from "react";
import {React as RecoveredReact, useApp, Modal as RecoveredModal, YouTubePlayer as RecoveredPlayer, media, uploadContentMedia} from "../recovered/index-DwifuW9D.js";
import * as runtime from "./runtime";
import {contentContext, setRotation, refreshContentContext, isContentAvailable, isInRotation, deleteCompanyContent} from "./content-runtime";
import {contentCategory, categoryLabel, youtubeId, matchesSlideContent, type ContentCategory} from "./content-selection";
import {FilePicker} from "./file-picker";
import {confirmUI} from "./dialogs";
import {formError, contentPermissionMessage} from "./content-feedback";
import {t, subscribeLanguage, getLanguage} from "./i18n";
import type {Row, State} from "./types";
const React=RecoveredReact as typeof RT;
const Modal=RecoveredModal as RT.ComponentType<{title:string;onClose:()=>void;wide?:boolean;children:RT.ReactNode}>;
const Player=RecoveredPlayer as RT.ComponentType<{item:Row;onReady?:()=>void;onError?:()=>void}>;
type AppContext={state:State;update:(fn:(s:State)=>State)=>Promise<State>;notify:(text:string)=>void};
function app(){return useApp() as AppContext;}
function useContext(){React.useSyncExternalStore(subscribeLanguage,getLanguage,getLanguage);return React.useSyncExternalStore(runtime.subscribe,contentContext,contentContext);}
function Category({item}:{item:Row}){return <>{t(categoryLabel(contentCategory(item)))}</>;}
function useAssetUrl(item:Row,assets:Row[],thumbnail=false):string|undefined {
 const asset=assets.find(a=>a.id===(thumbnail?(item.thumbnailAssetId??item.assetId):item.assetId));
 const [local,setLocal]=React.useState<{id:string;url:string}|null>(null);
 React.useEffect(()=>{if(runtime.hosted||!asset)return;let closed=false,objectUrl:string|undefined;void media.url(asset.hash,asset.mime,asset.id).then((url:string|null)=>{objectUrl=url??undefined;if(closed){if(url?.startsWith("blob:"))URL.revokeObjectURL(url);}else setLocal(url?{id:asset.id,url}:null);}).catch(()=>setLocal(null));return()=>{closed=true;if(objectUrl?.startsWith("blob:"))URL.revokeObjectURL(objectUrl);};},[asset?.id,asset?.hash,asset?.mime]);
 return asset?runtime.hosted?`./api/v1/media/${asset.id}${thumbnail&&asset.mime.startsWith("image/")?"?thumbnail=1":""}`:local?.id===asset.id?local.url:undefined:undefined;
}
function Thumbnail({item,onPreview}:{item:Row;onPreview:()=>void}){
 const {state}=app();const [failed,fail]=React.useState(false);const video=item.type==="video"||!!youtubeId(item.url??"");
 const localImage=useAssetUrl(item,state.assets,true);
 const image=youtubeId(item.url??"")?`https://i.ytimg.com/vi/${youtubeId(item.url)}/mqdefault.jpg`:item.type==="video"&&!item.thumbnailAssetId?undefined:localImage;
 return <div className="content-visual">{image&&!failed?<img src={image} alt={t("Thumbnail for {arg0}",{arg0:item.title})} loading="lazy" referrerPolicy="no-referrer" onError={()=>fail(true)}/>:<span>{video?t("Video"):contentCategory(item)==="media"?t("Image"):contentCategory(item)==="link"?t("Web link"):t("Text")}</span>}{video&&<button type="button" className="video-indicator" aria-label={t("Play preview · {arg0}",{arg0:item.title})} onClick={onPreview}>▶</button>}{failed&&<small>{t("Thumbnail unavailable")}</small>}</div>;
}
function RotationControl({item}:{item:Row}){
 const ctx=useContext();const [busy,setBusy]=React.useState(false),[error,setError]=React.useState("");
 const enrolled=isInRotation(item),available=isContentAvailable(item);const reason=!ctx.location?t("Choose a meeting location before managing rotation."):!ctx.canManage?t("Only this location account or an administrator can change its rotation."):!available?t("Content is not available at this location."):"";
 return <div className="rotation-control"><span className={`status-chip ${enrolled?"green":""}`}>{item.archived?t("Archived"):enrolled?t("In our rotation"):t("Available only")}</span><button type="button" hidden={!!item.archived} disabled={busy||!!reason} title={reason} onClick={async()=>{setError("");setBusy(true);try{await setRotation(item,!enrolled);}catch(e){setError(formError(e));}finally{setBusy(false);}}}>{busy?t("Saving…"):enrolled?t("Remove from our rotation"):t("Add to our rotation")}</button>{error&&<p role="alert" className="form-feedback warning">{error}</p>}</div>;
}
function Preview({item,onClose}:{item:Row;onClose:()=>void}){
 const {state}=app();const media=React.useRef<HTMLVideoElement>(null),ready=React.useRef(false),[error,setError]=React.useState(""),[loading,setLoading]=React.useState(true);
 const kind=contentCategory(item),youtube=youtubeId(item.url??""),url=useAssetUrl(item,state.assets),poster=useAssetUrl(item,state.assets,true),isVideo=item.type==="video";
 React.useEffect(()=>{const el=media.current;const timer=setTimeout(()=>{if((youtube||isVideo)&&!ready.current)setError(t("Video did not load. Check your connection, codec, or use the original link."));},10000);return()=>{clearTimeout(timer);if(el){el.pause();el.removeAttribute("src");el.load();}};},[item.id]);
 return <Modal title={t(kind==="text"?"Full text · {arg0}":"Preview · {arg0}",{arg0:item.title})} wide onClose={onClose}><div className="content-preview" data-preview-id={item.id}>
  {kind==="media"?(url?isVideo?<video ref={media} controls playsInline preload="metadata" src={url} poster={item.thumbnailAssetId?poster:undefined} onLoadedData={()=>{ready.current=true;setLoading(false);}} onError={()=>setError(t("This video cannot play here. Try H.264 MP4 or VP8/VP9 WebM."))}/>:<img src={url} alt={item.title} onError={()=>setError(t("Image unavailable. Ask the contributor to check the file."))}/>:<p role="alert">{t("Media unavailable")}</p>):youtube?<Player item={{...item,type:"external-video"}} onReady={()=>{ready.current=true;setLoading(false);}} onError={()=>setError(t("Video did not load. Check your connection, codec, or use the original link."))}/>:null}
  {loading&&(youtube||isVideo)&&!error&&<p role="status">{t("Loading video…")}</p>}
  {error&&<p role="alert" className="form-feedback warning">{error}</p>}
  {item.summary&&<p className="content-summary">{item.summary}</p>}{item.description&&<div className="content-body-preview">{item.description}</div>}
  {kind==="link"&&<a className="button" href={item.url} target="_blank" rel="noopener noreferrer">{youtube?t("Open online video"):t("Open web page")}</a>}
  <p className="muted">{t("Preview does not record use or change rotation.")}</p>
  <button type="button" onClick={onClose}>{t("Back to content")}</button>
 </div></Modal>;
}
function Card({item,onPreview,children}:{item:Row;onPreview:(item:Row)=>void;children?:RT.ReactNode}){
 const {state}=app();const kind=contentCategory(item);
 return <article className={`visual-content-card category-${kind}`}>
  {kind==="media"||youtubeId(item.url??"")?<Thumbnail item={item} onPreview={()=>onPreview(item)}/>:null}
  <div className="visual-content-details"><h3>{item.title}</h3><p className="muted">{state.libraries.find(l=>l.id===item.libraryId)?.name} · <Category item={item}/></p>
  {item.summary&&<p className="content-summary">{item.summary}</p>}{kind==="text"&&item.description&&<p className="content-excerpt">{item.description}</p>}
  {kind==="text"&&<button type="button" className="text-button" onClick={()=>onPreview(item)}>{t("See Full Text")}</button>}
  {kind==="link"&&!youtubeId(item.url??"")&&<a href={item.url} target="_blank" rel="noopener noreferrer">{t("Open web page")}</a>}
  {children}</div></article>;
}
function DeleteChoice({item,onClose,onDeleted}:{item:Row;onClose:()=>void;onDeleted:()=>void}){
 const [busy,setBusy]=React.useState(false),[error,setError]=React.useState("");const {notify}=app();
 async function remove(mode:"archive"|"permanent"){
  setBusy(true);setError("");try{await deleteCompanyContent(item,mode);notify(t(mode==="archive"?"Content archived for every location.":"Content permanently deleted. Saved meetings and referenced media remain."));onDeleted();}catch(e){setError(formError(e));setBusy(false);}
 }
 return <Modal title={item.archived?t("Permanently delete content"):t("Archive or delete content")} onClose={()=>{if(!busy)onClose();}}>
  <p>{item.archived?t("Permanently delete “{arg0}” from the content library?",{arg0:item.title}):t("Would you like to archive “{arg0}”?",{arg0:item.title})}</p>
  <p className="muted">{t("This affects every location. Permanent deletion cannot be undone. Saved meeting snapshots and referenced media remain available.")}</p>
  {error&&<p role="alert" className="form-feedback warning">{error}</p>}
  <div className="modal-actions"><button type="button" autoFocus disabled={busy} onClick={onClose}>{t("Cancel")}</button>
   {!item.archived&&<button type="button" disabled={busy} onClick={()=>void remove("archive")}>{t("Yes, archive")}</button>}
   <button type="button" className="danger" disabled={busy} onClick={()=>void remove("permanent")}>{item.archived?t("Delete permanently"):t("No, delete permanently")}</button>
  </div>
 </Modal>;
}
export function ContentCards({items,onEdit,layout="list"}:{items:Row[];onEdit:(item:Row)=>void;layout?:string}){
 const ctx=useContext(),{state}=app();const [preview,setPreview]=React.useState<Row|null>(null),[view,setView]=React.useState("available");
 const rows=items.filter(item=>view!=="rotation"||isInRotation(item));
 return <><div className="compact-library-filter"><label>{t("Rotation")} <select aria-label={t("Filter rotation")} value={view} onChange={e=>setView(e.target.value)}><option value="available">{t("Available content")}</option><option value="rotation">{t("Our rotation")}</option></select></label></div>
  <div className={`compact-library ${layout==="grid"?"compact-grid":""}`}>
   <div className="compact-library-head"><span>{t("CONTENT")}</span><span>{t("TAGS")}</span><span>{t("LAST USED")}</span><span>{t("USES")}</span><span/></div>
   {rows.map(item=><article className="compact-library-row" key={item.id}>
    <div className="compact-content-identity">{contentCategory(item)==="media"||youtubeId(item.url??"")?<Thumbnail item={item} onPreview={()=>setPreview(item)}/>:null}<div>
     {contentCategory(item)==="text"?<button type="button" className="compact-content-title" title={t("See Full Text")} onClick={()=>setPreview(item)}>{item.title}</button>:<strong>{item.title}</strong>}
     <small><Category item={item}/> · {state.libraries.find(l=>l.id===item.libraryId)?.name}</small>{item.summary&&<small className="content-summary" title={item.summary}>{item.summary}</small>}
    </div></div>
    <div className="tags">{item.tags?.slice(0,3).map((tag:string)=><span className="tag" key={tag}>{tag}</span>)}</div>
    <span className="compact-last-used">{item.lastUsedAt?new Date(item.lastUsedAt).toLocaleDateString(getLanguage()==="es"?"es-MX":"en-US"):t("Never used")}</span>
    <span className="compact-use-count">{item.useCount??0}</span>
    <button type="button" className="compact-edit" onClick={()=>onEdit(structuredClone(item))}>{runtime.canEditContent()?t("Edit content"):t("View content")}</button>
   </article>)}
  </div>
  {!rows.length&&<p role="status">{view==="rotation"?t("Our rotation is empty. Manage rotation from Edit content in the content library."):t("No matching content")}</p>}
  {!ctx.location&&<p className="muted">{t("Choose a meeting location to see its availability and rotation.")}</p>}
  {preview&&<Preview key={preview.id} item={preview} onClose={()=>setPreview(null)}/>}</>;
}
export function LocationsField({all,ids,onChange,disabled}:{all:boolean;ids:string[];onChange:(all:boolean,ids:string[])=>void;disabled?:boolean}){
 const ctx=useContext(),locations=ctx.locations.filter(l=>Boolean(Number(l.enabled)));const ref=React.useRef<HTMLInputElement>(null);
 const selected=all?locations.map(l=>l.id):ids;React.useEffect(()=>{if(ref.current)ref.current.indeterminate=!all&&selected.length>0;},[all,selected.length]);
 return <fieldset className="locations-field" disabled={disabled}><legend>{t("Locations *")}</legend><details><summary>{all?t("All locations (including future locations)"):selected.length?t("{arg0} locations selected",{arg0:selected.length}):t("Select receiving locations")}</summary><div className="locations-options"><label><input ref={ref} type="checkbox" checked={all} onChange={()=>onChange(!all,[])}/>{t("All")}</label>{locations.map(l=><label key={l.id}><input type="checkbox" checked={selected.includes(l.id)} onChange={e=>{const next=e.target.checked?[...selected,l.id]:selected.filter(id=>id!==l.id);onChange(next.length===locations.length,next);}}/>{l.name}</label>)}</div></details>{!all&&selected.length>0&&<small>{locations.filter(l=>ids.includes(l.id)).map(l=>l.name).join(", ")}</small>}</fieldset>;
}
async function videoPoster(file:File):Promise<Blob|undefined>{
 return new Promise((resolve,reject)=>{
  const el=document.createElement("video"),url=URL.createObjectURL(file);let finished=false;el.muted=true;el.preload="auto";el.playsInline=true;
  const done=(error?:Error,blob?:Blob)=>{if(finished)return;finished=true;el.onerror=null;el.onloadeddata=null;clearTimeout(timer);el.pause();el.removeAttribute("src");el.load();URL.revokeObjectURL(url);if(error)reject(error);else resolve(blob);};
  const timer=setTimeout(()=>done(new Error(t("This video cannot play here. Try H.264 MP4 or VP8/VP9 WebM."))),10000);
  el.onerror=()=>done(new Error(t("This video cannot play here. Try H.264 MP4 or VP8/VP9 WebM.")));
  el.onloadeddata=()=>{el.onerror=null;el.onloadeddata=null;try{const canvas=document.createElement("canvas");canvas.width=400;canvas.height=Math.max(1,Math.round(el.videoHeight*400/Math.max(1,el.videoWidth)));canvas.getContext("2d")?.drawImage(el,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>done(undefined,blob??undefined),"image/jpeg",.75);}catch{done();}};
  el.src=url;
 });
}
export function ContentEditor({item,onClose,onSaved}:{item:Row;onClose:()=>void;onSaved?:(item:Row)=>void}){
 const {state,update,notify}=app();const ctx=useContext();const exists=state.items.some(i=>i.id===item.id),allowed=exists?runtime.canEditContent():runtime.canAddContent();
 const [draft,setDraft]=React.useState<Row>(structuredClone(item)),[kind,setKind]=React.useState<ContentCategory>(contentCategory(item)),[tags,setTags]=React.useState((item.tags??[]).join(", "));
 const [all,setAll]=React.useState(item.allLocations??!item.locations?.length),[locations,setLocations]=React.useState<string[]>(item.locations??[]),[busy,setBusy]=React.useState(false),[dirty,setDirty]=React.useState(false),[error,setError]=React.useState("");
 const [deleting,setDeleting]=React.useState(false);
 const feedback=React.useRef<HTMLParagraphElement>(null),pending=React.useRef(false);React.useEffect(()=>globalThis.MMB.holdContentDraft(),[]);
 const change=(values:Partial<Row>)=>{setDraft(d=>({...d,...values}));setDirty(true);};
 const fail=(e:unknown)=>{setError(formError(e));requestAnimationFrame(()=>{feedback.current?.scrollIntoView({block:"nearest"});feedback.current?.focus();});};
 const close=async()=>{if(!pending.current&&(!dirty||!allowed||await confirmUI(t("Discard these unsaved content changes?"))))onClose();};
 async function attach(file:File){if(pending.current)return;pending.current=true;setBusy(true);setError("");try{
  const video=file.type.startsWith("video/")||/\.(mp4|webm)$/i.test(file.name);
  const limit=video?(ctx.limits?.video??52428800):(ctx.limits?.image??15728640);
  if(file.size>limit)throw new Error(t("This file exceeds the upload limit ({arg0} MB).",{arg0:Math.round(limit/1048576)}));
  if(video&&!/\.(mp4|webm)$/i.test(file.name))throw new Error(t("Library videos must be MP4 or WebM. Use H.264 MP4 or VP8/VP9 WebM."));
  const poster=video?await videoPoster(file):undefined;
  const uploaded=await uploadContentMedia(file,state.assets);let thumb:Row|undefined;
  if(poster){try{thumb=(await uploadContentMedia(new File([poster],"video-poster.jpg",{type:"image/jpeg"}),state.assets)).asset;}catch{/* The video remains usable without an optional poster. */}}
  await update(s=>({...s,assets:[...s.assets.filter(a=>a.id!==uploaded.asset.id&&a.id!==thumb?.id),uploaded.asset,...(thumb?[thumb]:[])]}));
  change({assetId:uploaded.asset.id,type:video?"video":"image",thumbnailAssetId:thumb?.id});
 }catch(e){fail(e);}finally{pending.current=false;setBusy(false);}}
 async function save(e:RT.FormEvent){e.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError("");runtime.clearError();try{
  if(exists)globalThis.MMB.requireContentEdit();else globalThis.MMB.requireContentAdd();
  if(!draft.title?.trim())throw new Error(t("Content title required"));
  if(!ctx.locations.some(l=>Boolean(Number(l.enabled))))throw new Error(t("Create a receiving location before adding content."));
  if(!all&&!locations.length)throw new Error(t("Select at least one receiving location."));
  if(kind==="text"&&!draft.description?.trim())throw new Error(t("Text content requires body text."));
  if(kind==="media"&&!draft.assetId)throw new Error(t("Choose a media file."));
  if(kind==="link"){try{const u=new URL(draft.url);if(!["http:","https:"].includes(u.protocol))throw Error();}catch{throw new Error(t("Add a complete web link."));}}
  const asset=state.assets.find(a=>a.id===draft.assetId);
  const saved:Row={...draft,title:draft.title.trim(),description:draft.description??"",summary:draft.summary??"",tags:tags.split(",").map((s:string)=>s.trim()).filter(Boolean),allLocations:all,locations:all?[]:locations,updatedAt:new Date().toISOString(),type:kind==="text"?"lesson":kind==="media"?(asset?.mime.startsWith("video/")||draft.type==="video"?"video":draft.description?.trim()?"image-text":"image"):youtubeId(draft.url)?"external-video":"link",url:kind==="link"?draft.url.trim():kind==="media"&&contentCategory(item)==="media"?(item.url??""):""};
  if(kind!=="media"){delete saved.assetId;delete saved.thumbnailAssetId;}
  if(saved.tags.length>40)throw new Error(t("Use no more than 40 subject tags."));
  if(state.items.some(i=>i.id!==saved.id&&i.libraryId===saved.libraryId&&(i.title.toLowerCase()===saved.title.toLowerCase()||(saved.url&&i.url===saved.url)))&&!await confirmUI(t("This title or link already exists in this library. Save another item?")))return;
  await update(s=>({...s,items:exists?s.items.map(i=>i.id===saved.id?saved:i):[...s.items,saved]}));
  await runtime.sync();if(!runtime.hosted){await refreshContentContext();if(!exists&&isContentAvailable(saved))await setRotation(saved,true);}notify(t("Content saved. Shared locations keep independent rotations."));onSaved?.(saved);setDirty(false);onClose();
 }catch(e){fail(e);}finally{pending.current=false;setBusy(false);}}
 return <Modal title={exists?allowed?t("Edit content"):t("View content"):t("Add content")} wide onClose={()=>void close()}><form onSubmit={e=>void save(e)} onInvalidCapture={e=>fail(new Error((e.target as HTMLInputElement).validationMessage))}>
  {error&&<p className="form-feedback warning" role="alert" tabIndex={-1} ref={feedback}>{error}</p>}{!allowed&&<p role="note">{contentPermissionMessage()}</p>}
  <fieldset className="content-editor-fields" disabled={busy||!allowed}>
   <label className="field">{t("Title *")}<input aria-label={t("Title *")} autoFocus required maxLength={300} value={draft.title} onChange={e=>change({title:e.target.value})}/></label>
   <label className="field">{t("Content type")}<select aria-label={t("Content type")} value={kind} onChange={e=>{setKind(e.target.value as ContentCategory);setDirty(true);}}>{(["text","media","link"] as ContentCategory[]).map(k=><option key={k} value={k}>{t(categoryLabel(k))}</option>)}</select></label>
   <label className="field">{t("Library *")}<select aria-label={t("Library *")} required value={draft.libraryId} onChange={e=>change({libraryId:e.target.value})}>{state.libraries.filter(l=>!l.archived).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
   <label className="field">{kind==="text"?t("Body text *"):t("Accompanying text (optional)")}<textarea aria-label={kind==="text"?t("Body text *"):t("Accompanying text (optional)")} required={kind==="text"} rows={5} maxLength={20000} value={draft.description??""} onChange={e=>change({description:e.target.value})}/></label>
   <label className="field">{t("Content description (optional)")}<textarea aria-label={t("Content description (optional)")} rows={2} maxLength={4000} value={draft.summary??""} onChange={e=>change({summary:e.target.value})}/><small>{t("Shown when browsing content, not on the presentation slide.")}</small></label>
   {kind==="link"&&<label className="field">{t("Web link *")}<input aria-label={t("Web link *")} type="url" required maxLength={3000} value={draft.url??""} placeholder="https://" onChange={e=>change({url:e.target.value})}/><small>{t("YouTube links use the video player. Other links open their original website.")}</small></label>}
   {kind==="media"&&<label className="field">{t("Media file *")}<FilePicker aria-label={t("Media file *")} disabled={busy||!allowed} accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={e=>{const file=e.target.files?.[0];if(file)void attach(file);e.target.value="";}}/><small>{state.assets.find(a=>a.id===draft.assetId)?.name??t("Choose JPEG, PNG, WebP, MP4 or WebM.")}</small><small>{t("No video conversion is performed. Use H.264 MP4 or VP8/VP9 WebM.")}</small></label>}
   {!!state.libraries.find(l=>l.id===draft.libraryId)?.locations?.length&&<p className="muted">{t("The library’s existing location targeting still applies.")}</p>}
   <LocationsField all={all} ids={locations} onChange={(value,ids)=>{setAll(value);setLocations(ids);setDirty(true);}}/>
   <label className="field">{t("Subject tags (separated by commas)")}<input aria-label={t("Subject tags (separated by commas)")} value={tags} onChange={e=>{setTags(e.target.value);setDirty(true);}}/></label>
   <label className="field">{t("Source / credit")}<input aria-label={t("Source / credit")} value={draft.source??""} maxLength={300} onChange={e=>change({source:e.target.value})}/></label>
  </fieldset>
  {exists&&<RotationControl item={item}/>}<p className="muted">{t("New content joins your location’s rotation when shared with it. Other locations choose their own rotation.")}</p>{!runtime.session?.account.location_id&&!ctx.canManage&&runtime.hosted&&<p className="muted">{t("This account has no assigned rotation. An administrator or location account can enroll the content.")}</p>}
  <div className="modal-actions">{exists&&ctx.canDelete&&<button type="button" className="danger-text" disabled={busy} onClick={()=>setDeleting(true)}>{item.archived?t("Delete permanently"):t("Delete content")}</button>}<button type="button" onClick={()=>void close()} disabled={busy}>{t("Cancel")}</button><button className="primary" type="submit" disabled={busy||!allowed}>{busy?t("Saving…"):t("Save content")}</button></div>
 </form>{deleting&&<DeleteChoice item={item} onClose={()=>setDeleting(false)} onDeleted={()=>{setDeleting(false);onClose();}}/>}</Modal>;
}
export function ContentSelector({slide,onClose,onChoose}:{slide:Row;used:Set<string>;onClose:()=>void;onChoose:(items:Row[])=>void}){
 const {state}=app();const ctx=useContext();const [query,setQuery]=React.useState(""),[kind,setKind]=React.useState(""),[tab,setTab]=React.useState("available"),[preview,setPreview]=React.useState<Row|null>(null),[limit,setLimit]=React.useState(30);
 React.useEffect(()=>{void refreshContentContext().catch(runtime.reportError);},[]);
 const container=React.useRef<HTMLDivElement>(null),scroll=React.useRef(0);
 const openPreview=(item:Row)=>{scroll.current=container.current?.closest("dialog")?.scrollTop??0;setPreview(item);};
 const closePreview=()=>{setPreview(null);requestAnimationFrame(()=>requestAnimationFrame(()=>{const dialog=container.current?.closest("dialog");if(dialog)dialog.scrollTop=scroll.current;}));};
 const available=state.items.filter(i=>matchesSlideContent(slide.definition,i)&&isContentAvailable(i));
 const rows=available.filter(i=>(tab!=="rotation"||isInRotation(i))&&(!kind||contentCategory(i)===kind)&&`${i.title} ${i.description} ${i.summary??""} ${(i.tags??[]).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
 return <Modal title={t("Choose content · {arg0}",{arg0:slide.definition.title})} wide onClose={onClose}><div ref={container} className="content-selector">
  <div className="toolbar"><label className="search"><input aria-label={t("Search replacement content")} placeholder={t("Search content…")} value={query} onChange={e=>{setQuery(e.target.value);setLimit(30);}}/></label><select aria-label={t("Filter content type")} value={kind} onChange={e=>{setKind(e.target.value);setLimit(30);}}><option value="">{t("All content types")}</option>{(["text","media","link"] as ContentCategory[]).map(k=><option key={k} value={k}>{t(categoryLabel(k))}</option>)}</select></div>
  <div className="tabs"><button type="button" aria-pressed={tab==="available"} onClick={()=>{setTab("available");setLimit(30);}}>{t("Available content")}</button><button type="button" aria-pressed={tab==="rotation"} onClick={()=>{setTab("rotation");setLimit(30);}}>{t("Our rotation")}</button></div>
  {!ctx.location&&<p role="note">{t("Choose a meeting location to see its availability and rotation.")}</p>}
  {tab==="rotation"&&!rows.length&&<p role="status">{t("Our rotation is empty. Manage rotation from Edit content in the content library.")}</p>}
  <div className="visual-content-grid">{rows.slice(0,limit).map(item=><Card key={item.id} item={item} onPreview={openPreview}>
   <div className="actions"><button type="button" className="primary" onClick={()=>{setPreview(null);onChoose([structuredClone(item)]);}}>{t("Use content")}</button></div>
  </Card>)}</div>
  {!rows.length&&<p>{t("No matching content. Try Available content or change the filters.")}</p>}{rows.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+30)}>{t("Show more content")}</button>}
  <div className="modal-actions"><button type="button" onClick={onClose}>{t("Cancel")}</button></div>
 </div>{preview&&<Preview key={preview.id} item={preview} onClose={closePreview}/>}</Modal>;
}

export function BuilderContent({item}:{item:Row}){
 const [preview,setPreview]=React.useState(false);const kind=contentCategory(item);
 return <div className="builder-content">{kind==="media"||youtubeId(item.url??"")?<Thumbnail item={item} onPreview={()=>setPreview(true)}/>:kind==="text"?<button type="button" className="text-button" onClick={()=>setPreview(true)}>{t("See Full Text")}</button>:<a href={item.url} target="_blank" rel="noopener noreferrer">{t("Open web page")}</a>}{item.summary&&<small className="content-summary">{item.summary}</small>}{preview&&<Preview item={item} onClose={()=>setPreview(false)}/>}</div>;
}
