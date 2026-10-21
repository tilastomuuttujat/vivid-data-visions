import data from "@/data/murrosmatriisi-evidence.json";

export type Observation = {
  year: number;
  value: number;
  value_kind: string;
  validation_status: string;
};
export type Phase = {
  window: [number, number];
  n: number;
  mean: number | null;
  mean_status: string;
  missing_years: number[];
};
export type Comparison = {
  status: string;
  baseline_year?: number;
  endpoint_year?: number;
  absolute_change?: number;
  relative_percent_change?: number | null;
  percentage_point_change?: number | null;
};
export type Metric = {
  series_key: string;
  group_key: string;
  group_label: string;
  title: string;
  unit: string;
  observations: Observation[];
  pre: Phase;
  shock: Phase;
  post: Phase;
  known_break_years: number[];
  source_urls: string[];
  comparability: string;
  shock_vs_baseline: Comparison;
  followup_vs_baseline: Comparison;
};
export type Context = {
  event_key: string;
  event_date: string;
  statute_id: string;
  timing_type: string;
  verification: string;
  interpretation: string;
  primary_source_pending?: boolean;
};
export type PeriodEvidence = {
  title: string;
  unit: string;
  limitation: string;
  not_annual: boolean;
  observations: { period: string; value: number }[];
};
export type Episode = {
  code: string;
  case_id: string;
  title: string;
  pre: [number, number];
  shock: [number, number];
  post: [number, number];
  selection: string;
  metrics: Metric[];
  limitations: string[];
  missing_dimensions: string[];
  followup_right_censored: boolean;
  decision_context: Context[];
  implementation_ids: string[];
  period_evidence: PeriodEvidence[];
};
export type Fact = {
  id: string;
  statement: string;
  fact_kind: string;
  value?: number | null;
  unit?: string;
  approximate?: boolean;
  quantity_text?: string;
  denominator?: string | null;
  validation_status: string;
  source_url: string;
  period: {
    as_of?: string;
    date?: string;
    start?: string;
    end?: string;
    start_year?: number;
    end_year?: number | null;
    year?: number;
    month?: number;
  };
};
export type Implementation = {
  id: string;
  title: string;
  summary: string;
  checked_on: string;
  evidence_level: string;
  statute_ids: string[];
  limitations: string[];
  facts: Fact[];
  sources: { url: string; publisher: string; locator: string; retrieved_on: string }[];
};
export type EvidenceCase = {
  id: string;
  title: string;
  status: string;
  revision: number;
  summary: string;
  alternatives: string;
  counterevidence: string;
  limits: string;
};
type Snapshot = {
  schemaVersion: number;
  counts: {
    cases: number;
    episodes: number;
    comparisons: number;
    implementationRecords: number;
    observations: number;
  };
  source: { capturedAt: string; projectRef: string };
  integrity: { payloadSha256: string };
  cases: EvidenceCase[];
  episodes: Episode[];
  implementationRecords: Implementation[];
};
// Built by the fail-closed Python importer, not arbitrary runtime user JSON.
export const evidence = data as unknown as Snapshot;
export const formatValue = (value: number | null | undefined) =>
  value == null ? "Ei laskettavissa" : value.toLocaleString("fi-FI", { maximumFractionDigits: 2 });
export const periodLabel = (p: Fact["period"]) => {
  if (p.as_of) return `Kertymä tilanteessa ${p.as_of}`;
  if (p.date) return String(p.date);
  if (p.start) return `${p.start}–${p.end ?? "avoin"}`;
  if (p.start_year) return `${p.start_year}–${p.end_year ?? "avoin"}`;
  if (p.year) return `${p.year}${p.month ? `-${String(p.month).padStart(2, "0")}` : ""}`;
  return "Ajankohta ei täsmenny";
};
export const factKind = (kind: string) =>
  kind === "ex_ante_expectation"
    ? "Ennakkoarvio · ei toteuma"
    : kind === "source_availability"
      ? "Tietolähteen saatavuus · ei toteumamittari"
      : "Raportoitu toteutustieto";
export const timingLabel = (type: string) =>
  ({
    issued: "Lain antaminen",
    commencement: "Voimaantulo",
    general_commencement: "Yleinen voimaantulo",
    statutory_commencement: "Säädetty voimaantulo",
    implementation_commencement: "Toimeenpanon aloitus",
    conditional_implementation_deadline: "Ehdollinen toimeenpanon määräaika",
  })[type] ?? type;
export function chartSegments(
  points: Observation[],
  breaks: number[],
  x: (n: number) => number,
  y: (n: number) => number,
) {
  return points
    .map((p, i) => {
      const previous = points[i - 1];
      return `${!previous || p.year !== previous.year + 1 || breaks.some((b) => previous.year < b && b <= p.year) ? "M" : "L"}${x(p.year)},${y(p.value)}`;
    })
    .join(" ");
}
