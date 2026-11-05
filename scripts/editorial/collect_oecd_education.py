"""Fetch original OECD SDMX metadata and CSV for an exact attainment review."""
import csv,io,json,hashlib,urllib.request,urllib.parse,xml.etree.ElementTree as ET
from datetime import datetime,timezone
BASE='https://sdmx.oecd.org/public/rest/v1/'
FLOW='OECD.EDU.IMEP,DSD_EAG_LSO_EA@DF_LSO_NEAC_DISTR_EA,1.0'
def get(url,accept):
    req=urllib.request.Request(url,headers={'Accept':accept,'User-Agent':'AtlasSourceReview/1.0'})
    with urllib.request.urlopen(req,timeout=90) as r:
        if urllib.parse.urlparse(r.url).hostname!='sdmx.oecd.org':raise ValueError('Unexpected OECD redirect host')
        body=r.read(16000000)
        if len(body)>=16000000:raise ValueError('Source response too large')
        return body,dict(url=url,final_url=r.url,retrieved_at=datetime.now(timezone.utc).isoformat(),sha256=hashlib.sha256(body).hexdigest(),bytes=len(body),content_type=r.headers.get('Content-Type'))
def main():
    url=BASE+'dataflow/OECD.EDU.IMEP/DSD_EAG_LSO_EA@DF_LSO_NEAC_DISTR_EA/1.0?references=all'
    body,meta=get(url,'application/vnd.sdmx.structure+xml;version=2.1')
    root=ET.fromstring(body);ns={'s':'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure'}
    lists=root.findall('.//s:DataStructureComponents/s:DimensionList',ns)
    if len(lists)!=1:raise ValueError('Ambiguous OECD data structure')
    dims=sorted([d for d in lists[0] if d.tag.endswith('}Dimension')],key=lambda d:int(d.attrib['position']))
    ids=[d.attrib['id'] for d in dims]
    selectors={'REF_AREA':'FIN','SEX':'_T','AGE':'Y25T34','ATTAINMENT_LEV':'ISCED11A_0T2+ISCED11A_5T8','MEASURE':'OBS','FREQ':'A'}
    if not {'REF_AREA','SEX','AGE','ATTAINMENT_LEV'}<=set(ids):raise ValueError('Unexpected education dimensions')
    key='.'.join(selectors.get(k,'') for k in ids)
    url=BASE+'data/'+FLOW+'/'+key+'?startPeriod=2000&endPeriod=2025&format=csvfile'
    body,data=get(url,'text/csv')
    text=body.decode('utf-8-sig');reader=csv.DictReader(io.StringIO(text));rows=list(reader)
    if not rows or not {'REF_AREA','SEX','AGE','ATTAINMENT_LEV','TIME_PERIOD','OBS_VALUE'}<=set(reader.fieldnames or []):raise ValueError('Unexpected OECD CSV structure')
    if any(r['REF_AREA']!='FIN' or r['SEX']!='_T' or r['AGE']!='Y25T34' or r['ATTAINMENT_LEV'] not in ('ISCED11A_0T2','ISCED11A_5T8') for r in rows):raise ValueError('OECD selection mismatch')
    print(json.dumps(dict(source='OECD official SDMX',structure_receipt=meta,data_receipt=data,dimensions=ids,selectors=selectors,columns=reader.fieldnames,rows=rows),ensure_ascii=False))
if __name__=='__main__':main()
