"""Rebuild an inventory, never infer effect evidence from calendar coverage."""
import hashlib,json,pathlib,collections
ROOT=pathlib.Path(__file__).resolve().parents[2]
def build(inputs,periods):
    assert len(inputs['themes'])==32 and len({t['id'] for t in inputs['themes']})==32
    refs={s['series_key']:s for s in inputs['series']}
    cells=[]
    for t in inputs['themes']:
        mapped=[m for m in inputs['mappings'] if m['theme_id']==t['id']]
        for p in periods:
            rows=[r for r in inputs['inventory'] if r['theme_id']==t['id'] and r['a']==p['start'] and r['b']==p['end']]
            years=sorted({y for r in rows for y in (r['observed_years'] or [])})
            assert all(p['start']<=y<=p['end'] for y in years)
            for r in rows:
                assert r['series_key'] in refs
            status='observed_candidates' if years else 'estimate_candidates' if any(r['estimated'] for r in rows) else 'no_historical_candidate_in_scope'
            cells.append(dict(id=f"{t['id']}:{p['id']}",theme_id=t['id'],period_id=p['id'],start=p['start'],end=p['end'],status=status,
                mapped_series=len({m['series_key'] for m in mapped}),observed_years=years,
                missing_observed_years=[y for y in range(p['start'],p['end']+1) if y not in years],
                series=rows,
                change_assessment=dict(status='requires_concept_review',finding=None,question=t['question']),
                channel_assessment=dict(status='not_causally_assessed',finding=None,question=p['channel']),
                distribution_assessment=dict(status='requires_group_comparability_review',finding=None,question='Vertaa saman käsitteen alue-, sukupuoli-, ikä- ja sosioekonomisia ryhmiä; tarkista myös edustavuus.'),
                duration_assessment=dict(status='not_assessed',finding=None,question='Erota tilapäinen poikkeama, palautuminen ja jatkuva muutos; ilmoita seurannan loppuvuosi.'),
                evidence_assessment=dict(status='candidate_inventory_only',finding=None,question='Tarkista käsite, lähdeversio, katkokset ja vertailuasetelma ennen tulkintaa.'),
                next_step=('Etsi ja kytke teemaan sopiva historiallinen ydinsarja; puuttuva kytkentä ei osoita tiedon puuttumista.' if not years else 'Valitse vertailukelpoinen ydinsarja ja tarkista lähde sekä ryhmärajaukset; vuosien unioni ei ole yhtenäinen sarja.'),
                correction_question=f"Missä {t['name'].lower()} -teeman päätös tai toimintatapa paransi mahdollisuuksia, ja mitä toteuma osoittaa?",
                alternative_question='Voisiko saman muutoksen selittää suhdanne, väestörakenne, mittaustavan muutos tai muu samanaikainen päätös?'))
    payload=dict(version=1,scope=[1850,2025],captured_at=inputs['captured_at'],themes=inputs['themes'],periods=periods,cells=cells,
        counts=dict(themes=32,cells=len(cells),statuses=dict(collections.Counter(c['status'] for c in cells))),
        series_catalog=inputs['series'],mappings=inputs['mappings'],
        source_scope='Published indicator_series + indicator_values via existing atlas_theme_variables / atlas_variable_indicators. Other database evidence families and unpublished series are not audited.',
        methodology=['Calendar inventory is not effect evidence.','Observed, estimated and projected values remain separate.','Original validation labels are retained; observed is not synonymous with verified.','No automatic welfare sign, causal attribution, group comparison or turning-point test.','No mapping is not proof that data does not exist.'],
        inputs_sha256=hashlib.sha256(json.dumps(inputs,sort_keys=True,ensure_ascii=False).encode()).hexdigest())
    payload['priority_tasks']=[dict(theme_id=i,title=title,action=action,status='planned',basis='Editorial balance of explanatory needs; not a statistical priority score') for i,title,action in [
        (4,'Koulutuksen mahdollisuudet ja valikoivuus','Valitse osallistumista ja oppimistuloksia kuvaavat ydinsarjat. Vertaa uudistusten toteutumista eri ryhmissä, myös onnistuneita korjausliikkeitä.'),
        (7,'Terveyden ja toimintakyvyn pitkä muutos','Tarkista kuolleisuus- ja terveyssarjojen käsitevastaavuus, ikävakiointi ja historialliset alueet ennen suunnan arviointia.'),
        (3,'Asumisolot ja asumisen jälkeinen toimeentulo','Erota varustetason ja väljyyden paraneminen kustannusrasituksesta; tarkista hallintasuhteet ja kotitaloustyypit.'),
        (19,'Oikeuksien laajeneminen käytännössä','Yhdistä säädetty oikeus toimeenpanoon ja osallistumisen toteumaan. Etsi myös ryhmät, joita uudistus ei tavoittanut.'),
        (9,'Energian ja ympäristön suunnanmuutokset','Tarkista puuttuvat suorat kytkennät energia-, päästö- ja kulutussarjoihin. Vertaa tuotannon ja ympäristökuorman eritahtisuutta.'),
        (10,'Luonnonvarojen käytön hyödyt ja rajat','Kytke käyttöä ja uusiutumista kuvaavat ydinsarjat; erottele paikalliset vaikutukset kansallisista hyödyistä.'),
        (15,'Kasvun ja työn käytön eritahtisuus','Laajenna neljän mallin toipumisvertailu kriisien ulkopuolelle; tarkista työllisyyskäsitteiden erot.'),
        (26,'Kasvun ja turvan jakautuminen','Valitse yhtenäiset tuloryhmäsarjat ja dokumentoi käsitekatkokset ennen ryhmien vertailua.'),
        (20,'Alueiden erilaiset kehityspolut','Valitse vertailukelpoinen alueluokitus ja väestöpohja. Testaa, peittääkö kansallinen keskiarvo vastakkaiset suunnat.'),
        (17,'Yhteisen vastuun rahoitus','Erota tulo- ja menolajien kirjanpidollinen muutos päätösten vaikutuksista ja tarkista ennen vuotta 1975 jäävät aukot.'),
        (23,'Arvot ilman näennäistä vuosijatkumoa','Kytke alkuperäiset kyselyaallot ja historialliset laadulliset lähteet. Älä interpoloi asenteita välivuosille.'),
        (29,'Tiedon ja julkisuuden valta','Erota tiedon saatavuus, yleisöt, luottamus ja vaikutus. Älä käytä pelkkää sisältömäärää vaikutusmittarina.')]]
    return payload
if __name__=='__main__':
    inputs=json.loads((ROOT/'src/data/research/theme-coverage-inputs.json').read_text())
    periods=json.loads((ROOT/'src/data/research/long-view.json').read_text())['periods']
    out=build(inputs,periods)
    (ROOT/'src/data/research/theme-coverage.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(out['counts']))
