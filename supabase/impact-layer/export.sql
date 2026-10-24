-- Backend/static-site export. One refresh and one consistent release for all dimensions.
with current_release as materialized (select research.impact_refresh('static_export') release_id)
select jsonb_build_object(
 'schema_version',1,'release_id',r.release_id,'timeline',jsonb_build_object('start',1850,'end',2025),
 'input_sha256',s.content_sha256,'engine_sha256',r.engine_sha256,
 'themes',(select jsonb_agg(jsonb_build_object('id',t->'id','name',t->'payload'->>'name','definition',t->'payload'->>'test') order by (t->>'id')::int) from jsonb_array_elements(s.payload->'themes')t),
 'models',s.payload->'model_catalog','theme_assessments',s.payload->'model_theme_assessments',
 'mechanisms',s.payload->'mechanisms','mechanism_relations',s.payload->'mechanism_relations','stage_mechanisms',s.payload->'stage_mechanisms',
 'coverage',(select jsonb_agg(to_jsonb(c) order by theme_id,year) from research.impact_theme_year c where c.release_id=r.release_id),
 'runs',(select jsonb_agg(jsonb_build_object('model',mr.model_key,'baseline',mr.baseline_year,'output_sha256',ck.output_sha256,'points',(select jsonb_agg(jsonb_build_object('year',p.year,'factor',p.factor_key,'group',p.group_key,'actual',p.actual,'comparison',p.comparison,'effect',p.effect,'status',p.value_status,'missing_reason',p.not_computable_reason,'reference_kind',p.dims->>'reference_kind') order by p.year,p.factor_key,p.group_key) from research.impact_visual_point p where p.release_id=r.release_id and p.model_key=mr.model_key and p.baseline_year=mr.baseline_year)) order by mr.model_key,mr.baseline_year) from research.impact_model_run mr join research.impact_run_check ck using(computation_run_id) where mr.release_id=r.release_id),
 'rules',s.payload->'rules',
 'interpretation','Teemakytkentä ei ole teeman kokonaisvaikutus. Ei eri mallien tai päällekkäisten tekijöiden summia. Null tarkoittaa laskematta jäävää, ei nollavaikutusta.'
)
from current_release cr join research.impact_release r using(release_id) join research.impact_snapshot s using(snapshot_id);
