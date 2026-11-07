/** Identidad original de Panamá Swim (no usa ni imita el logotipo de la FPN). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="10" fill="#07182F" />
      <path d="M6 15c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 4 3" fill="none" stroke="#00B7E8" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 22c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 4 3" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 29c4 0 4-3 8-3s4 3 8 3" fill="none" stroke="#0969B2" strokeWidth="3" strokeLinecap="round" />
      <circle cx="31" cy="28" r="3" fill="#D62839" />
    </svg>
  );
}

export function Logo({ tone = "auto" }: { tone?: "auto" | "light" }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-[1.28rem] font-bold leading-none ${tone === "light" ? "text-white" : "text-ink"}`} style={{ fontStretch: "118%" }}>
        Panamá <span className="text-brand">Swim</span>
      </span>
    </span>
  );
}
