import contextlib,io,json,unittest
from unittest.mock import patch
from pathlib import Path
import collect_oecd_education as m
RAW=(Path(__file__).resolve().parent/'sources/oecd-education-2026-11-05.csv').read_bytes()
class Tests(unittest.TestCase):
 def test_exact_csv_dimensions_and_receipt(self):
  out=io.StringIO()
  with patch.object(m,'get',return_value=(RAW,{'sha256':'csv'})) as get,contextlib.redirect_stdout(out):m.main()
  v=json.loads(out.getvalue());self.assertEqual(len(v['rows']),48)
  self.assertEqual(v['selectors']['MEASURE'],'POP');self.assertEqual(v['selectors']['STATISTICAL_OPERATION'],'OBS')
  self.assertEqual(v['data_receipt']['sha256'],'csv')
 def test_wrong_population_rejected(self):
  with patch.object(m,'get',return_value=(RAW.replace(b'FIN,_T,Y25T34',b'FIN,M,Y25T34'),{})):
   with self.assertRaises(ValueError):m.main()
