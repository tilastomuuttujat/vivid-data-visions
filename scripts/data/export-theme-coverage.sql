WITH periods(a,b) AS (VALUES (1850,1917),(1918,1945),(1946,1975),(1976,1994),(1995,2007),(2008,2025)),
mapping AS (SELECT DISTINCT tv.theme_id,vi.series_key,vi.relation_type FROM public.atlas_theme_variables tv JOIN public.atlas_variable_indicators vi USING(variable_id)),
obs AS (SELECT m.theme_id,v.series_key,p.a,p.b,count(*) n,count(DISTINCT v.year) years,
count(*) FILTER(WHERE v.value_kind='observed') observed,
count(*) FILTER(WHERE v.value_kind='estimate') estimated,
count(*) FILTER(WHERE v.value_kind='projection') projected,
jsonb_agg(DISTINCT v.validation_status) validation,
jsonb_agg(DISTINCT v.group_key) groups,
jsonb_agg(DISTINCT v.year ORDER BY v.year) available_years,
jsonb_agg(DISTINCT v.year ORDER BY v.year) FILTER(WHERE v.value_kind='observed') observed_years,
jsonb_agg(DISTINCT v.year ORDER BY v.year) FILTER(WHERE v.value_kind='estimate') estimate_years
FROM (SELECT DISTINCT theme_id,series_key FROM mapping)m JOIN public.indicator_series s USING(series_key) JOIN public.indicator_values v USING(series_key)
JOIN periods p ON v.year BETWEEN p.a AND p.b WHERE s.published AND v.is_published AND v.value IS NOT NULL GROUP BY m.theme_id,v.series_key,p.a,p.b)
SELECT jsonb_build_object('captured_at',now(),'project_ref','zzbubbrsgiqsvsovkkmf',
'themes',(SELECT jsonb_agg(jsonb_build_object('id',id,'name',payload->>'name','question',payload->>'test') ORDER BY id) FROM public.atlas_themes),
'mappings',(SELECT jsonb_agg(m ORDER BY theme_id,series_key,relation_type) FROM mapping m),
'series',(SELECT jsonb_agg(jsonb_build_object('series_key',series_key,'title',title,'unit',unit,'source_url',source_url,'data_class',data_class,'quality',quality) ORDER BY series_key) FROM public.indicator_series WHERE published AND series_key IN (SELECT series_key FROM mapping)),
'inventory',(SELECT jsonb_agg(o ORDER BY theme_id,a,series_key) FROM obs o)) AS payload;
