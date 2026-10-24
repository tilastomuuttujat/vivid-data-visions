import { createFileRoute } from '@tanstack/react-router';
import { Teemavertailu } from '@/components/teemavertailu/Teemavertailu';
export const Route = createFileRoute('/teemavertailu')({
  head: () => ({ meta: [
    { title: 'Teemavertailu — Suomen rakennemuutosten atlas' },
    { name: 'description', content: 'Vedä Suomen rakennemuutoksen 32 teemaa samalle aikajanalle ja vertaa niiden vaihekaaria.' },
    { property: 'og:title', content: 'Teemavertailu — Suomen rakennemuutosten atlas' },
    { property: 'og:description', content: 'Vedä teemoja samalle aikajanalle ja vertaa niiden vaihekaaria 1850–2050.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Teemavertailu,
});
