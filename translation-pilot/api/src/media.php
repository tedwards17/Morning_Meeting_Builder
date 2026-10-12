<?php
function media_meta(array $r):array{return ['id'=>$r['id'],'organization_id'=>$r['organization_id'],'hash'=>$r['sha256'],'mime'=>$r['mime'],'size'=>(int)$r['byte_size'],'width'=>(int)$r['width'],'height'=>(int)$r['height'],'name'=>$r['name'],'createdAt'=>str_replace(' ','T',$r['created_at']).'Z','archived'=>(bool)$r['archived'],'thumbnail'=>!empty($r['thumbnail_path'])];}
function media_allowed(string $id):bool{
 if(in_array(actor()['role'],['administrator','content_manager','report_viewer'],true))return true;
 $asset=one('SELECT creator_id FROM media_assets WHERE organization_id=? AND id=?',[org(),$id]);if($asset&&$asset['creator_id']===actor()['id'])return true;
 foreach(rows('SELECT kind,payload FROM records WHERE organization_id=?',[org()]) as $r)if(str_contains($r['payload'],$id)&&visible($r['kind'],payload($r)))return true;
 foreach(rows('SELECT payload FROM meetings WHERE organization_id=? AND location_id=?',[org(),actor()['location_id']]) as $r)if(str_contains($r['payload'],$id))return true;
 return false;
}
if($path==='media'&&$method==='POST'){
 role(['administrator','content_manager']);$f=$_FILES['image']??null;if(!$f||$f['error']!==UPLOAD_ERR_OK)fail(422,'Image upload failed; check PHP upload limits');
 if($f['size']<1||$f['size']>$config['max_image_bytes'])fail(413,'Image exceeds application limit');
 $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);$info=@getimagesize($f['tmp_name']);if(!in_array($mime,['image/jpeg','image/png','image/webp'],true)||!$info||$info['mime']!==$mime)fail(422,'Upload a valid JPEG, PNG, or WebP image');if($info[0]*$info[1]>40000000)fail(422,'Image dimensions exceed 40 megapixels');
 begin_write();$used=(int)one('SELECT COALESCE(SUM(byte_size),0) AS total FROM media_assets WHERE organization_id=?',[org()])['total'];if($used+$f['size']>$config['max_storage_bytes'])fail(413,'Organization storage limit reached');
 $dir=rtrim($config['media_dir'],'/').'/'.org().'/'.gmdate('Y/m');if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Media directory unavailable');
 $ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime];$name=bin2hex(random_bytes(24));$target=$dir.'/'.$name.'.'.$ext;$thumb=null;
 if(function_exists('imagecreatefromstring')&&function_exists('imagewebp')){
  $image=@imagecreatefromstring(file_get_contents($f['tmp_name']));if(!$image)fail(422,'Image decoding failed');
  if($mime==='image/jpeg'&&function_exists('exif_read_data')){$exif=@exif_read_data($f['tmp_name']);$orientation=$exif['Orientation']??1;if(in_array($orientation,[2,4,5,7],true))imageflip($image,IMG_FLIP_HORIZONTAL);$angle=[3=>180,4=>180,5=>90,6=>-90,7=>-90,8=>90][$orientation]??0;if($angle)$image=imagerotate($image,$angle,0);}
  $w=imagesx($image);$h=imagesy($image);$scale=min(1,2400/max($w,$h));if($scale<1)$image=imagescale($image,(int)($w*$scale),(int)($h*$scale));$target=$dir.'/'.$name.'.webp';if(!imagewebp($image,$target,85))throw new RuntimeException('WebP encoding failed');$thumb=$dir.'/'.$name.'-thumb.webp';$small=imagescale($image,min(400,imagesx($image)));imagewebp($small,$thumb,75);imagedestroy($small);$info=[imagesx($image),imagesy($image)];imagedestroy($image);$mime='image/webp';
 }else{if(!move_uploaded_file($f['tmp_name'],$target))throw new RuntimeException('Image storage failed');}
 chmod($target,0600);if($thumb)chmod($thumb,0600);$hash=hash_file('sha256',$target);
 $duplicate=one('SELECT * FROM media_assets WHERE organization_id=? AND sha256=? AND archived=0',[org(),$hash]);if($duplicate){unlink($target);if($thumb)unlink($thumb);$pdo->commit();json_out(media_meta($duplicate));}
 $id=uuid();query('INSERT INTO media_assets(id,organization_id,creator_id,stored_path,thumbnail_path,sha256,mime,byte_size,width,height,name,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(6))',[$id,org(),actor()['id'],$target,$thumb,$hash,$mime,filesize($target),$info[0],$info[1],substr(basename($f['name']),0,255)]);change('assets',$id);audit('media_upload',$id);$pdo->commit();json_out(media_meta(one('SELECT * FROM media_assets WHERE organization_id=? AND id=?',[org(),$id])),201);
}
if(preg_match('#^media/([a-f0-9-]{36})$#',$path,$match)&&$method==='GET'){
 $r=one('SELECT * FROM media_assets WHERE organization_id=? AND id=?',[org(),$match[1]]);if(!$r||!media_allowed($match[1]))fail(404,'Image unavailable');$file=isset($_GET['thumbnail'])&&$r['thumbnail_path']?$r['thumbnail_path']:$r['stored_path'];if(!is_file($file))fail(404,'Image file missing');header('Content-Type: '.(isset($_GET['thumbnail'])&&$r['thumbnail_path']?'image/webp':$r['mime']));header('Content-Disposition: inline');header('Content-Length: '.filesize($file));readfile($file);exit;
}
