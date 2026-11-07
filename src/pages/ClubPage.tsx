import { Link, useParams } from "react-router-dom";
import { CourseBadge, DemoTag } from "../components/Bits";
import { NotFoundState } from "../components/States";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useToday } from "../hooks/useToday";
import { upcoming } from "../services/calendar";
import { currentCategory, fullName, publicCompetitions, publicResults, publicSwimmers } from "../services/queries";
import { rankEvent } from "../services/results";
import { formatRange } from "../utils/dates";

export default function ClubPage() {
  const { id = "" } = useParams();
  const { data, ix } = useData();
  const today = useToday();
  const club = ix.club.get(id);
  usePageMeta(club?.name ?? "Club no encontrado");
  if (!club) return <NotFoundState title="Club no encontrado" text="Ese club no existe en la demo." to="/clubes" cta="Ver clubes" />;

  const members = publicSwimmers(data).filter((s) => s.clubId === club.id).sort((a, b) => a.lastName.localeCompare(b.lastName, "es"));
  const ids = new Set(members.map((s) => s.id));
  const results = publicResults(data);
  const clubResults = results.filter((r) => ids.has(r.swimmerId));
  const coaches = data.coaches.filter((c) => c.clubId === club.id);
  const comps = publicCompetitions(data);

  const grouped = comps
    .filter((c) => clubResults.some((r) => r.competitionId === c.id))
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map((c) => {
      const mine = clubResults.filter((r) => r.competitionId === c.id);
      let podiums = 0;
      for (const evId of new Set(mine.map((r) => r.eventId))) {
        const ranked = rankEvent(results.filter((r) => r.eventId === evId));
        podiums += ranked.filter((r) => ids.has(r.swimmerId) && r.place !== null && r.place <= 3).length;
      }
      return { c, entries: mine.length, valid: mine.filter((r) => r.status === "OK").length, podiums };
    });
  const next = upcoming(comps, today).filter((c) => ix.pool.get(c.poolId)?.province === club.province || c.type === "campeonato").slice(0, 4);

  return (
    <>
      <header className="bg-navy text-white">
        <div className="wrap py-10">
          <nav aria-label="Ruta" className="text-sm text-white/70">
            <Link to="/clubes" className="underline underline-offset-4 hover:text-pool">
              Clubes
            </Link>
          </nav>
          <h1 className="h-page mt-2">{club.name}</h1>
          <p className="mt-1 text-white/80">Provincia de {club.province}</p>
          <p className="mt-2 inline-flex rounded-full border border-dashed border-white/40 px-2.5 py-0.5 text-xs font-semibold">Club ficticio, sin datos de contacto</p>
        </div>
        <div className="lane-rope rounded-none" aria-hidden="true" />
      </header>
      <div className="wrap grid gap-10 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="h-atletas">
            <h2 id="h-atletas" className="h-section">
              Atletas de demostración
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {members.map((s) => (
                <li key={s.id}>
                  <Link to={`/nadadores/${s.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-brand">
                    <span className="truncate font-semibold">{fullName(s)}</span>
                    <span className="shrink-0 text-sm text-muted">
                      {currentCategory(data, s, today)} · {s.gender}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="h-agrupados">
            <h2 id="h-agrupados" className="h-section">
              Resultados agrupados
            </h2>
            <div className="table-wrap mt-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Competencia</th>
                    <th scope="col">Participaciones</th>
                    <th scope="col">Tiempos válidos</th>
                    <th scope="col">Podios</th>
                    <th scope="col">
                      <span className="sr-only">Enlace</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(({ c, entries, valid, podiums }) => (
                    <tr key={c.id}>
                      <td>
                        <span className="font-semibold">{c.name}</span> <CourseBadge course={c.course} />
                        <span className="block text-xs text-muted">{formatRange(c.startDate, c.endDate)}</span>
                      </td>
                      <td className="time">{entries}</td>
                      <td className="time">{valid}</td>
                      <td className="time">{podiums}</td>
                      <td>
                        <Link className="link text-sm" to={`/resultados?competencia=${c.id}&club=${club.id}`}>
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="min-w-0 space-y-6">
          <section className="panel p-5" aria-labelledby="h-ent">
            <h2 id="h-ent" className="h-card">
              Entrenadores
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {coaches.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span>{c.name}</span>
                  <Link className="link" to={`/entrenador?entrenador=${c.id}`}>
                    Vista de entrenador
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <DemoTag>Nombres ficticios</DemoTag>
            </p>
          </section>
          <section className="panel p-5" aria-labelledby="h-ev">
            <h2 id="h-ev" className="h-card">
              Eventos relacionados
            </h2>
            <p className="text-xs text-muted">Próximas competencias en su provincia y campeonatos nacionales.</p>
            <ul className="mt-3 space-y-3 text-sm">
              {next.map((c) => (
                <li key={c.id}>
                  <Link to={`/competencias/${c.id}`} className="font-semibold hover:text-brand">
                    {c.name}
                  </Link>
                  <span className="block text-muted">{formatRange(c.startDate, c.endDate)}</span>
                </li>
              ))}
              {next.length === 0 && <li className="text-muted">No hay próximas competencias relacionadas.</li>}
            </ul>
          </section>
          <p className="text-sm text-muted">
            {members.filter((s) => s.gender === "F").length} nadadoras y {members.filter((s) => s.gender === "M").length} nadadores en la demo.
          </p>
        </aside>
      </div>
    </>
  );
}
