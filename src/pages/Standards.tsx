import { AlertTriangle, CheckCircle2, Info, Timer } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CourseBadge, DemoTag, Field, PageHeader, Time } from "../components/Bits";
import { ProgressChart } from "../components/ProgressChart";
import type { CategoryId, Course, Gender, Stroke } from "../models";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { categoryFor } from "../services/categories";
import { fullName, publicCompetitions, publicSwimmers, swimmerRows } from "../services/queries";
import { bestTime, compareToStandard, findStandard } from "../services/standards";
import { formatDate } from "../utils/dates";
import { COURSES, eventLabel, GENDERS, STROKES } from "../utils/labels";
import { formatSeconds, formatTime, TimeFormatError, parseTime } from "../utils/time";

export default function Standards() {
  usePageMeta("Comparador de marcas mínimas");
  const { data, ix } = useData();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const targetComps = publicCompetitions(data)
    .filter((c) => data.standards.some((s) => s.published && s.competitionId === c.id))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const comp = ix.comp.get(get("competencia")) ?? targetComps.find((c) => !get("piscina") || c.course === get("piscina")) ?? targetComps[0];
  const swimmer = get("nadador") ? ix.swimmer.get(get("nadador")) : undefined;

  // Categoría y rama: del nadador seleccionado (en la fecha de la competencia) o de los selectores.
  const swimmerCat = swimmer && comp ? categoryFor(data.categories, swimmer.birthYear, comp.startDate) : null;
  const categoryId = (swimmer ? swimmerCat : (get("categoria") as CategoryId)) || comp?.categories[0];
  const gender = (swimmer?.gender ?? (get("rama") as Gender)) || "F";
  const course = (get("piscina") as Course) || comp?.course || "LCM";

  const options = useMemo(
    () =>
      comp && categoryId
        ? data.standards
            .filter((s) => s.published && s.competitionId === comp.id && s.categoryId === categoryId && s.gender === gender)
            .map((s) => `${s.distance}-${s.stroke}`)
        : [],
    [data.standards, comp, categoryId, gender],
  );
  const [dStr, sStr] = (options.includes(get("prueba")) ? get("prueba") : (options.find((o) => o === "100-LIBRE") ?? options[0] ?? "100-LIBRE")).split("-");
  const distance = Number(dStr);
  const stroke = sStr as Stroke;

  const courseMismatch = !!comp && course !== comp.course;
  const standard =
    comp && categoryId && !courseMismatch ? findStandard(data.standards, { competitionId: comp.id, categoryId, gender, distance, stroke, course }) : undefined;

  const rows = useMemo(() => (swimmer ? swimmerRows(data, swimmer.id, ix) : []), [data, ix, swimmer]);
  const best = swimmer ? bestTime(rows, distance, stroke, course) : undefined;

  const typed = get("tiempo");
  let typedMs: number | null = null;
  let typedError = "";
  if (typed) {
    try {
      typedMs = parseTime(typed);
    } catch (e) {
      typedError = e instanceof TimeFormatError ? e.message : "Tiempo no válido.";
    }
  }
  const timeMs = typedMs ?? best?.result.timeMs ?? null;
  const cmp = standard && timeMs ? compareToStandard(timeMs, standard.timeMs) : null;
  const series = rows.filter((r) => r.event.distance === distance && r.event.stroke === stroke && r.course === course && r.result.status === "OK");
  const swimmers = publicSwimmers(data).sort((a, b) => a.lastName.localeCompare(b.lastName, "es"));

  return (
    <>
      <PageHeader
        title="Comparador de marcas mínimas"
        intro={
          <>
            Compare un tiempo con la marca mínima de una competencia. Solo se comparan pruebas idénticas en la misma longitud de piscina, sin conversiones. <DemoTag>Marcas mínimas ficticias</DemoTag>
          </>
        }
      />
      <div className="wrap grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <form className="panel h-fit space-y-4 p-5 sm:p-6" data-tour="comparator" onSubmit={(e) => e.preventDefault()} aria-label="Datos de la comparación">
          <Field label="1. Competencia" htmlFor="c-comp">
            <select id="c-comp" className="field" value={comp?.id ?? ""} onChange={(e) => set({ competencia: e.target.value, prueba: null, piscina: null, categoria: null })}>
              {targetComps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({COURSES[c.course].short})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nadador de demostración (opcional)" htmlFor="c-sw" hint="Rellena categoría, rama y su mejor marca registrada.">
            <select id="c-sw" className="field" value={swimmer?.id ?? ""} onChange={(e) => set({ nadador: e.target.value, tiempo: null })}>
              <option value="">Ninguno: escribiré mi tiempo</option>
              {swimmers.map((s) => (
                <option key={s.id} value={s.id}>
                  {fullName(s)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="2. Categoría" htmlFor="c-cat" hint={swimmer ? "Según su año de nacimiento en la fecha de la competencia." : undefined}>
              <select id="c-cat" className="field" value={categoryId ?? ""} disabled={!!swimmer} onChange={(e) => set({ categoria: e.target.value, prueba: null })}>
                {comp?.categories.map((k) => (
                  <option key={k} value={k}>
                    {data.categories.find((c) => c.id === k)?.label}
                  </option>
                ))}
                {swimmer && !swimmerCat && <option value="">Sin categoría</option>}
              </select>
            </Field>
            <Field label="Rama" htmlFor="c-rama">
              <select id="c-rama" className="field" value={gender} disabled={!!swimmer} onChange={(e) => set({ rama: e.target.value, prueba: null })}>
                <option value="F">{GENDERS.F}</option>
                <option value="M">{GENDERS.M}</option>
              </select>
            </Field>
          </div>
          <fieldset>
            <legend className="label">3. Prueba</legend>
            <div className="mt-1 grid gap-4 sm:grid-cols-2">
              <Field label="4. Distancia" htmlFor="c-dist">
                <select id="c-dist" className="field" value={distance} onChange={(e) => set({ prueba: `${e.target.value}-${options.find((o) => o.startsWith(`${e.target.value}-`))?.split("-")[1] ?? stroke}` })}>
                  {[...new Set(options.map((o) => Number(o.split("-")[0])))].sort((a, b) => a - b).map((d) => (
                    <option key={d} value={d}>
                      {d} m
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="5. Estilo" htmlFor="c-estilo">
                <select id="c-estilo" className="field" value={stroke} onChange={(e) => set({ prueba: `${distance}-${e.target.value}` })}>
                  {options
                    .filter((o) => o.startsWith(`${distance}-`))
                    .map((o) => o.split("-")[1] as Stroke)
                    .map((s) => (
                      <option key={s} value={s}>
                        {STROKES[s]}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          </fieldset>
          <Field label="6. Longitud de piscina" htmlFor="c-pool">
            <select id="c-pool" className="field" value={course} onChange={(e) => set({ piscina: e.target.value })}>
              <option value="LCM">{COURSES.LCM.long}</option>
              <option value="SCM">{COURSES.SCM.long}</option>
            </select>
          </Field>
          <Field label="7. Tiempo personal" htmlFor="c-time" hint="Formato m:ss.cc (1:04.80) o ss.cc (58.31). Si lo deja vacío se usa la mejor marca registrada.">
            <input
              id="c-time"
              inputMode="decimal"
              autoComplete="off"
              className="field time text-lg"
              placeholder={best ? formatTime(best.result.timeMs!) : "1:04.80"}
              value={typed}
              aria-invalid={!!typedError}
              aria-describedby={typedError ? "c-time-error" : undefined}
              onChange={(e) => set({ tiempo: e.target.value })}
            />
            {typedError && (
              <p id="c-time-error" className="mt-1 text-sm font-medium text-signal">
                {typedError}
              </p>
            )}
          </Field>
        </form>

        <section aria-labelledby="h-resultado" className="min-w-0 space-y-6" data-tour="comparator-result">
          <div className="overflow-hidden rounded-2xl bg-navy text-white">
            <div className="lane-rope rounded-none" aria-hidden="true" />
            <div className="p-5 sm:p-7">
              <h2 id="h-resultado" className="flex flex-wrap items-center gap-2 font-display text-xl font-semibold">
                {eventLabel(distance, stroke)} · {GENDERS[gender].toLowerCase()} {categoryId}
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs">{COURSES[course].short}</span>
              </h2>
              <p className="text-sm text-white/70">{comp?.name}</p>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <dt className="text-xs text-white/60">Marca mínima requerida</dt>
                  <dd className="time mt-1 text-[2.2rem] leading-none" data-testid="standard-time">
                    {standard ? formatTime(standard.timeMs) : "—"}
                  </dd>
                  {standard && <dd className="mt-1 text-xs text-white/60">Ficticia</dd>}
                </div>
                <div>
                  <dt className="text-xs text-white/60">{typedMs ? "Tiempo ingresado" : "Mejor marca registrada"}</dt>
                  <dd className="time mt-1 text-[2.2rem] leading-none text-pool" data-testid="swimmer-time">
                    {timeMs ? formatTime(timeMs) : "—"}
                  </dd>
                  {!typedMs && best && <dd className="mt-1 text-xs text-white/60">{ix.comp.get(best.result.competitionId)?.name}, {formatDate(best.date)}</dd>}
                  {typedMs && best && (
                    <dd className="mt-1 text-xs text-white/60">
                      Mejor marca registrada: <span className="time">{formatTime(best.result.timeMs!)}</span>
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="text-xs text-white/60">Diferencia</dt>
                  <dd className="time mt-1 text-2xl" data-testid="diff">
                    {cmp ? `${cmp.meets ? "−" : "+"}${formatSeconds(cmp.diffMs)} s` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-white/60">Porcentaje</dt>
                  <dd className="time mt-1 text-2xl" data-testid="percent">
                    {cmp ? `${cmp.percent > 0 ? "+" : cmp.percent < 0 ? "−" : ""}${Math.abs(cmp.percent).toFixed(2)} %` : "—"}
                  </dd>
                </div>
              </dl>

              {cmp && (
                <div className="mt-6">
                  <div className="h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Avance hacia la marca mínima" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(cmp.progress * 100)}>
                    <div className={`h-full rounded-full ${cmp.meets ? "bg-[#4ade80]" : "bg-pool"}`} style={{ width: `${cmp.progress * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-white/60">Avance: marca mínima ÷ tiempo = {(cmp.progress * 100).toFixed(1)} %</p>
                </div>
              )}

              <div className="mt-6 rounded-xl bg-white/5 p-4" role="status" aria-live="polite" data-testid="verdict">
                {courseMismatch ? (
                  <p className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-[#fbbf24]" aria-hidden="true" />
                    <span>
                      Esta competencia exige marcas en {COURSES[comp!.course].long.toLowerCase()}. No se comparan ni se convierten tiempos de {COURSES[course].long.toLowerCase()}.
                    </span>
                  </p>
                ) : !standard ? (
                  <p className="flex gap-2">
                    <Info className="h-5 w-5 shrink-0 text-pool" aria-hidden="true" />
                    <span>No hay marca mínima registrada para esta combinación de competencia, categoría, rama, prueba y piscina.</span>
                  </p>
                ) : !timeMs ? (
                  <p className="flex gap-2">
                    <Timer className="h-5 w-5 shrink-0 text-pool" aria-hidden="true" />
                    <span>{swimmer ? `${fullName(swimmer)} no tiene marca válida en esta prueba y piscina. ` : ""}Escriba un tiempo para compararlo.</span>
                  </p>
                ) : cmp!.meets ? (
                  <p className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4ade80]" aria-hidden="true" />
                    <span>
                      <strong>Este tiempo alcanza la marca objetivo</strong>
                      {cmp!.diffMs < 0 ? ` (${formatSeconds(cmp!.diffMs)} s por debajo)` : ""}. Alcanzar la marca mínima no equivale a una clasificación oficial: la inscripción depende de los demás requisitos de la convocatoria.
                    </span>
                  </p>
                ) : (
                  <p className="flex gap-2">
                    <Timer className="h-5 w-5 shrink-0 text-pool" aria-hidden="true" />
                    <span>
                      <strong>
                        Necesitas reducir <span className="time">{formatSeconds(cmp!.diffMs)}</span> segundos para alcanzar esta marca objetivo.
                      </strong>
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {swimmer && (
            <div className="panel p-5 sm:p-6">
              <h3 className="h-card flex flex-wrap items-center gap-2">
                Evolución hacia el objetivo: {fullName(swimmer)} <CourseBadge course={course} />
              </h3>
              {series.length ? (
                <ProgressChart
                  title={`Evolución de ${fullName(swimmer)} en ${eventLabel(distance, stroke)} frente a la marca mínima`}
                  points={series.map((r) => ({ date: r.date, competition: ix.comp.get(r.result.competitionId)!.name, timeMs: r.result.timeMs! }))}
                  standardMs={standard?.timeMs}
                  height={240}
                />
              ) : (
                <p className="mt-2 text-sm text-muted">Sin tiempos válidos en esta prueba y piscina.</p>
              )}
              <Link to={`/nadadores/${swimmer.id}`} className="link mt-3 inline-block text-sm">
                Ver el perfil completo
              </Link>
            </div>
          )}

          <div className="rounded-2xl border border-line p-5 text-sm text-muted">
            <h3 className="h-card text-ink">Reglas del comparador</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Diferencia = tiempo − marca mínima, calculada en milisegundos enteros.</li>
              <li>Porcentaje = diferencia ÷ marca mínima × 100.</li>
              <li>Solo se compara la misma distancia, estilo, rama, categoría y longitud de piscina.</li>
              <li>No hay conversiones entre piscina de 25 m y de 50 m.</li>
              <li>Alcanzar una marca no es una clasificación oficial.</li>
            </ul>
            {standard && (
              <p className="mt-3">
                Marca usada: <Time ms={standard.timeMs} /> ({comp?.name}). Es ficticia y sirve solo para la demostración.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
