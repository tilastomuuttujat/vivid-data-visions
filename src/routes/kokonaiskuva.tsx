import { createFileRoute } from "@tanstack/react-router";
import { Kokonaiskuva } from "@/components/kokonaiskuva/Kokonaiskuva";
export const Route = createFileRoute("/kokonaiskuva")({
  head: () => ({ meta: [{ title: "Erotus · kokonaiskuva — ikärakenteen vaikutus 1850–2050" }] }),
  component: Kokonaiskuva,
});
