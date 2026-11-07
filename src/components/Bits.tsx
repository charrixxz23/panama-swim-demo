import type { ReactNode } from "react";
import type { Course, ResultStatus } from "../models";
import { COURSES, STATUS } from "../utils/labels";
import { formatTime } from "../utils/time";

export function Time({ ms, className = "" }: { ms: number; className?: string }) {
  return <span className={`time ${className}`}>{formatTime(ms)}</span>;
}

export function StatusBadge({ status }: { status: ResultStatus }) {
  const tone =
    status === "OK"
      ? "bg-ok/10 text-ok"
      : status === "DQ"
        ? "bg-signal/10 text-signal"
        : "bg-raised text-muted";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`} title={STATUS[status].long}>
      {STATUS[status].short}
      {status !== "OK" && <span className="sr-only"> ({STATUS[status].long})</span>}
    </span>
  );
}

export function CourseBadge({ course }: { course: Course }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold ${course === "LCM" ? "bg-brand/10 text-brand" : "bg-accent/15 text-ink"}`}
      title={COURSES[course].long}
    >
      {COURSES[course].short}
    </span>
  );
}

export function DemoTag({ children = "Dato ficticio" }: { children?: ReactNode }) {
  return <span className="demo-tag">{children}</span>;
}

export function PageHeader({ title, intro, children, tour }: { title: string; intro?: ReactNode; children?: ReactNode; tour?: string }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="wrap py-8 sm:py-10" data-tour={tour}>
        <h1 className="h-page">{title}</h1>
        {intro && <p className="mt-2 max-w-prose text-muted">{intro}</p>}
        {children}
      </div>
    </header>
  );
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel p-8 text-center">
      <p className="h-card">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}
