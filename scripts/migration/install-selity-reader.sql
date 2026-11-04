BEGIN;
CREATE FUNCTION public.migration_selity_page_v1(p_table text,p_after jsonb DEFAULT NULL,p_limit integer DEFAULT 200)
RETURNS json LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $body$
DECLARE q text; result json;
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'Service role required' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>500 THEN RAISE EXCEPTION 'Invalid page limit'; END IF;
 IF p_after IS NOT NULL THEN
   IF jsonb_typeof(p_after)<>'array' OR jsonb_array_length(p_after)<>1 OR p_after->>0 IS NULL THEN
     RAISE EXCEPTION 'Invalid cursor';
   END IF;
 END IF;
 CASE p_table
 WHEN 'selitysatlas.categories' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."categories" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.contested_explanations' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."contested_explanations" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.decisions' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."decisions" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.dictionary' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."term"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."dictionary" WHERE ($1 IS NULL OR "term" > ($1->>0)::text) ORDER BY "term" LIMIT $2) r';
WHEN 'selitysatlas.evidence_levels' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."evidence_levels" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.exogenous_events' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."exogenous_events" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.explanation_components' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."explanation_components" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.generations' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."generations" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.hypotheses' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."hypotheses" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.mechanisms' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."mechanisms" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.meta' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."meta" WHERE ($1 IS NULL OR "id" > ($1->>0)::boolean) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.models' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."models" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.open_issues' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."open_issues" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.questions' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."questions" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.relations' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."relations" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.sources' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."sources" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.stories' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."stories" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'selitysatlas.themes' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "selitysatlas"."themes" WHERE ($1 IS NULL OR "id" > ($1->>0)::text) ORDER BY "id" LIMIT $2) r';
WHEN 'public.infographics' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "public"."infographics" WHERE ($1 IS NULL OR "id" > ($1->>0)::bigint) ORDER BY "id" LIMIT $2) r';
WHEN 'public.selitysatlas_links' THEN q := 'SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "public"."selitysatlas_links" WHERE ($1 IS NULL OR "id" > ($1->>0)::bigint) ORDER BY "id" LIMIT $2) r';
 ELSE RAISE EXCEPTION 'Table not allowed';
 END CASE;
 EXECUTE q INTO result USING p_after,p_limit;
 RETURN result;
END;
$body$;
REVOKE ALL ON FUNCTION public.migration_selity_page_v1(text,jsonb,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.migration_selity_page_v1(text,jsonb,integer) TO service_role;
GRANT USAGE ON SCHEMA selitysatlas TO service_role;
GRANT SELECT ON "selitysatlas"."categories","selitysatlas"."contested_explanations","selitysatlas"."decisions","selitysatlas"."dictionary","selitysatlas"."evidence_levels","selitysatlas"."exogenous_events","selitysatlas"."explanation_components","selitysatlas"."generations","selitysatlas"."hypotheses","selitysatlas"."mechanisms","selitysatlas"."meta","selitysatlas"."models","selitysatlas"."open_issues","selitysatlas"."questions","selitysatlas"."relations","selitysatlas"."sources","selitysatlas"."stories","selitysatlas"."themes" TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
