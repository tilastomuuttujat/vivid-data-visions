"""Muuntaa Lainsaadanto.xlsx -> src/data/lainsaadanto.json. Käyttö: python3 convert-lainsaadanto.py polku.xlsx"""
import json, re, sys, openpyxl
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
def rows(name):
    ws = wb[name]; h = [c.value for c in ws[1]]
    for r in ws.iter_rows(min_row=2, values_only=True):
        if any(v is not None for v in r): yield dict(zip(h, r))
def s(v): return None if v is None else str(v).strip()
def kind(a):
    a = (a or '').lower()
    if 'heikent' in a: return 'heikentava'
    if 'korjaa' in a: return 'korjaava'
    if 'ristiriit' in a: return 'ristiriitainen'
    return 'vahvistava'
decisions = []
for i, r in enumerate(rows('Sheet1')):
    y = r.get('Päätösvuosi / jakson alku')
    try: y = int(float(y))
    except: y = int(re.findall(r'\d{4}', s(r['Aika']))[0])
    decisions.append({
      'id': f'd{i+1:03d}', 'aika': s(r['Aika']), 'vuosi': y, 'paatos': s(r['Päätös tai ratkaisu']),
      'arvio': s(r['Arvio']), 'arvioLuokka': kind(s(r['Arvio'])), 'metatarina': s(r['Merkitys metatarinalle']),
      'toimeenpano': s(r['Toimeenpano']), 'teema': s(r['Teema']), 'tavoite': s(r['Tavoite']),
      'riskinjako': s(r['Riskin ja vastuun jako']), 'rajat': s(r['Tulkinnan rajat']),
      'lahde': s(r['Lähde']), 'lahdelinkki': s(r['Lähdelinkki']), 'saadostunnus': s(r['Säädöstunnus tietokannassa']),
      'heViitteet': s(r['HE-viitteet']), 'vaikutusnaytto': s(r['Toteutuneiden vaikutusten näyttö'])})
byText = {d['paatos']: d['id'] for d in decisions}
prep = [{'paatosId': byText.get(s(r['Päätös'])), 'he': s(r['HE tai tutkimus']), 'otsikko': s(r['Otsikko / aineisto']),
         'yhteys': s(r['Yhteyden luonne']), 'linkki': s(r['Lähdelinkki']), 'tulkinta': s(r['Näytön tulkinta'])} for r in rows('Valmistelu ja näyttö')]
ws = wb['Rahoituskytkennät']; h = [c.value for c in ws[1]]
fund = []
for r in rows('Rahoituskytkennät'):
    fund.append({'paatosId': byText.get(s(r['Päätös'])), 'momentti': s(r['Momentti']), 'nimi': s(r['Momentin nimi tietokannassa']),
                 'vuosi': r['Aineiston vuosi'], 'summa': r['Momentin summa tietokannassa (€)'], 'varmuus': s(r['Tietokannan varmuusluokka'])})
guide = [{'otsikko': s(r[0]), 'teksti': s(r[1])} for r in wb['Lukuohje'].iter_rows(min_row=2, values_only=True) if r[0]]
json.dump({'schema_version': 1, 'lahde': 'Lainsaadanto.xlsx (fi_state_causal_map.db)', 'paatokset': decisions,
           'valmistelu': prep, 'rahoitus': fund, 'lukuohje': guide}, open('src/data/lainsaadanto.json', 'w'), ensure_ascii=False, indent=1)
print(len(decisions), len(prep), len(fund), sum(p['paatosId'] is None for p in prep), sum(f['paatosId'] is None for f in fund))
