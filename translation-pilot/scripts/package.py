from pathlib import Path
import shutil,zipfile,hashlib,re,json,subprocess
root=Path(__file__).resolve().parents[1]
deploy=root/'deploy';out=root/'artifacts';out.mkdir(exist_ok=True)
if deploy.exists():shutil.rmtree(deploy)
public=deploy/'public_html';shutil.copytree(root/'build/hosted',public)
shutil.copytree(root/'api',public/'api',ignore=shutil.ignore_patterns('config.example.php'))
shutil.copyfile(root/'scripts/public.htaccess',public/'.htaccess')
(deploy/'private').mkdir();shutil.copyfile(root/'api/config.example.php',deploy/'private/config.example.php')
shutil.copytree(root/'database',deploy/'database');shutil.copytree(root/'docs',deploy/'docs')
(deploy/'scripts').mkdir()
for name in ['migrate.php','create-admin.php','bootstrap-admin.php']:shutil.copyfile(root/'scripts'/name,deploy/'scripts'/name)
# CLI password tool depends on core.php; keep private copy outside public tree too.
(deploy/'api/src').mkdir(parents=True);shutil.copyfile(root/'api/src/core.php',deploy/'api/src/core.php')
(deploy/'README.txt').write_text('Upload ONLY the contents of public_html to the domain document root. Place private/config.example.php outside that root as config.php after editing it. Read docs/CPANEL_SETUP.md first. Database and scripts directories are private setup materials, not web content.\n')
def validate(folder):
 html=(folder/'index.html').read_text()
 for url in re.findall(r'(?:src|href)="([^"]+)"',html):
  assert not url.startswith('/'),f'Absolute asset path: {url}'
  assert (folder/url).is_file(),f'Missing asset {url}'
 manifest=json.loads((folder/'manifest.webmanifest').read_text());assert manifest['start_url']=='./'
 for icon in manifest['icons']:assert (folder/icon['src']).is_file()
 assert (folder/'sw.js').is_file()
 subprocess.run(['node','--check',str(folder/'sw.js')],check=True)
 for js in (folder/'assets').glob('*.js'):
  for ref in re.findall(r'''["'](\./[^"']+\.js)["']''',js.read_text()):
   assert (js.parent/ref).is_file(),f'Missing dynamic asset {ref}'
 for p in folder.rglob('*'):
  assert p.name not in ['node_modules','config.php','.env'],p
 for p in (folder/'assets').iterdir():assert p.suffix in ['.js','.css'],p
 return len(list(folder.rglob('*')))
print('Hosted package paths valid:',validate(public));print('Demo package paths valid:',validate(root/'build/demo'))
def zip_tree(destination,folder,exclude=()):
 with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in sorted(folder.rglob('*')):
   rel=p.relative_to(folder)
   if not p.is_file() or any(part in exclude for part in rel.parts):continue
   info=zipfile.ZipInfo(rel.as_posix(),date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,p.read_bytes(),compresslevel=9)
zip_tree(out/'morning-meeting-builder-cpanel.zip',deploy)
zip_tree(out/'morning-meeting-builder-github-pages-demo.zip',root/'build/demo')
zip_tree(out/'morning-meeting-builder-source.zip',root,('node_modules','.git','build','deploy','artifacts','test-results','__pycache__'))
zip_tree(out/'morning-meeting-builder-migrations.zip',root/'database')
manifest={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(out.glob('*.zip'))}
(out/'SHA256SUMS.txt').write_text(''.join(f"{v['sha256']}  {k}\n" for k,v in manifest.items()))
print(json.dumps(manifest,indent=2))
