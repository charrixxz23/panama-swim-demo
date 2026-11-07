import { Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CourseBadge, DemoTag, StatusBadge, Time } from "../components/Bits";
import { ProgressChart } from "../components/ProgressChart";
import { NotFoundState } from "../components/States";
import type { Course } from "../models";
import { eventKey } from "../models";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useToday } from "../hooks/useToday";
import { categoryFor } from "../services/categories";
import { currentCategory, fullName, personalBests, publicResults, swimmerRows } from "../services/queries";
import { rankEvent } from "../services/results";
import { findStandard } from "../services/standards";
import { formatDate } from "../utils/dates";
import { COURSES, eventLabel, GENDERS } from "../utils/labels";
import { formatDelta } from "../utils/time";

export default function SwimmerPage() {
  const { id = "" } = useParams();
  const { data, ix } = useData();
  const today = useToday();
  const s = ix.swimmer.get(id);
  usePageMeta(s ? fullName(s) : "Nadador no encontrado");
  const rows = useMemo(() => (s ? swimmerRows(data, s.id, ix) : []), [data, ix, s]);
  const bests = useMemo(() => personalBests(rows), [rows]);
  const [sel, setSel] = useState<string>("");
  const [target, setTarget] = useState<string>("auto");

  // Posición de cada resultado dentro de su prueba.
  const places = useMemo(() => {
    const m = new Map<string, number | null>();
    const all = publicResults(data);
    for (const r of rows) {
      const ranked = rankEvent(all.filter((x) => x.eventId === r.result.eventId));
      m.set(r.result.id, ranked.find((x) => x.id === r.result.id)?.place ?? null);
    }
    return m;
  }, [data, rows]);

  if (!s || !s.published) return <NotFoundState title="Nadador no encontrado" text="Ese perfil no existe en la demo." to="/nadadores" cta="Ver nadadores" />;

  const cat = currentCategory(data, s, today);
  const club = ix.club.get(s.clubId)!;
  const selected = bests.find((b) => b.key === sel) ?? bests.find((b) => b.key === eventKey(100, "LIBRE", "LCM")) ?? bests[0];
  const series = selected ? rows.filter((r) => r.event.distance === selected.distance && r.event.stroke === selected.stroke && r.course === selected.course) : [];
  const valid = series.filter((r) => r.result.status === "OK" && r.result.timeMs !== null);

  // Marcas mínimas aplicables a la prueba seleccionada (misma prueba, misma piscina, categoría en la fecha de esa competencia).
  const targets = selected
    ? data.competitions
        .filter((c) => c.published && c.course === selected.course && data.standards.some((x) => x.competitionId === c.id))
        .map((c) => {
          const catThen = categoryFor(data.categories, s.birthYear, c.startDate);
          const std = catThen ? findStandard(data.standards, { competitionId: c.id, categoryId: catThen, gender: s.gender, distance: selected.distance, stroke: selected.stroke, course: selected.course }) : undefined;
          return std ? { c, std } : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x)
        .filter(({ c }) => c.endDate >= today)
    : [];
  const chosenTarget = target === "none" ? undefined : target === "auto" ? targets[0] : targets.find((t) => t.c.id === target);

  const byCourse = (course: Course) => bests.filter((b) => b.course === course);
  const disputed = [...new Set(rows.map((r) => `${eventLabel(r.event.distance, r.event.stroke)} (${COURSES[r.course].short})`))];
  const byComp = [...new Set(rows.map((r) => r.result.competitionId))].map((cid) => ({ c: ix.comp.get(cid)!, list: rows.filter((r) => r.result.competitionId === cid) })).reverse();

  return (
    <>
      <header className="bg-navy text-white">
        <div className="wrap flex flex-wrap items-center gap-6 py-10">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-pool font-display text-3xl font-bold text-navy" aria-hidden="true">
            {s.firstName[0]}
            {s.lastName[0]}
          </span>
          <div className="min-w-0">
            <nav aria-label="Ruta" className="text-sm text-white/70">
              <Link to="/nadadores" className="underline underline-offset-4 hover:text-pool">
                Nadadores
              </Link>
            </nav>
            <h1 className="h-page mt-1">{fullName(s)}</h1>
            <p className="mt-1 text-white/80">
              <Link to={`/clubes/${club.id}`} className="underline underline-offset-4 hover:text-pool">
                {club.shortName}
              </Link>{" "}
              · Categoría {cat ?? "sin categoría"} · {GENDERS[s.gender]}
            </p>
            <p className="mt-2 inline-flex rounded-full border border-dashed border-white/40 px-2.5 py-0.5 text-xs font-semibold text-white/85">
              Perfil ficticio: sin fecha de nacimiento, documentos ni contacto
            </p>
          </div>
        </div>
        <div className="lane-rope rounded-none" aria-hidden="true" />
      </header>

      <div className="wrap py-10">
        <section aria-labelledby="h-mejores" data-tour="best-times">
          <h2 id="h-mejores" className="h-section">
            Mejores marcas personales
          </h2>
          <p className="mt-1 text-sm text-muted">Separadas por piscina: una marca de 25 m no se compara con una de 50 m.</p>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {(["LCM", "SCM"] as Course[]).map((course) => (
              <div key={course} className="min-w-0">
                <h3 className="h-card flex items-center gap-2">
                  {COURSES[course].long} <CourseBadge course={course} />
                </h3>
                {byCourse(course).length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Sin marcas en esta piscina.</p>
                ) : (
                  <div className="table-wrap mt-2">
                    <table className="data-table !min-w-[30rem]">
                      <thead>
                        <tr>
                          <th scope="col">Prueba</th>
                          <th scope="col">Marca</th>
                          <th scope="col">Dónde</th>
                          <th scope="col">
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {byCourse(course).map((b) => (
                          <tr key={b.key}>
                            <td className="font-semibold">{eventLabel(b.distance, b.stroke)}</td>
                            <td>
                              <Time ms={b.timeMs} className="text-base" />
                            </td>
                            <td className="text-muted">
                              {ix.comp.get(b.result.competitionId)?.name}
                              <span className="block text-xs">{formatDate(b.date)}</span>
                            </td>
                            <td className="text-right">
                              <Link
                                to={`/marcas-minimas?nadador=${s.id}&prueba=${b.distance}-${b.stroke}&piscina=${b.course}`}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                                aria-label={`Comparar ${eventLabel(b.distance, b.stroke)} con una marca mínima`}
                              >
                                <Scale className="h-4 w-4" aria-hidden="true" /> Comparar
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {selected && (
          <section id="progreso" className="mt-12" aria-labelledby="h-progreso">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="h-progreso" className="h-section">
                Progresión
              </h2>
              <div className="flex flex-wrap gap-3">
                <label className="text-sm">
                  <span className="font-semibold">Prueba</span>
                  <select className="field" value={selected.key} onChange={(e) => (setSel(e.target.value), setTarget("auto"))}>
                    {bests.map((b) => (
                      <option key={b.key} value={b.key}>
                        {eventLabel(b.distance, b.stroke)} · {COURSES[b.course].short}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-semibold">Marca mínima de referencia</span>
                  <select className="field" value={target} onChange={(e) => setTarget(e.target.value)} disabled={targets.length === 0}>
                    {targets.length === 0 && <option value="auto">No hay marcas para esta prueba</option>}
                    {targets.length > 0 && <option value="auto">{targets[0].c.name}</option>}
                    {targets.slice(1).map((t) => (
                      <option key={t.c.id} value={t.c.id}>
                        {t.c.name}
                      </option>
                    ))}
                    {targets.length > 0 && <option value="none">Sin marca de referencia</option>}
                  </select>
                </label>
              </div>
            </div>
            <div className="panel mt-4 p-4 sm:p-6" data-tour="progress-chart">
              <p className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                {eventLabel(selected.distance, selected.stroke)} <CourseBadge course={selected.course} />
                {chosenTarget && <DemoTag>Marca mínima ficticia</DemoTag>}
              </p>
              <ProgressChart
                title={`Progresión de ${fullName(s)} en ${eventLabel(selected.distance, selected.stroke)}, ${COURSES[selected.course].long}`}
                points={valid.map((r) => ({ date: r.date, competition: ix.comp.get(r.result.competitionId)!.name, timeMs: r.result.timeMs! }))}
                standardMs={chosenTarget?.std.timeMs}
              />
            </div>

            <h3 className="h-card mt-8">Comparación entre competencias</h3>
            <div className="table-wrap mt-3">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Competencia</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Tiempo</th>
                    <th scope="col">Vs. anterior</th>
                    <th scope="col">Vs. mejor marca</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((r, i) => {
                    const prev = series.slice(0, i).reverse().find((x) => x.result.status === "OK");
                    const d = r.result.timeMs !== null && prev ? r.result.timeMs - prev.result.timeMs! : null;
                    const toBest = r.result.timeMs !== null ? r.result.timeMs - selected.timeMs : null;
                    return (
                      <tr key={r.result.id}>
                        <td className="font-semibold">{ix.comp.get(r.result.competitionId)?.name}</td>
                        <td className="text-muted">{formatDate(r.date)}</td>
                        <td>{r.result.timeMs !== null ? <Time ms={r.result.timeMs} /> : "—"}</td>
                        <td className={`time ${d === null ? "text-muted" : d < 0 ? "text-ok" : d > 0 ? "text-signal" : ""}`}>
                          {d === null ? "—" : formatDelta(d)}
                          {d !== null && d < 0 && <span className="sr-only"> (mejora)</span>}
                        </td>
                        <td className="time text-muted">{toBest === null ? "—" : toBest === 0 ? "Mejor marca" : formatDelta(toBest)}</td>
                        <td>
                          <StatusBadge status={r.result.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section aria-labelledby="h-historial" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="h-historial" className="h-section">
                Historial competitivo
              </h2>
              <Link to={`/resultados?nadador=${s.id}`} className="link text-sm">
                Ver en el centro de resultados
              </Link>
            </div>
            {byComp.length === 0 && <p className="mt-3 text-muted">Aún no tiene resultados publicados.</p>}
            <ol className="mt-4 space-y-4">
              {byComp.map(({ c, list }) => (
                <li key={c.id} className="panel p-4">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    <Link to={`/competencias/${c.id}`} className="hover:text-brand">
                      {c.name}
                    </Link>
                    <CourseBadge course={c.course} />
                  </p>
                  <p className="text-xs text-muted">{formatDate(c.startDate)}</p>
                  <ul className="mt-3 divide-y divide-line text-sm">
                    {list.map((r) => {
                      const place = places.get(r.result.id);
                      return (
                        <li key={r.result.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                          <span>
                            {eventLabel(r.event.distance, r.event.stroke)} <span className="text-muted">({r.event.categoryId})</span>
                          </span>
                          <span className="flex items-center gap-3">
                            {place ? <span className="text-muted">{place}.º</span> : null}
                            {r.result.timeMs !== null ? <Time ms={r.result.timeMs} /> : null}
                            <StatusBadge status={r.result.status} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
          <aside aria-labelledby="h-disputadas" className="min-w-0">
            <h2 id="h-disputadas" className="h-section">
              Pruebas disputadas
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {disputed.map((d) => (
                <li key={d} className="rounded-full bg-raised px-3 py-1 text-sm font-medium">
                  {d}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </>
  );
}
