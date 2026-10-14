import { createFileRoute } from '@tanstack/react-router';
import { Laboratorio } from '@/components/planeetta/Laboratorio';
export const Route = createFileRoute('/laboratorio')({
  head: () => ({ meta: [
    { title: 'Tutkimuslaboratorio — Suomen rakenteiden aikasarjat' },
    { name: 'description', content: 'Lait, omistus, työ, julkinen talous ja mekanismit aikasarjoina ja lähteineen.' },
    { property: 'og:title', content: 'Tutkimuslaboratorio — kartan alla on mitattu maaperä' },
    { property: 'og:description', content: 'Aikasarjat ja lähteet Planeetan tulkintojen takana.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Laboratorio,
});
