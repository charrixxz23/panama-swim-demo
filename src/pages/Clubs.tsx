import { Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { DemoTag, Empty, Field, PageHeader } from "../components/Bits";
import { PROVINCES } from "../data/reference";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { publicResults, publicSwimmers } from "../services/queries";
import { matchesAll } from "../utils/text";

export default function Clubs() {
  usePageMeta("Clubes");
  const { data } = useData();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const prov = params.get("provincia") ?? "";
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };
  const swimmers = publicSwimmers(data);
  const results = publicResults(data);
  const list = data.clubs.filter((c) => (!q || matchesAll(`${c.name} ${c.province}`, q)) && (!prov || c.province === prov));

  return (
    <>
      <PageHeader
        title="Clubes y entrenadores"
        intro={
          <>
            Directorio de clubes ficticios de la demo. No se publican datos de contacto. La FPN mantiene su propia lista de clubes afiliados en{" "}
            <a className="link" href="https://www.fpnpty.com/miembros-afiliados/clubes-federados" target="_blank" rel="noopener noreferrer">
              su sitio
            </a>
            . <DemoTag>Clubes ficticios</DemoTag>
          </>
        }
      >
        <Link to="/entrenador" className="btn btn-primary mt-5">
          Vista de entrenador
        </Link>
      </PageHeader>
      <div className="wrap py-8">
        <div className="panel grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Field label="Buscar club" htmlFor="cl-q">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input id="cl-q" type="search" className="field pl-9" value={q} placeholder="Nombre" onChange={(e) => set("q", e.target.value)} />
            </div>
          </Field>
          <Field label="Provincia" htmlFor="cl-prov">
            <select id="cl-prov" className="field" value={prov} onChange={(e) => set("provincia", e.target.value)}>
              <option value="">Todas</option>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
          {list.length === 1 ? "1 club" : `${list.length} clubes`}
        </p>
        {list.length === 0 ? (
          <div className="mt-4">
            <Empty title="Ningún club coincide">Pruebe otra provincia o quite la búsqueda.</Empty>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => {
              const members = swimmers.filter((s) => s.clubId === c.id);
              const ids = new Set(members.map((s) => s.id));
              const n = results.filter((r) => ids.has(r.swimmerId)).length;
              return (
                <li key={c.id}>
                  <Link to={`/clubes/${c.id}`} className="panel group block p-5 hover:border-brand">
                    <p className="text-sm font-semibold text-muted">{c.province}</p>
                    <h2 className="h-card mt-1 group-hover:text-brand">{c.name}</h2>
                    <p className="mt-3 text-sm text-muted">
                      {members.length} nadadores · {n} resultados
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
