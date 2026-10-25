import { Link } from "@tanstack/react-router";

const pages = [
  { to: "/selityspolku", label: "Selityspolku" },
  { to: "/kokonaiskuva", label: "Kokonaiskuva" },
  { to: "/", label: "Atlas" },
  { to: "/minka-varaan", label: "Minkä varaan?" },
  { to: "/observatorio", label: "Observatorio" },
  { to: "/planeetta", label: "Planeetta" },
  { to: "/laboratorio", label: "Laboratorio" },
  { to: "/teemavertailu", label: "Teemavertailu" },
  { to: "/murrokset", label: "Murrokset" },
  { to: "/kehityskaari", label: "Kehityskaari" },
  { to: "/erotus", label: "Erotus" },
  { to: "/erotus-tulot", label: "Erotus · tulot" },
  { to: "/erotus-tuotanto", label: "Erotus · tuotanto" },
] as const;

export function MainLinks({
  exclude,
  className = "v-back",
}: {
  exclude?: string;
  className?: string;
}) {
  return (
    <>
      {pages
        .filter((p) => p.to !== exclude)
        .map((p) => (
          <Link key={p.to} to={p.to} className={className}>
            {p.label}
          </Link>
        ))}
    </>
  );
}
