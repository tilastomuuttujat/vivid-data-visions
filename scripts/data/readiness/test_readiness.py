import importlib.util,json,pathlib,unittest
P=pathlib.Path(__file__).with_name('build-readiness.py');S=importlib.util.spec_from_file_location('readiness',P);M=importlib.util.module_from_spec(S);S.loader.exec_module(M)
class ReadinessTests(unittest.TestCase):
 def test_same_group_density_not_pooled(self):
  s={'value_audit':{'numeric_rows':100,'candidate_rows':100},'group_audit':{'dense_candidate_groups':0},'frequency':'annual','published':True,'unit':'%','exact_cell_extra_rows':'0','multirow_groupyears':0}
  self.assertEqual(M.classify(s),'B_sparse_or_frequency_review')
  s['group_audit']['dense_candidate_groups']=1
  self.assertEqual(M.classify(s),'A_curve_candidate')
  s['multirow_groupyears']=1
  self.assertEqual(M.classify(s),'D_cell_review')
 def test_projection_is_not_observed(self):
  s={'value_audit':{'numeric_rows':100,'projection_rows':100,'candidate_rows':0},'group_audit':{},'published':True,'unit':'henkilöä','frequency':'annual'}
  self.assertEqual(M.classify(s),'C_model_or_estimate_review')
 def test_irregular_series_not_dense_annual(self):
  s={'value_audit':{'numeric_rows':20,'candidate_rows':20},'group_audit':{'dense_candidate_groups':1},'published':True,'unit':'%','frequency':'survey_wave'}
  self.assertEqual(M.classify(s),'B_sparse_or_frequency_review')
 def test_mapping_avoids_industry_names_and_mean_word(self):
  self.assertEqual(M.primary({'series_key':'fi.statfin15ab.e1.d','title':'Työlliset — Sähköhuolto'})[0],1)
  self.assertEqual(M.primary({'title':'Tulokymmenysten keskiarvot','theme':'Toimeentulo ja tulonjako'})[0],2)
  self.assertEqual(M.primary({'title':'Yleinen kuolleisuus, jaksokeskiarvot'})[0],4)
 def test_inventory_reconciles_and_no_composite_approval(self):
  out=P.parents[3]/'docs/data-readiness';s=json.loads((out/'summary.json').read_text());r=json.loads((out/'series-ledger.json').read_text())
  self.assertEqual(len(r),1609);self.assertEqual(sum(s['classes'].values()),len(r));self.assertEqual(sum(b['series'] for b in s['blocks'])+s['unmapped_series'],len(r))
  self.assertEqual(sum(x['value_audit']['value_rows'] for x in r),596464)
  self.assertFalse(any(x['eligible_for_composite'] for x in r));self.assertEqual(s['finance_totals']['value_rows'],970849)
if __name__=='__main__':unittest.main()
