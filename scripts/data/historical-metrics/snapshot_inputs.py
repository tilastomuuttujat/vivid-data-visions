"""Restore only missing JSON audit inputs from the repository's frozen archive."""
import pathlib,tarfile

def ensure_snapshot_inputs(root):
 root=pathlib.Path(root);archive=root/'snapshot-inputs.tar.gz'
 if not archive.exists():return
 with tarfile.open(archive,'r:gz') as t:
  for member in t.getmembers():
   if not member.isfile() or pathlib.PurePosixPath(member.name).name!=member.name or not member.name.endswith('.json'):raise ValueError('Unsafe snapshot archive member')
   target=root/member.name
   if not target.exists():target.write_bytes(t.extractfile(member).read())
