import { createFileRoute } from "@tanstack/react-router";
import { Kehityskaari } from "@/components/kaari/Kehityskaari";
export const Route = createFileRoute("/kehityskaari")({
  head: () => ({
    meta: [
      { title: "Kehityskaari — kolme voimaa, seitsemän käännettä 1860–2050" },
      { name: "description", content: "Suomen kehitys kolmena voimalinjana ja seitsemänä käänteenä; syvätasolla tilastot ja säädökset." },
      { property: "og:title", content: "Kehityskaari — Suomen kehitys yhdellä silmäyksellä" },
      { property: "og:description", content: "Tulkinnallinen kehityskaari 1860–2050, jonka taustalta aukeavat tilastot ja säädökset." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kehityskaari,
});
