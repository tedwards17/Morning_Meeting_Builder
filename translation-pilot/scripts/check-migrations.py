import pathlib,re
files=sorted(pathlib.Path('database/migrations').glob('*.sql'))
assert [int(p.name[:3]) for p in files]==list(range(1,len(files)+1))
for i,p in enumerate(files,1):
 s=p.read_text();assert f'VALUES({i})' in s
 for table in re.findall(r'CREATE TABLE (\w+).*?;',s,re.S):pass
 assert all('ENGINE=InnoDB' in part and 'utf8mb4' in part for part in re.findall(r'CREATE TABLE .*?;',s,re.S))
print(f'{len(files)} numbered InnoDB/utf8mb4 migrations validated')
