import { createFileRoute } from '@tanstack/react-router';
import { Observatorio } from '@/components/observatorio/Observatorio';
export const Route = createFileRoute('/observatorio')({
  head: () => ({ meta: [
    { title: 'Observatorio — Suomen murrokset tähtitaivaana 1850–2050' },
    { name: 'description', content: 'Iso kuva: 32 teemaa ja 16 polkua tähtitaivaana, neljä suurta aaltoa, kiintotähdet ja aikaviiveitä mittaava sekstantti.' },
    { property: 'og:title', content: 'Observatorio — mennyt ohjausjärjestelmänä' },
    { property: 'og:description', content: 'Kantavat solmut, toimeenpanolukot ja isot aallot yhdellä silmäyksellä.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Observatorio,
});
