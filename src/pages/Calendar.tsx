import { CalendarDays, ChevronLeft, ChevronRight, List, Search } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CourseBadge, DemoTag, Empty, Field, PageHeader } from "../components/Bits";
import { PROVINCES } from "../data/reference";
import type { Competition, CompetitionType } from "../models";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useToday } from "../hooks/useToday";
import { PHASE_LABEL, past, phase, REGISTRATION_LABEL, registrationState, upcoming } from "../services/calendar";
import { publicCompetitions } from "../services/queries";
import { formatDate, formatRange } from "../utils/dates";
import { COMP_TYPES } from "../utils/labels";
import { matchesAll } from "../utils/text";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function monthGrid(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

const shiftMonth = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

export default function Calendar() {
  usePageMeta("Calendario de competencias");
  const { data, ix } = useData();
  const today = useToday();
  const [params, setParams] = useSearchParams();
  const view = params.get("vista") === "mes" ? "mes" : "lista";
  const month = /^\d{4}-\d{2}$/.test(params.get("mes") ?? "") ? params.get("mes")! : today.slice(0, 7);
  const f = {
    q: params.get("q") ?? "",
    desde: params.get("desde") ?? "",
    hasta: params.get("hasta") ?? "",
    provincia: params.get("provincia") ?? "",
    categoria: params.get("categoria") ?? "",
    tipo: params.get("tipo") ?? "",
  };
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(
    () =>
      publicCompetitions(data).filter((c) => {
        const pool = ix.pool.get(c.poolId);
        if (f.desde && c.endDate < f.desde) return false;
        if (f.hasta && c.startDate > f.hasta) return false;
        if (f.provincia && pool?.province !== f.provincia) return false;
        if (f.categoria && !c.categories.includes(f.categoria as never)) return false;
        if (f.tipo && c.type !== f.tipo) return false;
        if (f.q && !matchesAll(`${c.name} ${pool?.name} ${pool?.city} ${COMP_TYPES[c.type]}`, f.q)) return false;
        return true;
      }),
    [data, ix, f.desde, f.hasta, f.provincia, f.categoria, f.tipo, f.q],
  );
  const active = Object.values(f).some(Boolean);
  const nextList = upcoming(filtered, today);
  const pastList = past(filtered, today);

  const card = (c: Competition) => {
    const pool = ix.pool.get(c.poolId);
    const ph = phase(c, today);
    const reg = registrationState(c, today);
    return (
      <li key={c.id}>
        <Link to={`/competencias/${c.id}`} className="panel group grid gap-3 p-4 transition-colors hover:border-brand sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:p-5">
          <p className="time text-lg">{formatRange(c.startDate, c.endDate)}</p>
          <div className="min-w-0">
            <h3 className="h-card group-hover:text-brand">{c.name}</h3>
            <p className="text-sm text-muted">
              {pool?.name}, {pool?.province} · {COMP_TYPES[c.type]} · categorías {c.categories.join(", ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <CourseBadge course={c.course} />
            <span className={`text-sm font-semibold ${ph === "finalizada" ? "text-muted" : reg === "abierta" ? "text-ok" : "text-ink"}`}>
              {ph === "finalizada" ? PHASE_LABEL[ph] : REGISTRATION_LABEL[reg]}
            </span>
            <DemoTag>Demo</DemoTag>
          </div>
        </Link>
      </li>
    );
  };

  const cells = monthGrid(month);
  const inMonth = filtered.filter((c) => c.startDate.slice(0, 7) <= month && c.endDate.slice(0, 7) >= month).sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <>
      <PageHeader title="Calendario de competencias" intro="Competencias demostrativas. El estado de cada una se calcula con la fecha de hoy: lo que ya terminó nunca aparece como próximo." />
      <div className="wrap py-8" data-tour="calendar">
        <div className="panel p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="sm:col-span-2">
              <Field label="Buscar" htmlFor="cal-q">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input id="cal-q" type="search" className="field pl-9" placeholder="Nombre, sede o tipo" value={f.q} onChange={(e) => set({ q: e.target.value })} />
                </div>
              </Field>
            </div>
            <Field label="Desde" htmlFor="cal-desde">
              <input id="cal-desde" type="date" className="field" value={f.desde} onChange={(e) => set({ desde: e.target.value })} />
            </Field>
            <Field label="Hasta" htmlFor="cal-hasta">
              <input id="cal-hasta" type="date" className="field" value={f.hasta} onChange={(e) => set({ hasta: e.target.value })} />
            </Field>
            <Field label="Provincia" htmlFor="cal-prov">
              <select id="cal-prov" className="field" value={f.provincia} onChange={(e) => set({ provincia: e.target.value })}>
                <option value="">Todas</option>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Categoría" htmlFor="cal-cat">
              <select id="cal-cat" className="field" value={f.categoria} onChange={(e) => set({ categoria: e.target.value })}>
                <option value="">Todas</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo" htmlFor="cal-tipo">
              <select id="cal-tipo" className="field" value={f.tipo} onChange={(e) => set({ tipo: e.target.value })}>
                <option value="">Todos</option>
                {(Object.keys(COMP_TYPES) as CompetitionType[]).map((t) => (
                  <option key={t} value={t}>
                    {COMP_TYPES[t]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2" role="group" aria-label="Vista">
              <button type="button" className="chip" aria-pressed={view === "lista"} onClick={() => set({ vista: null })}>
                <List className="h-4 w-4" aria-hidden="true" /> Lista
              </button>
              <button type="button" className="chip" aria-pressed={view === "mes"} onClick={() => set({ vista: "mes" })}>
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> Mes
              </button>
            </div>
            {active && (
              <button type="button" className="link text-sm" onClick={() => setParams(view === "mes" ? { vista: "mes", mes: month } : {}, { replace: true })}>
                Quitar filtros
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
          {filtered.length === 1 ? "1 competencia" : `${filtered.length} competencias`}
          {active ? " con los filtros actuales" : ""} · hoy es {formatDate(today)}
        </p>

        {view === "lista" ? (
          filtered.length === 0 ? (
            <div className="mt-4">
              <Empty title="Ninguna competencia coincide">Pruebe con otro rango de fechas o quite filtros.</Empty>
            </div>
          ) : (
            <>
              <section className="mt-6" aria-labelledby="h-prox">
                <h2 id="h-prox" className="h-section">
                  Próximas y en curso
                </h2>
                {nextList.length ? <ul className="mt-4 space-y-3">{nextList.map(card)}</ul> : <p className="mt-3 text-muted">No hay competencias próximas con estos filtros.</p>}
              </section>
              <section className="mt-10" aria-labelledby="h-fin">
                <h2 id="h-fin" className="h-section">
                  Finalizadas
                </h2>
                {pastList.length ? <ul className="mt-4 space-y-3">{pastList.map(card)}</ul> : <p className="mt-3 text-muted">No hay competencias finalizadas con estos filtros.</p>}
              </section>
            </>
          )
        ) : (
          <section className="mt-6" aria-labelledby="h-mes">
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="btn btn-ghost !px-3" onClick={() => set({ mes: shiftMonth(month, -1) })} aria-label="Mes anterior">
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <h2 id="h-mes" className="h-section">
                {((t) => t[0].toUpperCase() + t.slice(1))(formatDate(`${month}-15`, { month: "long", year: "numeric" }))}
              </h2>
              <button type="button" className="btn btn-ghost !px-3" onClick={() => set({ mes: shiftMonth(month, 1) })} aria-label="Mes siguiente">
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="grid grid-cols-7 bg-raised text-center text-xs font-semibold text-muted" aria-hidden="true">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((iso, i) => {
                  const evs = iso ? inMonth.filter((c) => c.startDate <= iso && c.endDate >= iso) : [];
                  return (
                    <div key={i} className={`min-h-[3.5rem] border-t border-line p-1 sm:min-h-[6.5rem] sm:p-1.5 ${i % 7 ? "border-l" : ""} ${iso === today ? "bg-brand/5" : ""}`}>
                      {iso && (
                        <>
                          <span className={`time text-xs ${iso === today ? "rounded-full bg-brand px-1.5 py-0.5 text-white dark:text-navy" : "text-muted"}`}>{Number(iso.slice(8))}</span>
                          <ul className="mt-1 space-y-1">
                            {evs.map((c) => (
                              <li key={c.id}>
                                <Link
                                  to={`/competencias/${c.id}`}
                                  className={`block truncate rounded-md px-1 py-0.5 text-[0.7rem] font-semibold sm:px-1.5 sm:text-xs ${phase(c, today) === "finalizada" ? "bg-raised text-muted" : "bg-brand text-white dark:text-navy"}`}
                                  title={c.name}
                                >
                                  <span className="hidden sm:inline">{c.name}</span>
                                  <span className="sm:hidden" aria-label={c.name}>
                                    ●
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <h3 className="h-card mt-8">Competencias de este mes</h3>
            {inMonth.length ? <ul className="mt-3 space-y-3">{inMonth.map(card)}</ul> : <p className="mt-2 text-muted">No hay competencias en este mes con los filtros actuales.</p>}
          </section>
        )}
      </div>
    </>
  );
}
