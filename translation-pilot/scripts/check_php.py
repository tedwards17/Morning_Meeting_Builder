import os,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
php=os.environ.get('PHP_BIN','php')
files=sorted(root.glob('api/**/*.php'))+sorted(root.glob('translation-api/*.php'))+sorted(root.glob('scripts/*.php'))+sorted(root.glob('tests/api/*.php'))
for file in files:subprocess.run([php,'-l',str(file)],check=True)
print(f'PHP syntax: {len(files)} files passed')
