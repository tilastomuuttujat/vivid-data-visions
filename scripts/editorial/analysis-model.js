/* Claim types are editorial proposals, never inferred from words or publication years. */
(() => {
 const periods=[[1850,1899],[1900,1917],[1918,1945],[1946,1975],[1976,1994],[1995,2009],[2010,2025],[2026,2050]];
 const typeLabels={description:'Kuvaus',association:'Havaittu yhteys',mechanism_hypothesis:'Mekanismihypoteesi',causal_estimate:'Kausaalinen arvio',scenario:'Skenaario',assessment_rule:'Arviointisääntö',normative_proposal:'Normatiivinen ehdotus',unclassified:'Luokittelematta'};
 const overlaps=(range,p)=>Array.isArray(range)&&Number.isInteger(range[0])&&Number.isInteger(range[1])&&range[0]<=range[1]&&range[0]<=p[1]&&range[1]>=p[0];
 const normalized=s=>String(s||'').replace(/\s+/g,' ').trim();
 const checkedQualitative=c=>{
  const d=c.evidence_design;
  return c.current&&c.classification&&['description','assessment_rule'].includes(c.type)&&d?.kind==='retrospective_qualitative'&&d.review_status==='source_checked'&&d.role==='method_and_scope_verification'&&d.annual_series===false&&d.population_prevalence_estimate===false&&overlaps(d.historical_scope,d.historical_scope)&&/^\d{4}-(0[1-9]|1[0-2])$/.test(d.fieldwork_start||'')&&/^\d{4}-(0[1-9]|1[0-2])$/.test(d.fieldwork_end||'')&&d.fieldwork_start<=d.fieldwork_end;
 };
 const qualitativeCovers=(c,p,range)=>checkedQualitative(c)&&c.evidence_design.historical_scope[0]<=range[0]&&c.evidence_design.historical_scope[1]>=range[1]&&normalized(c.article_passage).length>=30&&normalized(p.evidence).includes(normalized(c.article_passage));
 const checkedImplementation=c=>{
  const d=c.implementation_evidence;
  return c.current&&c.classification&&c.type==='description'&&c.period_linkage==='exact_passage_only'&&d?.kind==='documented_implementation_timeline'&&d.review_status==='source_checked'&&d.annual_series===false&&d.causal_effect_identified===false&&Array.isArray(d.events)&&d.events.length>0&&d.events.every(e=>Number.isInteger(e.year)&&overlaps(c.period,[e.year,e.year])&&e.description&&c.sources?.some(s=>s.id===e.source_id));
 };
 const implementationCovers=(c,p,range)=>checkedImplementation(c)&&range[0]===range[1]&&c.implementation_evidence.events.some(e=>e.year===range[0])&&normalized(c.article_passage).length>=30&&normalized(p.evidence).includes(normalized(c.article_passage));
 function project(catalog,data){
  return catalog.map(a=>{
   const annotations=(data.periods||[]).filter(p=>p.article_id===a.id&&p.article_revision===a.revision).flatMap(p=>JSON.parse(p.periods_json));
   const claims=(data.supplements||[]).filter(s=>s.article_id===a.id).map(row=>{
    const s=JSON.parse(row.payload_json),candidate=(data.reviews||[]).find(r=>r.article_id===a.id&&r.supplement_id===s.id);
    const r=candidate?JSON.parse(candidate.payload_json):(s.claim_classification||null);
    const review=r&&r.article_revision===s.article_revision&&r.body_sha256===s.body_sha256&&r.source_version===row.version?r:null;
    return {...s,key:a.id+'/'+s.id,version:row.version,current:s.article_revision===a.revision,type:review?.claim_type||'unclassified',classification:review,scope:review?.population_scope||s.choice_and_implementation?.scope||null,observationPeriods:review?.observation_periods||null,review:'source_checked_interpretation'};
   });
   return {article:a,annotations,claims,cells:periods.map(p=>({period:p,mentions:annotations.filter(x=>overlaps([x.start,x.end],p)).length,supplements:claims.filter(x=>x.current&&overlaps(x.period,p)).length})),undated:annotations.filter(x=>!Number.isInteger(x.start)||!Number.isInteger(x.end)).length};
  });
 }
 function audit(rows){
  const gaps=[];
  const add=(r,priority,kind,claim,period,missing,action)=>gaps.push({article_id:r.article.id,title:r.article.title,priority,kind,claim,period,missing,action});
  for(const r of rows){
   for(const p of r.annotations){
    const range=[p.start,p.end],linked=r.claims.filter(c=>c.current&&overlaps(c.period,range)&&(c.period_linkage!=='exact_passage_only'||(normalized(c.article_passage).length>=30&&normalized(p.evidence).includes(normalized(c.article_passage)))));
    if(p.dating==='future_scenario')add(r,'P1','future_basis',p.evidence,range,'Skenaarion oletuksia ja virallista ennustepohjaa ei ole hyväksytty väitekohtaisesti.','Kytke väestö-, talous- tai ilmastoskenaario; kirjaa perusvuosi, oletukset ja epävarmuus.');
    else if(Number.isInteger(p.start)&&p.start<=1975&&linked.length===0)add(r,'P1','historical_gap',p.evidence,range,'Aikakausimerkintään ei osu nykyistä lähdetäydennystä. Tämä ei osoita kaiken lähdeaineiston puuttumista.','Tarkista historiallinen tilasto tai alkuperäisasiakirja; kirjaa käsitemuutokset ja ketjutuksen rajat.');
    else if(Number.isInteger(p.start)&&p.start<=1975&&!linked.some(c=>c.observationPeriods?.some(r=>overlaps(r,range)&&r[0]<=range[0]&&r[1]>=range[1])||qualitativeCovers(c,p,range)||implementationCovers(c,p,range)))add(r,'P1','historical_observation_scope',p.evidence,range,'Lähdeosuma on olemassa, mutta varmennettu havaintojakso ei kata koko väitteen aikaväliä tai sen kattavuus on vielä tarkistamatta.','Varmenna lähdekohtaiset vuodet ja se, kattaako näyttö väitteen ajallisen ja alueellisen laajuuden.');
    else if(linked.length===0)add(r,'P2','unlinked_period',p.evidence,range,'Ei ajallisesti osuvaa nykyistä täydennystä; väitekohtainen lähdeyhteys tarkistamatta.','Tarkista väitteen lähde ja sen kohderyhmä.');
   }
   for(const c of r.claims){
    if(!c.current){add(r,'P1','stale_revision',c.article_passage,c.period,'Täydennys koskee aiempaa artikkelirevisiota.','Tarkista katkelma uudesta tekstistä ja arvioi kytkentä uudelleen.');continue;}
    if(c.type==='unclassified')add(r,'P2','classification',c.article_passage,c.period,'Ajantasainen toimituksellinen luokitus puuttuu.','Luokittele väite katkelman sisällön perusteella.');
    if(!c.observationPeriods&&!checkedQualitative(c)&&!checkedImplementation(c))add(r,'P2','observation_years',c.article_passage,c.period,'Lähdekohtaisia havaintovuosia ei ole varmennettu rakenteiseen kenttään. Sijoitusvuodet eivät korvaa niitä.','Tarkista jokaisen lähteen aineiston vuodet; erittele kuvaus, seuranta ja julkaisuvuosi.');
    if(!c.scope)add(r,'P2','population_scope',c.article_passage,c.period,'Kohderyhmä ja alue puuttuvat rakenteisesta rajauksesta.','Kirjaa väestöryhmä, alue ja yleistämisen rajat.');
    if(c.research_gap)add(r,'P3','research_gap',c.article_passage,c.period,c.research_gap,'Täydennä vain väitteen kannalta ratkaiseva puuttuva näyttö.');
   }
   if(!r.annotations.length)add(r,'P2','period_analysis',null,null,'Nykyisen revision aikakausianalyysi puuttuu.','Tarkista analyysi nykyisestä tekstistä.');
   if(!r.claims.length)add(r,'P1','no_supplements',null,null,'Artikkelilta puuttuvat lähdetäydennykset tästä kerroksesta.','Poimi keskeiset väitteet ja liitä niiden näyttö.');
  }
  return gaps.sort((a,b)=>a.priority.localeCompare(b.priority)||a.title.localeCompare(b.title,'fi')||a.kind.localeCompare(b.kind));
 }
 // Reviewed cross-cutting scopes; never infer membership from article keywords.
 const populationScopes=[
  {id:'work',label:'Työ',field:'population_work',version:'population-work-2026-11-06-v1',ids:['2372b417-dc83-5067-be5a-7bfef51a7fa7','dac526d7-e658-593e-8512-1c52e5838cb4'],claimIds:['population-work-work','population-work-public_finance'],support:'Työllisten määrä, koko väestön työllisten osuus ja vuotuinen työpanos kuvaavat eri asioita.',boundary:'Ikävakiointi on laskennallinen vertailu. Se ei tunnista ikääntymisen, politiikan tai työkyvyn vaikutusta.',next:'Erittele työajan, työkyvyn ja toimialojen muutos; säilytä rekisterin ja tilinpidon eri käsitteet.'},
  {id:'education',label:'Koulutus',field:'population_education',version:'population-education-2026-11-06-v1',ids:['804b66e5-1816-5761-ad2a-ab5662a21f61','db7169c2-6da5-5a11-94b6-116601424a7b'],claimIds:['school-age-and-actual-pupils','school-age-and-actual-pupils'],support:'Kouluikäisten alueellinen jakauma ja vuosiluokkien oppilasmäärät tarkentavat järjestelmän mittakaavaa.',boundary:'Vuosiluokat ja asukasikäryhmät eroavat. Määristä ei päätellä osallistumisastetta, kapasiteettia tai oppimistulosta.',next:'Kytke oppilaitosverkko, matkat, henkilöstö ja tuen tarve samoihin alueisiin ja vuosiin.'},
  {id:'care',label:'Hoiva',field:'population_care',version:'population-care-2026-11-06-v1',ids:['be9ee685-6d5f-52c3-9d3a-d36c9b13918c','3134a926-f6af-5b71-afae-94f0ab4f18b0'],claimIds:['oldest-population-and-realised-homecare','oldest-population-and-realised-homecare'],support:'Vanhimpien ikäryhmien mittakaava ja toteutunut kotihoito on erotettu toisistaan.',boundary:'Palvelukäyttö ei mittaa kaikkea tarvetta tai läheisten työtä. Raportoinnin kattavuus rajoittaa vertailua; ennuste on ehdollinen.',next:'Kytke toimintakyky, palvelutarpeen arvio, viiveet ja läheisapu samoihin alueisiin ja vuosiin.'},
  {id:'security',label:'Sosiaaliturva',field:'population_security',version:'population-security-2026-11-06-v1',ids:['33e4e43f-901c-573b-bbbc-b7e0ea177b60','36c65edb-0893-5c7a-8ba6-6cffda47a40f'],claimIds:['basic-assistance-age-and-household','basic-assistance-age-and-household'],support:'Perustoimeentulotuen ikä- ja kotitalousjakauma antaa etuuskohtaisen kuvauksen käytöstä.',boundary:'Raakasaajamäärä ei ole saamisriski, etuusoikeus tai alikäyttö. Vuositilasto ei osoita poistumisen syytä.',next:'Varmenna maantieteeltään ja iältään yhteensopiva nimittäjä ennen ryhmäkohtaisia osuuksia; sen jälkeen tutki siirtymiä ja oikeutettuja.'},
  {id:'regions',label:'Alueet',field:'population_regions',version:'population-regions-2026-11-06-v1',ids:['855bfd25-c957-5425-9858-c18685e49c27','2372b417-dc83-5067-be5a-7bfef51a7fa7'],claimIds:['regional-demographic-components','regional-demographic-components'],support:'Syntyneet, kuolleet, kotimainen nettomuutto, nettomaahanmuutto ja korjaukset muodostavat erilliset komponentit.',boundary:'Väestötase ei tunnista muuttamisen motiiveja, työvaikutuksia tai kuulumisen kokemusta. Aluejako on kiinteä vuoden 2026 jako.',next:'Kytke ikä- ja koulutuskohtainen muuttoliike työpaikkoihin, asumiseen ja palveluihin.'},
  {id:'fiscal',label:'Julkinen talous',field:'population_fiscal',version:'population-fiscal-2026-11-06-v1',ids:['dac526d7-e658-593e-8512-1c52e5838cb4','3f654773-8325-5bcf-b078-4dc45b2423e7'],claimIds:['public-expenditure-functions-and-population','public-expenditure-functions-and-population'],support:'Sulautettujen tehtävämenojen rakenne ja väestömäärä on erotettu; nimelliseurot ja BKT-osuudet säilyvät eri mittareina.',boundary:'COFOG-tehtävä ei ole ikäryhmä. Aineisto ei tunnista reaalikustannusta, demografista menovaikutusta tai kestävyysvajetta.',next:'Kytke tehtäviin sopivat hinta- ja volyymi-indeksit, saajat, etuustasot ja tulot.'}
 ];
 function populationSynthesis(rows){
  const groups=populationScopes.map(scope=>{
   const basis=scope.ids.map((id,i)=>{
    const row=rows.find(r=>r.article.id===id),claim=row?.claims.find(c=>c.id===scope.claimIds[i]);
    let status='missing';
    if(claim){status=!claim.current?'stale':claim.version!==scope.version||!claim.classification||claim.type!=='mechanism_hypothesis'||!claim[scope.field]||claim.causal_effect_identified!==false?'needs_review':'current';}
    return {article_id:id,title:row?.article.title||'Artikkeli puuttuu otoksesta',key:claim?.key||null,status,claim:status==='current'?claim:null};
   });
   const n=basis.filter(b=>b.status==='current').length;
   return {id:scope.id,label:scope.label,status:n===basis.length?'current':n?'partial':'unavailable',current:n,expected:basis.length,support:n?scope.support:'Ajantasainen tarkistettu lähdekytkentä puuttuu tästä kirjaston otoksesta.',boundary:scope.boundary,next:n?scope.next:'Tarkista artikkelin revisio ja lähdekytkentä ennen tulkintaa.',basis};
  });
  return {version:'population-comparison-2026-11-06-v1',groups,ready:groups.filter(g=>g.status==='current').length,total:groups.length,causal_effect_identified:false,scope:'Kuuden ryhmän ensimmäinen väestökerros; ei kaikkien artikkelien tai aikakausien kattavuusarvio.'};
 }
 function populationExport(synthesis){
  return {...synthesis,groups:synthesis.groups.map(g=>({...g,basis:g.basis.map(b=>({...b,claim:b.claim?{key:b.claim.key,article_id:b.claim.article_id,article_revision:b.claim.article_revision,body_sha256:b.claim.body_sha256,source_version:b.claim.version,article_passage:b.claim.article_passage,period:b.claim.period,classification:b.claim.classification,evidence:b.claim.evidence,sources:b.claim.sources,limits:b.claim.limits,research_gap:b.claim.research_gap}:null}))}))};
 }
 globalThis.articleAnalysisModel={periods,typeLabels,overlaps,project,audit,populationSynthesis,populationScopes,populationExport};
})();
