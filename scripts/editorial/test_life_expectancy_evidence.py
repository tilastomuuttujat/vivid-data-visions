import unittest,json
from test_period_analysis import Local
from life_expectancy_evidence import reference,store,check
class Tests(unittest.TestCase):
 def test_periods_not_point_years(self):
  r,p=reference();self.assertFalse(r['annual_series']);self.assertEqual(r['periods']['1851'],[1851,1860]);self.assertEqual(r['periods']['1946'],[1946,1950]);self.assertEqual(len(json.loads(p)['data']),30)
 def test_soldier_death_definitions_kept(self):
  r,_=reference();self.assertTrue(r['coverage_change_notes']['1911-1920'].startswith('Includes'));self.assertTrue(r['coverage_change_notes']['1941-1945'].startswith('Excludes'))
 def test_idempotent_original_article_unchanged(self):
  db=Local();before=db.execute('SELECT * FROM editorial__articles');store(db);store(db);check(db);self.assertEqual(db.execute('SELECT * FROM editorial__articles'),before);self.assertEqual(len(db.execute('SELECT * FROM editorial__life_expectancy_source_snapshots')),1)
 def test_changed_snapshot_rejected(self):
  db=Local();store(db);db.execute("UPDATE editorial__life_expectancy_source_snapshots SET review_json='{}'")
  with self.assertRaises(ValueError):store(db)
