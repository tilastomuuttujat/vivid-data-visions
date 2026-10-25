import { Link } from "@tanstack/react-router";
import fiscal from "@/data/research/fiscal-model.json";
import edu from "@/data/research/education-income.json";
import longView from "@/data/research/long-view.json";
import "./measured.css";

/** Measured snapshots linked to editorial factors/turns. Accounting readings, never causal effects. */
const Y0 = 1850, Y1 = 2050, W = 600, H = 90, L = 30, R = 10;
const x = (yr: number) => L + ((yr - Y0) / (Y1 - Y0)) * (W - L - R);

type Pt = { year: number; v: number };
export function fiscalSeries(key: "balance_pct" | "revenue_pct" | "expenditure_pct"): Pt[] {
  return fiscal.points
    .filter((p) => p.status === "computed" && typeof p[key] === "number")
    .map((p) => ({ year: p.year, v: p[key] as number }));
}
export function employmentSeries(education: "78" | "9"): Pt[] {
  return edu.employment.filter((r) => r.education === education).map((r) => ({ year: r.year, v: r.value }));
}
export function periodFor(year: number) {
  return [...longView.periods].reverse().find((p) => Number(p.start) <= year) ?? longView.periods[0]!;
}

const FISCAL = new Set(["velka", "perusturva", "elake", "terveys", "turva", "sopiminen"]);
const EDU = new Set(["koulu", "tki"]);

function Spark({ series, lo, hi, zero }: { series: { pts: Pt[]; cls: string; label: string }[]; lo: number; hi: number; zero?: boolean }) {
  const y = (v: number) => H - 12 - ((v - lo) / (hi - lo)) * (H - 22);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="m-spark" role="img" aria-label={series.map((s) => s.label).join(", ") + " aikajanalla 1850–2050"}>
      <line x1={x(2025)} x2={x(2025)} y1={6} y2={H - 12} className="m-now" />
      {zero && <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} className="m-zero" />}
      {[1850, 1900, 1950, 2000, 2050].map((t) => (
        <text key={t} x={x(t)} y={H - 1} textAnchor="middle" className="m-tick">{t}</text>
      ))}
      <text x={L - 4} y={y(hi) + 4} textAnchor="end" className="m-tick">{hi}</text>
      <text x={L - 4} y={y(lo) + 4} textAnchor="end" className="m-tick">{lo}</text>
      {series.map((s) => (
        <polyline key={s.cls} points={s.pts.map((p) => `${x(p.year)},${y(p.v)}`).join(" ")} className={`m-line ${s.cls}`} />
      ))}
    </svg>
  );
}

const at = (pts: Pt[], yr: number) => pts.find((p) => p.year === yr)?.v;
const f1 = (v?: number) => (v == null ? "–" : (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1).replace(".", ","));

export function hasMeasured(factor: string) {
  return FISCAL.has(factor) || EDU.has(factor);
}

/** Compact measured panel under the editorial curves. */
export function MeasuredEvidence({ factor, year }: { factor?: string; year?: number }) {
  const showFiscal = factor ? FISCAL.has(factor) : year != null && year >= 1970;
  const showEdu = factor ? EDU.has(factor) : false;
  const period = year != null ? periodFor(year) : null;
  if (!showFiscal && !showEdu && !period) return null;
  const bal = fiscalSeries("balance_pct");
  const e78 = employmentSeries("78"), e9 = employmentSeries("9");
  const ratio = edu.ratios.at(-1);
  return (
    <section className="m-box" aria-label="Mitattu näyttö">
      <p className="m-kicker">Mitattu näyttö · kirjanpitoa, ei syyvaikutusta</p>
      {showFiscal && (
        <div className="m-item">
          <h4>Julkisyhteisöjen rahoitusjäämä, % BKT:sta (1975–2025)</h4>
          <Spark series={[{ pts: bal, cls: "m-a", label: "Rahoitusjäämä" }]} lo={-10} hi={10} zero />
          <p>1990 {f1(at(bal, 1990))} · 1993 {f1(at(bal, 1993))} · 2000 {f1(at(bal, 2000))} · 2008 {f1(at(bal, 2008))} · 2024 {f1(at(bal, 2024))}. Lähde StatFin 15ah/15ai; ennen 1975 ja 2025 jälkeen ei havaintoja.</p>
        </div>
      )}
      {showEdu && (
        <div className="m-item">
          <h4>Työllisten osuus koulutusryhmässä, 18–64 v (2010–2024)</h4>
          <Spark series={[{ pts: e78, cls: "m-a", label: "Ylempi korkea-aste" }, { pts: e9, cls: "m-b", label: "Vain perusaste" }]} lo={40} hi={100} />
          <p><span className="m-sw m-a" /> Ylempi korkea-aste {at(e78, 2024)?.toFixed(0) ?? "–"} % · <span className="m-sw m-b" /> perusaste {at(e9, 2024)?.toFixed(0) ?? "–"} % (2024). Tulomediaanien suhde {ratio ? ratio.ratio.toFixed(2).replace(".", ",") : "–"} ({ratio?.year}). Kuvailevaa, ei tutkinnon kausaalivaikutus.</p>
        </div>
      )}
      {period && (
        <div className="m-item">
          <h4>Jakso {period.start}–{period.end}: {period.title}</h4>
          <p>{period.question} <em>Suurin aukko: {period.priority_gap}.</em></p>
        </div>
      )}
      <Link to="/selityspolku" className="m-link">Avaa koko selityspolku ja laskentatavat →</Link>
    </section>
  );
}
