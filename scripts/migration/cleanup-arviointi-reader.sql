BEGIN;
DROP FUNCTION public.migration_arviointi_page_v1(text,jsonb,integer);
REVOKE SELECT ON "arviointi"."excluded","arviointi"."lens_aggregate","arviointi"."lens_baselines","arviointi"."matrices","arviointi"."overrides" FROM service_role;
REVOKE USAGE ON SCHEMA arviointi FROM service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
