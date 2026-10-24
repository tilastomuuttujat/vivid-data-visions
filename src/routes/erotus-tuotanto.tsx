import { createFileRoute } from "@tanstack/react-router";
import { ErotusTuotanto } from "@/components/erotus-tuotanto/ErotusTuotanto";
export const Route = createFileRoute("/erotus-tuotanto")({
  head: () => ({
    meta: [
      { title: "Erotus · tuotanto — mitatut osuudet pääkäyrällä 1850–2050" },
      { name: "description", content: "Tuottavuuden, työtuntien ja työllisyyden mitattu osuus peilattuna yhteiskunnan kokonaiskäyrään." },
      { property: "og:title", content: "Erotus · tuotanto — mitä tuotannon osatekijä tekee kokonaisuudelle?" },
      { property: "og:description", content: "Shapley-jako Tilastokeskuksen aineistosta, kytkettynä 1850–2050-pääkäyrään." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ErotusTuotanto,
});
