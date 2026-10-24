-- Versioned visualization calculation layer. Extends research.computation / computation_run / derived_value.
create table research.impact_model (
 model_key text primary key, computation_id uuid not null references research.computation,
 engine text not null check(engine in ('age_standardization','production_shapley3','income_shapley3')),
 unit text not null, baseline_years integer[] not null, outcome_definition text not null,
 method_kind text not null check(method_kind in ('standardization','accounting_decomposition','causal_estimate','scenario')),
 approved boolean not null default false, metadata jsonb not null default '{}'
);
create table research.impact_model_theme (
 model_key text not null references research.impact_model, theme_id integer not null references public.atlas_themes,
 role text not null check(role in ('input_dimension','outcome_dimension','context_unquantified')),
 rationale text not null, primary key(model_key,theme_id)
);
create index impact_model_theme_theme_idx on research.impact_model_theme(theme_id);
create table research.impact_input_binding (
 model_key text not null references research.impact_model, input_key text not null,
 source_family text not null check(source_family in ('indicator','public_finance','external')),
 series_key text not null, group_key text not null default 'FI', expected_unit text not null,
 primary key(model_key,input_key)
);
create table research.impact_external_revision (
 revision_id uuid primary key default gen_random_uuid(), input_key text not null,
 payload jsonb not null, content_sha256 text not null, created_at timestamptz not null default now(),
 check(content_sha256=encode(sha256(convert_to(payload::text,'UTF8')),'hex')),
 unique(input_key,content_sha256)
);
create table research.impact_snapshot (
 snapshot_id uuid primary key default gen_random_uuid(), retrieval_id uuid not null references research.retrieval,
 payload jsonb not null, content_sha256 text not null unique, created_at timestamptz not null default now(),
 check(content_sha256=encode(sha256(convert_to(payload::text,'UTF8')),'hex'))
);
create table research.impact_release (
 release_id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references research.impact_snapshot,
 engine_sha256 text not null check(engine_sha256 ~ '^[0-9a-f]{64}$'), created_at timestamptz not null default now(),
 checks jsonb not null, unique(snapshot_id,engine_sha256)
);
create table research.impact_model_run (
 computation_run_id uuid primary key references research.computation_run,
 release_id uuid not null references research.impact_release, model_key text not null references research.impact_model,
 baseline_year integer not null check(baseline_year between 1850 and 2025),
 unique(release_id,model_key,baseline_year)
);
create table research.impact_run_check (
 computation_run_id uuid primary key references research.impact_model_run, output_sha256 text not null check(output_sha256 ~ '^[0-9a-f]{64}$'), checks jsonb not null
);
create table research.impact_point (
 computation_run_id uuid not null references research.impact_model_run,
 year integer not null check(year between 1850 and 2025), factor_key text not null, group_key text not null,
 derived_value_id uuid not null unique references research.derived_value,
 primary key(computation_run_id,year,factor_key,group_key)
);
create table research.impact_theme_year (
 release_id uuid not null references research.impact_release, theme_id integer not null references public.atlas_themes,
 year integer not null check(year between 1850 and 2025), observed_candidates integer not null,
 estimate_candidates integer not null, mapped_series integer not null, mechanism_count integer not null,
 quantitative_model_count integer not null, status text not null,
 missing_reason text, primary key(release_id,theme_id,year)
);
create index impact_theme_year_theme_idx on research.impact_theme_year(theme_id,year);
create table research.impact_channel (
 source_mechanism_id bigint not null references public.atlas_mechanisms,
 target_mechanism_id bigint not null references public.atlas_mechanisms,
 source_theme_id integer references public.atlas_themes,target_theme_id integer references public.atlas_themes,
 relation text not null, rationale text not null, evidence_status text not null,
 lag_min_years integer,lag_max_years integer,
 coefficient numeric,calibration_run_id uuid references research.computation_run,
 primary key(source_mechanism_id,target_mechanism_id),
 check(coefficient is null or calibration_run_id is not null),
 check(lag_min_years is null or lag_min_years>=0),
 check(lag_max_years is null or lag_max_years>=lag_min_years)
);
create index impact_channel_target_theme_idx on research.impact_channel(target_theme_id);
create index impact_channel_source_theme_idx on research.impact_channel(source_theme_id);

