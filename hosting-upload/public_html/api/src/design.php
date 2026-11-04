<?php
// Reusable backgrounds/logos use existing shared media and versioned records.
// Retired illustration records/files remain stored for rollback; no picker/rendering.
function require_design_template_edit(?string $id):void {
 if(!$id)fail(422,'Open an editable template to manage background images.');
 $template=record_row('templates',require_id($id));
 if($template){if(!template_permission(payload($template),actor(),'edit'))fail(403,'Template edit denied');}
 elseif(!actor()['can_create_templates']&&!in_array(actor()['role'],['administrator','content_manager'],true))fail(403,'Template creation denied');
}
function validate_slide_images(array $node):void {
 foreach($node as $key=>$value){
  if(is_array($value)){validate_slide_images($value);continue;}
  if($value===null)continue;
  if($key==='backgroundFit'&&!in_array($value,['cover','contain'],true))fail(422,'Choose Fill slide or Shrink to fit.');
  if($key==='logoSize'&&(!is_numeric($value)||$value<25||$value>100))fail(422,'Logo size must be between 25 and 100 percent.');
  if($key==='logoTrim'&&!is_bool($value))fail(422,'Choose a valid logo padding setting.');
 }
}
if($path==='design-assets'&&$method==='GET'){
 $records=[];foreach(rows("SELECT payload FROM records WHERE organization_id=? AND kind='visuals' AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.role')) IN ('background','logo') ORDER BY updated_at DESC",[org()]) as $row)$records[]=payload($row);json_out(['records'=>$records]);
}
if($path==='design-assets'&&$method==='POST'){
 $data=$body['data']??[];if(!is_array($data))fail(422,'Choose a valid design image.');$id=require_id($data['id']??'');$kind=$data['role']??'';
 if(!in_array($kind,['background','logo'],true)||!is_string($data['name']??null)||!trim($data['name'])||mb_strlen($data['name'],'UTF-8')>300)fail(422,'Enter an image name of 1–300 characters.');
 if($kind==='logo')role(['administrator']);else require_design_template_edit($body['template_id']??null);
 $assetId=require_id($data['assetId']??'');begin_write();$old=record_row('visuals',$id);$prior=$old?payload($old):null;
 if((int)($body['expected_version']??-1)!==(int)($old['version']??0))fail(409,'This record changed elsewhere. Refresh and retry your edit.');
 if($prior&&($prior['assetId']!==$assetId||$prior['role']!==$kind))fail(422,'Upload a new collection image instead of replacing a referenced file.');
 $asset=one("SELECT * FROM media_assets WHERE organization_id=? AND id=? AND scope='shared' AND archived=0",[org(),$assetId]);
 if(!$asset||!str_starts_with($asset['mime'],'image/'))fail(422,'Choose a shared JPEG, PNG or WebP image.');
 if($kind==='background'&&actor()['role']!=='administrator'&&(($prior&&$prior['owner_id']!==actor()['id'])||(!$prior&&$asset['creator_id']!==actor()['id'])))fail(403,'Only the uploader or an administrator can manage this background image.');
 // Registering the same upload again reuses its entry, without duplicate choices.
 if(!$prior){$existing=one("SELECT * FROM records WHERE organization_id=? AND kind='visuals' AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.assetId'))=? AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.role'))=? LIMIT 1",[org(),$assetId,$kind]);if($existing){$prior=payload($existing);if($kind==='background'&&actor()['role']!=='administrator'&&$prior['owner_id']!==actor()['id'])fail(403,'Only the uploader or an administrator can manage this background image.');if(empty($prior['archived'])){$pdo->commit();json_out(['record'=>$prior]);}$old=$existing;$id=$prior['id'];$data['name']=$prior['name'];}}
 $data=['id'=>$id,'name'=>trim($data['name']),'role'=>$kind,'assetId'=>$assetId,'archived'=>(bool)($data['archived']??false),'organization_id'=>org(),'owner_id'=>$prior['owner_id']??actor()['id'],'version'=>(int)($old['version']??0)+1,'updatedAt'=>gmdate('Y-m-d\TH:i:s.000\Z')];
 query("INSERT INTO records(organization_id,kind,id,owner_id,version,archived,payload,updated_at) VALUES(?,'visuals',?,?,?,?,?,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE version=VALUES(version),archived=VALUES(archived),payload=VALUES(payload),updated_at=VALUES(updated_at)",[org(),$id,$data['owner_id'],$data['version'],(int)$data['archived'],encoded($data)]);
 query("INSERT INTO record_versions(organization_id,kind,record_id,version,payload,created_at) VALUES(?,'visuals',?,?,?,UTC_TIMESTAMP())",[org(),$id,$data['version'],encoded($data)]);
 change('assets',$assetId);audit('design_asset_saved',$id,['role'=>$kind,'archived'=>$data['archived']]);$pdo->commit();json_out(['record'=>$data]);
}
