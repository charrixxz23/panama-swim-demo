import { Search } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DemoTag, Empty, Field, PageHeader } from "../components/Bits";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useToday } from "../hooks/useToday";
import { currentCategory, fullName, publicResults, publicSwimmers } from "../services/queries";
import { GENDERS } from "../utils/labels";
import { matchesAll } from "../utils/text";

export default function Swimmers() {
  usePageMeta("Nadadores");
  const { data, ix } = useData();
  const today = useToday();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const club = params.get("club") ?? "";
  const cat = params.get("categoria") ?? "";
  const rama = params.get("rama") ?? "";
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of publicResults(data)) m.set(r.swimmerId, (m.get(r.swimmerId) ?? 0) + 1);
    return m;
  }, [data]);

  const list = publicSwimmers(data)
    .map((s) => ({ s, cat: currentCategory(data, s, today) }))
    .filter(({ s, cat: c }) => (!q || matchesAll(fullName(s), q)) && (!club || s.clubId === club) && (!cat || c === cat) && (!rama || s.gender === rama))
    .sort((a, b) => a.s.lastName.localeCompare(b.s.lastName, "es"));

  return (
    <>
      <PageHeader
        title="Nadadores"
        intro={
          <>
            Perfiles de demostración. Todos los nombres son ficticios y no se publican fechas de nacimiento, documentos ni contactos. <DemoTag>Atletas ficticios</DemoTag>
          </>
        }
      />
      <div className="wrap py-8">
        <div className="panel grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4" data-tour="swimmer-search">
          <Field label="Buscar nadador" htmlFor="sw-q">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input id="sw-q" type="search" className="field pl-9" placeholder="Nombre o apellido" value={q} onChange={(e) => set("q", e.target.value)} />
            </div>
          </Field>
          <Field label="Club" htmlFor="sw-club">
            <select id="sw-club" className="field" value={club} onChange={(e) => set("club", e.target.value)}>
              <option value="">Todos</option>
              {data.clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Categoría actual" htmlFor="sw-cat">
            <select id="sw-cat" className="field" value={cat} onChange={(e) => set("categoria", e.target.value)}>
              <option value="">Todas</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rama" htmlFor="sw-rama">
            <select id="sw-rama" className="field" value={rama} onChange={(e) => set("rama", e.target.value)}>
              <option value="">Ambas</option>
              <option value="F">{GENDERS.F}</option>
              <option value="M">{GENDERS.M}</option>
            </select>
          </Field>
        </div>
        <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
          {list.length === 1 ? "1 nadador" : `${list.length} nadadores`}
        </p>
        {list.length === 0 ? (
          <div className="mt-4">
            <Empty title="Ningún nadador coincide">Revise la ortografía o quite filtros.</Empty>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(({ s, cat: c }) => (
              <li key={s.id}>
                <Link to={`/nadadores/${s.id}`} className="panel group flex items-center gap-4 p-4 hover:border-brand">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy font-display text-lg font-semibold text-pool" aria-hidden="true">
                    {s.firstName[0]}
                    {s.lastName[0]}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold group-hover:text-brand">{fullName(s)}</span>
                    <span className="block text-sm text-muted">
                      {ix.club.get(s.clubId)?.shortName} · {c ?? "sin categoría"} · {GENDERS[s.gender]}
                    </span>
                    <span className="block text-xs text-muted">{counts.get(s.id) ?? 0} resultados</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
