import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  id: string;
  index: number;
  title: string;
  lead: string;
  span: string;
  tags: string[];
  open?: boolean;
  children: ReactNode;
};

/** Teemahaitari: tiivis esikatselu suljettuna, analyysit avattuna. */
export function ThemeGroup({ id, index, title, lead, span, tags, open, children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  // Aukaise automaattisesti, jos osoitteen ankkuri osoittaa tämän ryhmän sisälle.
  useEffect(() => {
    const check = () => {
      const h = window.location.hash.split('#').pop();
      if (h && ref.current?.querySelector(`#${CSS.escape(h)}`)) ref.current.open = true;
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);
  return (
    <details ref={ref} id={id} className="pl-theme" open={open}>
      <summary>
        <span className="pl-theme-no">{String(index).padStart(2, '0')}</span>
        <span className="pl-theme-head">
          <span className="v-kicker">{span}</span>
          <h2>{title}</h2>
          <p>{lead}</p>
          <span className="pl-theme-tags">{tags.map(t => <i key={t}>{t}</i>)}</span>
        </span>
        <span className="pl-theme-toggle" aria-hidden />
      </summary>
      <div className="pl-theme-body">{children}</div>
    </details>
  );
}
