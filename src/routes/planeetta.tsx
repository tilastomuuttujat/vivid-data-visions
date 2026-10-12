import { createFileRoute } from '@tanstack/react-router';
import { Planeetta } from '@/components/planeetta/Planeetta';
export const Route = createFileRoute('/planeetta')({
  head: () => ({ meta: [
    { title: 'Planeetta — Suomen rakenteet etäisyyden mukaan' },
    { name: 'description', content: 'Zoomattava 2D-kartta ja 3D-planeetta: mannerlaatoista klustereihin, poluista yksittäisiin valintapisteisiin.' },
    { property: 'og:title', content: 'Planeetta — mitä lähemmäs menet, sitä syvemmälle näet' },
    { property: 'og:description', content: 'Mekanismit kaukaa, ketjut ja tarinat läheltä.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Planeetta,
});