-- New versioned inputs/outputs are append-only; no change to existing research guards.
create function research.impact_immutable() returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Impact history is append-only: create a new revision/release'; end $$;
do $$declare t text;begin
 foreach t in array array['impact_external_revision','impact_snapshot','impact_release','impact_model_run','impact_run_check','impact_point','impact_theme_year'] loop
 execute format('create trigger %I before update or delete on research.%I for each row execute function research.impact_immutable()',t||'_immutable',t);
 end loop;
end $$;

create view research.impact_source_value with (security_invoker=true) as
 select 'indicator'::text family,s.series_key,v.group_key,v.year,v.value,s.unit,
 v.validation_status,v.value_kind,v.source_version,v.meta,s.source_url,s.metadata source_metadata
 from public.indicator_values v join public.indicator_series s using(series_key)
 where s.published and v.is_published and v.value is not null and v.year between 1850 and 2025
 and v.value_kind in ('observed','estimate') and s.frequency in ('annual','annual_with_source_gap') and (v.period is null or v.period=v.year::text)
 and v.validation_status in ('calculation_checked','source_verified','import_checked','validated','reviewed','source_snapshot_checked','pdf_table_visually_checked','official_source_claim_checked')
 union all
 select 'public_finance',s.series_key,'FI',v.year,v.value,s.unit,v.validation_status,v.value_kind,
 coalesce(s.metadata->>'source_version','stored_source_version'),
 jsonb_build_object('release_status',v.release_status),v.source_url,to_jsonb(s)
 from public.public_finance_observations v join public.public_finance_series s using(series_key)
 where v.value is not null and v.year between 1850 and 2025 and v.value_kind in ('observed','estimate')
 and v.validation_status in ('import_checked','source_verified','calculation_checked','validated','reviewed');

create function research.impact_shapley3(b numeric[],c numeric[]) returns numeric[] language plpgsql immutable security invoker set search_path='' as $$
declare outv numeric[]:='{}'; i int;j int;k int;
begin
 if array_length(b,1)<>3 or array_length(c,1)<>3 then raise exception 'Three factors required';end if;
 for i in 1..3 loop
 if b[i] is null or c[i] is null or b[i]<=0 or c[i]<=0 or b[i]::text in ('NaN','Infinity','-Infinity') or c[i]::text in ('NaN','Infinity','-Infinity') then raise exception 'Finite positive factors required';end if;
 end loop;
 for i in 1..3 loop j:=i%3+1;k:=j%3+1;
 outv:=array_append(outv,(c[i]-b[i])*(b[j]*b[k]/3+(c[j]*b[k]+b[j]*c[k])/6+c[j]*c[k]/3));
 end loop;return outv;
end $$;

-- Captures exact computation inputs, source metadata, all theme definitions and linked annual coverage.
create function research.impact_current_payload() returns jsonb language sql stable security invoker set search_path='' as $$
with bindings as (select distinct source_family,series_key,group_key from research.impact_input_binding),
inputs as (select b.source_family,b.series_key,b.group_key,jsonb_agg(to_jsonb(v) order by v.year) observations
 from bindings b join research.impact_source_value v on (v.family,v.series_key,v.group_key)=(b.source_family,b.series_key,b.group_key)
 group by b.source_family,b.series_key,b.group_key),
links as (select distinct tv.theme_id,vi.series_key from public.atlas_theme_variables tv join public.atlas_variable_indicators vi using(variable_id)),
coverage as (select l.theme_id,v.year,count(*) filter(where v.value_kind='observed') observed_candidates,count(*) filter(where v.value_kind='estimate') estimate_candidates,count(distinct v.series_key) mapped_series
 from links l join research.impact_source_value v on v.series_key=l.series_key and v.family='indicator' group by l.theme_id,v.year)
