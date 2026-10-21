import copy, hashlib, importlib.util, json, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SPEC=importlib.util.spec_from_file_location('exporter',Path(__file__).with_name('import-murrosmatriisi-evidence.py'))
m=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(m)

def fixture():
    observations=[dict(year=y,value=v,value_kind='observed',validation_status='source_checked') for y,v in [(2018,10),(2019,8),(2020,12)]]
    metric=dict(series_key='test',group_key='FI',observations=observations,known_break_years=[],shock_vs_baseline=dict(status='descriptive_comparison',baseline_year=2018,endpoint_year=2019,absolute_change=-2),followup_vs_baseline=dict(status='descriptive_comparison',baseline_year=2018,endpoint_year=2020,absolute_change=2))
    for phase,y,v in [('pre',2018,10),('shock',2019,8),('post',2020,12)]:metric[phase]=dict(window=[y,y],n=1,mean=v,mean_status='complete_window',missing_years=[])
    episode=dict(code='test',case_id='case',title='Synthetic',pre=[2018,2018],shock=[2019,2019],post=[2020,2020],selection='Synthetic test',metrics=[metric],causal_identification=False,decision_context=[],followup_right_censored=False,missing_dimensions=[],limitations=[])
    fact=dict(id='forecast',source_id='source',source_url='https://example.org',is_annual_time_series_observation=False,fact_kind='ex_ante_expectation',not_realized_observation=True)
    record=dict(id='implementation',causal_effect_identified=False,source_ids=['source'],facts=[fact])
    case=dict(id='case',title='Synthetic',status='hypothesis',revision=1,published=True,updated_at='2026-10-21',data=dict(summary='',alternatives='',counterevidence='',limits='',deepened_evidence_20261021=dict(causal_confirmation=False,episodes=[episode]),decision_implementation_20261021=dict(causal_confirmation=False,episode_links=[dict(episode_code='test',record_ids=['implementation'])],records=[record],sources=dict(source=dict(url='https://example.org')))))
    values=[dict(o,series_key='test',group_key='FI',period=None,is_published=True) for o in observations]
    return dict(schemaVersion=1,projectRef='zzbubbrsgiqsvsovkkmf',capturedAt='2026-10-21T00:00:00Z',cases=[case],series=[dict(series_key='test',frequency='annual',published=True)],values=values)

class ImportValidation(unittest.TestCase):
    def test_valid_capture_is_deterministic(self):
        a=m.build(fixture());self.assertEqual(a,m.build(fixture()));self.assertEqual(a['counts']['observations'],3)
    def test_unpublished_records_fail_closed(self):
        for collection,field in [('cases','published'),('series','published'),('values','is_published')]:
            raw=fixture();raw[collection][0][field]=False
            with self.assertRaisesRegex(ValueError,'Unpublished'):m.build(raw)
    def test_changed_source_or_missing_reference_is_rejected(self):
        raw=fixture();raw['values'][0]['value']=999
        with self.assertRaisesRegex(ValueError,'differs from live'):m.build(raw)
        raw=fixture();raw['values'].pop()
        with self.assertRaisesRegex(ValueError,'Missing live'):m.build(raw)
    def test_incorrect_mean_and_endpoint_are_rejected(self):
        for field in ['pre','followup_vs_baseline']:
            raw=fixture();metric=raw['cases'][0]['data']['deepened_evidence_20261021']['episodes'][0]['metrics'][0]
            metric[field]['mean' if field=='pre' else 'absolute_change']=999
            with self.assertRaisesRegex(ValueError,'Arithmetic mismatch'):m.build(raw)
    def test_multiyear_value_cannot_enter_annual_chart(self):
        raw=fixture();raw['series'][0]['frequency']='mixed';raw['values'][0]['period']='2016–2018'
        with self.assertRaisesRegex(ValueError,'Multiyear'):m.build(raw)
    def test_forecast_and_causal_escalation_are_rejected(self):
        raw=fixture();raw['cases'][0]['data']['decision_implementation_20261021']['records'][0]['facts'][0]['not_realized_observation']=False
        with self.assertRaisesRegex(ValueError,'Expectation'):m.build(raw)
        raw=fixture();raw['cases'][0]['data']['deepened_evidence_20261021']['causal_confirmation']=True
        with self.assertRaisesRegex(ValueError,'Causal'):m.build(raw)
    def test_duplicate_keys_are_rejected(self):
        raw=fixture();raw['values'].append(copy.deepcopy(raw['values'][0]))
        with self.assertRaisesRegex(ValueError,'Duplicate observation'):m.build(raw)
    def test_checked_in_public_payload_hash_and_totals(self):
        data=json.loads((ROOT/'src/data/murrosmatriisi-evidence.json').read_text());integrity=data.pop('integrity')
        self.assertEqual(m.digest(data),integrity['payloadSha256'])
        self.assertEqual(data['counts'],dict(cases=8,episodes=9,comparisons=73,series=23,observations=595,implementationRecords=15,implementationFacts=33))
        self.assertEqual(len(data['observations']),595)

if __name__=='__main__':unittest.main()
