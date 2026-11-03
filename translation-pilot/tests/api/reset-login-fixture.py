"""Isolate browser suite login counters in an explicitly disposable HTTP fixture."""
import os,subprocess
assert os.environ.get('MMB_TEST_ALLOW_RESET')=='1'
subprocess.run([os.environ.get('PHP_BIN','php'),'-r',"$c=require getenv('MMB_CONFIG');if(empty($c['test_http']))throw new RuntimeException('Disposable HTTP fixture required');$p=new PDO($c['dsn'],$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);$p->exec('DELETE FROM login_attempts');"],check=True)
