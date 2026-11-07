import { Compass, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { Logo } from "./Logo";
import { useTour } from "./Tour";

export const NAV = [
  { to: "/", label: "Inicio", end: true },
  { to: "/calendario", label: "Calendario" },
  { to: "/resultados", label: "Resultados" },
  { to: "/nadadores", label: "Nadadores" },
  { to: "/marcas-minimas", label: "Marcas mínimas" },
  { to: "/clubes", label: "Clubes" },
  { to: "/admin", label: "Administración" },
];

export function Header() {
  const { theme, toggle } = useTheme();
  const tour = useTour();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const themeLabel = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="wrap flex h-16 items-center gap-3">
        <Link to="/" className="mr-auto shrink-0 rounded-lg" aria-label="Panamá Swim, ir al inicio">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-2 text-[0.92rem] font-semibold transition-colors ${isActive ? "bg-brand/10 text-brand" : "text-ink hover:text-brand"}`
                  }
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" onClick={toggle} className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-raised" aria-label={themeLabel} title={themeLabel} data-testid="theme-toggle">
          <ThemeIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={tour.start} className="btn btn-primary hidden !min-h-[40px] md:inline-flex" data-testid="tour-start">
          <Compass className="h-4 w-4" aria-hidden="true" /> Explorar Panamá Swim
        </button>
        <button ref={btn} type="button" className="grid h-11 w-11 place-items-center rounded-full hover:bg-raised xl:hidden" aria-label="Abrir menú" aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen(true)}>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div id="menu-movil" role="dialog" aria-modal="true" aria-label="Menú" className="fixed inset-0 z-50 overflow-y-auto bg-navy text-white xl:hidden">
          <div className="wrap flex h-16 items-center justify-between">
            <Logo tone="light" />
            <button type="button" autoFocus onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" aria-label="Cerrar menú">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="wrap pb-10">
            <div className="lane-rope" aria-hidden="true" />
            <nav aria-label="Principal (móvil)" className="mt-4">
              <ul>
                {NAV.map((n) => (
                  <li key={n.to} className="border-b border-white/10">
                    <NavLink
                      to={n.to}
                      end={n.end}
                      className={({ isActive }) => `block py-3.5 font-display text-2xl font-semibold ${isActive ? "text-pool" : "text-white"}`}
                      style={{ fontStretch: "112%" }}
                    >
                      {n.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <button
              type="button"
              className="btn mt-8 w-full bg-pool text-navy hover:bg-white"
              onClick={() => {
                setOpen(false);
                tour.start();
              }}
            >
              <Compass className="h-5 w-5" aria-hidden="true" /> Explorar Panamá Swim
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