select jsonb_build_object('target_start',1850,'target_end',2025,
 'inputs',coalesce((select jsonb_agg(to_jsonb(i) order by source_family,series_key,group_key) from inputs i),'[]'::jsonb),
 'external',coalesce((select jsonb_object_agg(input_key,payload) from (select distinct on(input_key) input_key,payload from research.impact_external_revision order by input_key,created_at desc,revision_id desc)e),'{}'::jsonb),
 'coverage',coalesce((select jsonb_agg(to_jsonb(c) order by theme_id,year) from coverage c),'[]'::jsonb),
 'themes',(select jsonb_agg(to_jsonb(t) order by id) from public.atlas_themes t),
 'variable_bindings',(select jsonb_agg(to_jsonb(t) order by theme_id,variable_id) from public.atlas_theme_variables t),
 'indicator_bindings',(select jsonb_agg(to_jsonb(t) order by variable_id,series_key) from public.atlas_variable_indicators t),
 'model_catalog',(select jsonb_agg(to_jsonb(m) order by model_key) from research.impact_model m),
 'model_theme_assessments',(select jsonb_agg(to_jsonb(t) order by model_key,theme_id) from research.impact_model_theme t),
 'input_bindings',(select jsonb_agg(to_jsonb(t) order by model_key,input_key) from research.impact_input_binding t),
 'mechanisms',(select jsonb_agg(to_jsonb(t) order by id) from public.atlas_mechanisms t),
 'stage_mechanisms',(select jsonb_agg(to_jsonb(t) order by theme_id,stage,mechanism_id) from public.atlas_stage_mechanisms t),
 'mechanism_relations',(select jsonb_agg(to_jsonb(t) order by source_mechanism_id,target_mechanism_id) from public.atlas_mechanism_relations t),
 'channels',(select jsonb_agg(to_jsonb(t) order by source_mechanism_id,target_mechanism_id) from research.impact_channel t),
 'rules',jsonb_build_object('no_imputation',true,'no_editorial_score_inputs',true,'coverage_is_not_causality',true,'cross_theme_effects_not_summed',true))
$$;

create function research.impact_age_values(p jsonb,b int) returns table(year int,actual numeric,reference numeric,components jsonb) language sql stable security invoker set search_path='' as $$
with base as (select br.row_json base_row from jsonb_array_elements(p->'rows') br(row_json) where (br.row_json->>'year')::int=b),
cells as (
 select (cr.row_json->>'year')::int as year,gs.group_json->>'id' id,
 (cr.row_json->'population'->>(gs.ord-1)::int)::numeric/(cr.row_json->>'totalPopulation')::numeric w,
 (base.base_row->'population'->>(gs.ord-1)::int)::numeric/(base.base_row->>'totalPopulation')::numeric bw,
 (cr.row_json->'employed'->>(gs.ord-1)::int)::numeric/(cr.row_json->'population'->>(gs.ord-1)::int)::numeric rate
 from jsonb_array_elements(p->'rows') cr(row_json) cross join base cross join jsonb_array_elements(p->'groups') with ordinality gs(group_json,ord)
 where (cr.row_json->>'year')::int>=b),totals as (select c.year,100*sum(c.w*c.rate) actual,100*sum(c.bw*c.rate) reference from cells c group by c.year)
select t.year,t.actual,t.reference,jsonb_object_agg(c.id,(c.w-c.bw)*(100*c.rate-t.reference)) from totals t join cells c using(year) group by t.year,t.actual,t.reference
$$;

-- Snapshot lookup by declared input role; no dynamic SQL/formula execution.
create function research.impact_input_value(p jsonb,m text,k text,y int) returns numeric language sql stable security invoker set search_path='' as $$
 select (o->>'value')::numeric
 from jsonb_array_elements(p->'inputs') s cross join jsonb_array_elements(s->'observations') o
 join jsonb_to_recordset(p->'input_bindings') b(model_key text,input_key text,source_family text,series_key text,group_key text) on b.model_key=m and b.input_key=k
 and s->>'source_family'=b.source_family and s->>'series_key'=b.series_key and s->>'group_key'=b.group_key
 where (o->>'year')::int=y
$$;

