"""Validate an authenticated read-only SQL capture and build the public evidence view.
No credentials, writes to Supabase, or network dependencies. All exports are explicit.
"""
import argparse, hashlib, json, math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]

def require(ok,message):
    if not ok:raise ValueError(message)
def compact(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)
def digest(x):return hashlib.sha256(compact(x).encode()).hexdigest()
def pairs(rows,key,label):
    d={key(r):r for r in rows};require(len(d)==len(rows),'Duplicate '+label);return d
def key(r):return r['series_key'],r['year'],r['group_key']
def close(a,b,label):
    require(isinstance(a,(float,int)) and math.isfinite(a) and math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-8),'Arithmetic mismatch: '+label)

def build(raw):
    compact(raw);require(raw['schemaVersion']==1,'Unsupported capture schema')
    require(raw['projectRef']=='zzbubbrsgiqsvsovkkmf','Unexpected source project')
    require(raw['cases'] and raw['series'] and raw['values'],'Empty source capture')
    series=pairs(raw['series'],lambda s:s['series_key'],'series');values=pairs(raw['values'],key,'observation')
    require(all(s['published'] for s in series.values()),'Unpublished series')
    require(all(v['is_published'] and v['value_kind'] in ['observed','estimate'] for v in values.values()),'Unpublished or projected observation')
    cases=[];episodes=[];records={};used=set();metric_count=0
    for c in raw['cases']:
        require(c['published'],'Unpublished case');d=c['data'];evidence=d['deepened_evidence_20261021'];impl=d['decision_implementation_20261021']
        require(evidence['causal_confirmation'] is False and impl['causal_confirmation'] is False,'Causal claim escalated')
        cases.append({k:c[k] for k in ['id','title','status','revision','updated_at']} | {k:d.get(k) for k in ['summary','alternatives','counterevidence','limits']})
        links={l['episode_code']:l for l in impl['episode_links']}
        for rec in impl['records']:
            require(rec['causal_effect_identified'] is False,'Implementation treated as causal effect')
            enriched=dict(rec,sources=[impl['sources'][sid] for sid in rec['source_ids']])
            for fact in rec['facts']:
                require(fact['source_url']==impl['sources'][fact['source_id']]['url'],'Fact source differs')
                require(fact['is_annual_time_series_observation'] is False,'Implementation snapshot annualized')
                if fact['fact_kind']=='ex_ante_expectation':require(fact['not_realized_observation'],'Expectation treated as actual')
            if rec['id'] in records:require(records[rec['id']]==enriched,'Implementation record differs across cases')
            records[rec['id']]=enriched
        for e in evidence['episodes']:
            require(e['causal_identification'] is False and e['case_id']==c['id'],'Episode identity or causal flag differs')
            for metric in e['metrics']:
                metric_count+=1;skey=metric['series_key'];require(skey in series and series[skey]['frequency'] in ['annual','mixed'],'Annual metric has nonannual source')
                observations=pairs(metric['observations'],lambda r:r['year'],'metric year')
                for o in observations.values():
                    k=(skey,o['year'],metric['group_key']);require(k in values,'Missing live source observation');v=values[k];used.add(k)
                    require(v['period'] in [None,str(o['year'])],'Multiyear observation in annual metric')
                    require(all(v[f]==o[f] for f in ['value','value_kind','validation_status']),'Stored evidence differs from live observation')
                breaks=metric['known_break_years']
                for phase in ['pre','shock','post']:
                    p=metric[phase];start,end=e[phase];rows=[o for y,o in observations.items() if start<=y<=end]
                    missing=sorted(set(range(start,end+1))-set(observations));crosses=any(start<y<=end for y in breaks)
                    require(p['window']==[start,end] and p['n']==len(rows) and p['missing_years']==missing,'Phase coverage differs')
                    status='no_observations' if not rows else 'withheld_method_break' if crosses else 'partial_window_not_full_mean' if missing else 'complete_window'
                    require(p['mean_status']==status,'Phase status differs')
                    if rows and not crosses:close(p['mean'],sum(o['value'] for o in rows)/len(rows),'phase mean')
                    else:require(p['mean'] is None,'Mean fabricated across gap or break')
                for name,target in [('shock_vs_baseline',e['shock'][1]),('followup_vs_baseline',e['post'][1])]:
                    comp=metric[name];baseline=e['shock'][0]-1
                    status='exact_endpoint_missing' if baseline not in observations or target not in observations else 'withheld_method_break' if any(baseline<y<=target for y in breaks) else 'descriptive_comparison'
                    require(comp['status']==status,'Endpoint comparison status differs')
                    if status=='descriptive_comparison':
                        require(comp['baseline_year']==baseline and comp['endpoint_year']==target,'Endpoint shifted')
                        close(comp['absolute_change'],observations[target]['value']-observations[baseline]['value'],'endpoint change')
            for period in e.get('period_evidence',[]):
                require(period['not_annual'] is True and series[period['series_key']]['frequency']=='period','Period evidence annualized')
                for o in period['observations']:
                    k=key(o['source_row']);require(k in values and values[k]['value']==o['value'] and values[k]['period']==o['period'],'Period source differs');used.add(k)
            link=links.get(e['code'],{'record_ids':[],'event_links':[]})
            require(all(rid in records for rid in link['record_ids']),'Missing implementation record')
            episode={k:e[k] for k in ['code','case_id','title','pre','shock','post','selection','metrics','causal_identification','decision_context','followup_right_censored','missing_dimensions']}
            episode.update(limitations=e['limitations'],period_evidence=e.get('period_evidence',[]),implementation_ids=link['record_ids'],implementation_links=link.get('event_links',[]))
            episodes.append(episode)
    pairs(cases,lambda c:c['id'],'case');pairs(episodes,lambda e:e['code'],'episode')
    require(used==set(values),'Unused exported observations')
    counts=dict(cases=len(cases),episodes=len(episodes),comparisons=metric_count,series=len(series),observations=len(values),implementationRecords=len(records),implementationFacts=sum(len(r['facts']) for r in records.values()))
    payload=dict(schemaVersion=1,source=dict(projectRef=raw['projectRef'],capturedAt=raw['capturedAt'],captureSha256=digest(raw),selection='Published cases with deepened_evidence_20261021 and their exact source observations; read-only MVCC snapshot'),counts=counts,cases=cases,episodes=sorted(episodes,key=lambda e:(e['shock'][0],e['code'])),implementationRecords=sorted(records.values(),key=lambda r:r['id']),series=list(series.values()),observations=list(values.values()))
    return dict(payload,integrity=dict(algorithm='sha256',payloadSha256=digest(payload)))

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',required=True,type=Path);p.add_argument('--output',type=Path,default=ROOT/'src/data/murrosmatriisi-evidence.json');a=p.parse_args()
    raw=json.loads(a.input.read_text());out=build(raw);a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(compact(out)+'\n')
    print(json.dumps(out['counts'],ensure_ascii=False));print('Payload SHA-256:',out['integrity']['payloadSha256'])
if __name__=='__main__':main()
