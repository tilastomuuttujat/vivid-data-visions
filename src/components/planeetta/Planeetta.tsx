import { WorkOpportunity } from './WorkOpportunity';
import { CareCapacity } from './CareCapacity';
import { HouseholdImpact } from './HouseholdImpact';
import { BudgetPower } from './BudgetPower';
import { StructuralChoices } from './StructuralChoices';
import { FamilyPolicy } from './FamilyPolicy';
import { LawTimeline } from './LawTimeline';
import { PoliticalGate } from './PoliticalGate';
import { FinlandValue } from './FinlandValue';
import { SsabComparison } from './SsabComparison';
import { StoraOwnership } from './StoraOwnership';
import { SharedTimeline } from './SharedTimeline';
import { TimelineProvider } from './timeline-context';
import { PublicDebt } from './PublicDebt';
import { HousingWealth } from './HousingWealth';
import { RedistributionPath } from './RedistributionPath';
import { RegionalPath } from './RegionalPath';
import { ProductivityPath } from './ProductivityPath';
import { lazy, Suspense, useCallback, useState } from 'react';
import { ClientOnly, Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { LEVELS, type Sel } from './planet-model';
import { PlanetMap } from './PlanetMap';
import { MechanismExplorer } from './MechanismExplorer';
import { HistoricalTurning } from './HistoricalTurning';
import { LongPath } from './LongPath';
import { TransitionPath } from './TransitionPath';
import { OwnershipPath } from './OwnershipPath';
import { StoraComparison } from './StoraComparison';

const PlanetGlobe = lazy(() => import('./PlanetGlobe'));

function Detail({ sel }: { sel: Sel }) {
  if (!sel) return <div className="pl-card"><p className="v-kicker">Miten luetaan</p><h3>Etäisyys vaihtaa tasoa</h3><p>Kaukaa näkyvät vain mannerlaatat — ne perustat, <em>minkä varaan</em> Suomi rakentuu — ja niiden törmäysvyöhykkeet. Lähemmäs mentäessä esiin nousevat klusterit, sitten polut ja lopulta yksittäiset valintapisteet.</p><p className="pl-note">Laattojen ja klustereiden rajaukset ovat tulkintoja, eivät mittauksia.</p></div>;
  if (sel.kind === 'plate') return <div className="pl-card"><p className="v-kicker">Mannerlaatta</p><h3>{sel.plate.name}</h3><p>{sel.plate.text}</p><ul>{sel.plate.clusters.map(c => <li key={c.id}>{c.name} · {c.anchors.length} polkua</li>)}</ul></div>;
  if (sel.kind === 'tension') return <div className="pl-card"><p className="v-kicker">Jännitevyöhyke</p><h3>{sel.t.name}</h3><p>{sel.t.text}</p></div>;
  if (sel.kind === 'cluster') return <div className="pl-card"><p className="v-kicker">Klusteri</p><h3>{sel.c.name}</h3><p>{sel.c.text}</p><ul>{sel.c.anchors.map(a => <li key={a.id}>{a.title.split(' – ')[0]} <span>{a.period}</span></li>)}</ul></div>;
  if (sel.kind === 'path') return <div className="pl-card"><p className="v-kicker">Polku · {sel.a.period}</p><h3>{sel.a.title}</h3><p>{sel.a.question}</p><ol>{sel.a.steps.map((s, i) => <li key={i}><b>{s.years?.[0]}</b> {s.short_title}</li>)}</ol><Link to="/minka-varaan" className="v-back">Katso polku virtana<ArrowRight size={14} /></Link></div>;
  const s = sel.s;
  return <div className="pl-card"><p className="v-kicker">Kairausnäyte · {s.period}</p><h3>{s.title}</h3><p className="pl-sub">{sel.a.title.split(' – ')[0]}</p><dl>
    <dt>Mekanismi</dt><dd>{s.mechanism}</dd><dt>Kuka hyötyi</dt><dd>{s.benefit}</dd><dt>Hinta</dt><dd>{s.tradeoff}</dd><dt>Keneen osui</dt><dd>{s.affected}</dd><dt>Viive</dt><dd>{s.lag}</dd><dt>Toinen selitys</dt><dd>{s.alternative}</dd></dl></div>;
}

export function Planeetta() {
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [sel, setSel] = useState<Sel>(null);
  const [level, setLevel] = useState(0);
  const onLevel = useCallback((l: number) => setLevel(l), []);
  return (
    <TimelineProvider><div className="varaan planeetta">
      <div className="v-aurora" aria-hidden />
      <div className="pl-wrap">
        <header className="v-top"><span className="v-kicker">Planeetta · tarkastelu etäisyyden mukaan</span>
          <nav className="pl-nav"><Link to="/" className="v-back">Atlas</Link><Link to="/minka-varaan" className="v-back">Minkä varaan?</Link><Link to="/observatorio" className="v-back">Observatorio ✦</Link>
            <div className="pl-switch" role="group" aria-label="Versio"><button className={mode === '2d' ? 'on' : ''} onClick={() => setMode('2d')}>2D-kartta</button><button className={mode === '3d' ? 'on' : ''} onClick={() => setMode('3d')}>3D-planeetta</button></div></nav>
        </header>
        <h1 className="pl-title">Mitä lähemmäs menet, <em>sitä syvemmälle näet</em></h1>
        <div className="pl-layout">
          <div className="pl-stage">
            <ol className="pl-alt">{LEVELS.map(l => <li key={l.key} className={l.key === level ? 'on' : ''}><b>{l.name}</b><span>{l.hint}</span></li>)}</ol>
            {mode === '2d' ? <PlanetMap sel={sel} onSel={setSel} onLevel={onLevel} /> :
              <ClientOnly fallback={<div className="pl-map" />}><Suspense fallback={<div className="pl-map" />}><PlanetGlobe sel={sel} onSel={setSel} level={level} onLevel={onLevel} /></Suspense></ClientOnly>}
            <p className="pl-hint">{mode === '2d' ? 'Rulla tai nipistys zoomaa, vedä siirtääksesi, klikkaa sukeltaaksesi.' : 'Vedä pyörittääksesi, rulla lähestyy pintaa, klikkaa laattaa tai pistettä.'}</p>
          </div>
          <aside className="pl-side"><Detail sel={sel} /></aside>
        </div>
        <SharedTimeline />
        <LawTimeline />
        <div id="family-policy"><FamilyPolicy /></div>
        <StructuralChoices />
        <div id="timeline-budget"><BudgetPower /></div>
        <div id="timeline-care"><CareCapacity /></div>
        <div id="timeline-work-opportunity"><WorkOpportunity /></div>
        <div id="timeline-households"><HouseholdImpact /></div>
        <LongPath />
        <TransitionPath />
        <OwnershipPath />
        <StoraOwnership />
        <SsabComparison />
        <FinlandValue />
        <StoraComparison />
        <div id="timeline-regional"><RegionalPath /></div>
        <div id="timeline-redistribution"><RedistributionPath /></div>
        <div id="timeline-housing"><HousingWealth /></div>
        <div id="timeline-debt"><PublicDebt /></div>
        <div id="timeline-historical"><HistoricalTurning />
        <PoliticalGate /></div>
        <div id="timeline-productivity"><ProductivityPath /></div>
        <MechanismExplorer />
      </div>
    </div></TimelineProvider>
  );
}
