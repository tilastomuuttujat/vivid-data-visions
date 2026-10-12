import { createFileRoute } from '@tanstack/react-router';
import { Varaan } from '@/components/varaan/Varaan';
export const Route = createFileRoute('/minka-varaan')({
  head: () => ({ meta: [
    { title: 'Minkä varaan Suomi rakentuu? — 16 murrospolkua' },
    { name: 'description', content: 'Havaintomalli siitä, minkä oletusten varaan suomalaiset ratkaisut rakennettiin, mitä ne tuottivat ja mikä piilohinta jäi.' },
    { property: 'og:title', content: 'Minkä varaan Suomi rakentuu?' },
    { property: 'og:description', content: 'Mekanismit, piilohinnat ja viiveet 16 murrospolulla 1866–2045.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Varaan,
});
