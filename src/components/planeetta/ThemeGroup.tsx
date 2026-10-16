import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
  const [expanded, setExpanded] = useState(Boolean(open));
  const [mounted, setMounted] = useState(Boolean(open));
  const targets = useMemo(() => {
    const ids = new Set([id]);
    const visit = (nodes: ReactNode) =>
      Children.forEach(nodes, (child) => {
        if (!isValidElement<{ id?: string; children?: ReactNode }>(child)) return;
        if (child.props.id) ids.add(child.props.id);
        visit(child.props.children);
      });
    visit(children);
    return ids;
  }, [children, id]);
  // Aukaise automaattisesti, jos osoitteen ankkuri osoittaa tämän ryhmän sisälle.
  useEffect(() => {
    const check = () => {
      const h = window.location.hash.split("#").pop();
      if (h && targets.has(h)) {
        setMounted(true);
        setExpanded(true);
        setTimeout(() => document.getElementById(h)?.scrollIntoView?.({ block: "start" }), 0);
      }
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [targets]);
  return (
    <details
      ref={ref}
      id={id}
      className="pl-theme"
      open={expanded}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        setExpanded(next);
        if (next) setMounted(true);
      }}
    >
      <summary>
        <span className="pl-theme-no">{String(index).padStart(2, "0")}</span>
        <span className="pl-theme-head">
          <span className="v-kicker">{span}</span>
          <h2>{title}</h2>
          <p>{lead}</p>
          <span className="pl-theme-tags">
            {tags.map((t) => (
              <i key={t}>{t}</i>
            ))}
          </span>
        </span>
        <span className="pl-theme-toggle" aria-hidden />
      </summary>
      <div className="pl-theme-body">{mounted ? children : null}</div>
    </details>
  );
}
