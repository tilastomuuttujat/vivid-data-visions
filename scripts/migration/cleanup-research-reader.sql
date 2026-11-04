BEGIN;
DROP FUNCTION public.migration_research_page_v1(text,jsonb,integer,integer);
REVOKE SELECT ON "research"."area","research"."area_classification","research"."area_mapping","research"."audit_log","research"."card_citation","research"."card_evidence_assessment","research"."card_section","research"."card_version","research"."claim","research"."claim_version","research"."coverage_assessment","research"."coverage_cell","research"."coverage_evidence","research"."evidence_kind_exception","research"."evidence_link","research"."hypothesis","research"."hypothesis_test","research"."hypothesis_version","research"."indicator","research"."indicator_definition","research"."observation","research"."open_question","research"."period","research"."plot","research"."research_case","research"."research_task","research"."revision_basis","research"."source_locator","research"."source_type" FROM service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
