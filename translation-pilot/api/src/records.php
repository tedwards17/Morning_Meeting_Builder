<?php
function save_record(array $write):array{
 $kind=$write['kind']??'';if(!in_array($kind,['templates','libraries','items','broadcasts'],true))fail(422,'Unknown record kind');
 $id=require_id($write['id']??'');$data=$write['data']??[];if(!is_array($data)||strlen(encoded($data))>524288)fail(422,'Record too large');
 $old=record_row($kind,$id);$prior=$old?payload($old):null;
 if($kind==='templates'){
  if($prior){if(!template_permission($prior,actor(),'edit'))fail(403,'Template edit denied');if(($data['access']??[])!==($prior['access']??[])||($data['company_visible']??false)!==($prior['company_visible']??false))if(!template_permission($prior,actor(),'share'))fail(403,'Only owner or administrator can share');}
  elseif(!actor()['can_create_templates']&&actor()['role']!=='administrator'&&actor()['role']!=='content_manager')fail(403,'Template creation denied');
  if(!is_array($data['slides']??null)||count($data['slides'])<1||count($data['slides'])>100)fail(422,'Templates require 1–100 slides');
  foreach($data['slides'] as &$slide){if(($slide['type']??'')==='intro'){unset($slide['libraryId']);$slide['contentIds']=[];}if(!empty($slide['libraryId'])){$lib=record_row('libraries',$slide['libraryId']);if(!$lib||!visible('libraries',payload($lib)))fail(422,'Library unavailable');}foreach($slide['contentIds']??[] as $cid){$content=record_row('items',$cid);if(!$content||!visible('items',payload($content)))fail(422,'Content unavailable');}}unset($slide);
 }else role(['administrator','content_manager']);
 if((int)($write['expected_version']??-1)!==(int)($old['version']??0))fail(409,'This record changed elsewhere. Refresh and retry your edit.');
 verify_targets($data);
 $validateMedia=function(array $node) use (&$validateMedia):void{foreach($node as $key=>$value){if(is_array($value))$validateMedia($value);elseif(in_array($key,['assetId','backgroundAssetId','logoAssetId','thumbnailAssetId'],true)&&$value){if(!one('SELECT id FROM media_assets WHERE organization_id=? AND id=?',[org(),require_id($value)])||!media_allowed($value))fail(403,'Image access denied');}elseif(in_array($key,['background','foreground','accent'],true)&&$value&&!preg_match('/^#[a-f0-9]{6}$/i',$value))fail(422,'Invalid theme color');}};$validateMedia($data);
 if(in_array($kind,['templates','libraries'],true)&&(strlen($data['name']??'')<1||strlen($data['name'])>300))fail(422,'Name required');

 if($kind==='items'){require_content($data);$lib=record_row('libraries',require_id($data['libraryId']??''));if(!$lib)fail(422,'Library unavailable');}
 if($kind==='broadcasts'){
  if(!in_array($data['importance']??'', ['available','suggested','required'],true)||!in_array($data['recurrence']??'', ['once','every'],true)||!in_array($data['status']??'', ['draft','published'],true))fail(422,'Invalid broadcast settings');
  $start=strtotime($data['start']??'');$end=strtotime($data['end']??'');if($start===false||$end===false||$end<$start)fail(422,'Invalid date window');
  $data['start']=gmdate('Y-m-d\TH:i:s.000\Z',$start);$data['end']=gmdate('Y-m-d\TH:i:s.000\Z',$end);if(strlen($data['slot']??'')<1)fail(422,'Insertion slot required');require_content($data['content']??[]);
  $data['sequence']=$prior['sequence']??((int)one('SELECT sequence FROM organizations WHERE id=?',[org()])['sequence']+1);
 }
 $data['id']=$id;$data['organization_id']=org();$data['owner_id']=$prior['owner_id']??actor()['id'];$data['version']=(int)($old['version']??0)+1;
 $data['archived']=(bool)($data['archived']??false);$data['updatedAt']=gmdate('Y-m-d\TH:i:s.000\Z');
 query('INSERT INTO records(organization_id,kind,id,owner_id,version,archived,payload,updated_at) VALUES(?,?,?,?,?,?,?,UTC_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE version=VALUES(version),archived=VALUES(archived),payload=VALUES(payload),updated_at=VALUES(updated_at)',[org(),$kind,$id,$data['owner_id'],$data['version'],(int)$data['archived'],encoded($data)]);
 query('INSERT INTO record_versions(organization_id,kind,record_id,version,payload,created_at) VALUES(?,?,?,?,?,UTC_TIMESTAMP(6))',[org(),$kind,$id,$data['version'],encoded($data)]);
 change($kind,$id);foreach(rows('SELECT id FROM media_assets WHERE organization_id=?',[org()]) as $media)if(str_contains(encoded($data),$media['id']))change('assets',$media['id']);audit($data['archived']?'archive':'save_'.$kind,$id,['version'=>$data['version']]);
 // Access changes cause all clients to re-evaluate visibility on next pull.
 if($kind==='templates'||isset($data['locations']))query('UPDATE organizations SET permission_epoch=sequence WHERE id=?',[org()]);
 return ['id'=>$id,'kind'=>$kind,'data'=>$data];
}
if($path==='records/batch'&&$method==='POST'){$writes=$body['records']??[];if(!is_array($writes)||count($writes)<1||count($writes)>50)fail(422,'Use batches of 1–50 records');begin_write();$result=[];foreach($writes as $w)$result[]=save_record($w);$pdo->commit();json_out(['records'=>$result]);}
if(in_array($path,['templates','libraries','content','broadcasts'],true)&&$method==='GET'){$kind=$path==='content'?'items':$path;$result=[];foreach(rows('SELECT * FROM records WHERE organization_id=? AND kind=?',[org(),$kind]) as $r){$d=payload($r);if(visible($kind,$d))$result[]=$d;}json_out(['records'=>$result]);}
