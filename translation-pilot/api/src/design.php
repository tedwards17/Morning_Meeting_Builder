<?php
// Company design assets use the existing versioned records table. They are not
// content items, rotation members, or temporary meeting uploads.
function design_image_analysis(array $asset):array {
 if(!function_exists('imagecreatefromstring'))return ['tintable'=>false,'tintReason'=>'unsupported'];
 $image=@imagecreatefromstring(file_get_contents($asset['stored_path']));if(!$image)return ['tintable'=>false,'tintReason'=>'unsupported'];
 $step=max(1,(int)ceil(max(imagesx($image),imagesy($image))/160));$total=0;$transparent=0;$colors=[];
 for($y=0;$y<imagesy($image);$y+=$step)for($x=0;$x<imagesx($image);$x+=$step){$total++;$c=imagecolorsforindex($image,imagecolorat($image,$x,$y));if($c['alpha']>=110)$transparent++;if($c['alpha']<=40)$colors[]=[$c['red'],$c['green'],$c['blue']];}
 imagedestroy($image);
 if(!$total||$transparent/$total<.03)return ['tintable'=>false,'tintReason'=>'opaque'];
 if(count($colors)<3)return ['tintable'=>false,'tintReason'=>'unsupported'];
 $uniform=true;for($i=0;$i<3;$i++){$values=array_column($colors,$i);if(max($values)-min($values)>35)$uniform=false;}
 return $uniform?['tintable'=>true,'tintReason'=>'single-color']:['tintable'=>false,'tintReason'=>'multicolor'];
}
function validate_slide_illustration(array $definition):void {
 if(!isset($definition['illustration']))return;$art=$definition['illustration'];
 if(!is_array($art)||!is_bool($art['matchHighlight']??false))fail(422,'Choose a valid slide illustration.');
 $builtin=$art['builtin']??null;$assetId=$art['assetId']??null;
 if((bool)$builtin===(bool)$assetId)fail(422,'Choose one slide illustration.');
 if($builtin){if(!in_array($builtin,['introduction','stretching','safety','vocabulary','lean','recognition','ownership','dismissal'],true))fail(422,'Choose a valid slide illustration.');return;}
 require_id($assetId);$record=one("SELECT payload FROM records WHERE organization_id=? AND kind='visuals' AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.assetId'))=? AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.role'))='illustration' LIMIT 1",[org(),$assetId]);
 if(!$record||!media_allowed($assetId))fail(403,'Illustration unavailable. Choose an available company illustration.');
 if(!empty($art['matchHighlight'])&&empty(payload($record)['tintable']))fail(422,'Color matching needs a transparent single-color illustration. Use original colors for this image.');
 if(isset($art['name'])&&(!is_string($art['name'])||mb_strlen($art['name'],'UTF-8')>300))fail(422,'Illustration name must be 300 characters or fewer.');
}
if($path==='design-assets'&&$method==='GET'){
 $records=[];foreach(rows("SELECT payload FROM records WHERE organization_id=? AND kind='visuals' ORDER BY updated_at DESC",[org()]) as $row)$records[]=payload($row);json_out(['records'=>$records]);
}
if($path==='design-assets'&&$method==='POST'){
 role(['administrator']);$data=$body['data']??[];if(!is_array($data))fail(422,'Choose a valid design image.');$id=require_id($data['id']??'');
 if(!in_array($data['role']??'',['illustration','logo'],true)||!is_string($data['name']??null)||!trim($data['name'])||mb_strlen($data['name'],'UTF-8')>300)fail(422,'Enter an image name of 1–300 characters.');
 $assetId=require_id($data['assetId']??'');begin_write();$old=record_row('visuals',$id);$prior=$old?payload($old):null;
 if((int)($body['expected_version']??-1)!==(int)($old['version']??0))fail(409,'This record changed elsewhere. Refresh and retry your edit.');
 if($prior&&($prior['assetId']!==$assetId||$prior['role']!==$data['role']))fail(422,'Upload a new collection image instead of replacing a referenced file.');
 $asset=one("SELECT * FROM media_assets WHERE organization_id=? AND id=? AND scope='shared' AND archived=0",[org(),$assetId]);
 if(!$asset||!str_starts_with($asset['mime'],'image/'))fail(422,'Choose a shared JPEG, PNG or WebP image.');
 $data=['id'=>$id,'name'=>trim($data['name']),'role'=>$data['role'],'assetId'=>$assetId,'archived'=>(bool)($data['archived']??false),'organization_id'=>org(),'owner_id'=>$prior['owner_id']??actor()['id'],'version'=>(int)($old['version']??0)+1,'updatedAt'=>gmdate('Y-m-d\TH:i:s.000\Z')]+design_image_analysis($asset);
 query("INSERT INTO records(organization_id,kind,id,owner_id,version,archived,payload,updated_at) VALUES(?,'visuals',?,?,?,?,?,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE version=VALUES(version),archived=VALUES(archived),payload=VALUES(payload),updated_at=VALUES(updated_at)",[org(),$id,$data['owner_id'],$data['version'],(int)$data['archived'],encoded($data)]);
 query("INSERT INTO record_versions(organization_id,kind,record_id,version,payload,created_at) VALUES(?,'visuals',?,?,?,UTC_TIMESTAMP())",[org(),$id,$data['version'],encoded($data)]);
 // Notify recipients whose earlier sync could not read this previously private asset.
 change('assets',$assetId);audit('design_asset_saved',$id,['role'=>$data['role'],'archived'=>$data['archived']]);$pdo->commit();json_out(['record'=>$data]);
}
