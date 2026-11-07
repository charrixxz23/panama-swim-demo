import { ArrowUpRight, CalendarDays, Medal, Timer, Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CourseBadge, DemoTag, Time } from "../components/Bits";
import { Photo } from "../components/Photo";
import { NEWS, PHOTOS, SITE } from "../data/reference";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useToday } from "../hooks/useToday";
import { past, REGISTRATION_LABEL, registrationState, upcoming } from "../services/calendar";
import { fullName, publicCompetitions, publicResults, publicSwimmers, swimmerRows } from "../services/queries";
import { rankEvent } from "../services/results";
import { bestTime, compareToStandard, findStandard } from "../services/standards";
import { formatDate, formatRange } from "../utils/dates";
import { COMP_TYPES, eventLabel, GENDERS } from "../utils/labels";
import { formatDelta, formatSeconds, formatTime } from "../utils/time";

function Scoreboard() {
  const { data } = useData();
  const rows = useMemo(() => swimmerRows(data, "daniel-perez"), [data]);
  const best = bestTime(rows, 100, "LIBRE", "LCM");
  const std = findStandard(data.standards, { competitionId: "nacional-lcm-2026", categoryId: "13-14", gender: "M", distance: 100, stroke: "LIBRE", course: "LCM" });
  if (!best || !std) return null;
  const cmp = compareToStandard(best.result.timeMs!, std.timeMs);
  const digits = (s: string) => s.split("").map((ch, i) => (
    <span key={i} style={{ animationDelay: `${120 + i * 45}ms` }}>
      {ch}
    </span>
  ));
  return (
    <Link
      to="/marcas-minimas?nadador=daniel-perez&competencia=nacional-lcm-2026&prueba=100-LIBRE"
      className="group block rounded-2xl border border-white/15 bg-navy/85 p-5 text-white shadow-2xl backdrop-blur-sm transition-colors hover:border-pool sm:p-6"
      aria-label="Abrir el comparador con el ejemplo de Daniel Pérez"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-pool">Comparador de marcas mínimas</p>
        <span className="rounded-full border border-dashed border-white/40 px-2 py-0.5 text-[0.7rem] font-semibold text-white/80">Ejemplo ficticio</span>
      </div>
      <p className="mt-1 text-sm text-white/75">Daniel Pérez · 100 m libre · piscina de 50 m</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-xs text-white/60">Mejor marca</dt>
          <dd className="time tick text-[2.1rem] leading-none sm:text-[2.6rem]">{digits(formatTime(best.result.timeMs!))}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/60">Marca mínima</dt>
          <dd className="time text-[2.1rem] leading-none text-white/70 sm:text-[2.6rem]">{formatTime(std.timeMs)}</dd>
        </div>
      </dl>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div className="h-full rounded-full bg-pool" style={{ width: `${cmp.progress * 100}%` }} />
      </div>
      <p className="mt-3 text-sm">
        {cmp.meets ? "Alcanza la marca objetivo." : (
          <>
            Necesita reducir <strong className="time text-pool">{formatSeconds(cmp.diffMs)} s</strong> ({cmp.percent.toFixed(2)} %) para alcanzar la marca objetivo.
          </>
        )}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pool group-hover:underline">
        Probar el comparador <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function Home() {
  usePageMeta();
  const { data, ix } = useData();
  const today = useToday();
  const comps = publicCompetitions(data);
  const next = upcoming(comps, today).slice(0, 4);
  const results = publicResults(data);
  const lastWithResults = past(comps, today).find((c) => results.some((r) => r.competitionId === c.id));
  const swimmers = publicSwimmers(data);

  const podiums = useMemo(() => {
    if (!lastWithResults) return [];
    const evs = data.events.filter((e) => e.competitionId === lastWithResults.id && e.distance === 100 && e.stroke === "LIBRE" && (e.categoryId === "13-14" || e.categoryId === "15-17"));
    return evs
      .map((e) => ({ e, ranked: rankEvent(results.filter((r) => r.eventId === e.id)).filter((r) => r.place !== null).slice(0, 3) }))
      .filter((x) => x.ranked.length > 0)
      .slice(0, 4);
  }, [data, lastWithResults, results]);

  // Atletas ficticios con mayor mejora en una misma prueba y piscina durante la temporada.
  const improvers = useMemo(() => {
    const out: { id: string; name: string; club: string; label: string; course: "LCM" | "SCM"; gain: number; best: number }[] = [];
    for (const s of swimmers) {
      const rows = swimmerRows(data, s.id, ix).filter((r) => r.result.status === "OK");
      const groups = new Map<string, typeof rows>();
      for (const r of rows) {
        const k = `${r.event.distance}-${r.event.stroke}-${r.course}`;
        groups.set(k, [...(groups.get(k) ?? []), r]);
      }
      for (const list of groups.values()) {
        if (list.length < 3) continue;
        const first = list[0].result.timeMs!;
        const best = Math.min(...list.map((r) => r.result.timeMs!));
        const ev = list[0].event;
        out.push({ id: s.id, name: fullName(s), club: ix.club.get(s.clubId)?.shortName ?? "", label: eventLabel(ev.distance, ev.stroke), course: list[0].course, gain: first - best, best });
      }
    }
    const seen = new Set<string>();
    return out
      .sort((a, b) => b.gain / b.best - a.gain / a.best)
      .filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
      .slice(0, 3);
  }, [data, ix, swimmers]);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy text-white" aria-labelledby="hero-title">
        <Photo src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} eager className="absolute inset-0 -z-10 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,24,47,.94)_0%,rgba(7,24,47,.82)_45%,rgba(7,24,47,.35)_100%)]" aria-hidden="true" />
        <div className="wrap grid items-center gap-10 py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div>
            <p className="font-display text-lg font-medium text-pool" style={{ fontStretch: "112%" }}>
              El ecosistema digital de la natación panameña
            </p>
            <h1 id="hero-title" className="h-hero mt-3">
              Panamá Swim
            </h1>
            <p className="mt-3 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium leading-tight text-white" style={{ fontStretch: "112%" }}>
              {SITE.motto}
            </p>
            <p className="mt-5 max-w-lg text-lg text-white/80">
              Competencias, resultados, marcas personales y marcas mínimas en un solo lugar, para que cada nadador sepa dónde está y cuánto le falta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/calendario" className="btn bg-pool text-navy hover:bg-white">
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> Ver competencias
              </Link>
              <Link to="/resultados" className="btn btn-on-dark">
                <Timer className="h-4 w-4" aria-hidden="true" /> Resultados
              </Link>
              <Link to="/nadadores" className="btn btn-on-dark">
                <Users className="h-4 w-4" aria-hidden="true" /> Perfiles de atletas
              </Link>
            </div>
          </div>
          <Scoreboard />
        </div>
        <div className="lane-rope rounded-none" aria-hidden="true" />
      </section>

      <div data-tour="dashboard">
        <section className="wrap py-12" aria-labelledby="h-proximas">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="h-proximas" className="h-section">
              Próximas competencias
            </h2>
            <Link to="/calendario" className="link">
              Calendario completo
            </Link>
          </div>
          {next.length === 0 ? (
            <p className="mt-4 text-muted">No hay competencias próximas en los datos demostrativos.</p>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {next.map((c) => {
                const pool = ix.pool.get(c.poolId);
                const reg = registrationState(c, today);
                return (
                  <li key={c.id}>
                    <Link to={`/competencias/${c.id}`} className="panel group flex h-full gap-4 p-4 transition-colors hover:border-brand sm:p-5">
                      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-navy py-2 text-white">
                        <span className="text-xs uppercase text-pool">{formatDate(c.startDate, { month: "short" }).replace(".", "")}</span>
                        <span className="time text-3xl leading-none">{Number(c.startDate.slice(8))}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CourseBadge course={c.course} />
                          <span className="text-xs font-semibold text-muted">{COMP_TYPES[c.type]}</span>
                          <DemoTag>Demo</DemoTag>
                        </div>
                        <h3 className="h-card mt-1.5 group-hover:text-brand">{c.name}</h3>
                        <p className="text-sm text-muted">
                          {formatRange(c.startDate, c.endDate)} · {pool?.name}
                        </p>
                        <p className={`mt-1 text-sm font-semibold ${reg === "abierta" ? "text-ok" : "text-muted"}`}>{REGISTRATION_LABEL[reg]}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border-y border-line bg-surface py-12" aria-labelledby="h-ultimos">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="h-ultimos" className="h-section">
                  Últimos resultados
                </h2>
                {lastWithResults && (
                  <p className="mt-1 text-muted">
                    {lastWithResults.name} · {formatRange(lastWithResults.startDate, lastWithResults.endDate)} <DemoTag>Resultados ficticios</DemoTag>
                  </p>
                )}
              </div>
              {lastWithResults && (
                <Link to={`/resultados?competencia=${lastWithResults.id}`} className="link">
                  Todos los resultados
                </Link>
              )}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {podiums.map(({ e, ranked }) => (
                <div key={e.id} className="rounded-2xl border border-line p-4">
                  <p className="text-sm font-semibold">
                    {eventLabel(e.distance, e.stroke)} · {GENDERS[e.gender].toLowerCase()} {e.categoryId}
                  </p>
                  <ol className="mt-3 space-y-2">
                    {ranked.map((r) => {
                      const s = ix.swimmer.get(r.swimmerId)!;
                      return (
                        <li key={r.id} className="flex items-center gap-3">
                          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${r.place === 1 ? "bg-pool text-navy" : "bg-raised"}`}>{r.place}</span>
                          <Link to={`/nadadores/${s.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-brand">
                            {fullName(s)}
                          </Link>
                          <Time ms={r.timeMs!} className="text-sm" />
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="wrap grid gap-8 py-12 lg:grid-cols-[1fr_1.1fr] lg:items-center" aria-labelledby="h-marcas">
        <Photo src={PHOTOS.blocks.src} alt={PHOTOS.blocks.alt} className="aspect-[4/3] w-full rounded-2xl" />
        <div>
          <h2 id="h-marcas" className="h-section">
            ¿Cuánto te falta para la marca mínima?
          </h2>
          <p className="mt-3 max-w-prose text-muted">
            Elige competencia, categoría, prueba y piscina, escribe tu tiempo y el comparador calcula la diferencia exacta en segundos y en porcentaje. Solo compara pruebas idénticas en la misma longitud de piscina.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2">
              <Medal className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" /> Marcas mínimas ficticias, identificadas como tales.
            </li>
            <li className="flex gap-2">
              <Timer className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" /> Sin conversiones entre piscina de 25 m y de 50 m.
            </li>
          </ul>
          <Link to="/marcas-minimas" className="btn btn-primary mt-6">
            Abrir el comparador
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-surface py-12" aria-labelledby="h-destacados">
        <div className="wrap">
          <h2 id="h-destacados" className="h-section">
            Atletas destacados
          </h2>
          <p className="mt-1 text-muted">
            Mayor mejora de la temporada en una misma prueba y piscina. <DemoTag>Atletas ficticios</DemoTag>
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {improvers.map((x) => (
              <li key={x.id}>
                <Link to={`/nadadores/${x.id}`} className="group block rounded-2xl border border-line p-5 hover:border-brand">
                  <p className="h-card group-hover:text-brand">{x.name}</p>
                  <p className="text-sm text-muted">{x.club}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm">
                    {x.label} <CourseBadge course={x.course} />
                  </p>
                  <p className="mt-1">
                    <span className="time text-3xl text-ok">{formatDelta(-x.gain)}</span> <span className="text-sm text-muted">s respecto a su primera marca</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div aria-labelledby="h-noticias">
          <h2 id="h-noticias" className="h-section">
            Noticias verificadas
          </h2>
          <p className="mt-1 text-sm text-muted">Enlaces a medios panameños, comprobados el {formatDate(SITE.verifiedOn)}.</p>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {NEWS.map((n) => (
              <li key={n.id} className="py-4">
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="group block">
                  <p className="text-xs font-semibold text-muted">
                    {n.outlet} · {formatDate(n.publishedOn)}
                  </p>
                  <p className="mt-1 font-semibold group-hover:text-brand">
                    {n.title} <ArrowUpRight className="inline h-4 w-4" aria-hidden="true" />
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">{n.summary}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div aria-labelledby="h-clubes">
          <h2 id="h-clubes" className="h-section">
            Clubes
          </h2>
          <p className="mt-1 text-sm text-muted">Clubes ficticios de la demo, por provincia.</p>
          <ul className="mt-5 space-y-2">
            {data.clubs.map((c) => (
              <li key={c.id}>
                <Link to={`/clubes/${c.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-brand">
                  <span className="font-semibold">{c.shortName}</span>
                  <span className="text-sm text-muted">{c.province}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap pb-4" aria-labelledby="h-plataforma">
        <div className="relative overflow-hidden rounded-3xl bg-navy p-8 text-white sm:p-10">
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-center">
            <div>
              <h2 id="h-plataforma" className="h-section">
                Una propuesta para modernizar la gestión deportiva
              </h2>
              <p className="mt-3 max-w-prose text-white/80">
                {comps.length} competencias, {results.length.toLocaleString("es-PA")} resultados y {swimmers.length} perfiles demostrativos conectados entre sí. La administración permite crear eventos, importar resultados CSV con validación y publicarlos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link to="/acerca" className="btn bg-pool text-navy hover:bg-white">
                Cómo funciona
              </Link>
              <Link to="/admin" className="btn btn-on-dark">
                Administración
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
