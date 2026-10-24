import { createFileRoute } from "@tanstack/react-router";
import { Dekompositio } from "@/components/dekompositio/Dekompositio";
export const Route = createFileRoute("/dekompositio")({
  head: () => ({
    meta: [
      { title: "Dekompositio — mistä BKT asukasta kohti on kasvanut?" },
      { name: "description", content: "Tilastokeskuksen aineistoon perustuva Shapley-hajotelma: tuottavuus, työtunnit ja työllisyys 1975–2025." },
      { property: "og:title", content: "Dekompositio — mistä BKT asukasta kohti on kasvanut?" },
      { property: "og:description", content: "Tuottavuuden, työtuntien ja työllisyyden laskennallinen osuus tuotannon muutoksesta 1975–2025." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dekompositio,
});
