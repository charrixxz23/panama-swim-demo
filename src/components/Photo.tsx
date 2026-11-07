import { useState } from "react";

/**
 * Fotografía externa (Unsplash) con carga diferida. Si no carga, queda un fondo de agua
 * generado con CSS: la página nunca muestra una imagen rota.
 */
export function Photo({ src, alt, className = "", eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  return (
    <div className={`relative overflow-hidden bg-[linear-gradient(160deg,#0969B2,#07182F_70%)] ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{ background: "repeating-linear-gradient(0deg, transparent 0 46px, rgba(255,255,255,.18) 46px 49px)" }}
      />
      {state !== "error" && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${state === "ok" ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {state === "error" && <span className="sr-only">{alt} (imagen no disponible)</span>}
    </div>
  );
}
