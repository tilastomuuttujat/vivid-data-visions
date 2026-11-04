BEGIN;
CREATE FUNCTION public.migration_arviointi_page_v1(p_table text,p_after jsonb DEFAULT NULL,p_limit integer DEFAULT 200)
RETURNS json LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $body$
DECLARE q text; result json; expected_keys integer;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Service role required' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>500 THEN RAISE EXCEPTION 'Invalid page limit'; END IF;
 CASE p_table
 WHEN 'arviointi.excluded' THEN expected_keys:=2; q:='SELECT coalesce(json_agg(r ORDER BY r."matrix_id",r."phenomenon_id"), ''[]''::json) FROM (SELECT * FROM "arviointi"."excluded" WHERE ($1 IS NULL OR ROW("matrix_id","phenomenon_id")>ROW(($1->>0)::uuid,($1->>1)::text)) ORDER BY "matrix_id","phenomenon_id" LIMIT $2) r';
WHEN 'arviointi.lens_aggregate' THEN expected_keys:=2; q:='SELECT coalesce(json_agg(r ORDER BY r."phenomenon_id",r."lens_id"), ''[]''::json) FROM (SELECT * FROM "arviointi"."lens_aggregate" WHERE ($1 IS NULL OR ROW("phenomenon_id","lens_id")>ROW(($1->>0)::text,($1->>1)::text)) ORDER BY "phenomenon_id","lens_id" LIMIT $2) r';
WHEN 'arviointi.lens_baselines' THEN expected_keys:=2; q:='SELECT coalesce(json_agg(r ORDER BY r."phenomenon_id",r."lens_id"), ''[]''::json) FROM (SELECT * FROM "arviointi"."lens_baselines" WHERE ($1 IS NULL OR ROW("phenomenon_id","lens_id")>ROW(($1->>0)::text,($1->>1)::text)) ORDER BY "phenomenon_id","lens_id" LIMIT $2) r';
WHEN 'arviointi.matrices' THEN expected_keys:=1; q:='SELECT coalesce(json_agg(r ORDER BY r."id"), ''[]''::json) FROM (SELECT * FROM "arviointi"."matrices" WHERE ($1 IS NULL OR ROW("id")>ROW(($1->>0)::uuid)) ORDER BY "id" LIMIT $2) r';
WHEN 'arviointi.overrides' THEN expected_keys:=3; q:='SELECT coalesce(json_agg(r ORDER BY r."matrix_id",r."phenomenon_id",r."lens_id"), ''[]''::json) FROM (SELECT * FROM "arviointi"."overrides" WHERE ($1 IS NULL OR ROW("matrix_id","phenomenon_id","lens_id")>ROW(($1->>0)::uuid,($1->>1)::text,($1->>2)::text)) ORDER BY "matrix_id","phenomenon_id","lens_id" LIMIT $2) r';
 ELSE RAISE EXCEPTION 'Table not allowed';
 END CASE;
 IF p_after IS NOT NULL THEN
  IF jsonb_typeof(p_after)<>'array' THEN RAISE EXCEPTION 'Invalid cursor'; END IF;
  IF jsonb_array_length(p_after)<>expected_keys OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_after) v WHERE v='null'::jsonb) THEN RAISE EXCEPTION 'Invalid cursor'; END IF;
 END IF;
 EXECUTE q INTO result USING p_after,p_limit;
 RETURN result;
END;
$body$;
REVOKE ALL ON FUNCTION public.migration_arviointi_page_v1(text,jsonb,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.migration_arviointi_page_v1(text,jsonb,integer) TO service_role;
GRANT USAGE ON SCHEMA arviointi TO service_role;
GRANT SELECT ON "arviointi"."excluded","arviointi"."lens_aggregate","arviointi"."lens_baselines","arviointi"."matrices","arviointi"."overrides" TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
