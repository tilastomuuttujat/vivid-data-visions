import { MainLinks } from "@/components/MainLinks";
import { Link } from "@tanstack/react-router";
import { RecoveryMap } from "./RecoveryMap";
import { CrisisManagement } from "./CrisisManagement";
import { WorkMobility } from "./WorkMobility";
import { GroupOpportunity } from "./GroupOpportunity";
import { RegionalOverlap } from "./RegionalOverlap";
import { LocalAdaptation } from "./LocalAdaptation";
import { WorkOpportunity } from "./WorkOpportunity";
import { CareCapacity } from "./CareCapacity";
import { HouseholdImpact } from "./HouseholdImpact";
import { BudgetPower } from "./BudgetPower";
import { StructuralChoices } from "./StructuralChoices";
import { FamilyPolicy } from "./FamilyPolicy";
import { LawTimeline } from "./LawTimeline";
import { PoliticalGate } from "./PoliticalGate";
import { FinlandValue } from "./FinlandValue";
import { SsabComparison } from "./SsabComparison";
import { StoraOwnership } from "./StoraOwnership";
import { SharedTimeline } from "./SharedTimeline";
import { TimelineProvider } from "./timeline-context";
import { PublicDebt } from "./PublicDebt";
import { HousingWealth } from "./HousingWealth";
import { RedistributionPath } from "./RedistributionPath";
import { RegionalPath } from "./RegionalPath";
import { ProductivityPath } from "./ProductivityPath";
import { MechanismExplorer } from "./MechanismExplorer";
import { HistoricalTurning } from "./HistoricalTurning";
import { LongPath } from "./LongPath";
import { TransitionPath } from "./TransitionPath";
import { OwnershipPath } from "./OwnershipPath";
import { StoraComparison } from "./StoraComparison";
import { ThemeGroup } from "./ThemeGroup";
import { SystemEngine } from "./SystemEngine";
import { StoryPath } from "./StoryPath";

const TOC = [
  ["teema-aikajana", "Aikajana ja lait"],
  ["teema-teollisuus", "Teollisuus ja omistus"],
  ["teema-tyo", "Työ ja perheet"],
  ["teema-talous", "Julkinen talous ja alueet"],
  ["teema-mekanismit", "Mekanismit"],
] as const;

