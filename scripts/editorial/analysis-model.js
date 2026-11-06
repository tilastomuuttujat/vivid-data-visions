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
 globalThis.articleAnalysisModel={periods,typeLabels,overlaps,project,audit};
})();
