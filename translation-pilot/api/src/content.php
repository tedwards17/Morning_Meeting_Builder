<?php
if(str_starts_with($path,'content/rotation')) {
 if(!one('SELECT version FROM schema_migrations WHERE version=5'))fail(426,'Install migration 005 before using content rotation.');
 if($path==='content/rotation'&&$method==='GET'){
  $locations=rows('SELECT id,name,enabled FROM locations WHERE organization_id=? ORDER BY name',[org()]);
  $location=actor()['category']==='location'?actor()['location_id']:($_GET['location']??'');
  if($location!=='')$location=content_rotation_location($location);
  $available=[];$libraries=[];
  foreach(rows("SELECT payload FROM records WHERE organization_id=? AND kind='libraries' AND archived=0",[org()]) as $row){$lib=payload($row);$libraries[$lib['id']]=$lib;}
  if($location!=='')foreach(rows("SELECT payload FROM records WHERE organization_id=? AND kind='items' AND archived=0",[org()]) as $row){$item=payload($row);if(content_location_visible($item,$location,$libraries[$item['libraryId']??'']??[]))$available[]=$item['id'];}
  $enabled=$location===''?[]:array_column(rows('SELECT content_id FROM content_rotation WHERE organization_id=? AND location_id=? AND enabled=1',[org(),$location]),'content_id');
  json_out(['location'=>$location,'locations'=>$locations,'available'=>$available,'enabled'=>array_values(array_intersect($enabled,$available)),'canManage'=>$location!==''&&can_manage_rotation($location),'canDelete'=>actor()['role']==='administrator','limits'=>['image'=>content_upload_limit($config['max_image_bytes']),'video'=>content_upload_limit($config['max_library_video_bytes']??52428800)]]);
 }
 if($path==='content/rotation'&&$method==='POST'){
  $location=content_rotation_location($body['location_id']??'');
  if(!can_manage_rotation($location))fail(403,'Only this location account or an administrator can change its rotation.');
  $id=require_id($body['content_id']??'');if(!is_bool($body['enabled']??null))fail(422,'Choose a valid rotation setting.');
  begin_write();$row=record_row('items',$id);
  if(!$row||!content_location_visible(payload($row),$location))fail(403,'Content is not available at this location.');
  query('INSERT INTO content_rotation(organization_id,location_id,content_id,enabled,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE enabled=VALUES(enabled),updated_at=CURRENT_TIMESTAMP',[org(),$location,$id,(int)$body['enabled']]);
  audit($body['enabled']?'rotation_add':'rotation_remove',$id,['location_id'=>$location]);$pdo->commit();json_out(['ok'=>true]);
 }
}
if(preg_match('#^content/([a-f0-9-]{36})/delete$#',$path,$match)&&$method==='POST'){
 role(['administrator']);begin_write();$row=record_row('items',$match[1]);if(!$row)fail(404,'Content unavailable');
 if((int)($body['expected_version']??-1)!==(int)$row['version'])fail(409,'This record changed elsewhere. Refresh and retry your edit.');
 $data=payload($row);$data['archived']=true;
 $result=save_record(['kind'=>'items','id'=>$match[1],'data'=>$data,'expected_version'=>(int)$row['version']]);
 query('DELETE FROM content_rotation WHERE organization_id=? AND content_id=?',[org(),$match[1]]);
 $pdo->commit();json_out(['record'=>$result]);
}