create function research.impact_economic_factors(p jsonb,m text,y int) returns numeric[] language plpgsql stable security invoker set search_path='' as $$
declare g numeric;h numeric;e numeric;n numeric;c numeric;cb numeric;v numeric; eng text;
begin
 select mc->>'engine' into eng from jsonb_array_elements(p->'model_catalog')mc where mc->>'model_key'=m;
 n:=research.impact_input_value(p,m,'population',y);
 if eng='production_shapley3' then
 g:=research.impact_input_value(p,m,'gdp',y);h:=research.impact_input_value(p,m,'hours',y);e:=research.impact_input_value(p,m,'employed',y);
 if g>0 and h>0 and e>0 and n>0 then return array[g/h,1000*h/e,e/n];end if;
 elsif eng='income_shapley3' then
 v:=research.impact_input_value(p,m,'nominal_income',y);c:=research.impact_input_value(p,m,'prices',y);cb:=research.impact_input_value(p,m,'prices',2025);
 if v>0 and n>0 and c>0 and cb>0 then return array[1000*v,cb/c,1/n];end if;
 end if;
 return null;
end $$;

create function research.impact_refresh(p_label text default 'on_demand') returns uuid language plpgsql security invoker set search_path='' as $$
declare p jsonb;compact jsonb;h text;code text;codehash text;sid uuid;rid uuid;dv uuid;ret uuid;ds uuid;ver uuid;src uuid;
 rel uuid;runid uuid;m record;b int;y int;f int;g text;ar record;fact text;fx numeric[];fb numeric[];parts numeric[];
 av numeric;rv numeric;ef numeric;ba numeric;comp jsonb;reason text;dims jsonb;valid boolean;outputhash text;
 age jsonb; cell record;totalp numeric;totale numeric;cnt int;
