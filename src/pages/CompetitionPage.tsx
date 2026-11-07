import { FileText, MapPin, Timer } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CourseBadge, DemoTag, Time } from "../components/Bits";
import { NotFoundState } from "../components/States";
import type { CategoryId } from "../models";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useToday } from "../hooks/useToday";
import { PHASE_LABEL, phase, REGISTRATION_LABEL, registrationState } from "../services/calendar";
import { publicResults } from "../services/queries";
import { findStandard } from "../services/standards";
import { formatDate, formatRange } from "../utils/dates";
import { COMP_TYPES, COURSES, eventLabel, GENDERS } from "../utils/labels";

export default function CompetitionPage() {
  const { id = "" } = useParams();
  const { data, ix } = useData();
  const today = useToday();
  const c = ix.comp.get(id);
  usePageMeta(c?.name ?? "Competencia no encontrada");
  const [cat, setCat] = useState<CategoryId | "">("");
  if (!c || !c.published)
    return <NotFoundState title="Competencia no encontrada" text="No existe o aún no está publicada." to="/calendario" cta="Ver el calendario" />;

  const pool = ix.pool.get(c.poolId)!;
  const ph = phase(c, today);
  const reg = registrationState(c, today);
  const events = data.events.filter((e) => e.competitionId === c.id && (!cat || e.categoryId === cat)).sort((a, b) => a.number - b.number);
  const results = publicResults(data).filter((r) => r.competitionId === c.id);
  const hasStandards = data.standards.some((s) => s.competitionId === c.id && s.published);

  return (
    <>
      <header className="relative overflow-hidden bg-navy text-white">
        <div className="wrap py-10" data-tour="comp-header">
          <nav aria-label="Ruta" className="text-sm text-white/70">
            <Link to="/calendario" className="underline underline-offset-4 hover:text-pool">
              Calendario
            </Link>
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">{COMP_TYPES[c.type]}</span>
            <span className="rounded-full bg-pool px-2.5 py-1 text-xs font-bold text-navy">{COURSES[c.course].long}</span>
            <span className="rounded-full border border-dashed border-white/40 px-2.5 py-1 text-xs font-semibold text-white/80">Competencia ficticia</span>
          </div>
          <h1 className="h-page mt-3 max-w-4xl">{c.name}</h1>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-white/60">Fecha</dt>
              <dd className="mt-0.5 font-semibold">{formatRange(c.startDate, c.endDate)}</dd>
            </div>
            <div>
              <dt className="text-white/60">Lugar</dt>
              <dd className="mt-0.5 flex items-start gap-1 font-semibold">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pool" aria-hidden="true" />
                <span>
                  {pool.name}, {pool.city} ({pool.province}){" "}
                  <span className="font-normal text-white/70">{pool.real ? "· instalación real" : "· sede ficticia"}</span>
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-white/60">Piscina</dt>
              <dd className="mt-0.5 font-semibold">{COURSES[c.course].long}</dd>
            </div>
            <div>
              <dt className="text-white/60">Estado</dt>
              <dd className="mt-0.5 font-semibold" data-testid="comp-status">
                {ph === "finalizada" ? PHASE_LABEL.finalizada : `${PHASE_LABEL[ph]} · ${REGISTRATION_LABEL[reg]}`}
              </dd>
              <dd className="text-white/70">
                Inscripción: {formatDate(c.registration.opens, { day: "numeric", month: "short" })} – {formatDate(c.registration.closes, { day: "numeric", month: "short", year: "numeric" })}
              </dd>
            </div>
          </dl>
        </div>
        <div className="lane-rope rounded-none" aria-hidden="true" />
      </header>

      <div className="wrap grid gap-10 py-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="h-pruebas" className="min-w-0" data-tour="comp-events">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="h-pruebas" className="h-section">
              Pruebas y requisitos
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Categoría</span>
              <select className="field !mt-0 !min-h-[40px] w-auto" value={cat} onChange={(e) => setCat(e.target.value as CategoryId | "")}>
                <option value="">Todas</option>
                {c.categories.map((k) => (
                  <option key={k} value={k}>
                    {data.categories.find((x) => x.id === k)?.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <h3 className="h-card mt-6">Requisitos</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {c.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h3 className="h-card mt-8">Programa de pruebas</h3>
          {hasStandards && <p className="mt-1 text-sm text-muted">La columna «Marca mínima» muestra marcas ficticias de la demo.</p>}
          <div className="table-wrap mt-3">
            <table className="data-table">
              <caption className="sr-only">Pruebas de {c.name}</caption>
              <thead>
                <tr>
                  <th scope="col">N.º</th>
                  <th scope="col">Prueba</th>
                  <th scope="col">Rama</th>
                  <th scope="col">Categoría</th>
                  {hasStandards && <th scope="col">Marca mínima</th>}
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const std = hasStandards ? findStandard(data.standards, { competitionId: c.id, categoryId: e.categoryId, gender: e.gender, distance: e.distance, stroke: e.stroke, course: c.course }) : undefined;
                  return (
                    <tr key={e.id}>
                      <td className="time text-muted">{e.number}</td>
                      <td className="font-semibold">{eventLabel(e.distance, e.stroke)}</td>
                      <td>{GENDERS[e.gender]}</td>
                      <td>{e.categoryId}</td>
                      {hasStandards && <td>{std ? <Time ms={std.timeMs} /> : <span className="text-muted">Sin marca</span>}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="min-w-0 space-y-6">
          <section className="panel p-5" aria-labelledby="h-res">
            <h2 id="h-res" className="h-card flex items-center gap-2">
              <Timer className="h-5 w-5 text-brand" aria-hidden="true" /> Resultados
            </h2>
            {results.length ? (
              <>
                <p className="mt-2 text-sm text-muted">
                  {results.length} resultados publicados. <DemoTag>Ficticios</DemoTag>
                </p>
                <Link to={`/resultados?competencia=${c.id}`} className="btn btn-primary mt-4 w-full">
                  Ver resultados
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                {ph === "finalizada"
                  ? "Resultados pendientes de publicación. Se pueden cargar desde Administración con un CSV validado."
                  : "La competencia aún no se ha disputado."}
              </p>
            )}
            {hasStandards && (
              <Link to={`/marcas-minimas?competencia=${c.id}`} className="link mt-4 inline-block text-sm">
                Comparar mi tiempo con sus marcas mínimas
              </Link>
            )}
          </section>
          <section className="panel p-5" aria-labelledby="h-docs">
            <h2 id="h-docs" className="h-card flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" aria-hidden="true" /> Documentos
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.documents.map((d) => (
                <li key={d.title}>
                  {d.url ? (
                    <a href={d.url} className="link" target="_blank" rel="noopener noreferrer">
                      {d.title}
                    </a>
                  ) : (
                    <span>
                      {d.title} <span className="block text-xs text-muted">No disponible: en una versión oficial aquí iría el PDF publicado.</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section className="panel p-5 text-sm" aria-labelledby="h-cats">
            <h2 id="h-cats" className="h-card">
              Categorías
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {c.categories.map((k) => (
                <li key={k} className="rounded-full bg-raised px-2.5 py-1 font-semibold">
                  {k}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-2 text-muted">
              Piscina: <CourseBadge course={c.course} />
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
