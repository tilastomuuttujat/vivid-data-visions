"""Capture 33 OWID chart sources for the 35-series Finland inventory.

Run once for a new snapshot; --refresh explicitly replaces local snapshots.
Preserves all Finland source years in CSV; the builder enforces 1850–2025.
"""
import concurrent.futures, csv, datetime, hashlib, io, json, pathlib, sys, urllib.request
R = pathlib.Path(__file__).resolve().parent
SLUGS = '''population population-density life-expectancy child-mortality maternal-mortality average-height-of-men average-height-of-women average-height-of-men-for-selected-countries gdp-per-capita-maddison-project-database gdp-maddison-project-database historical-gov-spending-gdp mean-years-of-schooling-long-run population-having-attained-at-least-basic-education primary-enrollment-selected-countries share-of-the-population-with-completed-tertiary-education urbanization-last-500-years land-use-over-the-long-term suffrage electoral-democracy liberal-democracy political-regime civil-liberties freedom-of-expression freedom-of-association women-civil-liberties-index political-corruption-index public-sector-corruption-index annual-co2-emissions-per-country annual-co2-coal annual-co2-oil annual-co2-gas cumulative-co-emissions share-of-cumulative-co2'''.split()
def sha(b): return hashlib.sha256(b).hexdigest()
def capture(slug):
    folder=R/'sources'; folder.mkdir(exist_ok=True)
    receipt=folder/(slug+'.receipt.json')
    if receipt.exists() and '--refresh' not in sys.argv:
        return {'slug':slug,'status':'cached'}
    files={}; headers={}
    for ext in ('csv','metadata.json'):
        url=f'https://ourworldindata.org/grapher/{slug}.{ext}?country=~FIN'
        req=urllib.request.Request(url,headers={'User-Agent':'Our World In Data data fetch/1.0'})
        with urllib.request.urlopen(req,timeout=35) as response:
            body=response.read(); headers[ext]={'requested_url':url,'resolved_url':response.url,'etag':response.headers.get('ETag'),'last_modified':response.headers.get('Last-Modified'),'download_sha256':sha(body)}
        if ext=='csv':
            reader=csv.DictReader(io.StringIO(body.decode('utf-8-sig')))
            rows=[r for r in reader if r.get('Code')=='FIN']
            if not rows: raise ValueError('No Finland rows: '+slug)
            out=io.StringIO(newline=''); w=csv.DictWriter(out,fieldnames=reader.fieldnames,lineterminator='\n');w.writeheader();w.writerows(rows)
            stored=out.getvalue().encode()
            files[ext]={'stored_sha256':sha(stored),'scope':'Finland rows, all available source years, original numeric strings','rows':len(rows)}
        else:
            json.loads(body);stored=body;files[ext]={'stored_sha256':sha(stored),'scope':'Full chart metadata response'}
        (folder/(slug+'.'+ext)).write_bytes(stored)
    receipt.write_text(json.dumps({'slug':slug,'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'requests':headers,'files':files},ensure_ascii=False,indent=2)+'\n')
    return {'slug':slug,'status':'saved','rows':files['csv']['rows']}
if __name__=='__main__':
    failed=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        fs={pool.submit(capture,s):s for s in SLUGS}
        for f in concurrent.futures.as_completed(fs):
            try: print(json.dumps(f.result()),flush=True)
            except Exception as e: failed.append(fs[f]);print(json.dumps({'slug':fs[f],'error':str(e)}),flush=True)
    if failed: sys.exit('Uncaptured sources: '+', '.join(failed))
