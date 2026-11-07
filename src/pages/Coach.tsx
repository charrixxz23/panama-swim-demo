import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CourseBadge, DemoTag, Field, PageHeader, Time } from "../components/Bits";
import { ProgressChart } from "../components/ProgressChart";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useToday } from "../hooks/useToday";
import { upcoming } from "../services/calendar";
import { categoryFor } from "../services/categories";
import { currentCategory, fullName, personalBests, publicCompetitions, publicSwimmers, swimmerRows } from "../services/queries";
import { compareToStandard, findStandard } from "../services/standards";
import { eventLabel } from "../utils/labels";
import { formatDelta, formatSeconds } from "../utils/time";

/** Vista conceptual de entrenador: progreso de sus atletas DE DEMOSTRACIÓN. Sin acceso a datos privados. */
export default function Coach() {
  usePageMeta("Vista de entrenador");
  const { data, ix } = useData();
  const today = useToday();
  const [params, setParams] = useSearchParams();
  const coach = data.coaches.find((c) => c.id === params.get("entrenador")) ?? data.coaches[0];
  const athletes = publicSwimmers(data).filter((s) => s.clubId === coach.clubId);
  const focusId = params.get("atleta") ?? athletes[0]?.id;
  const target = upcoming(publicCompetitions(data), today).find((c) => data.standards.some((s) => s.competitionId === c.id));

  const rows = useMemo(
    () =>
      athletes.map((s) => {
        const hist = swimmerRows(data, s.id, ix);
        const bests = personalBests(hist);
        // Mejora: primera vs. mejor marca en la prueba más disputada (misma piscina).
        const top = [...bests].sort((a, b) => b.races - a.races)[0];
        const firstOk = top ? hist.find((r) => r.result.status === "OK" && r.event.distance === top.distance && r.event.stroke === top.stroke && r.course === top.course) : undefined;
        const gain = top && firstOk ? firstOk.result.timeMs! - top.timeMs : null;
        // Marca mínima más cercana en la próxima competencia con marcas.
        let nearest: { label: string; diffMs: number } | null = null;
        if (target) {
          const cat = categoryFor(data.categories, s.birthYear, target.startDate);
          for (const b of bests.filter((x) => x.course === target.course)) {
            const std = cat ? findStandard(data.standards, { competitionId: target.id, categoryId: cat, gender: s.gender, distance: b.distance, stroke: b.stroke, course: b.course }) : undefined;
            if (!std) continue;
            const c = compareToStandard(b.timeMs, std.timeMs);
            if (!nearest || c.diffMs < nearest.diffMs) nearest = { label: eventLabel(b.distance, b.stroke), diffMs: c.diffMs };
          }
        }
        return { s, hist, top, gain, nearest, races: hist.length };
      }),
    [athletes, data, ix, target],
  );
  const focus = rows.find((r) => r.s.id === focusId) ?? rows[0];
  const series = focus?.top ? focus.hist.filter((r) => r.result.status === "OK" && r.event.distance === focus.top!.distance && r.event.stroke === focus.top!.stroke && r.course === focus.top!.course) : [];

  return (
    <>
      <PageHeader
        title="Vista de entrenador"
        intro={
          <>
            Concepto de cómo un entrenador seguiría el progreso de sus atletas. Sin inicio de sesión ni datos privados: solo atletas ficticios. <DemoTag>Demostración</DemoTag>
          </>
        }
      />
      <div className="wrap py-8">
        <div className="panel grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Field label="Entrenador (ficticio)" htmlFor="co-sel">
            <select id="co-sel" className="field" value={coach.id} onChange={(e) => setParams({ entrenador: e.target.value }, { replace: true })}>
              {data.coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {ix.club.get(c.clubId)?.shortName}
                </option>
              ))}
            </select>
          </Field>
          <div className="text-sm text-muted sm:self-end">
            {target ? (
              <>
                Marcas mínimas de referencia:{" "}
                <Link className="link" to={`/competencias/${target.id}`}>
                  {target.name}
                </Link>{" "}
                (ficticias).
              </>
            ) : (
              "No hay próximas competencias con marcas mínimas."
            )}
          </div>
        </div>

        <div className="table-wrap mt-6">
          <table className="data-table">
            <caption className="sr-only">Atletas de {ix.club.get(coach.clubId)?.name}</caption>
            <thead>
              <tr>
                <th scope="col">Atleta</th>
                <th scope="col">Categoría</th>
                <th scope="col">Carreras</th>
                <th scope="col">Prueba principal</th>
                <th scope="col">Mejora en la temporada</th>
                <th scope="col">Marca mínima más cercana</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.s.id} className={r.s.id === focus?.s.id ? "bg-brand/5" : undefined}>
                  <td>
                    <button type="button" className="text-left font-semibold hover:text-brand" onClick={() => setParams({ entrenador: coach.id, atleta: r.s.id }, { replace: true })} aria-pressed={r.s.id === focus?.s.id}>
                      {fullName(r.s)}
                    </button>
                  </td>
                  <td>{currentCategory(data, r.s, today)}</td>
                  <td className="time">{r.races}</td>
                  <td>
                    {r.top ? (
                      <span className="flex items-center gap-2">
                        {eventLabel(r.top.distance, r.top.stroke)} <CourseBadge course={r.top.course} /> <Time ms={r.top.timeMs} />
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className={`time ${r.gain && r.gain > 0 ? "text-ok" : "text-muted"}`}>{r.gain === null ? "—" : r.gain === 0 ? "0.00" : formatDelta(-r.gain)}</td>
                  <td>
                    {r.nearest ? (
                      <span>
                        {r.nearest.label}:{" "}
                        <span className={`time ${r.nearest.diffMs <= 0 ? "text-ok" : ""}`}>{r.nearest.diffMs <= 0 ? "alcanzada" : `faltan ${formatSeconds(r.nearest.diffMs)} s`}</span>
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {focus?.top && (
          <section className="panel mt-6 p-5 sm:p-6" aria-labelledby="h-foco">
            <h2 id="h-foco" className="h-card flex flex-wrap items-center gap-2">
              {fullName(focus.s)}: {eventLabel(focus.top.distance, focus.top.stroke)} <CourseBadge course={focus.top.course} />
            </h2>
            <ProgressChart title={`Progresión de ${fullName(focus.s)}`} points={series.map((r) => ({ date: r.date, competition: ix.comp.get(r.result.competitionId)!.name, timeMs: r.result.timeMs! }))} height={240} />
            <Link to={`/nadadores/${focus.s.id}`} className="link mt-2 inline-block text-sm">
              Abrir el perfil
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
