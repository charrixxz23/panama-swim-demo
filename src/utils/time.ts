/**
 * Tiempos de natación.
 * Representación interna: milisegundos enteros. Los tiempos de competencia se registran
 * en centésimas, así que los valores válidos son múltiplos de 10 ms.
 */

const TIME_RE = /^(?:(\d{1,2}):)?(\d{1,2})[.,](\d{1,2})$/;

export class TimeFormatError extends Error {}

/**
 * Convierte "1:04.80", "58.31" o "1:04,8" a milisegundos.
 * - Con minutos, los segundos deben estar entre 00 y 59.
 * - Una sola cifra decimal se interpreta como décimas ("1:04.8" = 1:04.80).
 * Lanza TimeFormatError si el texto no es un tiempo válido.
 */
export function parseTime(input: string): number {
  const text = input.trim();
  const m = TIME_RE.exec(text);
  if (!m) throw new TimeFormatError(`«${input}» no es un tiempo válido. Use m:ss.cc (1:04.80) o ss.cc (58.31).`);
  const [, minStr, secStr, fracStr] = m;
  const minutes = minStr ? Number(minStr) : 0;
  const seconds = Number(secStr);
  if (minStr !== undefined && secStr.length !== 2)
    throw new TimeFormatError(`«${input}»: con minutos, los segundos deben tener dos cifras (1:04.80).`);
  if (minStr !== undefined && seconds > 59) throw new TimeFormatError(`«${input}»: los segundos deben estar entre 00 y 59.`);
  const hundredths = fracStr.length === 1 ? Number(fracStr) * 10 : Number(fracStr);
  const ms = (minutes * 60 + seconds) * 1000 + hundredths * 10;
  if (ms <= 0) throw new TimeFormatError(`«${input}»: el tiempo debe ser mayor que cero.`);
  return ms;
}

export function tryParseTime(input: string): number | null {
  try {
    return parseTime(input);
  } catch {
    return null;
  }
}

/** 64800 → "1:04.80"; 58310 → "58.31". Redondea a la centésima más cercana. */
export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) throw new RangeError("Tiempo inválido");
  const cs = Math.round(ms / 10);
  const minutes = Math.floor(cs / 6000);
  const seconds = Math.floor((cs % 6000) / 100);
  const hundredths = cs % 100;
  const ss = String(seconds).padStart(minutes ? 2 : 1, "0");
  const hh = String(hundredths).padStart(2, "0");
  return minutes ? `${minutes}:${ss}.${hh}` : `${ss}.${hh}`;
}

/** Diferencia en segundos con signo: 2800 → "+2.80"; -420 → "−0.42"; 0 → "0.00". */
export function formatDelta(ms: number): string {
  const cs = Math.round(Math.abs(ms) / 10);
  const body = `${Math.floor(cs / 100)}.${String(cs % 100).padStart(2, "0")}`;
  if (cs === 0) return "0.00";
  return `${ms > 0 ? "+" : "−"}${body}`;
}

/** Valor absoluto en segundos con dos decimales: 2800 → "2.80". */
export function formatSeconds(ms: number): string {
  const cs = Math.round(Math.abs(ms) / 10);
  return `${Math.floor(cs / 100)}.${String(cs % 100).padStart(2, "0")}`;
}
