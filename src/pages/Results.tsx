import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CourseBadge, DemoTag, Empty, Field, PageHeader, StatusBadge, Time } from "../components/Bits";
import type { Stroke } from "../models";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { fullName, publicCompetitions, publicResults } from "../services/queries";
import { rankEvent, type RankedResult } from "../services/results";
import { formatRange } from "../utils/dates";
import { COURSES, eventLabel, GENDERS, STROKES } from "../utils/labels";
import { matchesAll } from "../utils/text";
import { formatDelta } from "../utils/time";

const PAGE = 10;

export default function Results() {
  usePageMeta("Resultados");
  const { data, ix } = useData();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);
  const p = (k: string) => params.get(k) ?? "";
  const f = {
    competencia: p("competencia"),
    anio: p("anio"),
    prueba: p("prueba"),
    distancia: p("distancia"),
    estilo: p("estilo"),
    categoria: p("categoria"),
    club: p("club"),
    nadador: p("nadador"),
    q: p("q"),
    piscina: p("piscina"),
  };
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
    setLimit(PAGE);
  };

  const comps = publicCompetitions(data);
  const results = publicResults(data);
  const compsWithResults = comps.filter((c) => results.some((r) => r.competitionId === c.id)).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const years = [...new Set(compsWithResults.map((c) => c.startDate.slice(0, 4)))].sort().reverse();
  const swimmer = f.nadador ? ix.swimmer.get(f.nadador) : undefined;

  const groups = useMemo(() => {
    const byEvent = new Map<string, typeof results>();
    for (const r of results) byEvent.set(r.eventId, [...(byEvent.get(r.eventId) ?? []), r]);
    const out: { eventId: string; rows: RankedResult[] }[] = [];
    for (const [eventId, list] of byEvent) {
      const e = ix.event.get(eventId)!;
      const c = ix.comp.get(e.competitionId)!;
      if (f.competencia && c.id !== f.competencia) continue;
      if (f.anio && !c.startDate.startsWith(f.anio)) continue;
      if (f.prueba && e.id !== f.prueba) continue;
      if (f.distancia && e.distance !== Number(f.distancia)) continue;
      if (f.estilo && e.stroke !== f.estilo) continue;
      if (f.categoria && e.categoryId !== f.categoria) continue;
      if (f.piscina && c.course !== f.piscina) continue;
      // La posición se calcula con TODOS los resultados de la prueba; después se filtra por club o atleta.
      const ranked = rankEvent(list).filter((r) => {
        const s = ix.swimmer.get(r.swimmerId)!;
        if (f.club && s.clubId !== f.club) return false;
        if (f.nadador && s.id !== f.nadador) return false;
        if (f.q && !matchesAll(fullName(s), f.q)) return false;
        return true;
      });
      if (ranked.length) out.push({ eventId, rows: ranked });
    }
    return out.sort((a, b) => {
      const ea = ix.event.get(a.eventId)!;
      const eb = ix.event.get(b.eventId)!;
      const ca = ix.comp.get(ea.competitionId)!;
      const cb = ix.comp.get(eb.competitionId)!;
      return cb.startDate.localeCompare(ca.startDate) || ea.number - eb.number;
    });
  }, [results, ix, f.competencia, f.anio, f.prueba, f.distancia, f.estilo, f.categoria, f.piscina, f.club, f.nadador, f.q]);

  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const active = Object.values(f).some(Boolean);
  const compEvents = f.competencia ? data.events.filter((e) => e.competitionId === f.competencia && results.some((r) => r.eventId === e.id)) : [];
  const distances = [...new Set(data.events.map((e) => e.distance))].sort((a, b) => a - b);

  return (
    <>
      <PageHeader
        title="Resultados"
        intro={
          <>
            Centro de resultados de las competencias demostrativas. La posición y la diferencia se calculan por prueba; DQ, DNS y DNF no reciben tiempo. <DemoTag>Resultados ficticios</DemoTag>
          </>
        }
      />
      <div className="wrap py-8">
        <div className="panel grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
          <Field label="Competencia" htmlFor="r-comp">
            <select id="r-comp" className="field" value={f.competencia} onChange={(e) => set({ competencia: e.target.value, prueba: null })}>
              <option value="">Todas</option>
              {compsWithResults.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Año" htmlFor="r-anio">
            <select id="r-anio" className="field" value={f.anio} onChange={(e) => set({ anio: e.target.value })}>
              <option value="">Todos</option>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </Field>
          <Field label="Prueba" htmlFor="r-prueba" hint={f.competencia ? undefined : "Elija antes una competencia"}>
            <select id="r-prueba" className="field" value={f.prueba} disabled={!f.competencia} onChange={(e) => set({ prueba: e.target.value })}>
              <option value="">Todas</option>
              {compEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.number}. {eventLabel(e.distance, e.stroke)} {e.gender} {e.categoryId}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Distancia" htmlFor="r-dist">
            <select id="r-dist" className="field" value={f.distancia} onChange={(e) => set({ distancia: e.target.value })}>
              <option value="">Todas</option>
              {distances.map((d) => (
                <option key={d} value={d}>
                  {d} m
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estilo" htmlFor="r-estilo">
            <select id="r-estilo" className="field" value={f.estilo} onChange={(e) => set({ estilo: e.target.value })}>
              <option value="">Todos</option>
              {(Object.keys(STROKES) as Stroke[]).map((s) => (
                <option key={s} value={s}>
                  {STROKES[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Categoría" htmlFor="r-cat">
            <select id="r-cat" className="field" value={f.categoria} onChange={(e) => set({ categoria: e.target.value })}>
              <option value="">Todas</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Club" htmlFor="r-club">
            <select id="r-club" className="field" value={f.club} onChange={(e) => set({ club: e.target.value })}>
              <option value="">Todos</option>
              {data.clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Atleta" htmlFor="r-q">
            {swimmer ? (
              <div className="field flex items-center justify-between gap-2">
                <span className="truncate">{fullName(swimmer)}</span>
                <button type="button" className="text-sm font-semibold text-brand" onClick={() => set({ nadador: null })} aria-label="Quitar el filtro de atleta">
                  Quitar
                </button>
              </div>
            ) : (
              <input id="r-q" type="search" className="field" placeholder="Nombre" value={f.q} onChange={(e) => set({ q: e.target.value })} />
            )}
          </Field>
          <Field label="Piscina" htmlFor="r-piscina">
            <select id="r-piscina" className="field" value={f.piscina} onChange={(e) => set({ piscina: e.target.value })}>
              <option value="">25 m y 50 m</option>
              <option value="LCM">{COURSES.LCM.long}</option>
              <option value="SCM">{COURSES.SCM.long}</option>
            </select>
          </Field>
          <div className="flex items-end">
            {active && (
              <button type="button" className="btn btn-ghost w-full" onClick={() => setParams({}, { replace: true })}>
                Quitar filtros
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
          {total.toLocaleString("es-PA")} {total === 1 ? "resultado" : "resultados"} en {groups.length} {groups.length === 1 ? "prueba" : "pruebas"}
        </p>

        <div data-tour="results-table" className="mt-4 space-y-8">
          {groups.length === 0 && <Empty title="Ningún resultado coincide">Quite algún filtro o elija otra competencia.</Empty>}
          {groups.slice(0, limit).map(({ eventId, rows }) => {
            const e = ix.event.get(eventId)!;
            const c = ix.comp.get(e.competitionId)!;
            return (
              <section key={eventId} aria-label={`${eventLabel(e.distance, e.stroke)} ${GENDERS[e.gender]} ${e.categoryId}, ${c.name}`}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="h-card">
                    {eventLabel(e.distance, e.stroke)} · {GENDERS[e.gender].toLowerCase()} {e.categoryId}
                  </h2>
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Link to={`/competencias/${c.id}`} className="hover:text-brand">
                      {c.name}
                    </Link>
                    · {formatRange(c.startDate, c.endDate)} <CourseBadge course={c.course} />
                  </p>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col" className="w-14">
                          Pos.
                        </th>
                        <th scope="col">Nadador</th>
                        <th scope="col">Club</th>
                        <th scope="col">Prueba</th>
                        <th scope="col">Tiempo</th>
                        <th scope="col">Dif. con el 1.º</th>
                        <th scope="col">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const s = ix.swimmer.get(r.swimmerId)!;
                        return (
                          <tr key={r.id} className={f.nadador === s.id ? "bg-brand/5" : undefined}>
                            <td className="time">{r.place ?? "—"}</td>
                            <td>
                              <Link to={`/nadadores/${s.id}`} className="font-semibold hover:text-brand">
                                {fullName(s)}
                              </Link>
                              {r.source === "importado" && <span className="ml-2 text-xs text-muted">(importado)</span>}
                            </td>
                            <td className="text-muted">{ix.club.get(s.clubId)?.shortName}</td>
                            <td className="whitespace-nowrap">
                              {e.distance} {STROKES[e.stroke].toLowerCase()}
                              <span className="text-muted"> · S{r.heat} C{r.lane}</span>
                            </td>
                            <td>{r.timeMs !== null ? <Time ms={r.timeMs} /> : <span className="text-muted">—</span>}</td>
                            <td className="time text-muted">{r.behindMs === null ? "—" : r.behindMs === 0 ? "0.00" : formatDelta(r.behindMs)}</td>
                            <td>
                              <StatusBadge status={r.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
          {groups.length > limit && (
            <button type="button" className="btn btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
              Mostrar más pruebas ({groups.length - limit})
            </button>
          )}
        </div>
      </div>
    </>
  );
}
