"""Descriptive calculations and scoped literature assessment; no fitted causal model."""
import json,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
def build(inputs):
 rows=inputs['observations']; lookup={}
 for r in rows:
  key=(r['series_key'],r['group_key'],r['year'])
  if key in lookup: raise ValueError('Duplicate observation')
  if r['value_kind']!='observed' or r['value'] is None or r['validation_status'] in ['missing_source','source_missing','pending_review']: raise ValueError('Unreviewed input')
  lookup[key]=r
 def val(s,g,y):return lookup[(s,g,y)]['value']
 rates=[]
 for r in rows:
  if r['series_key']=='vivid.groups.education.population':
   employed=val('vivid.groups.education.employed',r['group_key'],r['year'])
   if not 0<=employed<=r['value'] or r['value']<=0:raise ValueError('Bad denominator')
   rates.append(dict(year=r['year'],group_key=r['group_key'],group_label=r['group_label'],employed=employed,population=r['value'],value=100*employed/r['value']))
 checks=0
 for r in rows:
  if r['series_key']=='education.modern.placement.employment_share':
   computed=100*val('education.modern.placement.employed',r['group_key'],r['year'])/val('education.modern.placement.graduates',r['group_key'],r['year'])
   if abs(computed-r['value'])>0.500001:raise ValueError('Placement ratio mismatch')
   checks+=1
 early=[]
 for key,group,a,b in [('education.postwar.secondary_students1946_1956','TOTAL',1946,1956),('education.postwar.university1976.total','FI',1961,1975)]:
  va,vb=val(key,group,a),val(key,group,b)
  early.append(dict(series_key=key,group_key=group,start=a,end=b,start_value=va,end_value=vb,change_percent=100*(vb/va-1)))
 return dict(version=1,title='Koulutus avasi mahdollisuuksia — työn ja toimeentulon yhteys vaatii oman näyttönsä',captured_at=inputs['captured_at'],themes=[4,15,26],history_window=[1946,1975],comparison_window=[1995,2025],
 source_series=inputs['series'],historical_points=[r for r in rows if r['series_key'].startswith('education.postwar.')],early_changes=early,employment_rates=rates,
 placement_points=[r for r in rows if r['series_key']=='education.modern.placement.employment_share'],
 checks=dict(input_rows=len(rows),duplicate_rows=0,placement_ratios_checked=checks,placement_rounding_tolerance_pp=0.5,missing_2025_employment=True),
 input_sha256=hashlib.sha256(json.dumps(inputs,sort_keys=True,ensure_ascii=False).encode()).hexdigest(),
 studies=[dict(id='mobility_2006',type='published_research_estimate_not_reestimated',title='Peruskoulu-uudistus ja sukupolvien tuloliikkuvuus',authors='Pekkarinen, Pekkala ja Uusitalo',version='IFAU Working Paper 2006:13, 23.11.2006; sama tutkimus julkaistu Journal of Public Economicsissa 2009',url='https://www.ifau.se/globalassets/pdf/se/2006/wp06-13.pdf',locator='Tiivistelmä; luvut 2–5',checked_on='2026-10-25',finding='Tutkimus arvioi isän ja pojan tulojen välisen jouston pienentyneen noin 0,07. Pienempi jousto merkitsee heikompaa tuloaseman periytymistä, ei seitsemän prosentin palkankorotusta.',population='Vuosina 1960–1966 syntyneet miehet; poikien ansiot vuonna 2000 ja isien keskiansiot 1970–1990.',intervention_window=[1972,1977],effect_value=-0.07,effect_unit='intergenerational_income_elasticity',design='Alueittain porrastettuun käyttöönottoon perustuva difference-in-differences.',assumptions='Tulkinta edellyttää vertailukelpoista kehitystä ilman uudistusta; samanaikaisten alue- ja kohorttierojen sekä muuttoliikkeen merkitys on arvioitava.',limits='Uudistus sisälsi useita muutoksia. Yksittäisen osan vaikutusta tai koko vuosien 1946–1975 kasvua ei eroteta. Ei suoraa yleistystä naisiin, nykyisiin nuoriin tai työllisyyteen. Tässä ei tehdä aineiston uudelleenestimointia.'),
 dict(id='skills_2012',type='author_manuscript_not_reestimated',title='Peruskoulu-uudistus ja taidot',authors='Kerr, Pekkarinen ja Uusitalo',version='Tekijöiden käsikirjoitus 21.6.2012',url='https://www.hse-econ.fi/pekkarinen/july2_2012_tp.pdf',locator='Tiivistelmä ja johdanto',checked_on='2026-10-25',finding='Kielellisten testien keskiarvo parani hieman; aritmeettisen ja loogisen päättelyn keskiarvoissa ei havaittu vaikutusta. Vain peruskoulutettujen vanhempien lasten tulokset paranivat kaikissa testeissä.',population='Asevelvollisuuden alussa testatut miehet.',intervention_window=[1972,1977],effect_value=None,effect_unit=None,design='Porrastettua alueellista uudistusta hyödyntävä difference-in-differences.',assumptions='Kohorttien ja alueiden vertailukelpoisuus; tutkimuksen testijoukko ei kata kaikkia nuoria.',limits='Taitovaikutukset eivät tekijöiden mukaan yksin selitä tuloliikkuvuuden muutosta. Tämä ei ole riippumaton arvio koko koulutussektorin vaikutuksesta.')],
 conclusion=dict(supported='Opiskelijamäärät kasvoivat tarkastelluissa historiallisissa sarjoissa. Peruskoulu-uudistuksesta on lisäksi rajattua tutkimusnäyttöä mahdollisuuksien tasaantumisesta.',descriptive_only='Koulutusryhmien työllisten osuudet kuvaavat eroja, eivät tutkinnon aiheuttamaa vaikutusta. Ikä, koulutusala, terveys, valikoituminen ja työvoiman kysyntä voivat selittää eroja.',not_identified='Koulutuksen osuutta koko tuotannon tai kotitalouksien reaalitulon kasvusta ei tässä tunnisteta. Koulutusryhmittäinen vertailukelpoinen reaalituloseuranta sekä varhaiset alue- ja kohorttisarjat puuttuvat valitusta laskentapohjasta.',future='Vuodet 2025–2050 ovat avoin skenaariokysymys: koulutuksen, työn kysynnän ja osallistumismahdollisuuksien yhteensovittaminen. Historiallista vaikutusestimaattia ei siirretä ennusteeksi.'))
if __name__=='__main__':
 inp=json.loads((ROOT/'src/data/research/education-assessment-inputs.json').read_text());out=build(inp)
 (ROOT/'src/data/research/education-assessment.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(dict(checks=out['checks'],early=out['early_changes'])))