begin
 perform pg_advisory_xact_lock(hashtextextended('research.impact_refresh',0));
 p:=research.impact_current_payload();
 select jsonb_build_object('inputs',jsonb_agg(jsonb_build_object('source_family',s->>'source_family','series_key',s->>'series_key','group_key',s->>'group_key','observations',(select jsonb_agg(jsonb_build_object('year',o->'year','value',o->'value')) from jsonb_array_elements(s->'observations')o))),'input_bindings',p->'input_bindings','model_catalog',p->'model_catalog') into compact from jsonb_array_elements(p->'inputs')s;
 h:=encode(sha256(convert_to(p::text,'UTF8')),'hex');
 select string_agg(pg_get_functiondef(pr.oid),E'\n' order by pr.proname) into code from pg_proc pr join pg_namespace ns on ns.oid=pr.pronamespace where ns.nspname='research' and pr.proname like 'impact_%';
 codehash:=encode(sha256(convert_to(code,'UTF8')),'hex');
 select r.release_id into rel from research.impact_release r join research.impact_snapshot s using(snapshot_id) where s.content_sha256=h and r.engine_sha256=codehash and not exists(select 1 from research.impact_model_run irm join research.computation_run icr using(computation_run_id) where irm.release_id=r.release_id and icr.retracted_at is not null);
 if rel is not null then return rel;end if;
 if jsonb_array_length(p->'themes')<>32 then raise exception 'Expected 32 reviewed themes';end if;
 -- Fail closed on source dimension/unit mismatch, not just missing years.
 if exists(select 1 from jsonb_array_elements(p->'inputs') s cross join jsonb_array_elements(s->'observations') o join research.impact_input_binding ib on s->>'source_family'=ib.source_family and s->>'series_key'=ib.series_key where o->>'unit'<>ib.expected_unit) then raise exception 'Input unit changed; model review required';end if;
 age:=p->'external'->'employment_age_115w';
 if age is null or jsonb_array_length(age->'groups')<>13 then raise exception 'Complete age source required';end if;
 if (select count(distinct ag->>'id') from jsonb_array_elements(age->'groups')ag where ag->>'id'=any(array['0-17','18-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','75-']))<>13 then raise exception 'Age classification changed';end if;
 if (select count(distinct r->>'year') from jsonb_array_elements(age->'rows')r)<>jsonb_array_length(age->'rows') then raise exception 'Duplicate age year';end if;
 for cell in select r from jsonb_array_elements(age->'rows') r loop
 select sum((cell.r->'population'->>i)::numeric),sum((cell.r->'employed'->>i)::numeric),count(*) into totalp,totale,cnt from generate_series(0,12)i
 where (cell.r->'population'->>i)::numeric>0 and (cell.r->'employed'->>i)::numeric between 0 and (cell.r->'population'->>i)::numeric;
 if cnt<>13 or jsonb_array_length(cell.r->'population')<>13 or jsonb_array_length(cell.r->'employed')<>13 or totalp<>(cell.r->>'totalPopulation')::numeric or totale<>(cell.r->>'totalEmployed')::numeric then raise exception 'Age source fails total reconciliation';end if;
 end loop;
 select source_id into src from research.source where source_key='impact_layer_stored_inputs';
 if src is null then insert into research.source(source_key,source_type,primacy,title,notes) values('impact_layer_stored_inputs','official_statistics','secondary','Murrosmatriisin laskentakerroksen versioitu lähtöaineistopoiminta','Tietokanta- ja repositoriopoiminta; alkuperäislähteiden tarkistustaso säilyy. Ei uusi riippumaton lähdevarmennus.') returning source_id into src;end if;
 select dataset_id into ds from research.dataset where dataset_key='impact_layer_inputs';
 if ds is null then insert into research.dataset(source_id,dataset_key,provider,title,reference_time_note) values(src,'impact_layer_inputs','murrosmatriisi','32 teeman vaikutuslaskentojen lähtöaineisto','1850–2025; kattavuus lähdesarjakohtainen, puuttuvia vuosia ei täytetä.') returning dataset_id into ds;end if;
 select snapshot_id,retrieval_id into sid,ret from research.impact_snapshot where content_sha256=h;
 if sid is null then
 insert into research.dataset_version(dataset_id,provider_version_label,content_sha256,content_hash_scope,first_seen_at) values(ds,'impact_'||left(h,16),h,'canonical_json',now()) returning dataset_version_id into ver;
 insert into research.retrieval(retrieval_code,dataset_version_id,method,retrieved_at,response_format,row_count,limitations,validation_summary) values('impact_'||h,ver,'legacy_db_extract',now(),'canonical PostgreSQL jsonb',jsonb_array_length(p->'themes'),'Tarkka tallennettu lähdeversio; ei automaattista lähteiden luotettavuuden korotusta. Vuosittainen kattavuus ei osoita kausaalisuutta.',jsonb_build_object('sha256',h,'themes',32,'code_label',p_label)) returning retrieval_id into ret;
 insert into research.impact_snapshot(retrieval_id,payload,content_sha256) values(ret,p,h) returning snapshot_id into sid;
 end if;
 insert into research.impact_release(snapshot_id,engine_sha256,checks) values(sid,codehash,'{"source_age_totals":true,"no_imputation":true,"cross_theme_sum_forbidden":true}') returning release_id into rel;
 for m in select * from jsonb_to_recordset(p->'model_catalog')mc(model_key text,computation_id uuid,engine text,unit text,baseline_years integer[],approved boolean) where approved order by model_key loop
 foreach b in array m.baseline_years loop
 insert into research.computation_run(computation_id,run_code,run_at,parameters,code_ref,code_sha256,code_text,environment,input_manifest_sha256,checks,outcome)
 values(m.computation_id,'impact_'||rel||'_'||m.model_key||'_'||b,now(),jsonb_build_object('baseline',b,'start',1850,'end',2025,'snapshot_id',sid),'research.impact_refresh',codehash,code,jsonb_build_object('postgres',version()),h,'{"accounting_reconciliation":true}','completed') returning computation_run_id into runid;
 insert into research.computation_input(computation_run_id,input_role,retrieval_id,input_sha256,selection) values(runid,'series',ret,h,jsonb_build_object('model_key',m.model_key,'baseline',b));
 insert into research.impact_model_run values(runid,rel,m.model_key,b);
 if m.engine='age_standardization' then
 if not exists(select 1 from jsonb_array_elements(age->'rows') r where (r->>'year')::int=b) then raise exception 'Age baseline unavailable %',b;end if;
 select a.actual into ba from research.impact_age_values(age,b)a where a.year=b;
 else fb:=research.impact_economic_factors(compact,m.model_key,b);if fb is null then raise exception 'Economic baseline unavailable % %',m.model_key,b;end if;ba:=fb[1]*fb[2]*fb[3];end if;
 for y in 1850..2025 loop
 comp:=null;av:=null;rv:=null;reason:=null;parts:=null;
 if m.engine='age_standardization' then
 select * into ar from research.impact_age_values(age,b)a where a.year=y;
 if found then av:=ar.actual;rv:=ar.reference;comp:=ar.components;
 if av not between 0 and 100 or rv not between 0 and 100 or abs(av-(select 100*(sr->>'totalEmployed')::numeric/(sr->>'totalPopulation')::numeric from jsonb_array_elements(age->'rows')sr where (sr->>'year')::int=y))>0.00000001 then raise exception 'Age output fails published aggregate regression';end if;
 if abs((select sum(value::numeric) from jsonb_each_text(comp))-(av-rv))>0.00000001 then raise exception 'Age component conservation failed';end if;
 else reason:='Ikäryhmittäinen lähdeaineisto tai vertailu puuttuu; ei nollavaikutus.';end if;
 for g in select unnest(array['FI','under25','age25_44','age45_64','age65plus']) loop
 ef:=null;
 if av is not null then
 if g='FI' then ef:=av-rv;
 else select sum(value::numeric) into ef from jsonb_each_text(comp) where key=any(case g when 'under25' then array['0-17','18-24'] when 'age25_44' then array['25-29','30-34','35-39','40-44'] when 'age45_64' then array['45-49','50-54','55-59','60-64'] else array['65-69','70-74','75-'] end);end if;
 end if;
 dims:=jsonb_build_object('actual',av,'comparison',case when ef is not null then av-ef end,'baseline_actual',ba,'components',comp,'factor_key','age_structure','group_key',g,'reference_kind',case when g='FI' then 'fixed_age_weights' else 'centered_allocation_not_counterfactual' end,'not_causal',true);
 insert into research.derived_value(computation_run_id,output_label,period_start,period_end,dims,value,value_status,not_computable_reason,unit)
 values(runid,'age_structure',make_date(y,1,1),make_date(y,12,31),dims,ef,case when ef is null then 'not_computable' else 'computed' end,reason,m.unit) returning derived_value_id into dv;
 insert into research.impact_point values(runid,y,'age_structure',g,dv);
 end loop;
 else
 fx:=case when y>=b then research.impact_economic_factors(compact,m.model_key,y) else null end;
 if fx is not null and y>=b then av:=fx[1]*fx[2]*fx[3];parts:=research.impact_shapley3(fb,fx);
 if abs(parts[1]+parts[2]+parts[3]-(av-ba))>0.0000001 then raise exception 'Shapley conservation failed';end if;
 else reason:='Vertailuvuotta edeltävä vuosi tai vaadittu yhteismitallinen lähdehavainto puuttuu.';end if;
 for f in 1..3 loop
 fact:=(case m.engine when 'production_shapley3' then array['productivity','hours_per_employed','employed_per_population'] else array['nominal_disposable_income','prices','population'] end)[f];
 ef:=parts[f];dims:=jsonb_build_object('actual',av,'comparison',av-ef,'baseline_actual',ba,'factor_key',fact,'group_key','FI','input_factors',fx,'base_factors',fb,'all_components',parts,'reference_kind','shapley_allocation_not_counterfactual','not_causal',true,'source_preliminary_possible',y>=2024);
 insert into research.derived_value(computation_run_id,output_label,period_start,period_end,dims,value,value_status,not_computable_reason,unit)
 values(runid,fact,make_date(y,1,1),make_date(y,12,31),dims,ef,case when ef is null then 'not_computable' else 'computed' end,reason,m.unit) returning derived_value_id into dv;
 insert into research.impact_point values(runid,y,fact,'FI',dv);
 end loop;
 end if;
 end loop;
 select encode(sha256(convert_to(jsonb_agg(jsonb_build_object('year',extract(year from d2.period_start),'label',d2.output_label,'dims',d2.dims,'value',d2.value,'status',d2.value_status) order by d2.period_start,d2.output_label,d2.dims->>'group_key')::text,'UTF8')),'hex') into outputhash from research.derived_value d2 where d2.computation_run_id=runid;
 insert into research.impact_run_check values(runid,outputhash,jsonb_build_object('conservation',true,'complete_year_domain',true,'source_validation_not_upgraded',true));
 end loop;
 end loop;
 insert into research.impact_theme_year
 select rel,t.id,years.yr,
 coalesce((c->>'observed_candidates')::int,0),coalesce((c->>'estimate_candidates')::int,0),coalesce((c->>'mapped_series')::int,0),
 (select count(distinct am.id) from jsonb_to_recordset(p->'mechanisms') am(id bigint,theme_id int) left join jsonb_to_recordset(p->'stage_mechanisms') sm(mechanism_id bigint,theme_id int) on sm.mechanism_id=am.id where am.theme_id=t.id or sm.theme_id=t.id),
 (select count(distinct mr.model_key) from research.impact_model_run mr join jsonb_to_recordset(p->'model_theme_assessments') mt(model_key text,theme_id int,role text) on mt.model_key=mr.model_key and mt.theme_id=t.id and mt.role<>'context_unquantified' join research.impact_point ip using(computation_run_id) join research.derived_value dv using(derived_value_id) where mr.release_id=rel and ip.year=years.yr and dv.value_status='computed'),
 case when c is null then 'no_linked_annual_observations' else 'descriptive_candidates_not_causal' end,
 case when c is null then 'Ei kytkettyä hyväksyttyä vuosihavaintoa; ei tarkoita, ettei tietokannassa ole muuta teeman aineistoa.' end
 from jsonb_to_recordset(p->'themes') t(id int,payload jsonb) cross join generate_series(1850,2025) as years(yr) left join lateral (select c from jsonb_array_elements(p->'coverage')c where (c->>'theme_id')::int=t.id and (c->>'year')::int=years.yr) cc on true;
 if (select count(*) from research.impact_theme_year where release_id=rel)<>32*176 then raise exception 'Complete theme-year domain failed';end if;
 return rel;
