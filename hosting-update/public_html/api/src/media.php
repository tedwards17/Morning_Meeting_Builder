<?php
function media_meta(array $r):array {
 return ['id'=>$r['id'],'organization_id'=>$r['organization_id'],'hash'=>$r['sha256'],'mime'=>$r['mime'],'size'=>(int)$r['byte_size'],'width'=>(int)$r['width'],'height'=>(int)$r['height'],'name'=>$r['name'],'createdAt'=>str_replace(' ','T',$r['created_at']).'Z','archived'=>(bool)$r['archived'],'thumbnail'=>!empty($r['thumbnail_path']),'scope'=>$r['scope']??'shared','meeting_id'=>$r['meeting_id']??null];
}
function media_allowed(string $id):bool {
 $asset=one('SELECT * FROM media_assets WHERE organization_id=? AND id=?',[org(),$id]);if(!$asset)return false;
 if(($asset['scope']??'shared')==='meeting-only') {
  if($asset['archived'])return false;
  $meeting=one('SELECT * FROM meetings WHERE organization_id=? AND id=?',[org(),$asset['meeting_id']]);
  return $meeting&&$meeting['status']!=='completed'&&can_read_meeting($meeting);
 }
 if(in_array(actor()['role'],['administrator','content_manager','report_viewer'],true))return true;
 if($asset['creator_id']===actor()['id'])return true;
 foreach(rows('SELECT kind,payload FROM records WHERE organization_id=?',[org()]) as $r)if(str_contains($r['payload'],$id)&&visible($r['kind'],payload($r)))return true;
 foreach(rows('SELECT payload FROM meetings WHERE organization_id=? AND account_id=?',[org(),actor()['id']]) as $r)if(str_contains($r['payload'],$id))return true;
 return false;
}
function remove_meeting_upload_references(array $meeting):array {
 foreach($meeting['slides']??[] as $index=>$slide)foreach($slide['items']??[] as $itemIndex=>$item)if(($item['scope']??'')==='meeting-only') {
  unset($item['assetId'],$item['thumbnailAssetId']);$item['url']='';$item['mediaDeleted']=true;
  $meeting['slides'][$index]['items'][$itemIndex]=$item;
 }
 return $meeting;
}
function finalize_meeting_uploads(array $meeting):array {
 $meeting=remove_meeting_upload_references($meeting);
 $meeting['mediaExpiredAt']=$meeting['mediaExpiredAt']??gmdate('Y-m-d\TH:i:s.000\Z');
 $meeting['mediaCleanupConfirmed']=true;
 foreach(rows("SELECT id FROM media_assets WHERE organization_id=? AND meeting_id=? AND scope='meeting-only' AND archived=0",[org(),$meeting['id']]) as $asset) {
  query('UPDATE media_assets SET archived=1 WHERE organization_id=? AND id=?',[org(),$asset['id']]);change('assets',$asset['id']);
 }
 return $meeting;
}
function purge_completed_uploads():void {
 // Archived uploads cannot be downloaded. Failed disk deletion remains queued for a later sync.
 begin_write();
 foreach(rows("SELECT a.* FROM media_assets a JOIN meetings m ON m.organization_id=a.organization_id AND m.id=a.meeting_id WHERE a.organization_id=? AND a.scope='meeting-only' AND a.archived=1 AND m.status='completed'",[org()]) as $asset) {
  $removed=true;foreach([$asset['stored_path'],$asset['thumbnail_path']] as $file)if($file&&is_file($file)&&!@unlink($file))$removed=false;
  if($removed)query('DELETE FROM media_assets WHERE organization_id=? AND id=?',[org(),$asset['id']]);
 }
 $GLOBALS['pdo']->commit();
}
function validate_meeting_uploads(array $meeting):void {
 foreach($meeting['slides']??[] as $slide)foreach($slide['items']??[] as $item)foreach(['assetId','thumbnailAssetId'] as $key)if(!empty($item[$key])) {
  $asset=one('SELECT * FROM media_assets WHERE organization_id=? AND id=?',[org(),require_id($item[$key])]);
  if(!$asset||!media_allowed($asset['id']))fail(403,'Meeting media unavailable');
  if(($asset['scope']??'')==='meeting-only'&&($asset['meeting_id']!==$meeting['id']||($item['scope']??'')!=='meeting-only'))fail(403,'Meeting upload belongs to a different presentation');
 }
}
if($path==='media'&&$method==='POST') {
 $temporary=($_POST['scope']??'')==='meeting-only';
 role($temporary?['administrator','content_manager','location']:['administrator','content_manager','location','report_viewer']);
 $meetingId=$temporary?require_id($_POST['meeting_id']??''):null;
 $f=$_FILES['image']??null;if(!$f||$f['error']!==UPLOAD_ERR_OK)fail(422,'Media upload failed; check PHP upload limits');
 $limit=$temporary?($config['max_meeting_media_bytes']??150*1024*1024):$config['max_image_bytes'];
 if($f['size']<1||$f['size']>$limit)fail(413,'Media exceeds application upload limit');
 $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
 $images=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];$videos=['video/mp4'=>'mp4','video/webm'=>'webm','video/quicktime'=>'mov'];
 $video=isset($videos[$mime]);$info=[0,0];
 if($video&&!$temporary)fail(422,'Shared library uploads accept images only');
 if(!$video){$info=@getimagesize($f['tmp_name']);if(!isset($images[$mime])||!$info||$info['mime']!==$mime)fail(422,'Upload a valid JPEG, PNG, WebP, MP4, WebM or MOV file');if($info[0]*$info[1]>40000000)fail(422,'Image dimensions exceed 40 megapixels');}
 begin_write();
 if($temporary) {
  $meeting=one('SELECT * FROM meetings WHERE organization_id=? AND id=? FOR UPDATE',[org(),$meetingId]);
  if(!$meeting||$meeting['account_id']!==actor()['id']||$meeting['device_id']!==$GLOBALS['device']['id']||$meeting['status']==='completed')fail(403,'Open this saved meeting on your device before uploading');
 }
 $used=(int)one('SELECT COALESCE(SUM(byte_size),0) AS total FROM media_assets WHERE organization_id=?',[org()])['total'];if($used+$f['size']>$config['max_storage_bytes'])fail(413,'Organization storage limit reached');
 $dir=rtrim($config['media_dir'],'/').'/'.org().'/'.gmdate('Y/m');if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Media directory unavailable');
 $ext=$video?$videos[$mime]:$images[$mime];$target=$dir.'/'.bin2hex(random_bytes(24)).'.'.$ext;$thumb=null;
 if(!$video&&function_exists('imagecreatefromstring')&&function_exists('imagewebp')) {
  $image=@imagecreatefromstring(file_get_contents($f['tmp_name']));if(!$image)fail(422,'Image decoding failed');
  if($mime==='image/jpeg'&&function_exists('exif_read_data')){$exif=@exif_read_data($f['tmp_name']);$orientation=$exif['Orientation']??1;if(in_array($orientation,[2,4,5,7],true))imageflip($image,IMG_FLIP_HORIZONTAL);$angle=[3=>180,4=>180,5=>90,6=>-90,7=>-90,8=>90][$orientation]??0;if($angle)$image=imagerotate($image,$angle,0);}
  $w=imagesx($image);$h=imagesy($image);$scale=min(1,2400/max($w,$h));if($scale<1)$image=imagescale($image,(int)($w*$scale),(int)($h*$scale));$target=preg_replace('/\.[^.]+$/','.webp',$target);if(!imagewebp($image,$target,85))throw new RuntimeException('WebP encoding failed');$thumb=substr($target,0,-5).'-thumb.webp';$small=imagescale($image,min(400,imagesx($image)));imagewebp($small,$thumb,75);imagedestroy($small);$info=[imagesx($image),imagesy($image)];imagedestroy($image);$mime='image/webp';
 }elseif(!move_uploaded_file($f['tmp_name'],$target))throw new RuntimeException('Media storage failed');
 chmod($target,0600);if($thumb)chmod($thumb,0600);$hash=hash_file('sha256',$target);$scope=$temporary?'meeting-only':'shared';
 $duplicate=one('SELECT * FROM media_assets WHERE organization_id=? AND sha256=? AND archived=0 AND scope=? AND meeting_id <=> ?',[org(),$hash,$scope,$meetingId]);
 if($duplicate){unlink($target);if($thumb)unlink($thumb);$pdo->commit();json_out(media_meta($duplicate));}
 $id=uuid();query('INSERT INTO media_assets(id,organization_id,creator_id,stored_path,thumbnail_path,sha256,mime,byte_size,width,height,name,created_at,scope,meeting_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(6),?,?)',[ $id,org(),actor()['id'],$target,$thumb,$hash,$mime,filesize($target),$info[0],$info[1],substr(basename($f['name']),0,255),$scope,$meetingId]);change('assets',$id);audit('media_upload',$id);$pdo->commit();json_out(media_meta(one('SELECT * FROM media_assets WHERE organization_id=? AND id=?',[org(),$id])),201);
}
if(preg_match('#^media/([a-f0-9-]{36})$#',$path,$match)&&$method==='GET') {
 $r=one('SELECT * FROM media_assets WHERE organization_id=? AND id=?',[org(),$match[1]]);if(!$r||!media_allowed($match[1]))fail(404,'Media unavailable');
 $thumbnail=isset($_GET['thumbnail'])&&$r['thumbnail_path'];$file=$thumbnail?$r['thumbnail_path']:$r['stored_path'];if(!is_file($file))fail(404,'Media file missing');
 $size=filesize($file);$start=0;$end=$size-1;header('Content-Type: '.($thumbnail?'image/webp':$r['mime']));header('Content-Disposition: inline');header('Accept-Ranges: bytes');
 if(isset($_SERVER['HTTP_RANGE'])) {
  if(!preg_match('/^bytes=(\d*)-(\d*)$/D',$_SERVER['HTTP_RANGE'],$range)||($range[1]===''&&$range[2]==='')){header('Content-Range: bytes */'.$size);http_response_code(416);exit;}
  if($range[1]==='')$start=max(0,$size-(int)$range[2]);else{$start=(int)$range[1];if($range[2]!=='')$end=min($end,(int)$range[2]);}
  if($start>$end||$start>=$size){header('Content-Range: bytes */'.$size);http_response_code(416);exit;}
  http_response_code(206);header('Content-Range: bytes '.$start.'-'.$end.'/'.$size);
 }
 header('Content-Length: '.($end-$start+1));$handle=fopen($file,'rb');fseek($handle,$start);$remaining=$end-$start+1;while($remaining>0&&!feof($handle)){ $chunk=fread($handle,min(65536,$remaining));if($chunk===false||$chunk==='')break;echo $chunk;$remaining-=strlen($chunk);}fclose($handle);exit;
}
