import contextlib,io,json,unittest
from unittest.mock import patch
import collect_oecd_education as m
XML=b'''<R xmlns:s="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure"><s:DataStructureComponents><s:DimensionList><s:Dimension id="REF_AREA" position="1"/><s:Dimension id="SEX" position="2"/><s:Dimension id="AGE" position="3"/><s:Dimension id="ATTAINMENT_LEV" position="4"/><s:TimeDimension id="TIME_PERIOD" position="5"/></s:DimensionList></s:DataStructureComponents></R>'''
class Tests(unittest.TestCase):
 def responses(self,sex='_T'):
  return [(XML,{'sha256':'xml'}),(('REF_AREA,SEX,AGE,ATTAINMENT_LEV,TIME_PERIOD,OBS_VALUE\nFIN,'+sex+',Y25T34,ISCED11A_5T8,2024,38.96\n').encode(),{'sha256':'csv'})]
 def test_exact_dimensions_and_receipts(self):
  out=io.StringIO()
  with patch.object(m,'get',side_effect=self.responses()) as get,contextlib.redirect_stdout(out):m.main()
  v=json.loads(out.getvalue());self.assertEqual(v['dimensions'],['REF_AREA','SEX','AGE','ATTAINMENT_LEV'])
  self.assertEqual(v['rows'][0]['OBS_VALUE'],'38.96');self.assertEqual(v['data_receipt']['sha256'],'csv')
  self.assertIn('FIN._T.Y25T34.ISCED11A_0T2+ISCED11A_5T8',get.call_args_list[1].args[0])
 def test_wrong_population_rejected(self):
  with patch.object(m,'get',side_effect=self.responses('M')):
   with self.assertRaises(ValueError):m.main()
