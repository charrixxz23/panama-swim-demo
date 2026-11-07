import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "../utils/dates";
import { formatTime } from "../utils/time";

export interface ChartPoint {
  date: string;
  competition: string;
  timeMs: number;
}

/**
 * Progresión de UNA prueba en UNA piscina. Eje Y invertido: en natación menos tiempo es mejor,
 * así que la línea sube cuando el nadador mejora.
 */
export function ProgressChart({ points, standardMs, title, height = 280 }: { points: ChartPoint[]; standardMs?: number; title: string; height?: number }) {
  if (points.length === 0) return <p className="text-sm text-muted">Sin tiempos válidos para graficar.</p>;
  const values = points.map((p) => p.timeMs).concat(standardMs ? [standardMs] : []);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Marcas del eje en segundos redondos (0.5, 1, 2, 5, 10, 30 o 60 s) para que se lean como tiempos.
  const span = Math.max(1000, max - min);
  const step = [500, 1000, 2000, 5000, 10000, 30000, 60000].find((st) => span / st <= 5) ?? 120000;
  const lo = Math.max(0, Math.floor((min - step * 0.4) / step) * step);
  const hi = Math.ceil((max + step * 0.4) / step) * step;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const data = points.map((p) => ({ ...p, label: formatDate(p.date, { month: "short", year: "2-digit" }) }));

  return (
    <figure>
      <div style={{ height }} role="img" aria-label={`${title}. ${points.map((p) => `${formatDate(p.date)}: ${formatTime(p.timeMs)}`).join("; ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="rgb(var(--c-line))" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgb(var(--c-muted))", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "rgb(var(--c-line))" }} />
            <YAxis
              reversed
              domain={[lo, hi]}
              ticks={ticks}
              interval={0}
              tickFormatter={(v: number) => formatTime(v).replace(/\.00$/, "")}
              tick={{ fill: "rgb(var(--c-muted))", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={62}
            />
            <Tooltip
              cursor={{ stroke: "rgb(var(--c-accent))", strokeDasharray: "4 4" }}
              contentStyle={{ background: "rgb(var(--c-surface))", border: "1px solid rgb(var(--c-line))", borderRadius: 12, color: "rgb(var(--c-ink))" }}
              formatter={(v: number) => [formatTime(v), "Tiempo"]}
              labelFormatter={(_, p) => (p?.[0] ? `${(p[0].payload as ChartPoint).competition} · ${formatDate((p[0].payload as ChartPoint).date)}` : "")}
            />
            {standardMs !== undefined && (
              <ReferenceLine
                y={standardMs}
                stroke="rgb(var(--c-signal))"
                strokeDasharray="6 4"
                label={{ value: `Marca mínima ficticia ${formatTime(standardMs)}`, position: "insideBottomLeft", fill: "rgb(var(--c-signal))", fontSize: 12 }}
              />
            )}
            <Line type="monotone" dataKey="timeMs" stroke="rgb(var(--c-brand))" strokeWidth={3} dot={{ r: 4, fill: "rgb(var(--c-surface))", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-xs text-muted">Eje vertical invertido: más arriba significa más rápido.</figcaption>
    </figure>
  );
}
