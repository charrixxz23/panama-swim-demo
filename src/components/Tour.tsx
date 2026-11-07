import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TOUR_STEPS } from "../data/tour";

const TourContext = createContext<{ active: boolean; start: () => void }>({ active: false, start: () => {} });
export const useTour = () => useContext(TourContext);
const HL = "tour-target";
const clear = () => document.querySelectorAll(`.${HL}`).forEach((el) => el.classList.remove(HL));

/** "Explorar Panamá Swim": 10 pasos sobre componentes reales. No bloquea clics y no deja rastro al terminar. */
export function TourProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<number | null>(null);
  const [found, setFound] = useState(true);
  const navigate = useNavigate();
  const loc = useLocation();
  const here = loc.pathname + loc.search;
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const finish = useCallback(() => {
    clear();
    setStep(null);
    opener.current?.focus?.();
  }, []);
  const start = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setStep(0);
  }, []);

  useEffect(() => {
    if (step === null) return;
    const s = TOUR_STEPS[step];
    if (here !== s.route) navigate(s.route);
  }, [step, here, navigate]);

  useEffect(() => {
    if (step === null) return;
    const s = TOUR_STEPS[step];
    if (here !== s.route) return;
    clear();
    let raf = 0;
    const t0 = performance.now();
    const look = () => {
      const el = document.querySelector<HTMLElement>(s.target);
      if (el) {
        el.classList.add(HL);
        el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        setFound(true);
      } else if (performance.now() - t0 < 4000) raf = requestAnimationFrame(look);
      else setFound(false);
    };
    raf = requestAnimationFrame(look);
    panel.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(raf);
  }, [step, here]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, finish]);

  useEffect(() => () => clear(), []);

  const api = useMemo(() => ({ active: step !== null, start }), [step, start]);
  const s = step !== null ? TOUR_STEPS[step] : null;
  const last = step === TOUR_STEPS.length - 1;

  return (
    <TourContext.Provider value={api}>
      {children}
      {s && step !== null && (
        <div
          ref={panel}
          tabIndex={-1}
          role="dialog"
          aria-modal="false"
          aria-labelledby="tour-title"
          aria-describedby="tour-text"
          data-testid="tour"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-navy p-5 text-white shadow-2xl outline-none sm:inset-x-auto sm:bottom-6 sm:right-6"
        >
          <div className="lane-rope -mx-5 -mt-5 mb-4 rounded-b-none rounded-t-2xl" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-white/70" aria-live="polite">
              Paso {step + 1} de {TOUR_STEPS.length}
            </p>
            <button type="button" onClick={finish} className="-m-2 grid h-10 w-10 place-items-center rounded-full text-white/80 hover:text-pool" aria-label="Cerrar el recorrido">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <h2 id="tour-title" className="mt-1 font-display text-xl font-semibold">
            {s.title}
          </h2>
          <p id="tour-text" className="mt-1.5 text-[0.95rem] leading-relaxed text-white/85">
            {s.text}
          </p>
          {!found && <p className="mt-2 text-sm text-pool">No se encontró el elemento en pantalla; puede pasar al siguiente paso.</p>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={finish} className="text-sm font-medium text-white/80 underline underline-offset-4 hover:text-pool">
              Omitir
            </button>
            <div className="flex gap-2">
              <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="btn btn-on-dark !min-h-[40px] !px-4">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
              </button>
              <button type="button" onClick={() => (last ? finish() : setStep(step + 1))} className="btn !min-h-[40px] bg-pool !px-4 text-navy hover:bg-white">
                {last ? "Finalizar" : "Siguiente"}
                {!last && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </TourContext.Provider>
  );
}
