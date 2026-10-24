#!/usr/bin/env python3
"""Export the verified database layer through psql; credentials stay in normal PG environment."""
import argparse,json,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2]
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path,required=True);args=parser.parse_args()
    query=(ROOT/'supabase/impact-layer/export.sql').read_text()
    result=subprocess.run(['psql','-X','-v','ON_ERROR_STOP=1','-At','-f','-'],input=query,text=True,capture_output=True,check=True)
    data=json.loads(result.stdout)
    if data['timeline']!={'start':1850,'end':2025} or len(data['themes'])!=32 or len(data['coverage'])!=5632:raise ValueError('Incomplete theme/time domain')
    if len({r['model'] for r in data['runs']})!=3:raise ValueError('Unexpected model set; review export contract')
    for run in data['runs']:
        for point in run['points']:
            if point['status']=='computed':
                if any(point[k] is None for k in ['actual','comparison','effect']):raise ValueError('Computed point lacks values')
                if abs(point['actual']-point['comparison']-point['effect'])>1e-6:raise ValueError('Visual band fails reconciliation')
            elif any(point[k] is not None for k in ['actual','comparison','effect']):raise ValueError('Missing point contains numerical effect')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    temporary=args.output.with_suffix(args.output.suffix+'.tmp');temporary.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');temporary.replace(args.output)
    print(f"Exported release {data['release_id']}: 32 themes, 5632 coverage cells, {len(data['runs'])} model/baseline runs")
if __name__=='__main__':main()
