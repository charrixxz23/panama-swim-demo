import type { Dataset, Result, ResultStatus } from "../models";
import { parseTime, TimeFormatError } from "../utils/time";
import { categoryFor } from "./categories";

export const CSV_COLUMNS = ["competencia_id", "prueba_id", "nadador_id", "serie", "carril", "tiempo", "estado"] as const;
type Column = (typeof CSV_COLUMNS)[number];

/** Analizador CSV (RFC 4180): comillas, comillas escapadas, saltos de línea dentro de comillas, BOM y separador , o ;. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface CsvIssue {
  /** Línea del archivo (1 = encabezado). */
  line: number;
  column?: Column;
  message: string;
}

export interface CsvValidation {
  valid: Omit<Result, "id" | "importBatchId" | "published">[];
  errors: CsvIssue[];
  warnings: CsvIssue[];
  totalRows: number;
}

const STATUSES: ResultStatus[] = ["OK", "DQ", "DNS", "DNF"];

/**
 * Valida un CSV de resultados contra los datos cargados. Comprueba columnas, tipos, identificadores,
 * formato de tiempo, estado, categoría y rama del nadador, y duplicados (en el archivo y en los datos).
 * Si hay errores, ninguna fila debe importarse.
 */
export function validateResultsCsv(text: string, data: Dataset): CsvValidation {
  const out: CsvValidation = { valid: [], errors: [], warnings: [], totalRows: 0 };
  const rows = parseCsv(text);
  if (rows.length === 0) {
    out.errors.push({ line: 1, message: "El archivo está vacío." });
    return out;
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = CSV_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    out.errors.push({ line: 1, message: `Faltan columnas obligatorias: ${missing.join(", ")}. Encabezado esperado: ${CSV_COLUMNS.join(",")}.` });
    return out;
  }
  const extra = header.filter((h) => !(CSV_COLUMNS as readonly string[]).includes(h));
  if (extra.length) out.warnings.push({ line: 1, message: `Se ignorarán columnas desconocidas: ${extra.join(", ")}.` });
  const idx = Object.fromEntries(CSV_COLUMNS.map((c) => [c, header.indexOf(c)])) as Record<Column, number>;

  const comps = new Map(data.competitions.map((c) => [c.id, c]));
  const events = new Map(data.events.map((e) => [e.id, e]));
  const swimmers = new Map(data.swimmers.map((s) => [s.id, s]));
  const existing = new Set(data.results.map((r) => `${r.eventId}|${r.swimmerId}`));
  const seenEntry = new Map<string, number>();
  const seenLane = new Map<string, number>();

  rows.slice(1).forEach((cells, i) => {
    const line = i + 2;
    out.totalRows++;
    const get = (c: Column) => (cells[idx[c]] ?? "").trim();
    const err = (message: string, column?: Column) => out.errors.push({ line, column, message });
    const before = out.errors.length;

    const comp = comps.get(get("competencia_id"));
    if (!comp) err(`Competencia «${get("competencia_id")}» no existe.`, "competencia_id");
    const ev = events.get(get("prueba_id"));
    if (!ev) err(`Prueba «${get("prueba_id")}» no existe.`, "prueba_id");
    else if (comp && ev.competitionId !== comp.id) err(`La prueba «${ev.id}» no pertenece a la competencia «${comp.id}».`, "prueba_id");
    const sw = swimmers.get(get("nadador_id"));
    if (!sw) err(`Nadador «${get("nadador_id")}» no existe.`, "nadador_id");

    const heat = Number(get("serie"));
    if (!/^\d+$/.test(get("serie")) || heat < 1 || heat > 50) err(`Serie «${get("serie")}» debe ser un entero entre 1 y 50.`, "serie");
    const lane = Number(get("carril"));
    if (!/^\d+$/.test(get("carril")) || lane < 0 || lane > 10) err(`Carril «${get("carril")}» debe ser un entero entre 0 y 10.`, "carril");

    const statusText = get("estado").toUpperCase();
    const status = STATUSES.find((s) => s === statusText);
    if (!status) err(`Estado «${get("estado")}» no es válido. Use OK, DQ, DNS o DNF.`, "estado");

    let timeMs: number | null = null;
    const timeText = get("tiempo");
    if (status === "OK") {
      if (!timeText) err("Un resultado válido (OK) necesita tiempo.", "tiempo");
      else
        try {
          timeMs = parseTime(timeText);
        } catch (e) {
          err(e instanceof TimeFormatError ? e.message : `Tiempo «${timeText}» no válido.`, "tiempo");
        }
    } else if (status && timeText) {
      out.warnings.push({ line, column: "tiempo", message: `Estado ${status}: el tiempo «${timeText}» se ignora (un ${status} no se convierte en tiempo).` });
    }

    if (ev && sw && comp) {
      if (sw.gender !== ev.gender) err(`La rama del nadador (${sw.gender}) no coincide con la de la prueba (${ev.gender}).`, "nadador_id");
      const cat = categoryFor(data.categories, sw.birthYear, comp.startDate);
      if (cat !== ev.categoryId) err(`El nadador corresponde a la categoría ${cat ?? "sin categoría"} y la prueba es ${ev.categoryId}.`, "nadador_id");
      const key = `${ev.id}|${sw.id}`;
      if (seenEntry.has(key)) err(`Duplicado: el nadador ya aparece en esta prueba en la línea ${seenEntry.get(key)}.`, "nadador_id");
      else seenEntry.set(key, line);
      if (existing.has(key)) err("Duplicado: ya existe un resultado de este nadador en esta prueba.", "nadador_id");
      const laneKey = `${ev.id}|${heat}|${lane}`;
      if (seenLane.has(laneKey)) err(`Serie ${heat}, carril ${lane} ya está ocupado en la línea ${seenLane.get(laneKey)}.`, "carril");
      else seenLane.set(laneKey, line);
    }

    if (out.errors.length === before && comp && ev && sw && status)
      out.valid.push({ competitionId: comp.id, eventId: ev.id, swimmerId: sw.id, heat, lane, timeMs: status === "OK" ? timeMs : null, status, source: "importado" });
  });

  if (out.totalRows === 0) out.errors.push({ line: 2, message: "El archivo no tiene filas de datos." });
  return out;
}
