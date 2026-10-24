-- Read-only numerical and access regressions. Run after impact_refresh has completed.
do $$
declare rel uuid; n int; a numeric; b numeric; e numeric; t numeric; vals numeric[]; backward numeric[];
begin
 select release_id into rel from research.impact_release_status where status='computed' order by created_at desc limit 1;
 if rel is null then raise exception 'No validated release';end if;
 select count(*) into n from research.impact_theme_year where release_id=rel;
 if n<>5632 then raise exception 'Expected 32 x 176 coverage cells, got %',n;end if;
 if exists(select 1 from research.impact_visual_point where release_id=rel and value_status='not_computable' and (effect is not null or actual is not null or comparison is not null)) then raise exception 'Missing is not zero';end if;
 if exists(select 1 from research.impact_visual_point where release_id=rel and value_status='computed' and abs(actual-comparison-effect)>1e-7) then raise exception 'Visual band fails conservation';end if;
 select actual,comparison,effect into a,b,e from research.impact_visual_point where release_id=rel and model_key='age_structure' and baseline_year=1987 and group_key='FI' and year=2024;
 if abs(a-42.99938732828824)>1e-9 or abs(b-46.37308504665289)>1e-9 or abs(e+3.373697718364646)>1e-9 then raise exception 'Age source regression failed';end if;
 select count(*) into n from research.impact_visual_point where release_id=rel and model_key='age_structure' and baseline_year=1987 and group_key='FI' and value_status='computed';
 if n<>38 then raise exception 'Expected 38 source age years, got %',n;end if;
 if exists(select 1 from research.impact_visual_point where release_id=rel and model_key='age_structure' and value_status='computed' and (actual not between 0 and 100 or comparison not between 0 and 100)) then raise exception 'Invalid employment percentage';end if;
 if exists(select 1 from research.impact_visual_point where release_id=rel and model_key='age_structure' and value_status='computed' group by baseline_year,year having abs(sum(effect)filter(where group_key<>'FI')-sum(effect)filter(where group_key='FI'))>1e-8) then raise exception 'Age group allocations fail';end if;
 if exists(select 1 from research.impact_visual_point where release_id=rel and model_key<>'age_structure' and value_status='computed' group by model_key,baseline_year,year having abs(sum(effect)-(max(actual)-max((dims->>'baseline_actual')::numeric)))>1e-7) then raise exception 'Three-factor conservation failed';end if;
 select max(abs(v.actual-i.value)) into t from research.impact_visual_point v join public.indicator_values i on i.series_key='fi.atlas1960.household_disposable_real_per_capita' and i.group_key='FI' and i.year=v.year where v.release_id=rel and v.model_key='real_income_components' and v.value_status='computed';
 if t is null or t>1e-6 then raise exception 'Independent stored real-income comparison failed %',t;end if;
 select max(abs(v.actual-1000*g.value/n.value)) into t from research.impact_visual_point v join public.public_finance_observations g on g.series_key='statfin15ai.v20260918.total.b1gmh.u7' and g.year=v.year join public.public_finance_observations n on n.series_key='statfin15ai.v20260918.total.ep.u8' and n.year=v.year where v.release_id=rel and v.model_key='production_components' and v.value_status='computed';
 if t is null or t>1e-6 then raise exception 'Independent GDP/population comparison failed %',t;end if;
 vals:=research.impact_shapley3(array[1,1,1]::numeric[],array[2,3,4]::numeric[]);
 backward:=research.impact_shapley3(array[2,3,4]::numeric[],array[1,1,1]::numeric[]);
 if abs(vals[1]+vals[2]+vals[3]-23)>1e-10 or abs(vals[1]+backward[1])>1e-10 or abs(vals[2]+backward[2])>1e-10 or abs(vals[3]+backward[3])>1e-10 then raise exception 'Synthetic Shapley symmetry test failed';end if;
 if exists(select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='research' and p.proname like 'impact_%' and (p.prosecdef or has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))) then raise exception 'Calculation function exposed or privileged';end if;
 if exists(select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='research' and c.relname like 'impact_%' and c.relkind='r' and not c.relrowsecurity) then raise exception 'New research table lacks RLS';end if;
 if exists(select 1 from research.impact_model_run mr left join research.impact_run_check ck using(computation_run_id) where mr.release_id=rel and ck.output_sha256 is null) then raise exception 'Missing result checksum';end if;
 raise notice 'Impact tests passed: 32 themes, 5632 cells, age regression, independent income comparison, conservation, synthetic symmetry, RLS and private invoker functions';
end $$;
select 'passed' as impact_tests;
