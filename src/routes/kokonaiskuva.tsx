import { createFileRoute } from "@tanstack/react-router";
import { Kokonaiskuva } from "@/components/kokonaiskuva/Kokonaiskuva";
export const Route = createFileRoute("/kokonaiskuva")({
  head: () => ({ meta: [{ title: "Kokonaiskuva — miten kasvu kantaa yhteiskuntaa 1850–2050?" }] }),
  component: Kokonaiskuva,
});