end $$;

create view research.impact_visual_point with (security_invoker=true) as
 select mr.release_id,mr.model_key,mr.baseline_year,p.year,p.factor_key,p.group_key,
 d.value as effect,(d.dims->>'actual')::numeric actual,(d.dims->>'comparison')::numeric comparison,
 d.unit,d.value_status,d.not_computable_reason,d.dims,m.method_kind
 from research.impact_point p join research.impact_model_run mr using(computation_run_id)
 join research.derived_value d using(derived_value_id) join research.impact_model m using(model_key)
 where d.retracted_at is null and not exists(select 1 from research.computation_run cr where cr.computation_run_id=mr.computation_run_id and cr.retracted_at is not null);

create function research.impact_visualization(p_model_key text,p_baseline int,p_factor text,p_group text default 'FI') returns jsonb language plpgsql security invoker set search_path='' as $$
declare rel uuid;outv jsonb;
begin
 rel:=research.impact_refresh('visualization_read');
 select jsonb_build_object('schema_version',1,'release_id',rel,'model',p_model_key,'baseline',p_baseline,'factor',p_factor,'group',p_group,'timeline',jsonb_build_object('start',1850,'end',2025),
 'definition',m.outcome_definition,'method_kind',m.method_kind,'model_metadata',m.metadata,
 'points',(select jsonb_agg(to_jsonb(p) order by p.year) from research.impact_visual_point p where p.release_id=rel and p.model_key=p_model_key and p.baseline_year=p_baseline and p.factor_key=p_factor and p.group_key=p_group),
 'theme_assessments',(select jsonb_agg(to_jsonb(t) order by theme_id) from research.impact_model_theme t where t.model_key=p_model_key)) into outv from research.impact_model m where model_key=p_model_key;
 if outv is null or outv->'points'='null'::jsonb then raise exception 'Unsupported model, factor, baseline or group';end if;
 return outv;