export function Laboratorio() {
  const go = (id: string) => {
    const d = document.getElementById(id) as HTMLDetailsElement | null;
    if (d) {
      d.open = true;
      d.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  return (
    <TimelineProvider>
      <div className="varaan planeetta lab">
        <div className="v-aurora" aria-hidden />
        <div className="pl-wrap">
          <header className="v-top">
            <span className="v-kicker">Tutkimuslaboratorio · aikasarjat ja lähteet</span>
            <nav className="pl-nav">
              <MainLinks exclude="/laboratorio" />
            </nav>
          </header>
          <div className="lab-hero">
            <h1 className="pl-title">
              Kartan alla on <em>mitattu maaperä</em>
            </h1>
            <p>
              Planeetta näyttää tulkitut rakenteet. Täällä ovat aikasarjat, lait ja lähteet, joiden
              varaan tulkinnat nojaavat. Samanaikaisuus ei yksin osoita syy-yhteyttä — jokaisen
              kuvaajan alla kerrotaan tulkinnan raja.
            </p>
          </div>
          <SystemEngine />
          <StoryPath />
          <div className="lab-layout">
            <aside className="lab-toc">
              <p className="v-kicker">Teemat</p>
              <ol>
                {TOC.map(([id, n], i) => (
                  <li key={id}>
                    <button onClick={() => go(id)}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {n}
                    </button>
                  </li>
                ))}
              </ol>
            </aside>
            <main className="lab-main">
              <div className="pl-themes-bar lab-bar">
                <p className="v-kicker">Syventävät analyysit · viisi teemaa</p>
                <div>
                  <button
                    onClick={() =>
                      document
                        .querySelectorAll<HTMLDetailsElement>(".pl-theme")
                        .forEach((d) => (d.open = true))
                    }
                  >
                    Avaa kaikki
                  </button>
                  <button
                    onClick={() =>
                      document
                        .querySelectorAll<HTMLDetailsElement>(".pl-theme")
                        .forEach((d) => (d.open = false))
                    }
                  >
                    Sulje kaikki
                  </button>
                </div>
              </div>
              <ThemeGroup
                id="teema-aikajana"
                index={1}
                span="1850–2050"
                title="Yhteinen aikajana ja lainsäädäntö"
                lead="Lait, poliittiset murroskohdat ja rakenteelliset valinnat, joiden varaan myöhemmät polut syntyivät."
                tags={["Aikajana", "Lait", "Murroskohdat", "Valinnat"]}
                open
              >
                <SharedTimeline />
                <LawTimeline />
                <div id="timeline-historical">
                  <HistoricalTurning />
                  <PoliticalGate />
                </div>
                <StructuralChoices />
              </ThemeGroup>
              <ThemeGroup
                id="teema-teollisuus"
                index={2}
                span="Omistus · arvo · tuottavuus"
                title="Teollisuus, yritykset ja omistus"
                lead="Omistuksen polut, valtion rooli ja teollisuuden murrokset Stora Enson ja SSAB:n kautta."
                tags={["Omistus", "Stora Enso", "SSAB", "Tuottavuus"]}
              >
                <LongPath />
                <TransitionPath />
                <OwnershipPath />
                <StoraOwnership />
                <SsabComparison />
                <FinlandValue />
                <StoraComparison />
                <div id="timeline-productivity">
                  <ProductivityPath />
                </div>
              </ThemeGroup>
              <ThemeGroup
                id="teema-tyo"
                index={3}
                span="Työ · perhe · koti"
                title="Työ, toimeentulo ja perheet"
                lead="Työmahdollisuudet, liikkuvuus, perhepolitiikka, hoiva ja kotitalouksien arki."
                tags={["Työ", "Perheet", "Hoiva", "Asuminen"]}
              >
                <div id="timeline-work-opportunity">
                  <WorkOpportunity />
                </div>
                <div id="timeline-group-opportunity">
                  <GroupOpportunity />
                </div>
                <div id="timeline-work-mobility">
                  <WorkMobility />
                </div>
                <div id="family-policy">
                  <FamilyPolicy />
                </div>
                <div id="timeline-care">
                  <CareCapacity />
                </div>
                <div id="timeline-households">
                  <HouseholdImpact />
                </div>
                <div id="timeline-housing">
                  <HousingWealth />
                </div>
              </ThemeGroup>
              <ThemeGroup
                id="teema-talous"
                index={4}
                span="Budjetti · kriisit · alueet"
                title="Julkinen talous, kriisit ja alueet"
                lead="Velka, budjettivalta, tulonjako, kriisien hoito ja alueiden sopeutuminen."
                tags={["Velka", "Budjetti", "Kriisit", "Alueet"]}
              >
                <div id="timeline-debt">
                  <PublicDebt />
                </div>
                <div id="timeline-budget">
                  <BudgetPower />
                </div>
                <div id="timeline-redistribution">
                  <RedistributionPath />
                </div>
                <div id="timeline-crises">
                  <CrisisManagement />
                </div>
                <div id="timeline-recovery">
                  <RecoveryMap />
                </div>
                <div id="timeline-regional">
                  <RegionalPath />
                </div>
                <div id="timeline-regional-overlap">
                  <RegionalOverlap />
                </div>
                <div id="timeline-local-adaptation">
                  <LocalAdaptation />
                </div>
              </ThemeGroup>
              <ThemeGroup
                id="teema-mekanismit"
                index={5}
                span="Synteesi"
                title="Mekanismit ja palautesilmukat"
                lead="Kokoa havainnot syy–seurausketjuiksi: mikä vahvistaa, mikä jarruttaa, mikä lukitsee."
                tags={["Mekanismit", "Ketjut", "Silmukat"]}
              >
                <MechanismExplorer />
              </ThemeGroup>
            </main>
          </div>
        </div>
      </div>
    </TimelineProvider>
  );
}
