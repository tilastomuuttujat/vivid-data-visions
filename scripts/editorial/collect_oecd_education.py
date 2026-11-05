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
    selectors={'REF_AREA':'FIN','SEX':'_T','AGE':'Y25T34','ATTAINMENT_LEV':'ISCED11A_0T2+ISCED11A_5T8','EDUCATION_FIELD':'_T','MEASURE':'POP','INCOME':'_Z','BIRTH_PLACE':'_T','MIGRATION_AGE':'_Z','EDU_STATUS':'ED_NED','LABOUR_FORCE_STATUS':'POP','DURATION_UNEMP':'_Z','UNIT_MEASURE':'PT_POP_SEX_AGE','STATISTICAL_OPERATION':'OBS','WORK_TIME_ARNGMNT':'_Z','QUESTIONNAIRE':'NEAC','FREQ':'A'}
    # Column identities come from the original official CSV, not guessed positions.
    ids=list(selectors);key='.'.join(selectors[k] for k in ids)
    url=BASE+'data/'+FLOW+'/'+key+'?startPeriod=2000&endPeriod=2025&format=csvfile'
    body,data=get(url,'text/csv')
    reader=csv.DictReader(io.StringIO(body.decode('utf-8-sig')));rows=list(reader)
    if not rows or not set(ids+['TIME_PERIOD','OBS_VALUE','OBS_STATUS','UNIT_MULT'])<=set(reader.fieldnames or []):raise ValueError('Unexpected OECD CSV structure')
    expected_flow='OECD.EDU.IMEP:DSD_EAG_LSO_EA@DF_LSO_NEAC_DISTR_EA(1.0)'
    for r in rows:
        if r.get('DATAFLOW')!=expected_flow or r['UNIT_MULT']!='0':raise ValueError('OECD flow or unit multiplier mismatch')
        if any(r[k] not in selectors[k].split('+') for k in ids):raise ValueError('OECD selection mismatch')
    meta={'schema_basis':'Official CSV dimensions and population/unit/measure filters checked; XML metadata endpoint not used.'}
    print(json.dumps(dict(source='OECD official SDMX',structure_receipt=meta,data_receipt=data,dimensions=ids,selectors=selectors,columns=reader.fieldnames,rows=rows),ensure_ascii=False))
if __name__=='__main__':main()
