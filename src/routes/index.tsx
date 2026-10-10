import { createFileRoute } from "@tanstack/react-router";
import { Atlas } from '@/components/atlas/Atlas';
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: 'Suomen rakennemuutosten atlas — aikajana, 2D ja 3D' },
    { name: 'description', content: 'Suomalaisen yhteiskunnan 32 teemaa, kuusi muutoksen vaihetta ja teemojen yhteydet vuosina 1850–2050.' },
    { property: 'og:title', content: 'Suomen rakennemuutosten atlas' },
    { property: 'og:description', content: 'Tutki yhteiskunnan muutoksia kaksi- ja kolmiulotteisella teemakartalla.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Atlas,
});
