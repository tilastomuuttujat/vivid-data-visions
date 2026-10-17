"""Numerical and source-integrity checks for the municipal screening snapshot."""
import importlib.util
import json
import math
from pathlib import Path
import unittest

PATH = Path(__file__).with_name('build-municipal-correlations.py')
spec = importlib.util.spec_from_file_location('municipal', PATH)
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)
DATA = json.loads((model.ROOT/'src/components/kunnat/municipal-data.json').read_text())

class MunicipalTests(unittest.TestCase):
    def test_adjustments_known_family(self):
        self.assertEqual(model.fdr([.01,.04,.03,.2]), [.04,.05333333333333334,.05333333333333334,.2])
        self.assertTrue(all(by>=bh for bh,by in zip(model.fdr([.001,.02,.8]),model.fdr([.001,.02,.8],True))))
        self.assertEqual(model.fdr([]), [])

    def test_sparse_decoder_respects_order_and_null(self):
        response={'id':['area','year'],'dimension':{'area':{'category':{'index':{'b':1,'a':0}}},'year':{'category':{'index':{'2023':0,'2024':1}}}},'value':{'0':7,'2':0,'3':9}}
        _, values=model.decode(response)
        self.assertEqual(values,{('a','2023'):7,('a','2024'):None,('b','2023'):0,('b','2024'):9})

    def test_pearson_spearman_and_partial_against_reference(self):
        import numpy as np
        from scipy.stats import pearsonr, spearmanr, t
        x=np.arange(40,dtype=float);y=x**2+np.sin(x)*10
        for method,reference in [('pearson',pearsonr),('spearman',spearmanr)]:
            actual=model.statistic(x,y,[],method)
            self.assertAlmostEqual(actual['r'],reference(x,y).statistic,places=6)
        z=np.column_stack([np.sin(x/5),x]);design=np.column_stack([np.ones(40),z])
        a=x+np.cos(x);b=2*x+np.sin(x)
        residual_a=a-design@np.linalg.lstsq(design,a,rcond=None)[0]
        residual_b=b-design@np.linalg.lstsq(design,b,rcond=None)[0]
        expected=pearsonr(residual_a,residual_b).statistic
        actual=model.statistic(a,b,z,'pearson')
        self.assertAlmostEqual(actual['r'],expected,places=6)
        self.assertAlmostEqual(actual['p'],2*t.sf(abs(expected)*math.sqrt(36/(1-expected**2)),36),places=12)
        self.assertIsNone(model.statistic([1]*40,list(range(40)),[],'pearson'))
        self.assertIsNone(model.statistic([1,2],[2,3],[],'spearman'))

    def test_saved_observations_match_source_and_denominators(self):
        records={p.stem:json.loads(p.read_text()) for p in model.SOURCES.glob('*.json')}
        for source in records.values():
            self.assertEqual(source['query']['response']['format'],'json-stat2')
        snap=DATA['snapshots'][0]
        self.assertEqual(len(snap['rows']),308)
        self.assertEqual(len(set(r['id'] for r in snap['rows'])),308)
        dims,values=model.decode(records['keys']['response'])
        def source(area,code):
            return values[tuple(area if d=='Alue' else code if d=='Tiedot' else '2023' for d in dims)]
        for row in snap['rows']:
            self.assertEqual(row['values'][0],source(row['id'],'M411'))
            self.assertAlmostEqual(row['values'][5],source(row['id'],'M303')/source(row['id'],'M411')*1000,places=6)
        self.assertEqual(snap['coverage'][24],292)
        self.assertEqual(DATA['snapshots'][1]['coverage'][12:17],[0]*5)
        self.assertLess(snap['coverage'][21],308) # suppressed income cells remain missing

    def test_saved_family_matches_independent_calculation(self):
        from scipy.stats import spearmanr
        snap=DATA['snapshots'][0]
        family=next(f for f in snap['families'] if f['method']=='spearman' and not f['adjusted'] and not f['mixed'])
        self.assertEqual(family['tests'],276)
        self.assertEqual(len(family['pairs']),276)
        pair=next(p for p in family['pairs'] if p['a']==9 and p['b']==19)
        rows=[r['values'] for r in snap['rows'] if r['values'][9] is not None and r['values'][19] is not None]
        reference=spearmanr([r[9] for r in rows],[r[19] for r in rows])
        self.assertAlmostEqual(pair['r'],reference.statistic,places=6)
        self.assertAlmostEqual(pair['p'],reference.pvalue,places=12)
        self.assertEqual(pair['n'],len(rows))
        for key,arbitrary in [('qBH',False),('qBY',True)]:
            expected=model.fdr([p['p'] for p in family['pairs']],arbitrary)
            self.assertEqual([p[key] for p in family['pairs']],expected)
        for s in DATA['snapshots']:
            for f in s['families']:
                self.assertTrue(all(p['n']>=30 and -1<=p['r']<=1 and 0<=p['p']<=p['qBH']+1e-12<=p['qBY']+1e-12<=1+1e-12 for p in f['pairs']))
                if not f['mixed']:self.assertTrue(all(p['a']!=24 and p['b']!=24 for p in f['pairs']))
                if f['adjusted']:self.assertTrue(all(p['a'] not in [0,1,3] and p['b'] not in [0,1,3] for p in f['pairs']))

if __name__=='__main__':unittest.main()
