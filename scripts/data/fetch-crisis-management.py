"""Annual bankruptcy applications, not bankruptcies completed or jobs lost."""
import urllib.request,json,pathlib,hashlib,datetime
u='https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/kony/13fj.px'
q=[{'code':'timeperiod_y','selection':{'filter':'item','values':[str(y) for y in range(1986,2025)]}},{'code':'contentscode','selection':{'filter':'item','values':['kylkm']}}]
raw=urllib.request.urlopen(urllib.request.Request(u,data=json.dumps({'query':q,'response':{'format':'json'}}).encode(),headers={'Content-Type':'application/json'}),timeout=90).read();a=json.loads(raw)
points=[{'year':int(r['key'][0]),'applications':None if r['values'][0] in ['.','..','...',''] else int(r['values'][0])} for r in a['data']]
assert len(points)==39
out={'retrieved':datetime.date.today().isoformat(),'source':{'url':u,'query':q,'sha256':hashlib.sha256(raw).hexdigest(),'metadata':a.get('metadata',[])},'points':points}
root=pathlib.Path(__file__).resolve().parents[2];(root/'src/components/planeetta/crisis-outcomes-data.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n');print(points[-1])
