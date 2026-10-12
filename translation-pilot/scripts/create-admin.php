<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
// Outputs SQL only. No password is accepted as a command-line argument.
require __DIR__.'/../api/src/core.php';
fwrite(STDERR,"First administrator username: ");$name=trim(fgets(STDIN));
if(!$name||strlen($name)>190)throw new RuntimeException('Invalid username');
fwrite(STDERR,"Password (12+ characters, input hidden on Unix): ");$tty=function_exists('shell_exec')&&DIRECTORY_SEPARATOR==='/';if($tty)shell_exec('stty -echo');try{$password=rtrim(fgets(STDIN),"\r\n");}finally{if($tty)shell_exec('stty echo');fwrite(STDERR,"\n");}
if(strlen($password)<12)throw new RuntimeException('Use at least 12 characters');
$hash=password_hash($password,PASSWORD_DEFAULT);$password='';$id=uuid();
// Hex SQL literals avoid SQL-mode/escaping ambiguities in phpMyAdmin.
$literal=fn($s)=>"CONVERT(0x".bin2hex($s)." USING utf8mb4)";
echo "-- Import once after migrations and DTB seed. Delete this SQL after use.\nINSERT INTO accounts(id,organization_id,username,password_hash,category,role,can_create_templates,enabled) VALUES (".$literal($id).",'d7b00000-0000-4000-8000-000000000001',".$literal($name).",".$literal($hash).",'individual','administrator',1,1);\n";
