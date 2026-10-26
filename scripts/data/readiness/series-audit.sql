-- Read-only inventory. Eligibility means a review candidate, never approved evidence.
WITH vals AS (
 SELECT series_key,year,group_key,period,value,value_kind,validation_status,is_published,source_url,source_version,source_retrieved_at,
 (meta::text ~* 'uncertainty|standard.error|confidence.interval|lower.bound|upper.bound') has_uncertainty,
 (meta::text ~* 'break|katkos|comparab|vertailukelp') has_comparability, (value is not null and value::text not in ('NaN','Infinity','-Infinity')) finite,
 (value_kind='observed' and validation_status in ('source_verified','source_snapshot_checked','reviewed','validated','pdf_table_visually_checked','official_source_claim_checked') and is_published and value is not null and value::text not in ('NaN','Infinity','-Infinity') and coalesce(source_url,'') ~ '^https?://') candidate
 FROM public.indicator_values v
), gs AS (
 SELECT series_key,group_key,count(*) rows,count(distinct year) years,
 count(distinct year) filter(where candidate and year between 1850 and 2025) candidate_years,
 min(year) filter(where candidate and year between 1850 and 2025) candidate_start,
 max(year) filter(where candidate and year between 1850 and 2025) candidate_end,
 count(distinct year) filter(where candidate and year between 1850 and 1917) p1,
 count(distinct year) filter(where candidate and year between 1918 and 1945) p2,
 count(distinct year) filter(where candidate and year between 1946 and 1975) p3,
 count(distinct year) filter(where candidate and year between 1976 and 1995) p4,
 count(distinct year) filter(where candidate and year between 1996 and 2025) p5,
 count(distinct year) filter(where candidate and year between 1850 and 2025 and coalesce(period,'') not in ('','annual','year','vuosi')) period_label_years
 FROM vals GROUP BY series_key,group_key
), dup AS (
 SELECT series_key,sum(n-1) exact_cell_extra_rows FROM (
 SELECT series_key,year,group_key,period,count(*) n FROM vals GROUP BY series_key,year,group_key,period HAVING count(*)>1) d GROUP BY series_key
), collisions AS (
 SELECT series_key,count(*) multirow_groupyears FROM (
 SELECT series_key,year,group_key FROM vals GROUP BY series_key,year,group_key HAVING count(*)>1)d GROUP BY series_key
), va AS (
 SELECT series_key,count(*) value_rows,count(*) filter(where finite) numeric_rows,
 count(*) filter(where value is null) null_numeric_rows,
 count(*) filter(where value is not null and not finite) nonfinite_rows,
 count(*) filter(where not coalesce(is_published,false)) unpublished_rows,
 count(*) filter(where coalesce(source_url,'') !~ '^https?://') missing_row_url_rows,
 count(*) filter(where source_version is null or source_version='') missing_version_rows,
 count(*) filter(where source_retrieved_at is null) missing_retrieved_rows,
 count(*) filter(where value_kind='observed') observed_rows,
 count(*) filter(where value_kind='estimate') estimate_rows,
 count(*) filter(where value_kind='projection') projection_rows,
 count(*) filter(where candidate and year between 1850 and 2025) candidate_rows,
 min(year) first_year,max(year) last_year,
 array_agg(distinct value_kind) kinds,array_agg(distinct validation_status) validations,
 array_agg(distinct period) periods,
 md5(string_agg(concat_ws('|',year,group_key,period,value::text,value_kind),E'\n' order by year,group_key,period,value::text,value_kind)) values_digest,
 count(*) filter(where has_uncertainty) uncertainty_metadata_rows,
 count(*) filter(where has_comparability) comparability_metadata_rows
 FROM vals GROUP BY series_key
), ga AS (
 SELECT series_key,count(*) group_count,max(candidate_years) best_candidate_years,
 count(*) filter(where candidate_years>=10 and candidate_years>=0.8*(candidate_end-candidate_start+1)) dense_candidate_groups,
 max(p1) p1_best,max(p2) p2_best,max(p3) p3_best,max(p4) p4_best,max(p5) p5_best,
 (array_agg(group_key order by candidate_years desc,group_key))[1] best_group_key
 FROM gs GROUP BY series_key
), links AS (
 SELECT vi.series_key,array_agg(distinct tv.theme_id) linked_theme_ids
 FROM public.atlas_variable_indicators vi JOIN public.atlas_theme_variables tv USING(variable_id) GROUP BY vi.series_key
)
SELECT s.series_key,s.title,s.description,s.unit,s.geography,s.frequency,s.data_class,s.status,s.theme,s.source,s.source_url,s.published,s.start_year declared_start,s.end_year declared_end,s.quality,s.metadata,
 to_jsonb(va)-'series_key' value_audit,to_jsonb(ga)-'series_key' group_audit,
 coalesce(dup.exact_cell_extra_rows,0) exact_cell_extra_rows,coalesce(collisions.multirow_groupyears,0) multirow_groupyears,
 coalesce(links.linked_theme_ids,'{}') linked_theme_ids,
 (select to_jsonb(g)-'series_key' from gs g where g.series_key=s.series_key order by candidate_years desc,group_key limit 1) best_group
FROM public.indicator_series s LEFT JOIN va USING(series_key) LEFT JOIN ga USING(series_key) LEFT JOIN dup USING(series_key) LEFT JOIN collisions USING(series_key) LEFT JOIN links USING(series_key)
ORDER BY s.series_key
