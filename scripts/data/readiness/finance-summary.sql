WITH a AS (
 SELECT series_key,count(*) n,min(year) a,max(year) b,count(distinct year) yrs,
 count(*) filter(where value is null) nulls,
 count(*) filter(where coalesce(source_url,'') !~ '^https?://') no_url,
 count(*) filter(where value_kind='observed' and validation_status='source_verified' and year between 1850 and 2025) checked,
 count(*) filter(where value_kind='observed' and validation_status='import_checked') imported,
 count(*) filter(where validation_status='needs_review') review,
 count(*) filter(where value_kind not in ('observed','estimate')) other,
 count(*) filter(where value_kind='estimate') estimates,
 count(distinct year) filter(where value_kind='observed' and validation_status='source_verified' and year between 1850 and 1917) p1,
 count(distinct year) filter(where value_kind='observed' and validation_status='source_verified' and year between 1918 and 1945) p2,
 count(distinct year) filter(where value_kind='observed' and validation_status='source_verified' and year between 1946 and 1975) p3,
 count(distinct year) filter(where value_kind='observed' and validation_status='source_verified' and year between 1976 and 1995) p4,
 count(distinct year) filter(where value_kind='observed' and validation_status='source_verified' and year between 1996 and 2025) p5
 FROM public.public_finance_observations GROUP BY series_key
)
SELECT s.source_key,s.unit,s.price_basis,s.currency,s.accounting_framework,s.geography_level,
 count(*) series_count,count(*) filter(where a.series_key is null) empty_series,
 coalesce(sum(a.n),0) value_rows,min(a.a) first_year,max(a.b) last_year,
 coalesce(sum(a.checked),0) checked_rows,coalesce(sum(a.imported),0) imported_rows,
 coalesce(sum(a.review),0) review_rows,coalesce(sum(a.estimates),0) estimate_rows,
 coalesce(sum(a.other),0) other_rows,coalesce(sum(a.nulls),0) null_rows,coalesce(sum(a.no_url),0) missing_url_rows,
 count(*) filter(where a.checked>=10) checked_series_10_rows,
 count(*) filter(where a.p1>=55) p1_dense,count(*) filter(where a.p2>=23) p2_dense,
 count(*) filter(where a.p3>=24) p3_dense,count(*) filter(where a.p4>=16) p4_dense,
 count(*) filter(where a.p5>=24) p5_dense,
 count(*) filter(where length(coalesce(s.comparability_notes,''))>0) comparability_note_series,
 count(*) filter(where f.source_sha256 is not null and f.source_sha256<>'') hash_series,
 count(*) filter(where f.source_version is not null and f.source_version<>'') version_series
FROM public.public_finance_series s LEFT JOIN a USING(series_key) LEFT JOIN public.public_finance_sources f USING(source_key)
GROUP BY s.source_key,s.unit,s.price_basis,s.currency,s.accounting_framework,s.geography_level
ORDER BY s.source_key,s.unit,s.price_basis,s.currency,s.accounting_framework,s.geography_level
