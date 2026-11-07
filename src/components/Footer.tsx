import { Link } from "react-router-dom";
import { PHOTOS, SITE } from "../data/reference";
import { NAV } from "./Header";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 bg-navy text-white">
      <div className="lane-rope-flag rounded-none" aria-hidden="true" />
      <div className="wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-3 font-display text-xl text-pool" style={{ fontStretch: "112%" }}>
            {SITE.motto}
          </p>
          <p className="mt-3 max-w-sm text-sm text-white/75">
            Propuesta académica de un ecosistema digital para la natación panameña: competencias, resultados, marcas y progreso.
          </p>
        </div>
        <nav aria-label="Secciones">
          <h2 className="font-display text-base font-semibold text-pool">Secciones</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-pool">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/entrenador" className="hover:text-pool">
                Vista de entrenador
              </Link>
            </li>
            <li>
              <Link to="/acerca" className="hover:text-pool">
                Acerca de la plataforma
              </Link>
            </li>
          </ul>
        </nav>
        <div className="text-sm text-white/75">
          <h2 className="font-display text-base font-semibold text-pool">Créditos</h2>
          <p className="mt-3">
            Desarrollo:{" "}
            <a href={SITE.author.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline underline-offset-4">
              {SITE.author.handle}
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </p>
          <p className="mt-2">
            Fotografías de Unsplash: {Object.values(PHOTOS).map((p) => p.credit).join(", ")}.
          </p>
          <p className="mt-2">Datos de atletas, clubes, competencias, resultados y marcas: ficticios.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="wrap py-5 text-sm text-white/85" data-testid="disclaimer">
          {SITE.disclaimer}
        </p>
      </div>
    </footer>
  );
}
