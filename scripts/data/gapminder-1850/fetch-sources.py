"""Re-fetch immutable source commits and preserve Finland-only raw CSV strings."""
import csv,hashlib,io,json,pathlib,urllib.request
R=pathlib.Path(__file__).resolve().parent;man=json.loads((R/'source-manifest.json').read_text())
for s in man['sources']:
 raw=urllib.request.urlopen(s['raw_url'],timeout=40).read()
 if s.get('git_blob_sha'):
  got=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
  if got!=s['git_blob_sha']:raise ValueError('Git blob mismatch: '+s['id'])
 lines=raw.decode('utf-8').strip().splitlines();result='\n'.join([lines[0]]+[l for l in lines[1:] if l.startswith('fin,')])+'\n'
 target=R/(s['id']+'-fi.csv')
 if target.exists() and target.read_text()!=result:raise ValueError('Pinned Finland subset changed: '+s['id'])
 target.write_text(result)
 print(s['id'],hashlib.sha256(target.read_bytes()).hexdigest())
