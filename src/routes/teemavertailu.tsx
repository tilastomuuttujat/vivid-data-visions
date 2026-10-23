import { createFileRoute } from '@tanstack/react-router';
import { Teemavertailu } from '@/components/teemavertailu/Teemavertailu';
export const Route = createFileRoute('/teemavertailu')({
  head: () => ({ meta: [
    { title: 'Teemavertailu — Suomen rakennemuutosten atlas' },
    { name: 'description', content: 'Vertaa Suomen rakennemuutoksen 32 teemaa aikaraidoilla, rinnakkaiskuvaajilla ja selityspoluilla.' },
  ] }),
  component: Teemavertailu,
});