end $$;

-- Research layer remains private; exports are created server-side, never with client secrets.
do $$declare t text;begin
 foreach t in array array['impact_model','impact_model_theme','impact_input_binding','impact_external_revision','impact_snapshot','impact_release','impact_model_run','impact_run_check','impact_point','impact_theme_year','impact_channel'] loop
 execute format('alter table research.%I enable row level security',t);
 execute format('create policy %I on research.%I for all to service_role using(true) with check(true)',t||'_service',t);
 execute format('revoke all on research.%I from anon,authenticated',t);
 execute format('grant all on research.%I to service_role',t);
 end loop;
end $$;
revoke all on research.impact_source_value,research.impact_visual_point from anon,authenticated;
grant select on research.impact_source_value,research.impact_visual_point to service_role;
do $$declare r record;begin for r in select p.oid::regprocedure f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='research' and p.proname like 'impact_%' loop execute format('revoke all on function %s from public,anon,authenticated',r.f);execute format('grant execute on function %s to service_role',r.f);end loop;end $$;

-- Service jobs may access only the source/provenance relations used by this layer.
grant usage on schema research to service_role;
grant select on public.atlas_themes,public.atlas_theme_variables,public.atlas_variable_indicators,public.atlas_mechanisms,public.atlas_stage_mechanisms,public.atlas_mechanism_relations,public.indicator_series,public.indicator_values,public.public_finance_series,public.public_finance_observations to service_role;
grant select,insert on research.computation,research.computation_run,research.computation_input,research.derived_value,research.source,research.dataset,research.dataset_version,research.retrieval to service_role;

