"""Build the measured background for the 'Tuottavuus vs. työttömyyden hinta' debate.

Sources (Tilastokeskus StatFin):
- productivity = real GDP / hours worked, from the existing 15ai snapshot
  (src/components/erotus-tuotanto/production-data.json)
- social benefits in cash (S13 D62K) and general government net lending (B9 % GDP)
  from src/data/research/fiscal-inputs.json (15ah)
- nominal GDP (B1GMH, current prices) fetched live from 15a9

Output: src/components/erotus/sopeutus-measured.json. Accounting values only; no causal claim.
"""
import json, urllib.request, datetime

PROD = "src/components/erotus-tuotanto/production-data.json"
FISC = "src/data/research/fiscal-inputs.json"
OUT = "src/components/erotus/sopeutus-measured.json"
URL = "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/15a9.px"

years = [str(y) for y in range(1975, 2026)]
query = {"query": [
    {"code": "taloustoimi_1_20180101", "selection": {"filter": "item", "values": ["B1GMH"]}},
    {"code": "timeperiod_y", "selection": {"filter": "item", "values": years}},
    {"code": "contentscode", "selection": {"filter": "item", "values": ["ntp-cp"]}},
], "response": {"format": "json-stat2"}}
req = urllib.request.Request(URL, json.dumps(query).encode(), {"Content-Type": "application/json"})
js = json.load(urllib.request.urlopen(req))
gdp_nom = dict(zip(years, js["value"]))

prod = {str(p["year"]): p["gdp"] / p["hours"] for p in json.load(open(PROD))["points"]}
fisc = json.load(open(FISC))["observations"]
pick = lambda key: {str(o["year"]): o["value"] for o in fisc if o["series_key"] == key}
d62 = pick("statfin15ah.v20260918.s13.d62k.eur_m")
b9 = pick("statfin15ah.v20260918.s13.b9.gdp_pct")

base = prod["1975"]
rows = []
for y in years:
    if y not in prod or y not in d62 or gdp_nom.get(y) in (None, 0):
        continue
    rows.append({
        "year": int(y),
        "productivity_index": round(prod[y] / base * 100, 1),
        "benefits_pct_gdp": round(d62[y] / gdp_nom[y] * 100, 2),
        "net_lending_pct_gdp": b9.get(y),
    })

json.dump({
    "retrieved": datetime.date.today().isoformat(),
    "sources": [
        "Tilastokeskus 15ai (BKT 2015 hinnoin, tehdyt työtunnit)",
        "Tilastokeskus 15ah (S13 D62K sosiaalietuudet rahana, B9 nettoluotonanto % BKT)",
        "Tilastokeskus 15a9 (BKT käyvin hinnoin)",
    ],
    "units": {
        "productivity_index": "BKT per tehty työtunti, 1975 = 100",
        "benefits_pct_gdp": "julkisyhteisöjen sosiaalietuudet rahana, % BKT:sta",
        "net_lending_pct_gdp": "julkisyhteisöjen nettoluotonanto, % BKT:sta",
    },
    "points": rows,
}, open(OUT, "w"), ensure_ascii=False, indent=1)
print(len(rows), rows[0], rows[-1])
