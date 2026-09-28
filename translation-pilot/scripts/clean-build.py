import pathlib,shutil,sys
mode=sys.argv[1]
assert mode in ('demo','hosted')
root=pathlib.Path(__file__).resolve().parents[1]/'build'/mode
if root.exists():shutil.rmtree(root)
