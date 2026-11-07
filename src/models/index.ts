/**
 * Modelo de dominio de Panamá Swim.
 *
 * Reglas transversales:
 * - Los tiempos se guardan SIEMPRE como milisegundos enteros (`timeMs`). La presentación
 *   (1:04.80) solo existe en `utils/time.ts`.
 * - Cada registro indica si es sintético. En esta demo todos los atletas, clubes, competencias,
 *   resultados y marcas mínimas son sintéticos; solo las categorías por edad, las piscinas reales
 *   y las noticias provienen de fuentes públicas (ver docs/fuentes-y-datos.md).
 */

/** Longitud de piscina: LCM = piscina larga (50 m), SCM = piscina corta (25 m). */
export type Course = "LCM" | "SCM";

export type Stroke = "LIBRE" | "ESPALDA" | "PECHO" | "MARIPOSA" | "COMBINADO";

/** Rama de la prueba. */
export type Gender = "F" | "M";

export type CategoryId = "9-10" | "11-12" | "13-14" | "15-17" | "18+";

export interface Category {
  id: CategoryId;
  label: string;
  minAge: number;
  /** null = sin límite superior. */
  maxAge: number | null;
}

export type Province =
  | "Bocas del Toro"
  | "Chiriquí"
  | "Coclé"
  | "Colón"
  | "Darién"
  | "Herrera"
  | "Los Santos"
  | "Panamá"
  | "Panamá Oeste"
  | "Veraguas";

export interface Pool {
  id: string;
  name: string;
  city: string;
  province: Province;
  /** Longitudes que admite la instalación. */
  courses: Course[];
  /** true = instalación real citada en fuentes públicas; false = ficticia. */
  real: boolean;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  province: Province;
  synthetic: true;
}

export interface Coach {
  id: string;
  name: string;
  clubId: string;
  synthetic: true;
}

export interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  /**
   * Solo el año de nacimiento (nunca la fecha completa) para calcular la categoría.
   * No se muestra en la interfaz.
   */
  birthYear: number;
  clubId: string;
  synthetic: true;
  published: boolean;
}

export type CompetitionType = "evaluativa" | "campeonato" | "copa" | "open" | "selectivo";

export interface CompetitionDocument {
  title: string;
  /** null = documento de ejemplo no disponible para descarga. */
  url: string | null;
}

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  /** Fechas ISO (AAAA-MM-DD), hora local de Panamá. */
  startDate: string;
  endDate: string;
  poolId: string;
  course: Course;
  categories: CategoryId[];
  requirements: string[];
  registration: { opens: string; closes: string };
  documents: CompetitionDocument[];
  synthetic: true;
  published: boolean;
}

/** Prueba dentro de una competencia (p. ej., 100 m libre, varones 13-14). */
export interface SwimEvent {
  id: string;
  competitionId: string;
  number: number;
  distance: number;
  stroke: Stroke;
  gender: Gender;
  categoryId: CategoryId;
}

export type ResultStatus = "OK" | "DQ" | "DNS" | "DNF";

export interface Result {
  id: string;
  competitionId: string;
  eventId: string;
  swimmerId: string;
  /** Serie y carril. */
  heat: number;
  lane: number;
  /** null cuando el estado no es OK: un DQ/DNS/DNF nunca se convierte en tiempo. */
  timeMs: number | null;
  status: ResultStatus;
  source: "demo" | "importado";
  importBatchId?: string;
  published: boolean;
}

/** Marca mínima (tiempo objetivo) para inscribirse en una competencia. */
export interface QualifyingStandard {
  id: string;
  competitionId: string;
  categoryId: CategoryId;
  gender: Gender;
  distance: number;
  stroke: Stroke;
  course: Course;
  timeMs: number;
  /** Siempre true en la demo: marca ficticia. */
  synthetic: true;
  published: boolean;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  createdAt: string;
  competitionIds: string[];
  rows: number;
  status: "pendiente" | "publicado" | "descartado";
}

export interface NewsItem {
  id: string;
  title: string;
  outlet: string;
  url: string;
  publishedOn: string;
  summary: string;
  /** Fecha en que se comprobó el enlace. */
  verifiedOn: string;
}

export interface Dataset {
  version: number;
  generatedAt: string;
  categories: Category[];
  pools: Pool[];
  clubs: Club[];
  coaches: Coach[];
  swimmers: Swimmer[];
  competitions: Competition[];
  events: SwimEvent[];
  results: Result[];
  standards: QualifyingStandard[];
  importBatches: ImportBatch[];
}

/** Clave de prueba independiente de la competencia: distancia + estilo + piscina. */
export const eventKey = (distance: number, stroke: Stroke, course: Course) => `${distance}-${stroke}-${course}`;
