import copy,json,sqlite3,unittest
from pathlib import Path
from articles import canonical,digest
from historical_school_review import apply,validate,match_cells,META,FIELDS
class DB:
 def __init__(self):self.db=sqlite3.connect(':memory:',isolation_level=None);self.db.row_factory=sqlite3.Row
 def execute(self,sql,args=()):return [dict(r) for r in self.db.execute(sql,args).fetchall()]
class Tests(unittest.TestCase):
 def data(self):
  b=json.loads((Path(__file__).parent/'historical-school-review.json').read_text());db=DB()
  for table,cols in [('public__indicator_series',META),('public__indicator_values',FIELDS)]:
   db.execute('CREATE TABLE '+table+'('+','.join(k+(' INTEGER' if k in ('year','published','is_published','start_year','end_year') else ' TEXT') for k in cols.split(','))+')')
  db.execute('CREATE TABLE editorial__evidence_series_reviews(version TEXT,series_key TEXT,payload_json TEXT,PRIMARY KEY(version,series_key))')
  for r in b['reviews']:
   m=dict.fromkeys(META.split(','));m.update(series_key=r['series_key'],title='Old title')
   db.execute('INSERT INTO public__indicator_series VALUES('+','.join('?' for _ in m)+')',list(m.values()))
   rr=[]
   for c in b['cells']:
    if c['series_key']!=r['series_key']:continue
    v=dict.fromkeys(FIELDS.split(','));v.update(series_key=c['series_key'],year=c['year'],group_key=c['group_key'],value=c['value'],period=c['period'])
    db.execute('INSERT INTO public__indicator_values VALUES('+','.join('?' for _ in v)+')',list(v.values()))
   rr=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key=? ORDER BY series_key,year,group_key',[r['series_key']]);r['expected_metadata_sha256']=digest(canonical(m));r['expected_rows_sha256']=digest(canonical(rr))
  return db,b
 def test_exact_readback_idempotence_and_original_title_preserved(self):
  db,b=self.data();before=db.execute('SELECT * FROM public__indicator_series');apply(db,b);apply(db,b)
  self.assertEqual(db.execute('SELECT * FROM public__indicator_series'),before)
  self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__historical_school_verified')[0]['n'],17)
  self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__historical_school_verified WHERE original_title_rejected=1')[0]['n'],10)
 def test_changed_value_or_period_fails(self):
  for field,value in [('value','99'),('period','1937')]:
   db,b=self.data();db.execute('UPDATE public__indicator_values SET '+field+'=? WHERE year=1937',[value])
   with self.assertRaises(ValueError):apply(db,b)
 def test_wrong_unit_and_unrejected_old_title_fail(self):
  db,b=self.data();b['cells'][0]['unit']='percent'
  with self.assertRaises(ValueError):validate(b)
  db,b=self.data();b['reviews'][0]['original_title_rejected']=False
  with self.assertRaises(ValueError):validate(b)
