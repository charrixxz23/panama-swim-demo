import { Link } from "react-router-dom";
import { PageHeader } from "../components/Bits";
import { NEWS, PHOTOS, SITE, SOURCES } from "../data/reference";
import { useData } from "../hooks/useData";
import { usePageMeta } from "../hooks/usePageMeta";
import { formatDate } from "../utils/dates";

const ORIGIN = [
  ["Categorías por edad (9-10, 11-12, 13-14, 15-17, 18+)", "Referencia pública", "Notas de prensa sobre competencias de la FPN y de la Liga Provincial de Natación de Panamá. Pueden cambiar según cada convocatoria."],
  ["Piscina Olímpica Eileen Coparropa", "Real", "Sede citada por la FPN y el Comité Olímpico de Panamá."],
  ["Noticias de la portada", "Reales", "Títulos, medios, fechas y enlaces comprobados; los resúmenes son propios."],
  ["Clubes, entrenadores y nadadores", "Ficticios", "Nombres inventados, con la etiqueta «Demo» o «ficticio». No se usan clubes ni atletas reales."],
  ["Competencias y sus fechas", "Ficticias", "Calendario inventado para la demostración, con estados calculados con la fecha de hoy."],
  ["Resultados y tiempos", "Ficticios", "Generados por un script reproducible (scripts/generate-demo-data.mjs)."],
  ["Marcas mínimas", "Ficticias", "No son las marcas de ninguna convocatoria real."],
  ["Otras sedes (David, Chitré, Colón, Santiago)", "Ficticias", "Nombres «Piscina Demo de…»."],
] as const;

export default function About() {
  usePageMeta("Acerca de la plataforma");
  const { data } = useData();
  return (
    <>
      <PageHeader title="Acerca de Panamá Swim" intro="Qué es esta plataforma, de dónde salen sus datos y qué no pretende ser." />
      <div className="wrap grid gap-12 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="h-que">
            <h2 id="h-que" className="h-section">
              La propuesta
            </h2>
            <div className="mt-3 max-w-prose space-y-3 text-[1.05rem]">
              <p>
                Panamá Swim explora cómo podría verse un ecosistema digital para la natación panameña: un solo lugar donde un atleta consulta sus tiempos, descubre competencias y mide cuánto le falta para una marca mínima, y donde una federación publica calendario, resultados y marcas de forma estructurada.
              </p>
              <p>
                El flujo central es <strong>competencia → nadador → historial → marca personal → marca mínima → comparación → progreso</strong>. Cada paso usa los mismos datos, así que un resultado importado aparece en el perfil del nadador, en su club y en el comparador.
              </p>
              <p className="rounded-2xl border border-line bg-surface p-4 text-base">{SITE.disclaimer}</p>
            </div>
          </section>

          <section aria-labelledby="h-datos">
            <h2 id="h-datos" className="h-section">
              Qué datos son reales y cuáles ficticios
            </h2>
            <div className="table-wrap mt-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Dato</th>
                    <th scope="col">Origen</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {ORIGIN.map(([what, origin, detail]) => (
                    <tr key={what}>
                      <td className="font-semibold">{what}</td>
                      <td className={origin.startsWith("Ficti") ? "text-muted" : "text-ok"}>{origin}</td>
                      <td className="text-muted">{detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="h-tiempos">
            <h2 id="h-tiempos" className="h-section">
              Cómo se tratan los tiempos
            </h2>
            <ul className="mt-3 max-w-prose list-disc space-y-2 pl-5">
              <li>Se guardan como milisegundos enteros (1:04.80 = 64 800 ms) y solo se formatean al mostrarlos.</li>
              <li>Menos tiempo es mejor: las gráficas invierten el eje para que la línea suba cuando el nadador mejora.</li>
              <li>Las marcas de piscina de 25 m y de 50 m se listan, grafican y comparan por separado; no hay conversiones.</li>
              <li>DQ, DNS y DNF no tienen tiempo ni posición.</li>
              <li>Alcanzar una marca mínima no se presenta como clasificación oficial.</li>
            </ul>
          </section>

          <section aria-labelledby="h-priv">
            <h2 id="h-priv" className="h-section">
              Privacidad
            </h2>
            <p className="mt-3 max-w-prose">
              Ningún perfil corresponde a una persona real. Aun así, la plataforma está diseñada para proteger a menores: no muestra fechas de nacimiento completas (solo guarda el año para calcular la categoría), ni documentos, ni datos de contacto.
            </p>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="panel p-5" aria-labelledby="h-fuentes">
            <h2 id="h-fuentes" className="h-card">
              Fuentes consultadas
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {SOURCES.map((s) => (
                <li key={s.url}>
                  <a className="link" href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
              {NEWS.map((n) => (
                <li key={n.id}>
                  <a className="link" href={n.url} target="_blank" rel="noopener noreferrer">
                    {n.outlet}, {formatDate(n.publishedOn)}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Consultadas el {formatDate(SITE.verifiedOn)}.</p>
          </section>
          <section className="panel p-5 text-sm" aria-labelledby="h-cat">
            <h2 id="h-cat" className="h-card">
              Categorías de referencia
            </h2>
            <ul className="mt-2 space-y-1">
              {data.categories.map((c) => (
                <li key={c.id}>{c.label}</li>
              ))}
            </ul>
          </section>
          <section className="panel p-5 text-sm" aria-labelledby="h-cred">
            <h2 id="h-cred" className="h-card">
              Créditos
            </h2>
            <p className="mt-2">
              Desarrollo:{" "}
              <a className="link" href={SITE.author.url} target="_blank" rel="noopener noreferrer">
                {SITE.author.handle}
              </a>
            </p>
            <p className="mt-2">Fotografías (licencia Unsplash):</p>
            <ul className="mt-1 space-y-1">
              {Object.values(PHOTOS).map((p) => (
                <li key={p.page}>
                  <a className="link" href={p.page} target="_blank" rel="noopener noreferrer">
                    {p.credit}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-muted">
              El logotipo de Panamá Swim es original. No se usa el logotipo de la FPN.{" "}
              <Link to="/admin" className="link">
                Restaurar datos
              </Link>
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
