BEGIN;
DROP FUNCTION public.migration_selity_page_v1(text,jsonb,integer);
REVOKE SELECT ON "selitysatlas"."categories","selitysatlas"."contested_explanations","selitysatlas"."decisions","selitysatlas"."dictionary","selitysatlas"."evidence_levels","selitysatlas"."exogenous_events","selitysatlas"."explanation_components","selitysatlas"."generations","selitysatlas"."hypotheses","selitysatlas"."mechanisms","selitysatlas"."meta","selitysatlas"."models","selitysatlas"."open_issues","selitysatlas"."questions","selitysatlas"."relations","selitysatlas"."sources","selitysatlas"."stories","selitysatlas"."themes" FROM service_role;
REVOKE USAGE ON SCHEMA selitysatlas FROM service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
