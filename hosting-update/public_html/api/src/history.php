<?php
function can_read_meeting(array $meeting):bool {
 return ($meeting['organization_id']??null)===org() &&
  (actor()['role']==='administrator'||($meeting['account_id']??null)===actor()['id']);
}
// Text history is stored with the authenticated meeting payload, never in logs.
function validate_meeting_history(array $meeting):void {
 if(strlen(encoded($meeting))>2097152)fail(422,'Meeting history exceeds the 2 MB limit');
 $entries=$meeting['transcript']??[];$topics=$meeting['presentedTopics']??[];
 if(!is_array($entries)||!array_is_list($entries)||count($entries)>6000||!is_array($topics)||!array_is_list($topics)||count($topics)>100)fail(422,'Invalid meeting history');
 $slides=array_column($meeting['slides']??[],null,'id');$ids=[];
 foreach($entries as $entry){
  if(!is_array($entry)||!valid_id($entry['id']??null)||isset($ids[$entry['id']]))fail(422,'Invalid transcript entry');$ids[$entry['id']]=true;
  $slide=$slides[$entry['slideId']??'']??null;
  if(!$slide||!is_string($entry['text']??null)||strlen($entry['text'])<1||strlen($entry['text'])>12000||!in_array($entry['language']??'',['en','es'],true)||strtotime($entry['at']??'')===false||strlen($entry['slideTitle']??'')>300||strlen($entry['presenter']??'')>300)fail(422,'Invalid transcript text or context');
  if(!is_array($entry['contentTitles']??null)||count($entry['contentTitles'])>20)fail(422,'Invalid transcript topics');
  foreach($entry['contentTitles'] as $title)if(!is_string($title)||mb_strlen($title,'UTF-8')>300)fail(422,'Invalid transcript topic title');
  $translations=$entry['translations']??[];
  if(!is_array($translations)||count($translations)>1)fail(422,'Invalid transcript translation');
  foreach($translations as $language=>$text)if(!in_array($language,['en','es'],true)||$language===$entry['language']||!is_string($text)||!trim($text)||strlen($text)>36000)fail(422,'Invalid transcript translation');
 }
 foreach($topics as $topic){
  if(!is_array($topic)||!isset($slides[$topic['slideId']??''])||strlen($topic['title']??'')>300||!is_array($topic['content']??null)||count($topic['content'])>20)fail(422,'Invalid presented topic');
  foreach($topic['content'] as $item)if(!is_array($item)||!valid_id($item['id']??null)||!is_string($item['title']??null)||mb_strlen($item['title'],'UTF-8')>300)fail(422,'Invalid presented content title');
 }
}
function append_completed_history(array $prior,array $incoming):array {
 // Originals remain immutable; late speech and additive translations may finish after exit.
 $a=$prior;$b=$incoming;unset($a['transcript'],$b['transcript']);
 if(encoded($a)!==encoded($b))fail(409,'Completed meeting details cannot be changed');
 $old=$prior['transcript']??[];$new=$incoming['transcript']??[];
 if(count($new)<count($old))fail(409,'Saved transcript cannot be replaced');
 foreach($old as $index=>$entry){
  $original=$entry;$incomingEntry=$new[$index];unset($original['translations'],$incomingEntry['translations']);
  if(encoded($original)!==encoded($incomingEntry))fail(409,'Saved transcript cannot be replaced');
  foreach($entry['translations']??[] as $language=>$text)if(($new[$index]['translations'][$language]??null)!==$text)fail(409,'Saved transcript translation cannot be replaced');
 }
 return $incoming;
}
