<?php
function content_location_visible(array $data,string $location,?array $libraryData=null):bool {
 if(!empty($data['archived']))return false;
 if(!empty($data['locations'])&&!in_array($location,$data['locations'],true))return false;
 if($libraryData===null){$library=record_row('libraries',$data['libraryId']??'');if(!$library)return false;$libraryData=payload($library);}
 if(!$libraryData)return false;$lib=$libraryData;
 return empty($lib['archived'])&&(empty($lib['locations'])||in_array($location,$lib['locations'],true));
}
function content_rotation_location(mixed $id):string {
 $id=require_id($id);
 if(actor()['category']==='location'&&actor()['location_id']!==$id)fail(403,'Use your assigned location.');
 if(!one('SELECT id FROM locations WHERE organization_id=? AND id=? AND enabled=1',[org(),$id]))fail(403,'Location unavailable');
 return $id;
}
function can_manage_rotation(string $location):bool {
 return actor()['role']==='administrator'||(actor()['category']==='location'&&actor()['location_id']===$location);
}
function validate_content_sharing(array &$data,?array $prior):void {
 if(array_key_exists('allLocations',$data)&&!is_bool($data['allLocations']))fail(422,'Choose valid receiving locations.');
 if(!is_array($data['locations']??[]))fail(422,'Choose valid receiving locations.');
 $all=$data['allLocations']??empty($data['locations']);
 if($all)$data['locations']=[];
 if(!$all&&empty($data['locations']))fail(422,'Select at least one receiving location.');
 if(!$prior&&!one('SELECT id FROM locations WHERE organization_id=? AND enabled=1 LIMIT 1',[org()]))fail(422,'Create a receiving location before adding content.');
 foreach($data['locations'] as $id)if(!one('SELECT id FROM locations WHERE organization_id=? AND id=? AND enabled=1',[org(),require_id($id)]))fail(422,'Choose valid receiving locations.');
 $data['allLocations']=$all;
 if((!empty($data['archived'])&&(!$prior||empty($prior['archived'])))||($prior&&!empty($prior['archived'])&&empty($data['archived'])))role(['administrator']);
 // Rotation is managed only by the separate location-authorized endpoint.
 unset($data['rotation'],$data['rotationLocations'],$data['rotation_location_ids']);
}
function validate_library_content(array $data):void {
 require_content($data);
 if(isset($data['summary'])&&(!is_string($data['summary'])||mb_strlen($data['summary'],'UTF-8')>4000))fail(422,'Content description must be 4000 characters or fewer.');
 if(trim($data['title']??'')==='')fail(422,'Content title required');
 if(in_array($data['type'],['lesson','text','vocabulary','recognition','stretch'],true)&&empty($data['assetId'])&&empty($data['url'])&&trim($data['description']??'')==='')fail(422,'Text content requires body text.');
 if(in_array($data['type'],['image','image-text','video'],true)&&empty($data['assetId']))fail(422,'Choose a media file.');
 if(in_array($data['type'],['link','external-video'],true)&&empty($data['url']))fail(422,'Add a complete web link.');
 if(!empty($data['assetId'])){
  $asset=one("SELECT * FROM media_assets WHERE organization_id=? AND id=? AND scope='shared'",[org(),$data['assetId']]);
  if(!$asset)fail(422,'Media unavailable');
  if(($data['type']==='video')!==str_starts_with($asset['mime'],'video/'))fail(422,'Choose the matching image or video file.');
 }
}

function content_upload_limit(int $configured):int {
 $bytes=function(string $value):int {$number=(float)$value;$unit=strtolower(substr(trim($value),-1));$power=['k'=>1,'m'=>2,'g'=>3][$unit]??0;return $number>0?(int)($number*(1024**$power)):PHP_INT_MAX;};
 return min($configured,$bytes(ini_get('upload_max_filesize')),max(0,$bytes(ini_get('post_max_size'))-65536));
}

function validate_slide_layout(mixed $layout,bool $contentOnly=false):void {
 if($layout===null)return;
 if(!is_array($layout)||array_is_list($layout)&&count($layout)>0)fail(422,'Choose a valid slide layout.');
 foreach($layout as $key=>$value){
  if($contentOnly&&$key==='titlePosition')fail(422,'Set title position in the template builder.');
  if(!in_array($key,['titlePosition','textOnlyPosition','imageOnlyPosition','imageTextPosition','mediaPlacement'],true))fail(422,'Choose a valid slide layout.');
  if(!is_string($value)||!in_array($value,$key==='mediaPlacement'?['left','right','top','bottom']:['top-left','top-center','top-right','middle-left','middle-center','middle-right','bottom-left','bottom-center','bottom-right'],true))fail(422,'Choose a valid slide layout.');
 }
}
