import { createFileRoute } from "@tanstack/react-router";
import { Aineisto } from "@/components/aineisto/Aineisto";
export const Route = createFileRoute("/aineisto")({
  head: () => ({ meta: [{ title: "Aineisto — julkaistut indikaattorit ja kuvat" }] }),
  component: Aineisto,
});
