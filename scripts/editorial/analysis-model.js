/* Shared, conservative projection: no inferred causal edges or source coverage. */
(() => {
 const periods=[[1850,1899],[1900,1917],[1918,1945],[1946,1975],[1976,1994],[1995,2009],[2010,2025],[2026,2050]];
 const overlaps=(range,p)=>Array.isArray(range)&&Number.isInteger(range[0])&&Number.isInteger(range[1])&&range[0]<=range[1]&&range[0]<=p[1]&&range[1]>=p[0];
 function project(catalog,data){
  return catalog.map(a=>{
   const annotations=(data.periods||[]).filter(p=>p.article_id===a.id&&p.article_revision===a.revision).flatMap(p=>JSON.parse(p.periods_json));
   const claims=(data.supplements||[]).filter(s=>s.article_id===a.id).map(row=>{
    const s=JSON.parse(row.payload_json);
    return {...s,key:a.id+'/'+s.id,version:row.version,current:s.article_revision===a.revision,type:'mechanism_hypothesis',scope:s.choice_and_implementation?.scope||'Kohderyhmä tarkistettava',review:'source_checked_interpretation'};
   });
   return {article:a,claims,cells:periods.map(p=>({period:p,mentions:annotations.filter(x=>overlaps([x.start,x.end],p)).length,supplements:claims.filter(x=>x.current&&overlaps(x.period,p)).length})),undated:annotations.filter(x=>!Number.isInteger(x.start)||!Number.isInteger(x.end)).length};
  });
 }
 globalThis.articleAnalysisModel={periods,overlaps,project};
})();
