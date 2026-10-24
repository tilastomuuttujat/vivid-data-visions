import { createFileRoute } from "@tanstack/react-router";
import { Erotus } from "@/components/erotus/Erotus";
export const Route = createFileRoute("/erotus")({
  head: () => ({
    meta: [
      { title: "Erotusanalyysi — tekijän vaikutus kokonaisuuteen 1860–2050" },
      { name: "description", content: "Valitse voima, alavirta tai väestöryhmä ja näe sen erotus yhteiskunnan kokonaiskäyrään." },
      { property: "og:title", content: "Erotusanalyysi — mitä yksi tekijä tekee kokonaisuudelle?" },
      { property: "og:description", content: "Varjostettu erotus kokonaiskäyrän ja valitun tekijän välillä 1860–2050." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Erotus,
});
