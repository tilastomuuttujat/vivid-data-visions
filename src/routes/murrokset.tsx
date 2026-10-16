import { createFileRoute } from '@tanstack/react-router';
import { Murrokset } from '@/components/murrokset/Murrokset';
export const Route = createFileRoute('/murrokset')({
  head: () => ({ meta: [
    { title: 'Murrokset — Suomen käännepisteet ja päätökset 1850–2025' },
    { name: 'description', content: 'Viisi päävaihetta, kymmenen jaksoa ja 116 päätöstä: mikä vahvistui, mikä heikkeni, kuka kantoi riskin.' },
    { property: 'og:title', content: 'Murrokset — yhteisen kantokyvyn metatarina' },
    { property: 'og:description', content: 'Suomen käännepisteet ja lait yhdessä aikajanassa 1850–2025.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Murrokset,
});
