<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$file=$argv[1]??getenv('MMB_CONFIG');if(!$file||!is_file($file)){fwrite(STDERR,"Usage: php scripts/migrate.php /private/config.php\n");exit(1);}
$c=require $file;$pdo=new PDO($c['dsn'],$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$lock=$pdo->query("SELECT GET_LOCK('mmb_migrations',10)")->fetchColumn();if(!$lock)throw new RuntimeException('Another migration is running');
try{$versions=$pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);}catch(PDOException){$versions=[];}
foreach(glob(__DIR__.'/../database/migrations/*.sql') as $file){$version=(int)basename($file);if(in_array($version,$versions))continue;echo 'Applying '.basename($file)."\n";$sql=file_get_contents($file);foreach(explode(';',$sql) as $statement)if(trim($statement)!=='')$pdo->exec($statement);}
$pdo->query("SELECT RELEASE_LOCK('mmb_migrations')");echo "Migrations complete\n";
