<?php
function store_meeting(array $m):void{
 $id=require_id($m['id']??'');$location=require_id($m['location_id']??'');location_scope($location);
 if(actor()['role']==='report_viewer')fail(403,'Read-only account');
 $template=record_row('templates',require_id($m['templateId']??''));if(!$template||!template_permission(payload($template),actor(),'use'))fail(403,'Template use denied');
 if(!in_array($m['status']??'',['draft','presenting','completed'],true)||strlen($m['presenter']??'')>300||count($m['slides']??[])>100)fail(422,'Invalid meeting');
 $old=one('SELECT * FROM meetings WHERE organization_id=? AND id=?',[org(),$id]);
 if($old&&($old['account_id']!==actor()['id']||$old['device_id']!==$GLOBALS['device']['id']))fail(403,'Meeting belongs to another device');
 if($old&&$old['status']==='completed'){if(encoded(payload($old))!==encoded($m))return;return;}
 $m['organization_id']=org();$m['account_id']=actor()['id'];$m['device_id']=$GLOBALS['device']['id'];
 foreach($m['slides']??[] as $s){require_id($s['id']??'');if(!empty($s['broadcast_id'])){$broadcast=record_row('broadcasts',$s['broadcast_id']);if(!$broadcast||!visible('broadcasts',payload($broadcast)))fail(403,'Broadcast unavailable');$version=one('SELECT payload FROM record_versions WHERE organization_id=? AND kind=? AND record_id=? AND version=?',[org(),'broadcasts',$s['broadcast_id'],$s['broadcast_version']??0]);if(!$version)fail(422,'Unknown broadcast version');$b=payload($version);if($b['importance']==='required'){if(empty($s['required'])||!empty($s['skipped']))fail(422,'Required broadcast cannot be removed or skipped in draft');if(count($s['items']??[])!==1||($s['items'][0]['id']??'')!==$b['content']['id']||($s['items'][0]['description']??'')!==($b['content']['description']??'')||($s['items'][0]['assetId']??null)!==($b['content']['assetId']??null))fail(422,'Required broadcast content cannot be changed');}}}
 // Enforce required slides known at this device's last synchronization, without retroactively
 // adding broadcasts that arrived while the device was offline.
 if($m['status']!=='draft'){
  $seen=[];$cutoff=$GLOBALS['device']['last_sync']??gmdate('Y-m-d H:i:s');$at=strtotime($m['createdAt']??'')?:time();$cutoff=min($cutoff,gmdate('Y-m-d H:i:s',$at+1));
  foreach(rows("SELECT record_id,payload FROM record_versions WHERE organization_id=? AND kind='broadcasts' AND created_at<=? ORDER BY version DESC",[org(),$cutoff]) as $rv){if(isset($seen[$rv['record_id']]))continue;$seen[$rv['record_id']]=true;$b=payload($rv);
   if(($b['importance']??'')!=='required'||($b['status']??'')!=='published'||!empty($b['archived'])||!scoped($b,array_merge(actor(),['location_id'=>$location,'role'=>'location']))||strtotime($b['start'])>$at||strtotime($b['end'])<$at)continue;
   $completed=false;if($b['recurrence']==='once'){foreach(rows("SELECT payload FROM usage_events WHERE organization_id=? AND location_id=? AND broadcast_id=? AND event_type='broadcast_presented' AND occurred_at_utc<=?",[org(),$location,$b['id'],gmdate('Y-m-d H:i:s',$at)]) as $er){$ev=payload($er);$skips=rows("SELECT payload FROM usage_events WHERE organization_id=? AND meeting_id=? AND broadcast_id=? AND event_type='broadcast_skipped'",[org(),$ev['meeting_id'],$b['id']]);if(!array_filter($skips,fn($skip)=>(payload($skip)['slide_id']??'')===($ev['slide_id']??''))){$completed=true;break;}}}
   if(!$completed&&!array_filter($m['slides'],fn($slide)=>($slide['broadcast_id']??'')===$b['id']&&!empty($slide['required'])))fail(422,'A required broadcast is missing. Rebuild the meeting after synchronizing.');
  }
 }
 query('INSERT INTO meetings(id,organization_id,location_id,account_id,device_id,presenter,status,payload,created_at) VALUES(?,?,?,?,?,?,?,?,UTC_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE presenter=VALUES(presenter),status=VALUES(status),payload=VALUES(payload)',[$id,org(),$location,actor()['id'],$GLOBALS['device']['id'],$m['presenter']??'',$m['status'],encoded($m)]);change('meetings',$id);
}
function store_event(array $e):void{
 role(['administrator','content_manager','location']);
 $id=require_id($e['id']??'');$m=one('SELECT * FROM meetings WHERE organization_id=? AND id=?',[org(),require_id($e['meeting_id']??'')]);if(!$m)fail(422,'Meeting must sync before its events');location_scope($m['location_id']);
 if($m['device_id']!==$GLOBALS['device']['id']||$m['account_id']!==actor()['id'])fail(403,'Event device mismatch');
 $types=['meeting_started','meeting_completed','slide_opened','slide_skipped','content_presented','video_started','video_completed','broadcast_presented','broadcast_skipped'];$type=$e['event_type']??'';if(!in_array($type,$types,true))fail(422,'Unknown event type');
 if($type==='broadcast_skipped'&&strlen(trim($e['reason']??''))<1)fail(422,'A reason is required');if(strlen($e['reason']??'')>2000)fail(422,'Reason too long');
 $meeting=payload($m);$slide=null;foreach($meeting['slides'] as $s)if(($e['slide_id']??'')===$s['id'])$slide=$s;
 if(!str_starts_with($type,'meeting_')&&!$slide)fail(422,'Slide unavailable');
 $content=null;foreach($slide['items']??[] as $c)if(($e['content_id']??'')===$c['id'])$content=$c;
 if(in_array($type,['content_presented','video_started','video_completed'],true)&&!$content)fail(422,'Content unavailable');
 if(str_starts_with($type,'broadcast_')&&empty($slide['broadcast_id']))fail(422,'Broadcast unavailable');
 $when=strtotime($e['occurred_at_utc']??'');if($when===false||$when>time()+86400)fail(422,'Invalid event time');
 $e['organization_id']=org();$e['location_id']=$m['location_id'];$e['account_id']=actor()['id'];$e['device_id']=$GLOBALS['device']['id'];$e['presenter']=$m['presenter'];$e['title']=$content['title']??$slide['definition']['title']??$meeting['templateName'];$e['content_version']=$content['version']??null;$e['content_type']=$content['type']??null;$e['broadcast_id']=$slide['broadcast_id']??null;$e['broadcast_version']=$slide['broadcast_version']??null;
 $lib=$content?record_row('libraries',$content['libraryId']??''):null;$e['safety']=$content&&(in_array('safety',$content['tags']??[],true)||($lib&&stripos(payload($lib)['name']??'','safety')!==false));
 $e['event_key']=implode(':',[$m['id'],$slide['id']??'',$type,$content['id']??'']);$existing=one('SELECT id FROM usage_events WHERE organization_id=? AND event_key=?',[org(),$e['event_key']]);if($existing)return;
 query('INSERT INTO usage_events(id,organization_id,location_id,account_id,device_id,meeting_id,event_key,event_type,content_id,broadcast_id,occurred_at_utc,server_received_at,payload) VALUES(?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(6),?)',[$id,org(),$m['location_id'],actor()['id'],$GLOBALS['device']['id'],$m['id'],$e['event_key'],$type,$content['id']??null,$slide['broadcast_id']??null,gmdate('Y-m-d H:i:s',$when),encoded($e)]);change('events',$id);
}
if($path==='sync/push'&&$method==='POST'){
 $writes=$body['writes']??[];if(!is_array($writes)||count($writes)>50)fail(422,'Maximum batch size is 50');usort($writes,fn($a,$b)=>($a['kind']==='meeting'?0:1)<=>($b['kind']==='meeting'?0:1));begin_write();$accepted=[];foreach($writes as $w){if(($w['kind']??'')==='meeting')store_meeting($w['data']);elseif(($w['kind']??'')==='event')store_event($w['data']);else fail(422,'Unsupported outbox record');$accepted[]=$w['id'];}$pdo->commit();json_out(['accepted'=>$accepted]);
}
function sync_row(string $kind,string $id):array{
 $data=null;
 if(in_array($kind,['templates','libraries','items','broadcasts'],true)){$r=record_row($kind,$id);if($r){$p=payload($r);if(visible($kind,$p))$data=$p;}}
 elseif($kind==='assets'){$r=one('SELECT * FROM media_assets WHERE organization_id=? AND id=?',[org(),$id]);if($r&&media_allowed($id))$data=media_meta($r);}
 elseif($kind==='locations'){$r=one('SELECT id,organization_id,name,enabled FROM locations WHERE organization_id=? AND id=?',[org(),$id]);if($r&&(actor()['role']!=='location'||actor()['location_id']===$id))$data=$r;}
 elseif(in_array($kind,['events','meetings'],true)){$table=$kind==='events'?'usage_events':'meetings';$r=one("SELECT * FROM $table WHERE organization_id=? AND id=?",[org(),$id]);if($r&&(actor()['role']!=='location'||$r['location_id']===actor()['location_id']))$data=payload($r);}
 return ['id'=>$id,'kind'=>$kind,'deleted'=>$data===null,'data'=>$data];
}
function bootstrap_token(array $value):string{
 $data=bin2hex(encoded($value));return $data.'.'.hash_hmac('sha256',$data,$GLOBALS['session']['token_hash']);
}
function bootstrap_position(string $token):array{
 $parts=explode('.',$token);if(count($parts)!==2||strlen($parts[0])>2000||!preg_match('/^[a-f0-9]+$/D',$parts[0])||strlen($parts[0])%2||!hash_equals(hash_hmac('sha256',$parts[0],$GLOBALS['session']['token_hash']),$parts[1]))fail(422,'Invalid synchronization continuation');
 $value=json_decode(hex2bin($parts[0]),true);if(!is_array($value))fail(422,'Invalid synchronization continuation');return $value;
}
if(in_array($path,['sync/bootstrap','sync/changes'],true)&&$method==='GET'){
 // Keep transaction locks short: both snapshot and incremental responses contain at most 250 records.
 begin_write();$o=one('SELECT sequence,permission_epoch FROM organizations WHERE id=?',[org()]);$after=max(0,(int)($_GET['after']??0));$reset=$path==='sync/bootstrap'||$after<(int)$o['permission_epoch'];$changes=[];$next=null;
 if($reset){
  $position=!empty($_GET['page'])?bootstrap_position($_GET['page']):null;
  if($position&&$position['epoch']!==(int)$o['permission_epoch'])$position=null;
  $first=$position===null;$anchor=$position['anchor']??(int)$o['sequence'];$lastKind=$position['kind']??'';$lastId=$position['id']??'';$batch=[];
  foreach(['assets'=>'media_assets','broadcasts'=>'records','events'=>'usage_events','items'=>'records','libraries'=>'records','locations'=>'locations','meetings'=>'meetings','templates'=>'records'] as $kind=>$table){
   if(strcmp($kind,$lastKind)<0)continue;$remaining=251-count($batch);if($remaining<=0)break;
   $args=[org()];$where='organization_id=?';if($table==='records'){$where.=' AND kind=?';$args[]=$kind;}if($kind===$lastKind){$where.=' AND id>?';$args[]=$lastId;}
   foreach(rows("SELECT id FROM $table WHERE $where ORDER BY id LIMIT $remaining",$args) as $r)$batch[]=['kind'=>$kind,'id'=>$r['id']];
  }
  $pending=count($batch)>250;$batch=array_slice($batch,0,250);foreach($batch as $r)$changes[]=sync_row($r['kind'],$r['id']);
  if($pending){$last=end($batch);$next=bootstrap_token(['anchor'=>$anchor,'epoch'=>(int)$o['permission_epoch'],'kind'=>$last['kind'],'id'=>$last['id']]);}
  $reset=$first;$cursor=$anchor;$more=$pending||$anchor<(int)$o['sequence'];
 }else{
  $batch=rows('SELECT * FROM sync_changes WHERE organization_id=? AND sequence>? ORDER BY sequence LIMIT 250',[org(),$after]);foreach($batch as $c)$changes[]=sync_row($c['kind'],$c['record_id']);$cursor=$batch?(int)end($batch)['sequence']:$after;$more=$cursor<(int)$o['sequence'];
 }
 if(!$more)query('UPDATE devices SET last_sync=UTC_TIMESTAMP(6) WHERE organization_id=? AND id=?',[org(),$GLOBALS['device']['id']]);$pdo->commit();json_out(['reset'=>$reset,'changes'=>$changes,'cursor'=>$cursor,'more'=>$more,'next'=>$next]);
}
