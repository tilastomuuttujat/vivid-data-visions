"""Extract the two archived Labore example-family tables using Poppler.

These are model calculations, never observed household incomes. Only years
through 2025 are exported. Reports stay in /tmp/household-impact.
"""
import datetime, hashlib, json, pathlib, re, subprocess, urllib.request

CACHE=pathlib.Path('/tmp/household-impact');CACHE.mkdir(exist_ok=True)
PROFILES=[
 ('high-income','Hyvätuloinen pari','Kaksi palkansaajaa, ei lapsia; velaton omistusasunto.',21,24),
 ('salaried-family','Toimihenkilöiden lapsiperhe','Kaksi palkansaajaa ja kaksi lasta; asuntovelallinen.',21,25),
 ('worker-family','Työntekijöiden lapsiperhe','Kaksi palkansaajaa ja kaksi lasta; vuokra-asunto.',22,25),
 ('single-parent','Pienipalkkainen yksinhuoltaja','Yksi työssäkäyvä vanhempi ja yksi lapsi; vuokra-asunto.',22,25),
 ('graduate','Korkeakoulutettu yksinasuva','Yksi palkansaaja; asuntovelallinen.',22,25),
 ('basic-unemployed','Työmarkkinatuen saaja','Yksinasuva; lisäksi asumis- ja toimeentulotuki.',22,26),
 ('earnings-unemployed','Ansiopäivärahan saaja','Yksinasuva vuokralla. Päivärahan oletus vaihtelee julkaisusta toiseen.',23,26),
 ('retired-couple','Eläkeläispari','Työeläke ja vähimmäiseläketurva; velaton omistusasunto.',23,26),
]
VINTAGES=[
 {'id':'2024','published':'2024-10-10','calculated':'2024-10-02','forecastFrom':2024,
  'url':'https://labore.fi/wp-content/uploads/2024/10/Esimerkkiperheet101024.pdf',
  'web':'https://labore.fi/julkaisu/ostovoima-kasvuun-synkan-kauden-jalkeen-sosiaalietuuksien-leikkaukset-jakavat-kotitalouksia/',
  'earningsNote':'Vuoden 2024 raportin ansioturvaesimerkki on eri vuosina työttömäksi jäävien poikkileikkaus. Porrastus sisältyy vuoden 2025 laskelmaan; sama henkilö ei pysy ansiopäivärahalla koko vuosikymmentä.'},
 {'id':'2025','published':'2025-10-29','calculated':'2025-10-16','forecastFrom':2025,
  'url':'https://labore.fi/wp-content/uploads/2025/10/Esimerkkiperheet291025.pdf',
  'web':'https://labore.fi/julkaisu/hyvatuloisten-ostovoima-kasvaa-yksinhuoltajien-heikkenee-esimerkkiperheet-kuvaavat-kotitalouksien-kasvavaa-eriytymista/',
  'earningsNote':'Vuoden 2025 raportin ansioturvaesimerkki koskee täyttä ansiopäivärahaa ensimmäisiltä 40 päivärahapäivältä. Porrastuksen vaikutusta ei tässä esimerkissä lasketa; sitä ei rinnasteta vuoden 2024 raportin vuositulkintaan.'},
]

def extract(vintage):
    pdf=CACHE/f"labore{vintage['id']}.pdf"
    if not pdf.exists():
        with urllib.request.urlopen(vintage['url'],timeout=60) as r:pdf.write_bytes(r.read())
    textfile=pdf.with_suffix('.txt')
    subprocess.run(['pdftotext','-layout',str(pdf),str(textfile)],check=True)
    text=textfile.read_text()
    profiles=[]
    for number,(id,name,description,page2024,page2025) in enumerate(PROFILES,2):
        match=re.search(rf'LIITETAULUKKO {number}\.([\s\S]*?)(?=LIITETAULUKKO|\Z)',text)
        assert match,(vintage['id'],number)
        block=match.group(1)
        yearline=next(line for line in block.splitlines() if re.fullmatch(r'\s*(20\d\d\s*){6}',line))
        years=list(map(int,yearline.split()))
        fields={}
        for key,label in [('gross','Bruttotulot'),('transfers','Saadut tulonsiirrot'),('taxes','Saadut veronluonteiset maksut'),('net','Käytettävissä olevat tulot'),('taxShare','Verojen osuus bruttotuloista')]:
            line=next(line for line in block.splitlines() if line.strip().startswith(label))
            values=re.findall(r'-?\d+(?:,\d+)?',line.split(')',1)[1])
            assert len(values)==6,(vintage['id'],number,key,line)
            fields[key]=[float(value.replace(',','.')) for value in values]
        points=[dict(year=year,**{key:values[i] for key,values in fields.items()}) for i,year in enumerate(years) if year<=2025]
        assert all(abs(p['gross']+p['transfers']-p['taxes']-p['net'])<=1 for p in points),(id,points)
        profiles.append({'id':id,'name':name,'description':description,
            'page':page2024 if vintage['id']=='2024' else page2025,'points':points})
    return {**vintage,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'profiles':profiles}

if __name__=='__main__':
    output={'retrieved':datetime.date.today().isoformat(),'unit':'euroa kuukaudessa, nimellinen mallilaskelma',
        'vintages':[extract(v) for v in VINTAGES]}
    target=pathlib.Path('src/components/planeetta/household-example-data.json')
    target.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print('Saved',target)
