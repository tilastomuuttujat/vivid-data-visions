import copy,json,sqlite3,unittest
from pathlib import Path
from unittest.mock import patch
from articles import canonical,digest
from reconcile_oecd_education import load_reference,compare,apply,META,FIELDS
class DB:
 def __init__(self):self.db=sqlite3.connect(':memory:',isolation_level=None);self.db.row_factory=sqlite3.Row
 def execute(self,sql,args=()):return [dict(r) for r in self.db.execute(sql,args).fetchall()]
class Tests(unittest.TestCase):
 def fixture(self):
  receipt,ref=load_reference();db=DB()
  db.execute('CREATE TABLE public__indicator_series('+','.join(k+(' INTEGER' if k in ('published','start_year','end_year') else ' TEXT') for k in META.split(','))+')')
  db.execute('CREATE TABLE public__indicator_values('+','.join(k+(' INTEGER' if k in ('year','is_published') else ' TEXT') for k in FIELDS.split(','))+')')
  db.execute('CREATE TABLE editorial__evidence_series_reviews(version TEXT,series_key TEXT,payload_json TEXT,PRIMARY KEY(version,series_key))')
  specs=[]
  for level,key in [('ISCED11A_0T2','below'),('ISCED11A_5T8','tertiary')]:
   m=dict.fromkeys(META.split(','));m.update(series_key=key,title='Education',published=1)
   db.execute('INSERT INTO public__indicator_series VALUES('+','.join('?' for _ in m)+')',list(m.values()))
   for q in ref:
    if q['ATTAINMENT_LEV']!=level:continue
    r=dict.fromkeys(FIELDS.split(','));r.update(series_key=key,year=int(q['TIME_PERIOD']),group_key='FI',value=q['OBS_VALUE'],value_kind='estimate' if key=='tertiary' else 'observed')
    db.execute('INSERT INTO public__indicator_values VALUES('+','.join('?' for _ in r)+')',list(r.values()))
   rows=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key=? ORDER BY series_key,year,group_key',[key])
   specs.append(dict(series_key=key,attainment_level=level,expected_metadata_sha256=digest(canonical(m)),expected_rows_sha256=digest(canonical(rows)),expected_rows=24,group_key='FI',target_years=[2000,2025]))
  return db,dict(version='test-direct',base_quality_version='test-profile',series=specs),receipt,ref
 def test_exact_matches_preserve_gaps_flags_and_original_kind(self):
  db,b,receipt,ref=self.fixture();before=db.execute('SELECT * FROM public__indicator_values')
  a=apply(db,b,receipt,ref);self.assertEqual(a,apply(db,b,receipt,ref))
  self.assertEqual(db.execute('SELECT * FROM public__indicator_values'),before)
  self.assertEqual(len(a[1]),48);self.assertTrue(all(r['missing_years']==[2001,2002] for r in a[2]))
  self.assertEqual(sum(r['is_series_break'] for r in a[1]),2)
  self.assertEqual(sum(r['original_value_kind']=='estimate' for r in a[1]),24)
 def test_differing_source_decimal_fails(self):
  db,b,receipt,ref=self.fixture();ref=copy.deepcopy(ref);ref[0]['OBS_VALUE']=str(float(ref[0]['OBS_VALUE'])+0.000001)
  with self.assertRaises(ValueError):apply(db,b,receipt,ref)
 def test_changed_migrated_row_fails(self):
  db,b,receipt,ref=self.fixture();db.execute("UPDATE public__indicator_values SET value='99' WHERE series_key='below' AND year=2000")
  with self.assertRaises(ValueError):apply(db,b,receipt,ref)
 def test_source_bytes_must_match_receipt(self):
  with patch.object(Path,'read_bytes',return_value=b'changed'):
   with self.assertRaises(ValueError):load_reference()
