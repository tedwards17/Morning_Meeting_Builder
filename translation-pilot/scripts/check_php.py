import os,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
php=os.environ.get('PHP_BIN','php')
files=sorted(root.glob('server-paths.example.php'))+sorted(root.glob('api/**/*.php'))+sorted(root.glob('translation-api/*.php'))+sorted(root.glob('scripts/*.php'))+sorted(root.glob('tests/api/*.php'))
for file in files:
 args=[php,'-l',str(file)]
 if file.name=='translation-mock-router.php':args=[php,'-d','disable_functions=curl_init,curl_setopt_array,curl_exec,curl_getinfo,curl_close','-l',str(file)]
 subprocess.run(args,check=True)
print(f'PHP syntax: {len(files)} files passed')
