import { createFileRoute } from "@tanstack/react-router";
import { Selityspolku } from "@/components/selityspolku/Selityspolku";
export const Route = createFileRoute("/selityspolku")({
  head: () => ({ meta: [{ title: "Selityspolku — tuotanto, työ ja toimeentulo 1850–2050" }] }),
  component: Selityspolku,
});