create function research.impact_config_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from research.impact_model_run r where r.model_key=old.model_key) then raise exception 'Used impact model is versioned: register a new model/computation version instead of changing history';end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
create trigger impact_model_version_guard before update or delete on research.impact_model for each row execute function research.impact_config_guard();
create trigger impact_binding_version_guard before update or delete on research.impact_input_binding for each row execute function research.impact_config_guard();
create trigger impact_theme_version_guard before update or delete on research.impact_model_theme for each row execute function research.impact_config_guard();
alter table research.impact_model add constraint impact_engine_method_matches check(method_kind=case engine when 'age_standardization' then 'standardization' else 'accounting_decomposition' end);

create view research.impact_release_status with (security_invoker=true) as
select r.*,case when exists(select 1 from research.impact_model_run mr join research.computation_run cr using(computation_run_id) where mr.release_id=r.release_id and cr.retracted_at is not null) then 'retracted' else 'computed' end status
from research.impact_release r;

create function research.impact_overview() returns jsonb language plpgsql security invoker set search_path='' as $$
declare rel uuid;p jsonb;begin
 rel:=research.impact_refresh('overview_read');
 select s.payload into p from research.impact_release r join research.impact_snapshot s using(snapshot_id) where r.release_id=rel;
 return jsonb_build_object('schema_version',1,'release_id',rel,'timeline',jsonb_build_object('start',1850,'end',2025),
 'themes',(select jsonb_agg(jsonb_build_object('id',t->'id','name',t->'payload'->>'name','definition',t->'payload'->>'test','stages',t->'payload'->'steps') order by (t->>'id')::int) from jsonb_array_elements(p->'themes')t),
 'coverage',(select jsonb_agg(to_jsonb(c) order by theme_id,year) from research.impact_theme_year c where c.release_id=rel),
 'models',p->'model_catalog','model_theme_assessments',p->'model_theme_assessments',
 'mechanisms',p->'mechanisms','mechanism_relations',p->'mechanism_relations','stage_mechanisms',p->'stage_mechanisms',
 'input_lineage',p->'input_bindings','rules',p->'rules',
 'interpretation','32 teemaa on mukana kontekstissa ja kattavuudessa. Numeerinen vaikutus on käytettävissä vain erikseen määritellylle mittarille ja mallille. Teemojen vaikutuksia tai eri mallien vaikutuksia ei summata.');
end $$;
revoke all on function research.impact_config_guard(),research.impact_overview() from public,anon,authenticated;
grant execute on function research.impact_config_guard(),research.impact_overview() to service_role;
revoke all on research.impact_release_status from anon,authenticated;
grant select on research.impact_release_status to service_role;
create index impact_model_computation_idx on research.impact_model(computation_id);
create index impact_snapshot_retrieval_idx on research.impact_snapshot(retrieval_id);
create index impact_model_run_model_idx on research.impact_model_run(model_key);
create index impact_channel_target_mechanism_idx on research.impact_channel(target_mechanism_id);
create index impact_channel_calibration_idx on research.impact_channel(calibration_run_id);
