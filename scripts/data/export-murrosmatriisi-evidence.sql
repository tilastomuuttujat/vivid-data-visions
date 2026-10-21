-- Read-only, one MVCC snapshot. Execute with the authenticated SQL connector.
-- Save the snapshot column as JSON and pass it to import-murrosmatriisi-evidence.py.
WITH selected AS (
 SELECT id,title,year_start,year_end,status,revision,published,updated_at,
 jsonb_build_object('summary',data->'summary','alternatives',data->'alternatives',
 'counterevidence',data->'counterevidence','limits',data->'limits',
 'deepened_evidence_20261021',data->'deepened_evidence_20261021',
 'decision_implementation_20261021',data->'decision_implementation_20261021') AS data
 FROM public.atlas_mechanism_cases
 WHERE published AND data ? 'deepened_evidence_20261021'
), episodes AS (
 SELECT e FROM selected CROSS JOIN LATERAL jsonb_array_elements(data->'deepened_evidence_20261021'->'episodes') e
), refs AS (
 SELECT DISTINCT m->>'series_key' AS series_key,(o->>'year')::int AS year,m->>'group_key' AS group_key
 FROM episodes CROSS JOIN LATERAL jsonb_array_elements(e->'metrics') m
 CROSS JOIN LATERAL jsonb_array_elements(m->'observations') o
 UNION
 SELECT DISTINCT o->'source_row'->>'series_key',(o->'source_row'->>'year')::int,o->'source_row'->>'group_key'
 FROM episodes CROSS JOIN LATERAL jsonb_array_elements(e->'period_evidence') p
 CROSS JOIN LATERAL jsonb_array_elements(p->'observations') o
), source_values AS (
 SELECT r.*,v.period,v.value,v.value_kind,v.validation_status,v.is_published,v.source_url,v.source_version
 FROM refs r LEFT JOIN public.indicator_values v USING(series_key,year,group_key)
), source_series AS (
 SELECT series_key,title,source,source_url,unit,frequency,data_class,geography,quality,metadata,published
 FROM public.indicator_series WHERE series_key IN (SELECT series_key FROM refs)
)
SELECT jsonb_build_object('schemaVersion',1,'projectRef','zzbubbrsgiqsvsovkkmf',
 'capturedAt',to_char(current_timestamp AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
 'cases',coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY year_start,id) FROM selected c),'[]'::jsonb),
 'series',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY series_key) FROM source_series s),'[]'::jsonb),
 'values',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY series_key,year,group_key) FROM source_values v),'[]'::jsonb)
) AS snapshot;
