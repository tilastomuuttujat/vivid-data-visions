import { createFileRoute } from "@tanstack/react-router";
import { ErotusTulot } from "@/components/erotus-tulot/ErotusTulot";
export const Route = createFileRoute("/erotus-tulot")({
  head: () => ({ meta: [{ title: "Erotus — mistä kotitalouden tulomuutos syntyy?" }] }),
  component: ErotusTulot,
});
